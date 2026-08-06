# Matriz de riesgos

Riesgos de fiabilidad del backend y sus 20 workers. Cada entrada describe un modo
de fallo **concreto de este sistema**, no una categoría genérica: dice dónde
ocurre, cómo se reproduce y qué lo contiene hoy.

## Cómo leer la matriz

- **Criticidad** = impacto × probabilidad, evaluada sobre el sistema *después*
  del hardening. Un riesgo crítico con mitigación ✅ sigue siendo crítico: el
  control puede fallar o retirarse.
- **Estado**: ✅ mitigado y verificado por prueba · 🟡 mitigado, pendiente de
  validar en entorno real · 🔵 abierto, requiere decisión o insumo externo.

## Índice por criticidad

| ID | Riesgo | Criticidad | Estado |
| --- | --- | --- | --- |
| [R-01](#r-01) | Procesamiento duplicado por solapamiento de ticks | Crítica | ✅ |
| [R-02](#r-02) | Worker zombi: tick que no vuelve | Crítica | ✅ |
| [R-03](#r-03) | Cascada de fallos hacia la API por sus 20 clientes | Crítica | ✅ |
| [R-04](#r-04) | Trabajo a medias por apagado no drenado | Crítica | ✅ |
| [R-05](#r-05) | Error transitorio devuelto como permanente (pérdida de trabajo) | Crítica | ✅ |
| [R-06](#r-06) | Fallo terminal sin rastro | Alta | ✅ |
| [R-07](#r-07) | Agotamiento del pool de conexiones | Alta | 🟡 |
| [R-08](#r-08) | Tormenta de reintentos tras una recuperación | Alta | ✅ |
| [R-09](#r-09) | Agotamiento de memoria por cola sin límite | Alta | ✅ |
| [R-10](#r-10) | Mensaje envenenado: reintento infinito | Alta | 🟡 |
| [R-11](#r-11) | Interbloqueo de PostgreSQL bajo escritura concurrente | Alta | ✅ |
| [R-12](#r-12) | Fuga de temporizadores y sockets huérfanos | Media | ✅ |
| [R-13](#r-13) | Rate limiting inefectivo en multi-réplica | Media | 🔵 |
| [R-14](#r-14) | 502 esporádicos por desajuste de `keepAlive` con el balanceador | Media | ✅ |
| [R-15](#r-15) | Slowloris: descriptores retenidos por conexiones que no progresan | Media | ✅ |
| [R-16](#r-16) | Pérdida de spans de la operación que provocó la caída | Media | ✅ |
| [R-17](#r-17) | Fallo persistente invisible: el tick corre puntual y falla siempre | Media | 🟡 |
| [R-18](#r-18) | Deriva de reloj entre procesos | Media | 🔵 |
| [R-19](#r-19) | Emulador de proveedores activo en producción | Alta | ✅ |
| [R-20](#r-20) | Degradación silenciosa por descarte sostenido de ticks | Media | 🟡 |

---

<a id="r-01"></a>
## R-01 · Procesamiento duplicado por solapamiento de ticks

| | |
| --- | --- |
| **Descripción** | `@Interval` no espera a la ejecución anterior. Si un tick tarda más que su intervalo, se acumulan copias simultáneas del mismo job. |
| **Impacto** | Procesamiento duplicado, contención de locks, consumo multiplicado de conexiones y memoria, crecimiento sin techo mientras dure la degradación. |
| **Probabilidad** | Alta. Basta con que la API responda lenta: `outbox-relay` corre cada 5 s con un plazo HTTP de 30 s. |
| **Criticidad** | **Crítica** |
| **Código** | `src/worker/run-tick.util.ts`, los 30 jobs de `src/worker/jobs/` |
| **Cómo detectarlo** | Contador `skipped` creciente en `GET :9100/status`. En el log, `Tick omitido: la ejecución anterior sigue en vuelo` a nivel `warn`. |
| **Cómo reproducirlo** | Introducir latencia artificial en la API (`tc qdisc` o un proxy lento) por encima del intervalo del job y observar el contador. |
| **Cómo monitorearlo** | Alerta si `skipped` de una operación crece de forma sostenida (> 3 en 5 min): el intervalo del job está mal dimensionado. |
| **Prevención** | Exclusión mutua por operación en `runTick`, con política de descarte. ✅ |
| **Mitigación** | Ante descarte sostenido, subir el intervalo del job afectado o escalar horizontalmente el worker (la exclusión distribuida la dan `SKIP LOCKED`/`lockedBy` en los endpoints `/internal/*`). |
| **Recuperación** | Automática: el siguiente tick recoge el trabajo pendiente. |
| **Validación** | `run-tick.util.spec.ts` — descarte, liberación tras fallo, no bloqueo entre operaciones distintas, anidamiento con nombre repetido. |

---

<a id="r-02"></a>
## R-02 · Worker zombi: tick que no vuelve

| | |
| --- | --- |
| **Descripción** | Un tick queda bloqueado en una operación que nunca termina. Con exclusión mutua (R-01), ese job no vuelve a ejecutarse jamás. |
| **Impacto** | Un dominio entero deja de procesar trabajo sin que nada lo señale. `docker ps` sigue diciendo `Up`. |
| **Probabilidad** | Media. Requiere que fallen a la vez el plazo del tick y el aborto del socket. |
| **Criticidad** | **Crítica** — es el fallo silencioso por excelencia. |
| **Código** | `src/worker/run-tick.util.ts`, `src/worker/worker-health.registry.ts`, `src/worker/worker-health.server.ts` |
| **Cómo detectarlo** | `GET :9100/health` → 503 con el nombre del tick atascado. `GET :9100/status` muestra `inFlightSince` antiguo. |
| **Cómo reproducirlo** | Suspender el proceso de la API (`docker pause api`) durante más de `WORKER_STUCK_TICK_MS`. |
| **Cómo monitorearlo** | El `healthcheck` de Docker ya lo hace cada 15 s. Alerta si un contenedor worker pasa a `unhealthy`. |
| **Prevención** | Plazo de tick con cancelación real vía `AbortSignal` propagado a axios. ✅ |
| **Mitigación** | La liveness falla → `restart: always` reinicia el contenedor. Es el único remedio a un bloqueo no cancelable desde dentro. |
| **Recuperación** | Automática por reinicio. El trabajo reclamado se libera al expirar su lock en base. |
| **Validación** | `worker-health.registry.spec.ts`, `worker-health.server.spec.ts` |

---

<a id="r-03"></a>
## R-03 · Cascada de fallos hacia la API

| | |
| --- | --- |
| **Descripción** | 20 procesos × 30 jobs llamando a la API sin cortacircuitos: una caída de un minuto genera cientos de sockets colgados por proceso y una avalancha al volver. |
| **Impacto** | Caída total prolongada: la API vuelve, recibe todo lo represado y se cae otra vez. |
| **Probabilidad** | Alta durante despliegues y reinicios. |
| **Criticidad** | **Crítica** |
| **Código** | `src/worker/system-api-client.service.ts`, `src/common/resilience/circuit-breaker.ts` |
| **Cómo detectarlo** | `GET :9100/status` → `circuits[].state === 'open'`. En el log, `Cortacircuitos de la API: closed → open`. |
| **Cómo reproducirlo** | `docker compose stop api` y observar que los workers dejan de intentarlo tras ~4 fallos. |
| **Cómo monitorearlo** | Alerta si algún circuito lleva abierto más de 5 minutos. |
| **Prevención** | Mamparo (16 en vuelo) + cortacircuitos con backoff exponencial de apertura (30 s → 5 min). ✅ |
| **Mitigación** | El sondeo de media apertura deja pasar **una sola** llamada: la API se recupera sin recibir la avalancha. |
| **Recuperación** | Automática: el circuito cierra al primer sondeo exitoso y limpia su ventana. |
| **Validación** | `circuit-breaker.spec.ts` (14 casos), `system-api-client.service.spec.ts` |

---

<a id="r-04"></a>
## R-04 · Trabajo a medias por apagado no drenado

| | |
| --- | --- |
| **Descripción** | `SIGTERM` en mitad de un tick que reclamó 50 filas y va por la 20. |
| **Impacto** | 30 filas marcadas como reclamadas por un worker inexistente. Si el corte cae entre la llamada al proveedor y la confirmación en base, el mensaje se envió y el sistema no lo sabe: **duplicación garantizada** en el siguiente intento. |
| **Probabilidad** | Alta — ocurría en **cada despliegue** (`stop_grace_period` por defecto de 10 s). |
| **Criticidad** | **Crítica** |
| **Código** | `src/worker/worker-lifecycle.service.ts`, `docker-compose.yml` |
| **Cómo detectarlo** | Log `Apagado: se agotó el plazo de drenaje con ticks aún en vuelo`, con la lista de operaciones afectadas. |
| **Cómo reproducirlo** | `docker compose stop worker-messaging` durante un lote y revisar el log de apagado. |
| **Cómo monitorearlo** | Alerta ante cualquier aparición de ese mensaje de error. Los ticks que nombra son los primeros sitios donde buscar duplicados. |
| **Prevención** | Drenaje: dejar de admitir ticks nuevos y esperar a los que están en vuelo (`WORKER_DRAIN_TIMEOUT_MS` = 20 s), con `stop_grace_period: 45s` por encima. ✅ |
| **Mitigación** | Si el plazo se agota, se registra **qué** quedó pendiente en vez de morir en silencio. |
| **Recuperación** | Los locks expiran y el trabajo vuelve a la cola. La idempotencia de los endpoints `/internal/*` evita el doble efecto en los casos que la implementan. |
| **Validación** | `run-tick.util.spec.ts` (drenaje), `shutdown-watchdog.spec.ts` |

---

<a id="r-05"></a>
## R-05 · Error transitorio devuelto como permanente

| | |
| --- | --- |
| **Descripción** | Un interbloqueo, un pool agotado o un `statement_timeout` llegaban al cliente como `500 INTERNAL`. |
| **Impacto** | Un cliente bien programado **deja de reintentar** justo cuando reintentar era la respuesta correcta. Pérdida definitiva de trabajo que se habría recuperado solo. |
| **Probabilidad** | Alta: el interbloqueo es frecuente con 20 workers escribiendo en paralelo. |
| **Criticidad** | **Crítica** |
| **Código** | `src/common/filters/all-exceptions.filter.ts`, `src/common/errors/error-codes.ts` |
| **Cómo detectarlo** | Antes: imposible (todo era `INTERNAL`). Ahora: `CONCURRENCY_CONFLICT`, `TIMEOUT` y `DEPENDENCY_UNAVAILABLE` son distinguibles en el cuerpo de la respuesta y en el log. |
| **Cómo reproducirlo** | Dos transacciones que actualizan las mismas dos filas en orden inverso. |
| **Cómo monitorearlo** | Tasa de `CONCURRENCY_CONFLICT` por endpoint: si sube, hay contención real que conviene atacar en el diseño de la transacción. |
| **Prevención** | Mapeo completo de excepciones tipadas de MikroORM y de SQLSTATE crudo. ✅ |
| **Mitigación** | El cliente reintenta con la misma clave de idempotencia. |
| **Validación** | `all-exceptions.database.spec.ts` — 16 casos |

---

<a id="r-06"></a>
## R-06 · Fallo terminal sin rastro

| | |
| --- | --- |
| **Descripción** | Excepción no capturada o promesa rechazada sin manejador: el proceso muere volcando texto sin estructura en `stderr`. |
| **Impacto** | Contenedor reiniciándose en bucle sin diagnóstico. Los spans en búfer se pierden — justo los de la operación culpable. |
| **Probabilidad** | Media |
| **Criticidad** | **Alta** |
| **Código** | `src/common/runtime/process-guards.ts` |
| **Cómo detectarlo** | Log `fatal` con `reason: uncaughtException` / `unhandledRejection` y el stack completo. |
| **Cómo monitorearlo** | Alerta ante cualquier línea de nivel `fatal`. |
| **Prevención** | No se previene: se documenta. Seguir vivo con invariantes rotas es peor que reiniciar. ✅ |
| **Recuperación** | `restart: always`. El vaciado de telemetría corre con su propio plazo para no convertir la caída en un zombi. |
| **Validación** | `process-guards.spec.ts` |

---

<a id="r-07"></a>
## R-07 · Agotamiento del pool de conexiones

| | |
| --- | --- |
| **Descripción** | Más operaciones concurrentes que conexiones disponibles en PostgreSQL. |
| **Impacto** | SQLSTATE `53300`; toda petición nueva falla hasta que se liberan. |
| **Probabilidad** | Media |
| **Criticidad** | **Alta** |
| **Cómo detectarlo** | `503 DEPENDENCY_UNAVAILABLE` con mensaje de saturación (antes era un `500` opaco). |
| **Prevención** | El mamparo de `SystemApiClient` acota la concurrencia que 20 workers pueden imponer a la API, y con ella la que la API impone a la base. R-01 elimina la multiplicación por solapamiento. ✅ |
| **Pendiente** 🟡 | El pool de MikroORM no declara `min`/`max` explícitos: hoy vale el default del driver. Dimensionarlo requiere una medición de carga real que este repositorio no tiene. Ver [06-checklists.md](06-checklists.md). |

---

<a id="r-08"></a>
## R-08 · Tormenta de reintentos

| | |
| --- | --- |
| **Descripción** | N clientes que fallan por la misma causa reintentan en el mismo instante, tumban la dependencia que se recuperaba y repiten el patrón amplificándolo. |
| **Impacto** | La recuperación nunca converge. |
| **Probabilidad** | Alta sin jitter: 20 workers con intervalos fijos se sincronizan solos. |
| **Criticidad** | **Alta** |
| **Prevención** | Jitter **completo** —esperar un tiempo aleatorio *dentro* de la ventana, no la ventana entera— más backoff exponencial del propio cortacircuitos (30 s → 60 s → … → 5 min). ✅ |
| **Validación** | `retry.spec.ts` (progresión determinista con `random()` inyectado), `circuit-breaker.spec.ts` (techo del backoff) |

---

<a id="r-09"></a>
## R-09 · Agotamiento de memoria por cola sin límite

| | |
| --- | --- |
| **Descripción** | Una cola de espera sin techo convierte la saturación en un problema de memoria: las operaciones se aceptan, se apilan y el proceso muere por OOM sin haber rechazado ninguna. |
| **Impacto** | Caída del proceso (límite de 512 MB por worker en el compose). |
| **Criticidad** | **Alta** |
| **Prevención** | El mamparo tiene cola acotada y rechaza con `CONCURRENCY_LIMIT`. Rechazar rápido le da a quien llama la oportunidad de reintentar más tarde; morir por OOM no le da ninguna. ✅ |
| **Validación** | `bulkhead.spec.ts` |

---

<a id="r-10"></a>
## R-10 · Mensaje envenenado

| | |
| --- | --- |
| **Descripción** | Un mensaje cuyo procesamiento falla siempre por su propio contenido: bloquea la cola o consume reintentos indefinidamente. |
| **Impacto** | Cola detenida o trabajo repetido sin fin. |
| **Criticidad** | **Alta** |
| **Estado** 🟡 | **Parcialmente cubierto de antes.** El sistema ya tenía cola de mensajes muertos (`messaging.dead_letter_jobs`, `cross_store_consistency.projection_dead_letters`) y contador de agotamiento en el relevo del outbox (`exhausted`). El hardening añade que el fallo del elemento no aborte el lote (modo anidado de `runTick`), pero **no** se auditó en esta pasada si los 30 jobs agotan correctamente sus reintentos ni si las DLQ tienen un procedimiento de reproceso documentado. Es el primer candidato para la siguiente iteración. |

---

<a id="r-11"></a>
## R-11 · Interbloqueo de PostgreSQL

Ver R-05: la corrección es la misma. `DeadlockException` y los SQLSTATE `40001`,
`40P01` y `55P03` se mapean a `409 CONCURRENCY_CONFLICT`, que le dice al cliente
que reintente. ✅

Lo que **no** cubre: reducir la contención de origen ordenando los accesos de
forma consistente entre transacciones. Eso es trabajo de diseño por caso de uso.

---

<a id="r-12"></a>
## R-12 · Temporizadores y sockets huérfanos

| | |
| --- | --- |
| **Descripción** | Un `setTimeout` que sobrevive a la operación mantiene vivo el event loop; una promesa perdedora de un `Promise.race` mantiene abierto el socket. |
| **Impacto** | Apagado que se retrasa, descriptores que no se liberan, degradación progresiva. |
| **Criticidad** | **Media** |
| **Prevención** | `withTimeout` limpia el temporizador en `finally` —también en el camino feliz— y usa `unref`. `delay` es cancelable. El cortacircuitos resuelve su transición por tiempo **al leer**, sin un temporizador por circuito. La sonda HTTP va `unref`. ✅ |
| **Validación** | `with-timeout.spec.ts` — incluye la comprobación explícita de `clearTimeout` en el camino feliz. |

---

<a id="r-13"></a>
## R-13 · Rate limiting inefectivo en multi-réplica 🔵

Ver [A-10 en la auditoría](00-auditoria.md#a-10--rate-limiting-en-memoria-por-instancia-). Con N réplicas el
límite efectivo es N × 300. Requiere almacenamiento compartido (Redis) y es una
decisión de despliegue con su propio coste de disponibilidad.

---

<a id="r-14"></a>
## R-14 · 502 esporádicos por desajuste de `keepAlive`

| | |
| --- | --- |
| **Descripción** | Si el servidor cierra la conexión keep-alive antes que el balanceador, éste puede haber enviado ya una petición por ella. |
| **Impacto** | 502 intermitentes, sin nada anómalo en los logs de la aplicación — de los más difíciles de diagnosticar. |
| **Criticidad** | **Media** |
| **Prevención** | `keepAliveTimeout: 65 s` > idle timeout típico (60 s), y `headersTimeout: 70 s` > `keepAliveTimeout`. ✅ |
| **Nota** | Si el balanceador de producción usa otro idle timeout, hay que ajustar `HTTP_KEEPALIVE_TIMEOUT_MS` **por encima** de él. |

---

<a id="r-15"></a>
## R-15 · Slowloris

Conexiones que abren y mandan las cabeceras de una en una retienen descriptores
sin coste para el atacante. Contenido con `headersTimeout` y `requestTimeout`
explícitos, tanto en la API como en la sonda de los workers. ✅

---

<a id="r-16"></a>
## R-16 · Pérdida de los spans de la operación culpable

El `BatchSpanProcessor` bufferiza. Una muerte por excepción no capturada no pasa
por `registerTelemetryShutdown` (que sólo atiende señales), así que los spans en
búfer se perdían — justo los de la operación que provocó la caída.
`installProcessGuards` vacía antes de salir, con plazo propio. ✅

---

<a id="r-17"></a>
## R-17 · Fallo persistente invisible 🟡

Un tick que corre puntual y falla **siempre** no dispara ninguna sonda: la
liveness sólo mira los ticks que no vuelven, y con razón (ver A-03).

`consecutiveFailures` en `GET :9100/status` lo expone, pero **nada lo alerta hoy**
porque no hay métricas Prometheus (A-12). Mientras tanto, el log a nivel `error`
con `operation` y `executionId` es la única señal, y depende de que alguien
configure una alerta en el agregador de logs.

---

<a id="r-18"></a>
## R-18 · Deriva de reloj 🔵

Los plazos, los locks y las ventanas de expiración se calculan con `Date.now()`
de cada proceso. Una deriva entre contenedores produce expiraciones prematuras o
tardías. No se ha medido. Requiere NTP garantizado en los nodos de producción —
insumo de infraestructura, no de este repositorio.

---

<a id="r-19"></a>
## R-19 · Emulador de proveedores en producción

`mock-provider-server` acepta por defecto **toda** verificación de identidad y de
matrícula profesional. En producción significaría dar por verificado a cualquiera.

Contenido de antes de esta pasada: `assertMockProviderNotInProduction` **aborta el
arranque** —no avisa: aborta— si `MOCK_PROVIDER_BASE_URL` está configurada con
`NODE_ENV=production`. Se comprueba antes de construir nada, para que el fallo
ocurra en el arranque y no en el primer tick. ✅

---

<a id="r-20"></a>
## R-20 · Degradación silenciosa por descarte sostenido 🟡

El descarte de ticks solapados (R-01) convierte una degradación en pérdida de
frecuencia, que es lo correcto. Pero si el descarte se sostiene, el sistema está
procesando menos de lo que debería y **eso no es visible sin mirar el contador**.

`skipped` está en `GET :9100/status`. Falta la alerta, por el mismo motivo que
R-17.
