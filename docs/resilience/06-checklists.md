# Listas de verificación

Cuatro listas con propósitos distintos. Las casillas marcadas `[x]` están hechas
**y verificadas**; las `[ ]` no lo están, y en cada una se dice por qué.

Una casilla marcada sin evidencia es peor que una sin marcar: da por resuelto lo
que no lo está. Por eso cada `[x]` de este documento apunta al archivo o a la
prueba que la sostiene.

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
- [ ] **Alerta sobre fallo persistente de un tick.** El dato existe
      (`consecutiveFailures`); falta la serie temporal. Bloqueado por
      [A-12](00-auditoria.md#a-12--no-hay-métricas-prometheus-)

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
- [ ] **Verificado en el sistema levantado** — CHAOS-03, sin ejecutar

### Zero Resource Leaks

- [x] `clearTimeout` en `finally`, también en el camino feliz —
      `with-timeout.spec.ts`
- [x] `unref` en todos los temporizadores del kernel y en la sonda HTTP
- [x] El cortacircuitos resuelve su transición al leer, sin temporizador propio
- [x] Cola del mamparo acotada: la saturación se rechaza, no se acumula
- [x] Quien cancela sale de la cola del mamparo — `bulkhead.spec.ts`
- [ ] **Prueba de soak (24 h) buscando crecimiento de RSS** — sin ejecutar

### Zero Infinite Retries

- [x] Tres límites independientes: intentos, presupuesto de tiempo y tipo de
      fallo — `retry.spec.ts`
- [x] Allowlist **cerrada** de fallos reintentables: un código desconocido se
      considera permanente
- [x] El cortacircuitos corta la escalera entera de intentos
- [ ] **Auditoría del agotamiento de reintentos en los 30 jobs** —
      [R-10](01-matriz-de-riesgos.md#r-10)

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
- [ ] **Procedimiento de reproceso de las DLQ documentado** — sin escribir

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
- [ ] **Métricas Prometheus y alertas de umbral** — [A-12](00-auditoria.md#a-12--no-hay-métricas-prometheus-)

---

## 2 · SRE

### Sondas

- [x] Liveness sin dependencias (`/health`, `/liveness`)
- [x] Readiness con las 4 dependencias obligatorias (`/readiness`)
- [x] Sonda equivalente en los 20 workers
- [x] Liveness **no** falla por dependencia caída (evita el bucle de reinicios)
- [x] Readiness sí falla por circuito abierto

### SLI / SLO

- [ ] SLI definidos y medidos. Existe [`docs/observability/service-level-objectives.md`](../observability/service-level-objectives.md);
      **falta el instrumento de medición** ([A-12](00-auditoria.md#a-12--no-hay-métricas-prometheus-))
- [ ] Presupuesto de error acordado con negocio 🔵

### Capacidad

- [x] Límites de CPU y memoria por contenedor
- [x] Techo de concurrencia saliente por worker (mamparo)
- [ ] **Pool de PostgreSQL dimensionado** (`min`/`max` explícitos) —
      [R-07](01-matriz-de-riesgos.md#r-07). Requiere medición de carga real
- [ ] Prueba de carga con perfil realista 🔵

### Respuesta a incidentes

- [x] Manual de incidentes — [07-manual-de-incidentes.md](07-manual-de-incidentes.md)
- [x] Roles y niveles de severidad definidos —
      [05-recuperacion-y-continuidad.md](05-recuperacion-y-continuidad.md)
- [ ] Rotación de guardia 🔵
- [ ] Simulacro SEV-1 ejecutado 🔵

### Recuperación

- [ ] **Copias de seguridad configuradas** 🔵 — no viven en este repositorio
- [ ] **Restauración ensayada** 🔵 — es la casilla más importante de toda la lista
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
- [ ] Despliegue sin corte verificado (rolling con drenaje) 🟡

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
- [ ] Usuario no-root en la imagen 🟡 — verificar en `Dockerfile`

### CI

- [x] Lint con reglas type-aware
- [x] Typecheck
- [x] 4 251 pruebas unitarias en verde
- [x] Pruebas de integración contra Postgres real
- [ ] Umbral de cobertura como puerta de CI 🟡

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
- [ ] Carga 🔵
- [ ] Estrés 🔵
- [ ] Spike 🔵
- [ ] Soak (24 h, buscando fugas) 🔵
- [ ] Caos end-to-end 🟡 — [04-chaos-engineering.md](04-chaos-engineering.md)

### Objetivo de cobertura

El objetivo declarado en el encargo es **> 95 %**. La cobertura se mide hoy sobre
un subconjunto (`modules/iam`, `modules/common`, `modules/terminology`,
`common/**`) y no sobre los 57 módulos.

**No se alcanza ese objetivo con este trabajo y no se afirma lo contrario.** Lo
que sí se puede afirmar: las 13 piezas del hardening tienen cobertura de
comportamiento sobre sus caminos de fallo, que es donde el número importa. Elevar
la cobertura global por encima del 95 % es un esfuerzo de otra magnitud —
requiere ampliar `collectCoverageFrom` a los 57 módulos y escribir pruebas para
el código que hoy queda fuera de la medición— y debe planificarse como tal.

---

## Bloqueantes para declarar «listo para producción»

Por orden de importancia:

1. **Copias de seguridad configuradas y restauración ensayada.** Sin esto, el
   RPO de los datos clínicos es indefinido y ningún control de resiliencia lo
   compensa.
2. **Campaña de caos ejecutada** contra el sistema levantado. Los controles están
   probados en aislamiento, no en conjunto.
3. **Métricas y alertas.** Hoy el sistema detecta solo los fallos duros; los
   blandos (tick que falla siempre, tick que se descarta siempre) dependen de que
   alguien mire.
4. **Pool de PostgreSQL dimensionado** con una medición de carga real.
5. **Rate limiting compartido** si el despliegue es multi-réplica.
