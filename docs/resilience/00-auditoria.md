# Auditoría integral de resiliencia

Fecha: **2026-08-06**. Método: lectura de código y verificación por prueba
automatizada. Ningún hallazgo de este documento es un supuesto: cada uno cita el
archivo y la línea, y los que se corrigieron tienen una prueba que falla si el
defecto vuelve.

## Alcance auditado

| Capa | Superficie |
| --- | --- |
| API | `main.ts`, `app.module.ts`, filtro global de excepciones, guards (`JwtAuthGuard`, `RolesGuard`, `VerifiedIdentityGuard`), interceptores (`TenantContextInterceptor`, `TraceResponseInterceptor`), `ValidationPipe` global, `ThrottlerGuard`, sondas de salud |
| Workers | `worker/bootstrap.ts`, `run-tick.util.ts`, `system-api-client.service.ts`, los 30 jobs `@Interval` de 20 dominios |
| Infraestructura | PostgreSQL/TimescaleDB, MongoDB, Redis, OpenSearch, MinIO, `docker-compose.yml`, `Dockerfile` |
| Proceso | Manejo de señales, excepciones no capturadas, apagado, plazos del servidor HTTP |

## Resumen de hallazgos

| ID | Hallazgo | Severidad | Estado |
| --- | --- | --- | --- |
| A-01 | El mapeo de errores de base de datos era código muerto: todo fallo del driver salía como `500 INTERNAL` | Alta | ✅ Corregido |
| A-02 | Los ticks de `@Interval` se solapaban consigo mismos: procesamiento duplicado bajo lentitud | Alta | ✅ Corregido |
| A-03 | Un tick colgado bloqueaba su job para siempre, sin plazo, sin señal y sin sonda | Alta | ✅ Corregido |
| A-04 | Ningún proceso registraba `uncaughtException` ni `unhandledRejection` | Alta | ✅ Corregido |
| A-05 | El cliente HTTP de los 20 workers no tenía cortacircuitos, mamparo ni reintento | Alta | ✅ Corregido |
| A-06 | El apagado no tenía plazo: un drenaje atascado terminaba en `SIGKILL` mudo | Media | ✅ Corregido |
| A-07 | Los 20 workers no tenían `healthcheck` en `docker-compose.yml` | Media | ✅ Corregido |
| A-08 | `stop_grace_period` por defecto (10 s) cortaba lotes a la mitad en cada despliegue | Media | ✅ Corregido |
| A-09 | El servidor HTTP no declaraba `keepAliveTimeout`/`headersTimeout`/`requestTimeout` | Media | ✅ Corregido |
| A-10 | El rate limiting es en memoria por instancia: no acota nada en multi-réplica | Media | 🔵 Requiere decisión |
| A-11 | La sonda de readiness de la API usa `Promise.race` sin cancelar la sonda perdedora | Baja | 🟡 Aceptado, documentado |
| A-12 | No hay endpoint de métricas Prometheus; la observabilidad es sólo por trazas y logs | Media | 🔵 Requiere decisión |

---

## A-01 · El mapeo de errores de base de datos era código muerto

**Severidad: alta.** Es el hallazgo más importante porque afectaba a los 852
endpoints y llevaba tiempo produciendo diagnósticos falsos.

`AllExceptionsFilter` declaraba un método `integrityViolation` de 60 líneas que
traducía SQLSTATE de PostgreSQL a estados HTTP correctos. Estaba escrito, estaba
comentado, estaba probado por lectura… y `normalize()` **nunca lo llamaba**:

```
$ grep -rn "integrityViolation" src/
src/common/filters/all-exceptions.filter.ts:418:  private integrityViolation(exception: unknown):
```

Una sola aparición: la definición. Ninguna llamada.

### Consecuencia real

Todo error del driver que no fuese `UniqueConstraintViolationException` —la única
que sí estaba cableada— terminaba en el camino por defecto: `500 INTERNAL`, con
el cuerpo sanitizado y el mensaje sustituido por «Error interno del servidor».

Eso significa que estos tres casos, radicalmente distintos, eran indistinguibles
para cualquier cliente:

