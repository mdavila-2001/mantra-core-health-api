# Revisión: jobs de los 24 workers

- Fecha: 2026-10-05. Base: `origin/dev` `02af1e09`.
- Cobertura: los 24 entrypoints `src/worker-*.ts`, sus 38 jobs programados en `src/worker/jobs/*`, y los módulos de worker que los registran. Se revisaron con prioridad la identidad `SYSTEM`, tenant, credenciales, exposición de health/status, reintentos e idempotencia. El marco común se documenta por separado en [worker-framework.md](worker-framework.md).
- Límite: no se iniciaron procesos ni proveedores externos; las conclusiones sobre wiring se derivan de los módulos y de las variables de entorno. Los controladores y servicios de cada dominio quedan enlazados con sus informes de módulo.

## Resumen ejecutivo

Hallazgos confirmados: **0 críticos, 2 altos, 1 medio, 0 bajos**.

Los 24 entrypoints llegan a `bootstrapWorker`, por lo que heredan el token `SYSTEM`, timeout, control de solapamiento local y sonda ya revisados en el informe del marco. Los jobs simples delegan el descubrimiento y la exclusión a endpoints internos; los lotes que enumeran ítems usan `runTick` anidado. Se confirmaron tres problemas concretos: las tareas físicas de series atribuyen su auditoría y eventos siempre al tenant de semilla, tres capacidades de proveedor sólo se cablean a mocks y quedan inoperantes si no se configura uno, y la cola persiste texto de excepción no saneado.

| ID | Severidad | Área | Hallazgo |
|---|---|---|---|
| WJ-01 | Alto | `time_series` | Compresión, retención y rollups usan siempre `SEED.tenantId`; las métricas y eventos de acciones globales se atribuyen al tenant semilla. |
| WJ-02 | Alto | `cross_store_consistency`, `identity_assurance`, `vector_rag` | Los tres jobs sólo reemplazan sus adapters que fallan por mocks opcionales; no hay adapter de producción ni gate de arranque. |
| WJ-03 | Medio | `messaging/queue` | La cola persiste sin saneamiento el `Error.message` de cualquier handler como evidencia y dead letter. |

## Cobertura de entrypoints y jobs

| Worker | Jobs revisados | Observación de seguridad/operación |
|---|---|---|
| `audio-assets` | `audio-generation` | El callback de preparación, publicación y fallo se declara `idempotent: true`; no registra texto/audio. |
| `automation` | `calendar-trigger` | Tick de lote delegado a API. |
| `billing` | `run-due-dunning` | Tick de lote delegado a API. |
| `community` | `feed-fanout`, `search-indexer`, `badge-expiry` | Descubrimiento y trabajo por ítem; la salud agregada depende de WJ-02 del marco. |
| `consent` | `expiration-sweep` | Expiración delegada a API. |
| `cross_store_consistency` | `deletion-pipeline` | Adapter externo sin implementación productiva: WJ-02. |
| `data_catalog` | `scan-tick` | Tick de lote delegado a API. |
| `delegated_access` | `expiry-sweep` | Expiración delegada a API. |
| `files` | `malware-scan`, `storage-lifecycle` | Confirmación de malware y ciclo de storage se llaman como idempotentes. |
| `health_context` | `schedule-tick` | Tick de lote delegado a API. |
| `identity_assurance` | `dispatch-identity-checks`, `expire-sweep`, `evidence-lifecycle` | Cursor de evidencia se conserva ante fallo; autoridad externa sin implementación productiva: WJ-02. |
| `integrations` | `message-retry`, `message-correlation`, `message-dispatch` | El proveedor firmado vive en API; reintentos y dead letter se deciden en API. |
| `lakehouse` | `release-expiry` | Descubrimiento y revocación por release. |
| `messaging` | `outbox-relay`, `queue`, `notification-delivery` | Google puede cablear entrega; la cola conserva `Error.message`: WJ-03. |
| `pharmacy_inventory` | `expire-reservations` | Expiración delegada a API. |
| `promotions` | `expire-points` | Lote por programa; ver semántica de salud anidada en el marco. |
| `qa_lab` | `schedule-tick`, `plan-run-tick` | Tick de lote delegado a API. |
| `read_models` | `read-model-reconciliation` | Lote por modelo; ver semántica de salud anidada en el marco. |
| `reporting` | `scheduler-tick` | Tick de lote delegado a API. |
| `scheduling` | `dispatch-reminders`, `promote-waitlist`, `expire-holds` | El endpoint interno resuelve locks/estado. |
| `time_series` | `apply-retention`, `compress-chunks`, `refresh-rollups` | Tres llamadas `SYSTEM` a administración física; WJ-01. |
| `tracking` | `sla-scan` | Escaneo delegado a API con `SYSTEM`. |
| `vector_rag` | `embedding-drain` | Adapter de embeddings sin implementación productiva: WJ-02. |
| `workflow` | `sweep-timeouts` | Tick de lote delegado a API. |

