# Revisión transversal: contrato OpenAPI y AsyncAPI

## 1. Fecha, alcance y cobertura real

- Fecha: 2026-10-05. Base observada: `origin/dev` en `02af1e09`; rama `pablo/revision-backend-2026-10-04`.
- Se contrastaron el generador [tools/openapi/generate-openapi.mjs](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/tools/openapi/generate-openapi.mjs), el artefacto [openapi/openapi.json](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/openapi/openapi.json), [asyncapi/asyncapi.yaml](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/asyncapi/asyncapi.yaml), el validador, el filtro HTTP global, los controladores y DTO de `messaging`, y los jobs que consumen sus rutas internas.
- Inventario estático actual: OpenAPI publica **1.301 paths, 1.424 operaciones, 1.277 esquemas y 239 tags**; AsyncAPI declara **5 canales y 6 operaciones**. No se levantaron API, PostgreSQL ni workers: no se regeneró OpenAPI, porque el generador arranca `AppModule` y requiere infraestructura local ([generador:1-11](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/tools/openapi/generate-openapi.mjs#L1-L11)).
- Verificación ejecutada: `corepack yarn docs:asyncapi:validate` → **0 errores**; `corepack yarn docs:openapi:lint` → **exit 1, dos errores `security-defined`** en las dos rutas públicas de catálogo que se detallan en CO-04; `corepack yarn test --runInBand --silent src/common/filters/all-exceptions.filter.spec.ts src/common/filters/all-exceptions.database.spec.ts` → **2 suites, 32 pruebas aprobadas**. El último comando prueba el comportamiento del filtro, no que OpenAPI lo describa completo.
- No se revisaron en detalle los 1.424 contratos HTTP individuales, las 79 cargas de evento ni consumidores configurados en base de datos. Tampoco se inspeccionaron datos reales de `event_subscriptions`. No se modificó código ni contratos publicados durante esta unidad; por eso no corresponde reescribir un README de fuente.

## 2. Resumen ejecutivo

| Severidad | Hallazgos | Estado |
| --- | ---: | --- |
| Crítica | 0 | No se confirmó exposición directa de datos ni bypass de autenticación por el contrato. |
| Alta | 1 | CO-01: el `ErrorResponse` estricto de OpenAPI rechaza códigos que el filtro global sí devuelve, incluido `TIMEOUT` con HTTP 504. |
| Media | 3 | CO-02: AsyncAPI omite cuatro operaciones reales que usan los workers; CO-03: el mensaje `QueuedJob` no tiene la misma forma que la respuesta real de claim; CO-04: dos endpoints públicos quedan sin `security: []`. |
| Baja | 0 | Ninguno confirmado. |

**Refutaciones.** Las cuatro rutas omitidas por AsyncAPI sí figuran en OpenAPI; el problema está acotado al contrato de mensajería y no prueba que la API no las exponga. El parser declara `asyncapi.yaml` válido, pero sólo comprueba estructura del documento ([validador:1-29](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/tools/asyncapi/validate.mjs#L1-L29)); no recorre controladores ni jobs. La ausencia de un servidor productivo en OpenAPI tampoco se reporta: el generador declara sólo `localhost` y la nota de generación explica que no hay URL real conocida que pueda publicarse sin inventarla.

## 3. Mapa de la unidad

| Superficie | Fuente y comportamiento observado | Contrato actual |
| --- | --- | --- |
| OpenAPI HTTP | `SwaggerModule.createDocument` parte de los decoradores de controllers y DTO compilados ([generador:330-363](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/tools/openapi/generate-openapi.mjs#L330-L363)). | JSON/YAML generado, con postprocesado para `operationId`, seguridad pública, tags y errores. |
| Error HTTP común | El filtro construye `{ code, message, correlationId, details, timestamp, path }` para toda excepción ([filtro:161-171](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/common/filters/all-exceptions.filter.ts#L161-L171)). | `ErrorResponse` es estricto y enumera sólo parte de `ErrorCode` ([generador:254-284](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/tools/openapi/generate-openapi.mjs#L254-L284)). |
| Outbox y colas | `MessagingInternalController` protege las rutas con JWT y `SYSTEM`/`MESSAGING_ADMIN`; incluye relay, dispatch, ack, claim, complete, fail, pending y deliver ([controlador:49-188](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/messaging/controllers/messaging-internal.controller.ts#L49-L188)). | AsyncAPI modela relay, dispatch, ack, claim y receipt de proveedor. |
| Workers de mensajería | El job de cola reclama y luego llama `complete` o `fail` ([queue.job:80-123](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/worker/jobs/messaging/queue.job.ts#L80-L123)); el de notificaciones lista `pending` y llama `deliver` ([notification-delivery.job:110-184](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/worker/jobs/messaging/notification-delivery.job.ts#L110-L184)). | Esas cuatro operaciones no tienen canal ni operación en AsyncAPI. |
| Claim de jobs | DTO y servicio devuelven `queueId`, `claimed`, y por cada job `id`, `jobType`, `payloadJson`, `attempts`, `lockExpiresAt` ([DTO:402-457](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/messaging/dto/messaging.dto.ts#L402-L457), [servicio:149-179](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/messaging/services/queues.service.ts#L149-L179)). | `QueuedJob` documenta propiedades opcionales distintas: `jobId`, `queueCode`, `status`, `attempts`, `payload` ([AsyncAPI:154-175](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/asyncapi/asyncapi.yaml#L154-L175)). |
| Catálogo público | Dos `GET` con `@Public()` son explícitamente sin sesión ([controller:30-55](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/public/controllers/public-catalog.controller.ts#L30-L55)). | El artefacto OpenAPI no declara `security: []`, por lo que Redocly lo rechaza. |

## 4. Hallazgos por severidad, evidencia y plan

### CO-01 — `ErrorResponse` no admite códigos y estado que el filtro global expone — alta

**Evidencia.** El generador fuerza `additionalProperties: false` y enumera once códigos; faltan, entre otros, `IDENTITY_VERIFICATION_REQUIRED`, `TIMEOUT`, `CIRCUIT_OPEN` y `CONCURRENCY_LIMIT` ([generador:254-284](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/tools/openapi/generate-openapi.mjs#L254-L284)). El catálogo de código sí declara esos valores y documenta `TIMEOUT` como HTTP 504 y los dos últimos como 503 ([error-codes:12-48](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/common/errors/error-codes.ts#L12-L48)). El filtro preserva los 5xx reconocidos, incluyendo esas tres clases operativas ([filtro:35-43](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/common/filters/all-exceptions.filter.ts#L35-L43)), y su prueba confirma que SQLSTATE `57014` se entrega como `504/TIMEOUT` ([spec:143-166](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/common/filters/all-exceptions.database.spec.ts#L143-L166)). El generador sólo construye respuestas reutilizables hasta 503; no existe una respuesta 504 ([generador:176-223](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/tools/openapi/generate-openapi.mjs#L176-L223)).

**Problema, impacto y escenario.** Un cliente que valide respuestas contra el componente publicado rechaza como fuera de contrato un `TIMEOUT` verdadero. Tampoco puede conocer por OpenAPI que una ruta puede devolver HTTP 504. El documento es válido sintácticamente, pero su schema estricto contradice una respuesta ejercitada por pruebas del backend.

**Veredicto adversarial.** Confirmado. No depende de inferir una ruta de negocio: la prueba del filtro demuestra la tupla `504/TIMEOUT`, y el enum publicado no contiene `TIMEOUT`. No se afirma que cada ruta de las 1.424 pueda devolver todos los códigos: el defecto es que el envelope común declarado como universal no admite todos los códigos que la capa común puede emitir.

**Plan de corrección.**

1. En `tools/openapi/generate-openapi.mjs`, derivar la lista de `ErrorResponse.code` del catálogo estable o mantenerla junto a una prueba que compare ambos conjuntos; agregar los códigos hoy omitidos que el filtro puede exponer.
2. Añadir el componente reutilizable HTTP 504 con ejemplo `TIMEOUT`; conservar la representación separada de `DEPENDENCY_UNAVAILABLE`, `CIRCUIT_OPEN` y `CONCURRENCY_LIMIT` en 503 si el cliente necesita decidir reintento.
3. Definir por operación sólo los estados que realmente pueden salir de esa operación. El postprocesado actual puede seguir proveer el envelope compartido, pero no debe sustituir la matriz de fallas propia de cada ruta.
4. Crear una prueba de contrato que obtenga los códigos públicos del filtro/catálogo y falle si `ErrorResponse` pierde uno; incluir el caso de SQLSTATE `57014` contra el documento generado.

**Riesgos y dependencias.** Agregar códigos al enum es compatible para consumidores; declarar 504 puede revelar que algunos SDKs no lo manejan. La matriz de estados por operación requiere decisión de los dueños de cada endpoint y debe coordinarse con el catálogo de errores transversal.

### CO-02 — AsyncAPI omite operaciones reales del protocolo que usan los workers — media

**Evidencia.** AsyncAPI se presenta como el catálogo de los canales HTTP reales de publicación, reclamo y entrega ([AsyncAPI:5-11](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/asyncapi/asyncapi.yaml#L5-L11)), pero sus cinco direcciones son dispatch, relay, claim, ack y receipt ([AsyncAPI:26-81](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/asyncapi/asyncapi.yaml#L26-L81)). El controlador publica además `POST /internal/jobs/:id/complete`, `POST /internal/jobs/:id/fail`, `GET /internal/notifications/pending` y `POST /internal/notifications/:requestId/deliver` ([controlador:125-188](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/messaging/controllers/messaging-internal.controller.ts#L125-L188)). Los dos jobs de producción los consumen explícitamente ([queue.job:102-123](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/worker/jobs/messaging/queue.job.ts#L102-L123), [notification-delivery.job:110-184](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/worker/jobs/messaging/notification-delivery.job.ts#L110-L184)).

**Problema, impacto y escenario.** Una persona que integre un worker desde AsyncAPI puede reclamar jobs, pero no tiene contrato de cómo cerrarlos o fallarlos. Tampoco puede implementar el ciclo de notificaciones. El validador no lo detecta porque ninguna regla compara canales con controladores y clientes internos.

**Veredicto adversarial.** Confirmado como cobertura documental incompleta. Las cuatro rutas están en OpenAPI, por lo que no se clasifica como endpoint inexistente ni vulnerabilidad de autorización. AsyncAPI se define explícitamente para describir el mecanismo de colas y entrega, por lo que excluir operaciones consumidas por sus workers sí es una desviación de su alcance declarado.

**Plan de corrección.**

1. Añadir canales y operaciones para `jobComplete`, `jobFail`, `pendingNotifications` y `notificationDelivery`, con método HTTP, parámetros UUID, rol de servicio y correlación de request.
2. Referenciar los DTO reales: `CompleteJobDto`, `FailJobDto`, `FailJobResponseDto`, `PendingNotificationsResponseDto`, `DeliverNotificationDto` y su respuesta. Declarar condiciones de lock ajeno, job fuera de estado y cola muerta.
3. Añadir una prueba de cobertura que compare la lista permitida de rutas internas de mensajería con los canales AsyncAPI. Si se decide que alguna ruta es deliberadamente HTTP-only, documentar la exclusión en una allowlist con motivo y dueño.
4. Mantener `openapi` como contrato HTTP completo y AsyncAPI como mapa del protocolo de workers; enlazarlos por `operationId` o una extensión estable para evitar mantener dos formas independientes.

**Riesgos y dependencias.** Los workers llaman a estas rutas con JWT `SYSTEM`; no se deben publicar secretos, tokens ni direcciones de destinatarios al enriquecer el documento. La definición de mensajes debe conservar que `payloadJson` es opaco hasta que exista un schema validado por tipo de job/evento.

### CO-03 — El mensaje AsyncAPI `QueuedJob` no representa el payload real de claim — media

**Evidencia.** El canal `/internal/queues/{code}/claim` afirma describir el reclamo de jobs ([AsyncAPI:48-58](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/asyncapi/asyncapi.yaml#L48-L58)). Su mensaje ofrece `jobId`, `queueCode`, `status`, `attempts` y `payload` sin campos requeridos ([AsyncAPI:154-175](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/asyncapi/asyncapi.yaml#L154-L175)). En cambio, la respuesta que construye el servicio contiene cada `id`, `jobType`, `payloadJson`, `attempts` y `lockExpiresAt`, más `queueId` y `claimed` en el sobre ([servicio:149-179](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/messaging/services/queues.service.ts#L149-L179)); el DTO público coincide con esa forma ([DTO:402-457](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/messaging/dto/messaging.dto.ts#L402-L457)).

**Problema, impacto y escenario.** Un consumidor generado desde AsyncAPI buscaría `jobId`/`payload`, que no existen en la respuesta, y no conocería `jobType` ni `lockExpiresAt`, necesarios para despachar y respetar la reserva. Al no declarar `required`, el parser acepta incluso mensajes vacíos.

**Veredicto adversarial.** Confirmado. No se trata de nombres internos de base: la evidencia es el DTO de controller y la respuesta exacta devuelta al worker. La forma genérica de `payloadJson` es una limitación legítima; el nombre y los campos de envoltura no lo son.

**Plan de corrección.**

1. Reemplazar `QueuedJob` por mensajes de solicitud y respuesta de claim que reproduzcan el DTO: request `workerId`/`batchSize`; response `queueId`, `claimed` y `jobs[]` con `id`, `jobType`, `payloadJson`, `attempts`, `lockExpiresAt`.
2. Marcar los campos obligatorios y formatos UUID/date-time según decoradores Swagger; conservar `payloadJson` como `object`/`unknown` si no hay schema verificable por `jobType`.
3. Añadir ejemplos sintéticos sin datos clínicos, incluyendo claim vacío y un claim con un job, y validar el documento con parser y una prueba de schema contra fixtures de `QueuesService`.
4. Hacer que la prueba de cobertura de CO-02 compruebe también nombres, requeridos y tipos de las respuestas de claim para impedir otra deriva silenciosa.

**Riesgos y dependencias.** Cambiar el mensaje AsyncAPI afecta generadores de cliente que ya consuman el campo incorrecto; requiere versionar el documento o publicar nota de cambio incompatible. No hay evidencia de consumidores externos de este canal, por lo que no se afirma impacto efectivo.

### CO-04 — Dos rutas `@Public()` quedan sin seguridad explícita en OpenAPI — media

**Evidencia.** El generador sólo marca como públicas las rutas incluidas manualmente en `KNOWN_PUBLIC_OPERATIONS` ([generador:74-149](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/tools/openapi/generate-openapi.mjs#L74-L149)). El controller declara `@Public()` para `GET /public/profiles/o/:slug/services` y `GET /public/profiles/f/:slug/products` ([controller:30-55](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/public/controllers/public-catalog.controller.ts#L30-L55)); sus pruebas HTTP las ejercen sin token y esperan 200 ([spec:116-161](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/public/public-catalog.http.spec.ts#L116-L161)). Ninguna ruta aparece en la lista manual. `corepack yarn docs:openapi:lint` falla exactamente en ambas operaciones porque no tienen seguridad definida.

**Problema, impacto y escenario.** El artefacto no supera el gate de documentación y los generadores de cliente no pueden distinguir de forma contractual que estas rutas no requieren bearer. Si se incorporara una seguridad global para silenciar el lint, las marcaría erróneamente como autenticadas.

**Veredicto adversarial.** Confirmado. No se infiere publicidad por el prefijo `/public`: existe `@Public()` explícito y pruebas HTTP sin token. El propio lint lo detecta; no es una diferencia estética de descripción.

**Plan de corrección.**

1. Agregar ambas parejas método/ruta a `KNOWN_PUBLIC_OPERATIONS` y regenerar OpenAPI desde el build actual.
2. Extraer o automatizar la comparación entre handlers `@Public()` y operaciones con `security: []`; una lista manual puede mantenerse como excepción si la prueba impide omisiones.
3. Añadir un test que exija que las dos rutas tengan `security: []` y que las protegidas no queden vacías; ejecutar `yarn docs:openapi:lint` como gate.

**Riesgos y dependencias.** El cambio es documental y no altera el guard. La automatización debe contemplar rutas heredadas que no tengan decoradores Swagger y fallar con evidencia, no asumir que todo handler sin bearer es público.

## 5. Plan de pruebas por hallazgo

| Hallazgo | Caso | Tipo y spec propuesta | Preparación e entrada exacta | Resultado esperado |
| --- | --- | --- | --- | --- |
| CO-01 | Correcto | Unit `tools/openapi/generate-openapi.contract.spec.ts` | Generar documento desde fixture que contiene `ErrorCode.TIMEOUT`. | `ErrorResponse.code.enum` contiene `TIMEOUT`; existe componente `GatewayTimeout` 504. |
| CO-01 | Límite | Unit | Comparar cada `ErrorCode` que `AllExceptionsFilter` expone como 5xx con el enum OpenAPI. | Ningún código permitido por filtro queda fuera del schema estricto. |
| CO-01 | Error | Integración `test/integration/error-contract.int-spec.ts` | Forzar SQLSTATE `57014` sobre una ruta aislada. | HTTP `504`, cuerpo parseable contra `ErrorResponse`, `code: TIMEOUT`, sin detalle interno. |
| CO-01 | Falla catalogada | Integración | Forzar dependencia no disponible y circuito abierto en rutas aisladas. | HTTP `503`, `DEPENDENCY_UNAVAILABLE` o `CIRCUIT_OPEN` documentado, envelope estable y sin filtrar internals. |
| CO-02 | Correcto | Unit `tools/asyncapi/messaging-coverage.test.mjs` | Extraer las ocho rutas de `MessagingInternalController`. | Las cuatro nuevas rutas tienen canal/operación y enlace a DTO/mensaje. |
| CO-02 | Límite | Unit | Agregar una ruta interna deliberadamente excluida a fixture allowlist. | La prueba exige motivo, dueño y fecha de revisión; no admite exclusión muda. |
| CO-02 | Error | Integración worker | Ejecutar un job con `POST /internal/jobs/{id}/complete` contra servidor aislado. | La operación se describe y acepta el payload con `workerId`; devuelve la forma del DTO. |
| CO-02 | Falla catalogada | Integración worker | Worker intenta `complete` con lock de otro worker. | HTTP `422`, `PRECONDITION_FAILED`, razón/mensaje estable del catálogo que documente lock ajeno. |
| CO-03 | Correcto | Unit de schema AsyncAPI | Validar fixture de claim con `queueId`, un job `id`, `jobType`, `payloadJson`, `attempts`, `lockExpiresAt`. | El schema acepta el fixture y conserva formatos UUID/date-time. |
| CO-03 | Límite | Integración `messaging-internal` | Claim con `batchSize: 1` y sin jobs disponibles. | Respuesta documentada con `claimed: 0`, `jobs: []` y `queueId`. |
| CO-03 | Error | Integración | Enviar `batchSize: 0` o `workerId` de más de 200 caracteres. | HTTP `400`, `VALIDATION_FAILED`, envelope común documentado. |
| CO-03 | Falla catalogada | Integración | Reclamar una cola inexistente. | HTTP `404`, `NOT_FOUND`, envelope común sin datos internos. |
| CO-04 | Correcto | Unit `tools/openapi/public-security.test.mjs` | Generar el documento con ambos handlers públicos. | Las dos operaciones contienen `security: []`. |
| CO-04 | Límite | Unit | Comparar todos los handlers `@Public()` con las operaciones del documento. | Toda ruta pública conocida aparece exactamente una vez, sin rutas faltantes. |
| CO-04 | Error | Unit | Inyectar una ruta pública nueva sin entrada en la lista de generación. | La prueba falla con método/ruta y archivo del handler. |
| CO-04 | Falla catalogada | HTTP e2e | Llamar ambas rutas con slug inválido, sin token. | HTTP `404`, `NOT_FOUND`, envelope público documentado; no `401` ni `403`. |

## 6. Matriz de pruebas de la unidad completa

| Operación relevante | Correcto | Límite | Error | Falla catalogada |
| --- | --- | --- | --- | --- |
| Envelope HTTP OpenAPI | Todos los códigos expuestos pertenecen al enum. | Correlación opcional sigue siendo string o ausente. | Payload inválido usa `VALIDATION_FAILED`. | SQLSTATE de timeout devuelve `504/TIMEOUT` conforme schema. |
| `POST /internal/queues/{code}/claim` | Reclama job y devuelve forma documentada. | Lote 1/vacío. | `workerId` o batch inválido. | Cola inexistente `404/NOT_FOUND`. |
| `POST /internal/jobs/{id}/complete` | Cierra el job reservado por su worker. | `resultJson` ausente. | UUID inválido. | Lock o estado inválido `422/PRECONDITION_FAILED`. |
| `POST /internal/jobs/{id}/fail` | Reencola o manda a DLQ con respuesta documentada. | Último intento produce `deadLetterJobId`. | Cuerpo sin `errorText`. | Lock o estado inválido `422/PRECONDITION_FAILED`. |
| `GET /internal/notifications/pending` | Devuelve solicitud entregable con campos de worker. | Lista vacía. | `limit` inválido. | Dependencia de base caída `503/DEPENDENCY_UNAVAILABLE`. |
| `POST /internal/notifications/{requestId}/deliver` | Registra acuse del proveedor. | Canal in-app sin proveedor externo. | UUID o `outcome` inválido. | Solicitud inexistente o no entregable con error catalogado. |
| `POST /webhooks/providers/{providerCode}/receipts` | Firma válida concilia acuse. | Reentrega idempotente. | Forma de receipt inválida. | Firma inválida devuelve error catalogado sin revelar secreto. |
| `GET /public/profiles/{o,f}/{slug}/…` | Sin token devuelve catálogo público. | Cursor y límite válidos. | Límite/cursor inválido. | Slug inexistente `404/NOT_FOUND` sin requerir bearer. |

## 7. Catálogo de errores y contratos a crear o ajustar

| Código actual | HTTP | Uso observado | Ajuste contractual requerido |
| --- | ---: | --- | --- |
| `TIMEOUT` | 504 | El filtro mapea SQLSTATE `57014` a este código. | Añadir al enum `ErrorResponse` y componente/respuesta 504. |
| `CIRCUIT_OPEN` | 503 | Error resiliente expuesto por el filtro. | Añadir al enum y ejemplo 503 específico. |
| `CONCURRENCY_LIMIT` | 503 | Error de mamparo expuesto por el filtro. | Añadir al enum y ejemplo 503 específico. |
| `IDENTITY_VERIFICATION_REQUIRED` | 403 | Código de dominio declarado para guardas de identidad. | Añadir al enum y a respuestas de las rutas protegidas que lo pueden emitir. |
| `PRECONDITION_FAILED` | 422 | Claim/complete/fail usan precondiciones de cola y lock. | Documentar la condición por operación y prueba; no reducirla a un 422 genérico. |

El envelope observado no posee un campo `reason`; no se inventa uno en este informe. Si la política transversal adopta reasons estables, debe incorporarse primero al filtro y después al componente OpenAPI junto con pruebas de compatibilidad.

## 8. Olas de ejecución y esfuerzo

| Ola | Hallazgos | Trabajo y dependencia | Esfuerzo |
| --- | --- | --- | --- |
| 1 | CO-01 | Alinear enum y respuestas compartidas con `ErrorCode`/filtro; añadir prueba de deriva. Depende del dueño del catálogo de errores. | M |
| 2 | CO-02 | Completar canales y operaciones worker en AsyncAPI; enlazar el contrato HTTP y eventos sin divulgar secretos. | M |
| 2 | CO-03 | Corregir schemas de claim, required y fixtures; ejecutar validación de parser y test de forma. Depende de CO-02. | S |
| 1 | CO-04 | Sincronizar las dos rutas `@Public()` con `security: []` y restablecer el gate de Redocly. | S |
| 3 | CO-01–03 | Generar SDK/fixtures de consumidor en entorno aislado y ejercer las cuatro familias de casos. | M |

## 9. Trabajo pendiente de integrar

No hay commits externos de la tabla del plan que modifiquen OpenAPI/AsyncAPI confirmados durante esta revisión. Antes de aplicar CO-01 se debe contrastar cualquier cambio pendiente del catálogo de errores; antes de aplicar CO-02/CO-03 se debe contrastar cualquier cambio que añada rutas internas de workers. El informe queda deliberadamente basado en `02af1e09`.