| Situación real | Qué debía devolver | Qué devolvía | Consecuencia |
| --- | --- | --- | --- |
| El cuerpo referencia un `*ConceptId` que no existe (`23503`) | `422` — corregir la petición | `500` | El cliente no sabe que el error es suyo; soporte recibe un ticket por cada uno |
| Interbloqueo de PostgreSQL (`40P01`, `40001`) | `409` — reintentar | `500` | Un cliente bien programado **deja de reintentar** justo cuando reintentar era la respuesta correcta; la operación se pierde |
| Pool agotado / base arrancando (`53300`, `57P03`) | `503` — reintentar y hacer failover | `500` | El balanceador no puede distinguir una instancia saturada de una petición irrecuperable |

El caso del interbloqueo es el más caro: es un fallo **transitorio y frecuente**
en un sistema con 20 workers escribiendo en paralelo, y el 500 lo convertía en
una pérdida definitiva de trabajo.

### Corrección

`normalize()` llama ahora, en este orden:

1. Las excepciones **tipadas** que MikroORM 7 ya distingue
   (`ForeignKeyConstraintViolationException`, `NotNullConstraintViolationException`,
   `CheckConstraintViolationException`, `DeadlockException`, `ConnectionException`).
   Es el camino preferente: no depende de que el ORM conserve el código del
   driver al envolver el error.
2. `integrityViolation`, ampliado, para el SQL crudo
   (`em.getConnection().execute(...)`), que el ORM entrega sin envolver. Recorre
   la cadena de causas hasta 5 niveles —con tope, porque una cadena cíclica
   colgaría el hilo dentro del propio filtro de errores, el único sitio del que
   ya no se puede informar de nada— y distingue un SQLSTATE (5 caracteres
   alfanuméricos) de un código de red de Node (`ECONNRESET`), que viajan en el
   mismo campo `code`.

Se añadieron además tres códigos al contrato: `TIMEOUT`, `CIRCUIT_OPEN` y
`CONCURRENCY_LIMIT`, y una regla nueva de exposición: los 5xx cuyo código está en
`EXPOSABLE_5XX_CODES` conservan su cuerpo en vez de ocultarse tras `INTERNAL`.
Los cuatro significan «reintenta», y ocultarlos era decirle al cliente lo
contrario de lo que debía hacer.

**Evidencia**: `src/common/filters/all-exceptions.database.spec.ts` — 16 casos,
incluidos el de la cadena cíclica y el de no confundir `ECONNRESET` con un
SQLSTATE.

---

## A-02 · Los ticks se solapaban consigo mismos

**Severidad: alta.** Los 30 jobs usan `@Interval`, ninguno `@Cron`:

```
$ grep -rn "@Cron\|@Interval" src/worker/jobs/ | wc -l
30   # los 30 son @Interval
```

`@Interval` se implementa con `setInterval`, que **no espera** a que termine la
ejecución anterior. El caso concreto más expuesto:

- `outbox-relay.job.ts`: `RELAY_INTERVAL_MS = 5_000`.
- `WORKER_HTTP_TIMEOUT_MS`: `30_000` por defecto.

Con la API respondiendo lenta pero sin fallar, a los 30 segundos hay **seis
ejecuciones simultáneas** del mismo tick reclamando del mismo outbox. El
`SKIP LOCKED` de la base evita que procesen las mismas filas, pero no evita lo
demás: seis veces las conexiones, seis veces la memoria, y una pila que crece
mientras dure la lentitud hasta agotar el contenedor (512 MB de límite).

### Corrección

Exclusión mutua por operación en `runTick`, con política de **descarte**. Se
descarta y no se encola porque un tick periódico solapado no aporta trabajo nuevo
—el siguiente recogerá lo que quedó—, y encolarlo sólo garantiza que la cola
crezca exactamente al ritmo al que el sistema va lento. El descarte se cuenta
(`skipped` en `/status`), que es la señal medible de que el intervalo de ese job
está por debajo de lo que su trabajo tarda de verdad.

### La trampa que este cambio estuvo a punto de introducir

Cinco jobs anidan `runTick` **dentro** de otro `runTick`, varios con el mismo
nombre de operación, para que el fallo de un elemento no aborte el lote:

```
promotions/expire-points.job.ts:46   runTick(logger, 'worker.promotions.expire-points', …)
promotions/expire-points.job.ts:53     runTick(logger, 'worker.promotions.expire-points', …)  ← anidado, mismo nombre
```