## Hallazgos y plan de corrección

### WJ-01 — Alto: mantenimiento físico de series atribuido siempre al tenant semilla

- **Evidencia:** los tres jobs importan `SEED` y envían `tenantId: SEED.tenantId`: `apply-retention.job.ts:5,63-72`, `compress-chunks.job.ts:5,50-62`, `refresh-rollups.job.ts:5,51-60`. El controlador admite `SYSTEM` en las tres rutas (`timescale-admin.controller.ts:79-108,134-152`). El servicio copia `dto.tenantId` a la métrica y al evento del outbox, mientras la operación física actúa por tabla/rollup sin validar ni derivar ese tenant (`timescale-admin.service.ts:172-243,256-313,330-413`).
- **Impacto:** una compresión, una retención destructiva o un refresco puede quedar auditado y publicado como si perteneciera al tenant de seed aunque afecte una tabla compartida. La atribución inexacta invalida el rastro de cumplimiento y puede disparar eventos a consumidores del tenant equivocado. No se afirma que el token `SYSTEM` permita a un usuario externo escoger el tenant: el problema ocurre en el proceso autorizado.
- **Plan:** decidir el dueño correcto de una operación física global. Si es global, eliminar `tenantId` de métricas/eventos o registrar un sujeto de plataforma; si la política debe ser por tenant, derivar el tenant desde una configuración administrada y filtrar/particionar antes de ejecutar. Rechazar en el servicio un `tenantId` que no tenga contexto válido, persistir una clave de ejecución estable y añadir prueba de atribución. Archivos esperados: jobs de `time_series`, DTO/servicio de administración y specs. Esfuerzo M, ola 0.

### WJ-02 — Alto: capacidades de proveedor quedan operativas sólo con mocks opcionales

- **Evidencia:** los defaults de borrado, verificación, identidad y embeddings devuelven fallo o ausencia no verificada (`deletion-pipeline.job.ts:46-79`, `dispatch-identity-checks.job.ts:46-56`, `embedding-drain.job.ts:44-48`). Sus módulos sólo los reemplazan con `MockProviderWiringService` (`cross_store_consistency.worker-module.ts:46-48`, `identity-assurance.worker-module.ts:24-30`, `vector_rag.worker-module.ts:15-17`) y cada wiring retorna sin modificar nada cuando falta `MOCK_PROVIDER_BASE_URL` (`cross_store_consistency/mock-provider-wiring.service.ts:10-36`, `identity_assurance/mock-provider-wiring.service.ts:7-33`, `vector_rag/mock-provider-wiring.service.ts:7-30`). No hay adapter de producción en esos directorios.
- **Impacto:** en un despliegue sin servidor mock, solicitudes de borrado inter-store, verificaciones de identidad y trabajos de embeddings se marcan como fallidos o permanecen pendientes. El fallo es visible, pero el proceso puede declararse sano porque el job reporta el resultado al API sin que exista un requisito de configuración al arrancar.
- **Plan:** introducir bindings de proveedor productivos con secretos inyectados desde el entorno de despliegue, y definir por dominio si la ausencia debe impedir el arranque o degradar readiness. Mantener mocks sólo en desarrollo/test, registrar métricas de configuración y añadir un gate que falle si el worker productivo conserva el default. Archivos esperados: módulos de worker, adapters, `worker.env.ts`, Compose/secrets y specs. Esfuerzo L, ola 0.

