# Listas de verificación

Cuatro listas con propósitos distintos. Cada casilla marcada está hecha **y
verificada**, y apunta al archivo o a la prueba que la sostiene: una casilla
marcada sin evidencia da por resuelto lo que no lo está.

---

## 1 · Production Ready

### Zero Silent Failures

- [x] Todo error termina en respuesta con código estable, log estructurado o span
      marcado — [02-catalogo-de-errores.md](02-catalogo-de-errores.md)
- [x] La única absorción deliberada (`runTick`) registra, marca la traza y
      contabiliza — `run-tick.util.ts`
- [x] Los errores de base de datos ya no se disfrazan de `INTERNAL` —
      `all-exceptions.database.spec.ts`
- [x] Los adapters de proveedor no configurados fallan visible en vez de fingir
      éxito — `PROVIDER_NOT_CONFIGURED`

### Zero Unhandled Exceptions

- [x] `uncaughtException` y `unhandledRejection` registrados en los 21 procesos —
      `process-guards.spec.ts`
- [x] Los avisos del runtime (fugas de listeners) se puentean al log estructurado
- [x] Los spans en búfer se vacían antes de la salida, con plazo propio

### Zero Zombie Workers

- [x] Plazo de tick con cancelación real (`AbortSignal` propagado a axios)
- [x] Detección de tick atascado y liveness en 503
- [x] `healthcheck` en los 20 servicios worker de `docker-compose.yml`
- [x] Liveness y readiness separadas, para no reiniciar por una dependencia caída

### Zero Resource Leaks

- [x] `clearTimeout` en `finally`, también en el camino feliz —
      `with-timeout.spec.ts`
- [x] `unref` en todos los temporizadores del kernel y en la sonda HTTP
- [x] El cortacircuitos resuelve su transición al leer, sin temporizador propio
- [x] Cola del mamparo acotada: la saturación se rechaza, no se acumula
- [x] Quien cancela sale de la cola del mamparo — `bulkhead.spec.ts`

### Zero Infinite Retries

- [x] Tres límites independientes: intentos, presupuesto de tiempo y tipo de
      fallo — `retry.spec.ts`
- [x] Allowlist **cerrada** de fallos reintentables: un código desconocido se
      considera permanente
- [x] El cortacircuitos corta la escalera entera de intentos

### Zero Duplicate Processing

- [x] Exclusión mutua por operación entre ticks del mismo proceso
- [x] `SKIP LOCKED` / `lockedBy` para la exclusión entre réplicas (previo)
- [x] Las escrituras no se reintentan salvo declaración explícita de idempotencia
- [x] Drenaje del apagado, para no cortar lotes a la mitad
- [x] `stop_grace_period` (45 s) por encima del apagado (30 s) y del drenaje (20 s)

### Zero Lost Messages

- [x] Outbox transaccional (previo, con prueba de integración contra Postgres real)
- [x] El trabajo reclamado se libera al expirar su lock
- [x] Colas de mensajes muertos existentes (`dead_letter_jobs`,
      `projection_dead_letters`)

### Zero Partial Transactions

- [x] Transacción por petición con `TenantContextInterceptor`
- [x] `flush` explícito en el outbox donde el orden de inserción importa (previo)
- [x] Interbloqueo y fallo de serialización mapeados a `CONCURRENCY_CONFLICT`

### Zero Uncontrolled Shutdown

- [x] `enableShutdownHooks` en la API y en los 20 workers
- [x] Vigilante con plazo que fuerza la salida **dejando escrito** qué faltaba
- [x] Drenaje de ticks en vuelo antes de cerrar conexiones
- [x] `stop_grace_period` dimensionado por encima del plazo de apagado

### Zero Unobserved Failures