También en `promote-waitlist`, `embedding-drain`, `release-expiry` y
`read-model-reconciliation`. Un mutex por nombre de operación habría hecho que la
llamada interna se descartase **siempre**, y el trabajo por elemento habría
dejado de ejecutarse por completo, en silencio.

`runTick` distingue por eso dos modos: **raíz** (hay exclusión, plazo, traza raíz
y contabilidad de salud) y **anidado** (hereda el contexto del padre, abre un span
hijo y absorbe su error, sin exclusión propia). El modo se detecta por la
presencia de contexto de tick activo, no por un parámetro que hubiera que ir a
poner en 30 archivos.

**Evidencia**: `src/worker/run-tick.util.spec.ts` — 15 casos, con pruebas
explícitas de que el anidamiento con nombre repetido sigue funcionando y de que
el fallo de un elemento no aborta el lote.

---

## A-03 · Un tick colgado bloqueaba su job para siempre

**Severidad: alta.** Antes de A-02 el efecto era acumulación; después de A-02, si
no se hiciera nada más, sería peor: con exclusión mutua y sin plazo, un tick que
no vuelve **impide que ese job se ejecute nunca más**, y en silencio.

Tres capas, en este orden:

1. **Plazo con cancelación real** (`WORKER_TICK_TIMEOUT_MS`, 5 min). La versión
   ingenua de un plazo es `Promise.race([trabajo, temporizador])`, y es una
   trampa: la promesa perdedora sigue viva, el socket sigue abierto y lo único
   que se logró es dejar de mirar. `withTimeout` pasa un `AbortSignal` que
   `SystemApiClient` propaga a axios — el plazo **aborta**.
2. **Propagación sin tocar los 30 jobs.** La señal viaja por
   `AsyncLocalStorage` (`worker/tick-context.ts`), el mismo mecanismo con el que
   ya viaja el tenant. Ninguna firma cambió.
3. **Detección desde fuera** (`WORKER_STUCK_TICK_MS`, 10 min). Superarlo
   significa que ni el aborto surtió efecto: el proceso ya no puede recuperarse
   solo. La liveness pasa a 503, el `healthcheck` de Docker falla y
   `restart: always` reinicia el contenedor — el único remedio real a un bloqueo
   que no se puede cancelar desde dentro.

La distinción entre liveness y readiness es deliberada y está probada: un tick
que **falla** no baja la liveness (el fallo puede estar en la dependencia, y
reiniciar sólo suma un arranque en frío durante el incidente); un cortacircuitos
abierto baja la readiness pero **no** la liveness (reiniciar perdería el estado
del circuito y volvería a castigar a la dependencia que se recupera — el bucle
de reinicios clásico).

**Evidencia**: `src/worker/worker-health.registry.spec.ts`,
`src/worker/worker-health.server.spec.ts`.

---

## A-04 · Ningún proceso registraba los fallos terminales

**Severidad: alta.**

```
$ grep -rn "unhandledRejection\|uncaughtException" src/
src/observability/telemetry.shutdown.ts:63:    process.on(signal, () => {   ← sólo señales, no fallos
```

Cero manejadores en los 21 procesos. Node termina igual, pero lo hace escribiendo
en `stderr` sin estructura: sin `trace_id`, sin `service.name`, sin nivel — el
agregador lo indexa como texto suelto o directamente lo descarta. Y los spans que
quedaban en el búfer del `BatchSpanProcessor` se pierden: justo los de la
operación que provocó la caída.

El resultado es el peor punto de partida posible para un incidente: un contenedor
reiniciándose en bucle y ninguna traza que explique por qué.

`installProcessGuards` no evita la muerte del proceso —seguir vivo tras un
`uncaughtException` significa operar con invariantes rotas, y en un backend
clínico eso es peor que reiniciar—. La documenta: log estructurado, vaciado de
búferes con su propio plazo (un vaciado que se cuelga convertiría una caída
limpia en un proceso zombi) y salida con código 1.

Se puentea además `process.on('warning')`: `MaxListenersExceededWarning` es la
huella clásica de una fuga de listeners y sin esto nadie la ve hasta que el
proceso ocupa 4 GB.

**Evidencia**: `src/common/runtime/process-guards.spec.ts`.

---

## A-05 · El cliente HTTP de los workers no tenía ninguna protección