### WJ-03 — Medio: la cola conserva texto arbitrario de excepciones de handlers

- **Evidencia:** `QueueJob.settleJob` convierte cualquier excepción del handler en `error.message`/`String(error)` y la envía a `/internal/jobs/:id/fail` (`queue.job.ts:102-123`). `FailJobDto.errorText` sólo exige string, sin límite ni normalización (`messaging.dto.ts:483-499`); `QueuesService.failJob` lo persiste como `lastErrorText` y después como `failureReasonText` en la dead letter (`queues.service.ts:233-286`).
- **Impacto:** una excepción de proveedor, biblioteca o adapter que incluya token, dirección, payload o dato clínico puede quedar almacenada en la cola y su evidencia histórica. No se confirmó en esta revisión una ruta pública que lea esos campos; el riesgo confirmado es la persistencia interna de un mensaje no controlado.
- **Plan:** enviar al API sólo un código estable y un mensaje saneado/acotado; guardar el error original únicamente en logs protegidos con redacción. Imponer longitud máxima al DTO y a la columna, y revisar permisos de lectura de dead letters. Archivos esperados: `queue.job.ts`, DTO/servicio/repositorio de messaging y specs. Esfuerzo M, ola 1.

## Plan de cuatro pruebas por hallazgo

| ID | Correcto | Límite | Error | Falla catalogada |
|---|---|---|---|---|
| WJ-01 | Job global registra actor/sujeto de plataforma o tenant derivado. | Dos tenants en la misma tabla conservan atribución separada o global explícita. | Tenant desconocido/requerido rechaza antes de tocar Timescale. | API responde el `HttpStatus`, `ErrorCode` y `details.reason` de administración documentados; sin UUID seed como razón. |
| WJ-02 | Binding productivo configurado entrega/borrar/calcula y registra resultado. | Ausencia de una credencial degrada sólo el worker dependiente. | Arranque productivo sin binding termina con configuración inválida o readiness 503. | Error estable `PROVIDER_NOT_CONFIGURED` sólo en desarrollo, sin secreto ni payload. |
| WJ-03 | Handler lanza error normal y se persiste código/mensaje saneado. | Mensaje de 10 kB queda truncado al límite acordado. | Error que contiene un token sintético no llega a `lastErrorText` ni dead letter. | `HttpStatus`/`ErrorCode`/`details.reason` del handler se preservan como código estable, sin copiar su `message`. |

## Credenciales, reintentos e idempotencia

Todos los entrypoints usan el cliente común `SystemApiClient`; la obtención y rotación del token `SYSTEM`, los reintentos de `GET` y la prohibición de reintentar `POST` que no declare idempotencia se auditan en [worker-framework.md](worker-framework.md). Se verificó que las rutas de publicación de audio, análisis de malware, lifecycle de storage y lifecycle de evidencia declaran explícitamente `idempotent: true`. Para los POST restantes, la corrección debe comprobar idempotencia en su endpoint dueño antes de habilitar reintentos: marcar una llamada como idempotente desde el worker no crea esa propiedad en el proveedor.

## Evidencia

```text
corepack yarn test --runInBand --silent src/worker/jobs/time_series src/worker/jobs/cross_store_consistency src/worker/jobs/identity_assurance src/worker/jobs/vector_rag src/worker/jobs/messaging
exit 0
Test Suites: 15 passed, 15 total
Tests:       53 passed, 53 total
Snapshots:   0 total
```

La prueba dirigida cubre los cinco conjuntos que contienen los hallazgos. No arranca los 24 procesos ni contacta proveedores externos; valida la conducta actual de los jobs y sus adapters/mock wiring.