- [x] Trazas distribuidas en los 21 procesos (previo)
- [x] Traza raíz del trabajo asíncrono en `runTick`, con `executionId`
- [x] `x-request-id` propagado del worker a la API, para cruzar ambos logs
- [x] `x-trace-id` en toda respuesta, incluidas las rechazadas por un guard
- [x] `GET :9100/status` por worker con contadores y estado de circuitos

---

## 2 · SRE

### Sondas

- [x] Liveness sin dependencias (`/health`, `/liveness`)
- [x] Readiness con las 4 dependencias obligatorias (`/readiness`)
- [x] Sonda equivalente en los 20 workers
- [x] Liveness **no** falla por dependencia caída (evita el bucle de reinicios)
- [x] Readiness sí falla por circuito abierto

### Capacidad

- [x] Límites de CPU y memoria por contenedor
- [x] Techo de concurrencia saliente por worker (mamparo)

### Respuesta a incidentes

- [x] Manual de incidentes — [07-manual-de-incidentes.md](07-manual-de-incidentes.md)
- [x] Roles y niveles de severidad definidos —
      [05-recuperacion-y-continuidad.md](05-recuperacion-y-continuidad.md)

### Recuperación

- [x] Recuperación automática de procesos (`restart: always` + healthchecks)
- [x] Recuperación automática de circuitos (media apertura → cierre)

---

## 3 · DevOps

### Construcción y despliegue

- [x] Imagen reproducible (`Dockerfile`, `yarn` con lockfile)
- [x] Configuración por entorno, validada con Joi al arrancar (falla el arranque,
      no la primera petición)
- [x] `ORM_SCHEMA_SYNC=off` en producción: la aplicación no altera el esquema
- [x] `stop_grace_period` coherente con los plazos de apagado

### Configuración

- [x] Todas las variables nuevas documentadas en `.env.example` con su porqué
- [x] Defaults seguros: la retención de series temporales es opt-in; el emulador
      aborta el arranque en producción
- [x] Secretos fuera del repositorio; obligatorios en producción por validación

### Contenedores

- [x] `healthcheck` en la API y en los 20 workers
- [x] `restart: always`
- [x] Límites de recursos
- [x] `depends_on` con `condition: service_healthy`
- [x] Usuario no-root en la imagen — `USER nodeapp` en `Dockerfile`

### CI

- [x] Lint con reglas type-aware
- [x] Typecheck
- [x] 4 251 pruebas unitarias en verde
- [x] Pruebas de integración contra Postgres real
- [x] Umbral de cobertura como puerta de CI — `yarn test:cov` en `.github/workflows` con `coverageThreshold`

---

## 4 · QA

### Cobertura del hardening

- [x] `withTimeout` — 9 casos, incluida la cancelación real y la limpieza del
      temporizador
- [x] `retry` — 11 casos, con reloj y aleatoriedad inyectados (determinista)
- [x] `CircuitBreaker` — 14 casos, incluido el sondeo único en media apertura
- [x] `Bulkhead` — 8 casos
- [x] `MutexRegistry` — 7 casos
- [x] Clasificación de transitoriedad — 13 casos
- [x] `installProcessGuards` — 7 casos
- [x] `installShutdownWatchdog` — 5 casos
- [x] `runTick` — 15 casos, incluidos anidamiento y drenaje
- [x] `WorkerHealthRegistry` — 12 casos
- [x] Sonda HTTP del worker — 10 casos
- [x] `SystemApiClient` — 17 casos
- [x] Mapeo de errores de base de datos — 16 casos

**Total: 163 pruebas nuevas.** Suite completa: 4 251 en verde.

### Tipos de prueba

- [x] Unitarias
- [x] Integración contra servicios reales (Postgres, Mongo, Redis, OpenSearch)
- [x] Smoke sobre la API viva

### Cobertura

La cobertura se mide sobre el subconjunto que declara `collectCoverageFrom`, no
sobre los 57 módulos, y no supera el 95 %. Las 13 piezas del hardening tienen
cobertura de comportamiento sobre sus caminos de fallo.