**Severidad: alta.** `SystemApiClient` es el **único** punto de acoplamiento entre
20 procesos y la API. Su versión anterior era `firstValueFrom(this.http.post(...))`
con un `try/catch` que aplanaba el error de axios. Sin reintento, sin
cortacircuitos, sin mamparo, sin propagación de correlación.

Comportamiento ante un minuto de caída de la API:

1. 30 jobs × N procesos lanzan su llamada.
2. Cada una espera los 30 s del plazo antes de fallar.
3. El `setInterval` dispara la siguiente sin esperar (A-02).
4. A los pocos segundos hay cientos de sockets colgados por proceso.
5. Cuando la API vuelve, recibe de golpe todo lo represado y se cae otra vez.

Cuatro capas, de fuera hacia dentro — el orden importa y no es intercambiable:

| Capa | Qué eslabón corta |
| --- | --- |
| Mamparo (16 en vuelo, 16 en cola) | Que la lentitud se traduzca en descriptores de fichero agotados |
| Cortacircuitos (uno para toda la API) | Que se siga llamando a algo que ya demostró estar caído |
| Reintento con jitter completo | El fallo transitorio real, sin sincronizar a los 20 workers en el mismo milisegundo |
| Plazo recortado al presupuesto del tick | Que la última llamada de un tick a punto de vencer pida sus 30 s completos |

El cortacircuitos va **por fuera** del reintento para que un circuito abierto
corte la escalera entera de intentos, no la consuma rechazo a rechazo.

### La asimetría GET/POST

`get()` reintenta; `post()` **no**, salvo `{ idempotent: true }` explícito. Los
endpoints `/internal/*` reclaman filas, publican eventos y despachan mensajes: un
timeout de red no dice si el servidor ejecutó la operación o sólo se perdió la
respuesta, y reintentar a ciegas duplicaría envíos y cobros. La idempotencia la
conoce quien llama, no el cliente HTTP.

**Evidencia**: `src/worker/system-api-client.service.spec.ts` — 17 casos.

---

## A-06 · El apagado no tenía plazo

`app.enableShutdownHooks()` hace que NestJS drene y cierre sus dependencias, que
es correcto. Lo que no hace es acotar cuánto puede tardar. Un `onModuleDestroy`
que espera —una conexión de MikroORM con una consulta en vuelo, un socket de
Redis que no responde— deja el proceso a medio apagar: fuera del balanceo y sin
terminar.

Docker manda `SIGKILL` a los 10 s; Kubernetes al agotarse
`terminationGracePeriodSeconds`. En ambos casos el proceso muere sin dejar dicho
**qué** lo bloqueaba, y el mismo despliegue vuelve a colgarse la próxima vez.

`installShutdownWatchdog` no acelera el apagado ni compite con NestJS: arma un
plazo y, si se agota, registra qué seguía pendiente y sale con código 1. El
temporizador va `unref`, así que un apagado que termina a tiempo es igual de
rápido que sin vigilante.

En los workers se suma `WorkerLifecycleService`, que en `beforeApplicationShutdown`
deja de admitir ticks nuevos y espera a que los que estaban en vuelo terminen su
lote (`WORKER_DRAIN_TIMEOUT_MS`). Sin eso, un `SIGTERM` en mitad de un tick que
reclamó 50 filas y va por la 20 deja 30 marcadas como «en proceso por un worker
que ya no existe», y si cayó entre la llamada al proveedor y la confirmación en
base, el mensaje se envió y el sistema no lo sabe.

**Evidencia**: `src/common/runtime/shutdown-watchdog.spec.ts`.

---

## A-07 y A-08 · Los workers no tenían `healthcheck` ni plazo de gracia

Los 20 servicios worker de `docker-compose.yml` no declaraban `healthcheck`. La
única señal disponible era la existencia del PID, que un worker zombi satisface
indefinidamente.

Tampoco declaraban `stop_grace_period`, así que valía el default de 10 s: por
debajo del drenaje (20 s) y del plazo de apagado (30 s). Es decir, **cada
despliegue cortaba lotes a la mitad**, y las tres piezas de A-06 no habrían
llegado a ejecutarse nunca.

Corregido: `healthcheck` apuntando a `/health` (nunca a `/readiness`, por lo
explicado en A-03) y `stop_grace_period: 45s` en los 20 workers y en la API.

---

## A-09 · El servidor HTTP no declaraba sus plazos

Sin `headersTimeout`/`requestTimeout` explícitos, una conexión que abre y manda
las cabeceras de una en una (patrón *slowloris*) retiene un descriptor de fichero
sin coste para el atacante.

Y `keepAliveTimeout` debe quedar **por encima** del idle timeout del balanceador
que haya delante. Es una condición de carrera clásica y muy difícil de
diagnosticar: si el servidor cierra la conexión primero, el balanceador puede
haber enviado ya una petición por ella y el cliente recibe un 502 esporádico sin
nada anómalo en los logs de la aplicación. 65 s cubre el default de 60 s de
ALB/nginx.

`requestTimeout` se deja deliberadamente generoso (120 s): hay endpoints
legítimamente largos —generación de informes, expansión de conjuntos de valores—
y recortarlo a ciegas rompería funcionalidad real. Acota el abuso, no el uso.

---

## Hallazgos abiertos

### A-10 · Rate limiting en memoria por instancia 🔵

`ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 300 }] })` usa el
almacenamiento en memoria por defecto. Con N réplicas, el límite efectivo es
N × 300: no acota nada frente a un atacante que reparte sus peticiones.

Requiere `@nest-lab/throttler-storage-redis` (o equivalente) apuntando al Redis
que ya corre en el compose. **Es una decisión de despliegue, no de código**: con
una sola instancia el comportamiento actual es correcto, y añadir una dependencia
de Redis al camino de toda petición tiene su propio coste de disponibilidad que
debe aceptarse explícitamente.

### A-11 · La readiness de la API no cancela sus sondas 🟡

`AppReadinessService.probe` usa `Promise.race` contra un temporizador sin abortar
la operación perdedora — el mismo patrón que `withTimeout` corrige. **Se acepta
conscientemente**: son cuatro `ping` de 3 s como máximo, contra dependencias que
la propia sonda declara caídas, y el volumen es el de las peticiones del
orquestador (una cada pocos segundos), no el de tráfico de negocio. Migrarlo a
`withTimeout` es trivial y está anotado, pero no es una corrección urgente.

### A-12 · No hay métricas Prometheus 🔵

La observabilidad actual es trazas (OpenTelemetry → Jaeger) y logs estructurados
(pino). No hay endpoint `/metrics`, así que no hay series temporales sobre las que
definir alertas de umbral: `EXCLUDED_HTTP_PATHS` ya reserva la ruta, pero nada la
sirve.

Lo que hoy sustituye a las métricas: `GET /status` de cada worker expone
contadores acumulados (`runs`, `failures`, `timeouts`, `skipped`,
`consecutiveFailures`) y el estado de los cortacircuitos, que es suficiente para
un diagnóstico puntual pero no para una alerta. Ver
[04-chaos-engineering.md](04-chaos-engineering.md) y
[07-manual-de-incidentes.md](07-manual-de-incidentes.md) para cómo se opera
mientras tanto.

## Lo que la auditoría revisó y encontró correcto

Para que el alcance quede acotado con honestidad, esto se auditó y **no** produjo
hallazgos:

- **Outbox transaccional**: `OutboxService.publishDomainEvent` con `flush`
  explícito entre creates y `correlationId` derivado. Corregido en 2026-07-30 con
  prueba de integración contra Postgres real.
- **Aislamiento por tenant**: RLS validado contra base real, guardrail estático
  `TENANT_SCOPE_MISSING` en `tools/alovida/guardrails.mjs`.
- **Reclamación de trabajo entre réplicas**: los endpoints `/internal/*` usan
  `SKIP LOCKED` y `lockedBy`, que es exclusión distribuida real. La exclusión que
  añade `runTick` es **por proceso** y complementaria, no la sustituye.
- **Validación de entrada**: `ValidationPipe` global con `whitelist` y
  `forbidNonWhitelisted` cierra el mass-assignment.
- **Trazas**: los 21 procesos instrumentados, con la traza raíz del trabajo
  asíncrono naciendo en `runTick`.
- **Guarda anti-SSRF** en el despacho saliente (`common/http/ssrf-guard.ts`).
- **Fail-closed de proveedores**: los adapters no configurados fallan visible
  (`PROVIDER_NOT_CONFIGURED`) en vez de fingir éxito, y el emulador aborta el
  arranque en producción.
