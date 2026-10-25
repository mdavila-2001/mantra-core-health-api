<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `vector_rag`

- **Bloque:** Datos y NoSQL (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)
- **Operaciones:** 16 (16 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 1 · MEDIO 14 · BAJO 1
- **Tablas distintas que tocan:** 16
- **Respuestas de error y detalle contractual:** `openapi/endpoints/vector-rag.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/vector-rag/collections` | Crear una colección vectorial con su vínculo de tenant | MEDIO | 9 | RAG_COLLECTION_ADMIN, PLATFORM_ADMIN |
| 2 | POST | `/vector-rag/collections/{id}/embedding-jobs` | Encolar un job de embedding | MEDIO | 5 | RAG_COLLECTION_ADMIN, PLATFORM_ADMIN |
| 3 | PUT | `/vector-rag/collections/{id}/lifecycle` | Sellar o deprecar la colección | MEDIO | 6 | AI_GOVERNANCE_OFFICER, RAG_COLLECTION_ADMIN, PLATFORM_ADMIN |
| 4 | POST | `/vector-rag/collections/{id}/re-embed` | Migrar la colección a un modelo nuevo | MEDIO | 10 | AI_GOVERNANCE_OFFICER, MLOPS_ENGINEER, PLATFORM_ADMIN |
| 5 | POST | `/vector-rag/collections/{id}/reconciliation` | Reconciliar el manifiesto canónico contra el vectorial | MEDIO | 8 | SYSTEM, RECONCILIATION_WORKER, PLATFORM_ADMIN |
| 6 | POST | `/vector-rag/deletion-jobs` | Propagar el borrado de la fuente a los embeddings | ALTO | 12 | PRIVACY_OFFICER, DPO, SYSTEM, PLATFORM_ADMIN |
| 7 | POST | `/vector-rag/embedding-jobs/{id}/run` | Ejecutar un lote del job de embedding | MEDIO | 12 | SYSTEM, EMBEDDING_WORKER, PLATFORM_ADMIN |
| 8 | GET | `/vector-rag/embedding-jobs/pending` | Listar jobs de embedding en cola | BAJO | 1 | SYSTEM, EMBEDDING_WORKER, PLATFORM_ADMIN |
| 9 | POST | `/vector-rag/embedding-model-versions` | Registrar y aprobar una versión de modelo de embedding | MEDIO | 5 | AI_GOVERNANCE_OFFICER, MLOPS_ENGINEER, PLATFORM_ADMIN |
| 10 | POST | `/vector-rag/embedding-model-versions/{id}/retire` | Retirar una versión de modelo | MEDIO | 7 | AI_GOVERNANCE_OFFICER, MLOPS_ENGINEER, PLATFORM_ADMIN |
| 11 | POST | `/vector-rag/rag-access-policies` | Definir una política de acceso RAG | MEDIO | 2 | PRIVACY_OFFICER, DPO, PLATFORM_ADMIN |
| 12 | PUT | `/vector-rag/rag-access-policies/{id}/publish` | Publicar la política y reenlazar colecciones | MEDIO | 5 | PRIVACY_OFFICER, DPO, PLATFORM_ADMIN |
| 13 | POST | `/vector-rag/retrieval-sessions` | Abrir una sesión de retrieval gobernada por consentimiento | MEDIO | 7 | CLINICIAN, AGENT_RUNTIME, SYSTEM, PLATFORM_ADMIN |
| 14 | POST | `/vector-rag/retrieval-sessions/{id}/evidence` | Materializar la evidencia citable | MEDIO | 8 | SYSTEM, RETRIEVAL_WORKER, PLATFORM_ADMIN |
| 15 | POST | `/vector-rag/retrieval-sessions/{id}/feedback` | Capturar feedback de la sesión | MEDIO | 5 | CLINICIAN, AGENT_RUNTIME, PLATFORM_ADMIN |
| 16 | POST | `/vector-rag/retrieval-sessions/{id}/search` | Ranquear los candidatos y filtrarlos por consentimiento y etiquetas | MEDIO | 9 | SYSTEM, RETRIEVAL_WORKER, PLATFORM_ADMIN |

---

## 1. POST /vector-rag/collections

- **Origen:** CONTRATO
- **Nombre:** Crear una colección vectorial con su vínculo de tenant
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VectorGovernanceController.createCollection` — `src/modules/vector_rag/controllers/vector-governance.controller.ts:106`

### Qué es y para qué sirve (negocio)

Crear una colección vectorial con su vínculo de tenant. Caso de uso UC-59-02: Colección gobernada + binding de tenant. Dentro del módulo (descripción del modelo, en inglés): «Stores governed embeddings and retrieval evidence for protocols, policies, education, support and carefully approved clinical contexts.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/vector_rag/README.md:48`) · MODELO (`Mantra Core Health Context/modules/diagram_59_vector_rag.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /vector-rag/collections` la atiende `VectorGovernanceController.createCollection` (src/modules/vector_rag/controllers/vector-governance.controller.ts:106). Exige sesión con alguno de los roles RAG_COLLECTION_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `CreateCollectionDto` (8 campos, 5 obligatorios). Delega en `VectorGovernanceService.createCollection`. Crea filas en messaging.domain_events, messaging.outbox_messages, vector_rag.vector_collections, vector_rag.vector_tenant_bindings. Lee messaging.outbox_messages, vector_rag.embedding_model_versions, vector_rag.rag_access_policies, vector_rag.vector_collections, vector_rag.vector_tenant_bindings. Publica VectorCollectionProvisioned.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: RAG_COLLECTION_ADMIN, PLATFORM_ADMIN | `src/modules/vector_rag/controllers/vector-governance.controller.ts:106` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | VectorGovernanceController.createCollection → VectorGovernanceService.createCollection → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | VectorGovernanceController.createCollection → VectorGovernanceService.createCollection → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | VectorGovernanceController.createCollection → VectorGovernanceService.createCollection → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `vector_rag.embedding_model_versions` | LEE | LEE | DIRECTA | VectorGovernanceController.createCollection → VectorGovernanceService.createCollection → VectorCatalogRepository.findModelVersionForUpdate | `src/modules/vector_rag/repositories/vector-catalog.repository.ts:214` |
| `vector_rag.rag_access_policies` | LEE | LEE | DIRECTA | VectorGovernanceController.createCollection → VectorGovernanceService.createCollection → VectorCatalogRepository.findPolicyById | `src/modules/vector_rag/repositories/vector-catalog.repository.ts:427` |
| `vector_rag.vector_collections` | ESCRIBE | CREA | DIRECTA | VectorGovernanceController.createCollection → VectorGovernanceService.createCollection → VectorCatalogRepository.createCollection | `src/modules/vector_rag/repositories/vector-catalog.repository.ts:256` |
| `vector_rag.vector_collections` | LEE | LEE | DIRECTA | VectorGovernanceController.createCollection → VectorGovernanceService.createCollection → VectorCatalogRepository.findCollectionByCode | `src/modules/vector_rag/repositories/vector-catalog.repository.ts:310` |
| `vector_rag.vector_tenant_bindings` | ESCRIBE | CREA | DIRECTA | VectorGovernanceController.createCollection → VectorGovernanceService.createCollection → VectorCatalogRepository.createBinding | `src/modules/vector_rag/repositories/vector-catalog.repository.ts:367` |
| `vector_rag.vector_tenant_bindings` | LEE | LEE | DIRECTA | VectorGovernanceController.createCollection → VectorGovernanceService.createCollection → VectorCatalogRepository.findBindingByNamespace | `src/modules/vector_rag/repositories/vector-catalog.repository.ts:381` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `VectorCollectionProvisioned` | `src/modules/vector_rag/services/vector-governance.service.ts:247` |

### Cuerpo — DTO `CreateCollectionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:161` |
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:169` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:177` |
| `embeddingModelVersionId` | `string` | Sí | formato uuid | `@IsUUID()` | Modelo aprobado y no retirado | `src/modules/vector_rag/dto/vector-rag.dto.ts:184` |
| `containsPhi` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si la colección va a contener datos de paciente | `src/modules/vector_rag/dto/vector-rag.dto.ts:195` |
| `accessPolicyId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Política de acceso RAG publicada | `src/modules/vector_rag/dto/vector-rag.dto.ts:206` |
| `namespace` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Namespace físico único del vínculo | `src/modules/vector_rag/dto/vector-rag.dto.ts:217` |
| `encryptionProfileCode` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:226` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "embeddingModelVersionId": "00000000-0000-4000-8000-000000000001",
  "namespace": "Nombre de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "embeddingModelVersionId": "00000000-0000-4000-8000-000000000001",
  "containsPhi": false,
  "accessPolicyId": "00000000-0000-4000-8000-000000000001",
  "namespace": "Nombre de ejemplo",
  "encryptionProfileCode": "CODIGO_EJEMPLO"
}
```

</details>

### Respuesta — `Promise<CollectionResponseDto>` · DTO `CollectionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:237` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:243` |
| `dimension` | `number` | Sí | — | — | Valor de dimension mantenido por la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:249` |
| `distanceMetric` | `string` | Sí | — | — | Valor de distance metric mantenido por la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:255` |
| `lifecycleState` | `string` | Sí | — | — | Valor de lifecycle state mantenido por la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:261` |
| `bindingId` | `string` | Sí | formato uuid | — | Vínculo del tenant creado con la colección | `src/modules/vector_rag/dto/vector-rag.dto.ts:270` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión de modelo no encontrada. |
| 409 | `CONFLICT` | ConflictException: Ya existe una colección con ese código para el tenant.; ConflictException: El namespace ya está en uso por otro vínculo. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El modelo está retirado; no se pueden crear colecciones nuevas sobre él.; PreconditionFailedException: El modelo no está aprobado para datos de paciente. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/vector_rag.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 59 — Búsqueda vectorial, evidencia RAG y gobierno de embeddings — etapa `UC-59-02`

---

## 2. POST /vector-rag/collections/{id}/embedding-jobs

- **Origen:** CONTRATO
- **Nombre:** Encolar un job de embedding
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VectorGovernanceController.queueEmbeddingJob` — `src/modules/vector_rag/controllers/vector-governance.controller.ts:170`

### Qué es y para qué sirve (negocio)

Encolar un job de embedding. Caso de uso UC-59-04: Encolar job de embedding. Dentro del módulo (descripción del modelo, en inglés): «Stores governed embeddings and retrieval evidence for protocols, policies, education, support and carefully approved clinical contexts.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/vector_rag/README.md:50`) · MODELO (`Mantra Core Health Context/modules/diagram_59_vector_rag.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /vector-rag/collections/{id}/embedding-jobs` la atiende `VectorGovernanceController.queueEmbeddingJob` (src/modules/vector_rag/controllers/vector-governance.controller.ts:170). Exige sesión con alguno de los roles RAG_COLLECTION_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `QueueEmbeddingJobDto` (3 campos, 2 obligatorios). Delega en `EmbeddingPipelineService.queueEmbeddingJob`. Crea filas en messaging.domain_events, messaging.outbox_messages, vector_rag.embedding_jobs. Lee messaging.outbox_messages, vector_rag.vector_collections. Publica EmbeddingJobQueued.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: RAG_COLLECTION_ADMIN, PLATFORM_ADMIN | `src/modules/vector_rag/controllers/vector-governance.controller.ts:170` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CABECERA | idempotency-key (obligatoria) | `contrato (parameters)` |
| CABECERA | Idempotency-Key (opcional) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/vector_rag/controllers/vector-governance.controller.ts:170` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | VectorGovernanceController.queueEmbeddingJob → EmbeddingPipelineService.queueEmbeddingJob → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | VectorGovernanceController.queueEmbeddingJob → EmbeddingPipelineService.queueEmbeddingJob → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | VectorGovernanceController.queueEmbeddingJob → EmbeddingPipelineService.queueEmbeddingJob → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `vector_rag.embedding_jobs` | ESCRIBE | CREA | DIRECTA | VectorGovernanceController.queueEmbeddingJob → EmbeddingPipelineService.queueEmbeddingJob → VectorCatalogRepository.createJob | `src/modules/vector_rag/repositories/vector-catalog.repository.ts:460` |
| `vector_rag.vector_collections` | LEE | LEE | DIRECTA | VectorGovernanceController.queueEmbeddingJob → EmbeddingPipelineService.queueEmbeddingJob → VectorCatalogRepository.findCollectionById | `src/modules/vector_rag/repositories/vector-catalog.repository.ts:277` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `EmbeddingJobQueued` | `src/modules/vector_rag/services/embedding-pipeline.service.ts:107` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `idempotency-key` | header | Sí | `string` | — |
| `Idempotency-Key` | header | No | `string` | Si no se envía, se deriva del alcance del job. |

### Cuerpo — DTO `QueueEmbeddingJobDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `jobType` | `string` | Sí | valores: backfill, incremental, re_embed | `@IsIn(JOB_TYPES)` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:412` |
| `sourceScope` | `object` | Sí | — | `@IsObject()` | Qué documentos y versiones abarca el job | `src/modules/vector_rag/dto/vector-rag.dto.ts:419` |
| `totalChunks` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Chunks previstos, si se conocen | `src/modules/vector_rag/dto/vector-rag.dto.ts:431` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "jobType": "backfill",
  "sourceScope": {}
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "jobType": "backfill",
  "sourceScope": {},
  "totalChunks": 1
}
```

</details>

### Respuesta — `Promise<EmbeddingJobResponseDto>` · DTO `EmbeddingJobResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:442` |
| `vectorCollectionId` | `string` | Sí | formato uuid | — | Identificador asociado a vector collection. | `src/modules/vector_rag/dto/vector-rag.dto.ts:448` |
| `jobType` | `string` | Sí | — | — | Valor de job type mantenido por la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:454` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:460` |
| `duplicate` | `boolean` | Sí | — | — | Verdadero si la clave de idempotencia ya había encolado este job | `src/modules/vector_rag/dto/vector-rag.dto.ts:469` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La colección no está activa; no admite jobs de embedding. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/vector_rag.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 59 — Búsqueda vectorial, evidencia RAG y gobierno de embeddings — etapa `UC-59-04`

---

## 3. PUT /vector-rag/collections/{id}/lifecycle

- **Origen:** CONTRATO
- **Nombre:** Sellar o deprecar la colección
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VectorGovernanceController.updateCollectionLifecycle` — `src/modules/vector_rag/controllers/vector-governance.controller.ts:225`

### Qué es y para qué sirve (negocio)

Sellar o deprecar la colección. Dentro del módulo (descripción del modelo, en inglés): «Stores governed embeddings and retrieval evidence for protocols, policies, education, support and carefully approved clinical contexts.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_59_vector_rag.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`PUT /vector-rag/collections/{id}/lifecycle` la atiende `VectorGovernanceController.updateCollectionLifecycle` (src/modules/vector_rag/controllers/vector-governance.controller.ts:225). Exige sesión con alguno de los roles AI_GOVERNANCE_OFFICER, RAG_COLLECTION_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `UpdateCollectionLifecycleDto` (1 campo, 1 obligatorio). Delega en `VectorGovernanceService.updateCollectionLifecycle`. Crea filas en messaging.domain_events, messaging.outbox_messages. Actualiza vector_rag.vector_tenant_bindings. Lee messaging.outbox_messages, vector_rag.vector_collections, vector_rag.vector_tenant_bindings. Publica VectorCollectionSealed.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: AI_GOVERNANCE_OFFICER, RAG_COLLECTION_ADMIN, PLATFORM_ADMIN | `src/modules/vector_rag/controllers/vector-governance.controller.ts:225` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/vector_rag/controllers/vector-governance.controller.ts:225` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | VectorGovernanceController.updateCollectionLifecycle → VectorGovernanceService.updateCollectionLifecycle → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | VectorGovernanceController.updateCollectionLifecycle → VectorGovernanceService.updateCollectionLifecycle → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | VectorGovernanceController.updateCollectionLifecycle → VectorGovernanceService.updateCollectionLifecycle → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `vector_rag.vector_collections` | LEE | LEE | DIRECTA | VectorGovernanceController.updateCollectionLifecycle → VectorGovernanceService.updateCollectionLifecycle → VectorCatalogRepository.findCollectionForUpdate | `src/modules/vector_rag/repositories/vector-catalog.repository.ts:292` |
| `vector_rag.vector_tenant_bindings` | ESCRIBE | ACTUALIZA | POR_TIPO | VectorGovernanceController.updateCollectionLifecycle → VectorGovernanceService.updateCollectionLifecycle | `src/modules/vector_rag/services/vector-governance.service.ts:549` |
| `vector_rag.vector_tenant_bindings` | LEE | LEE | DIRECTA | VectorGovernanceController.updateCollectionLifecycle → VectorGovernanceService.updateCollectionLifecycle → VectorCatalogRepository.findBindingsByCollectionForUpdate | `src/modules/vector_rag/repositories/vector-catalog.repository.ts:395` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `VectorCollectionSealed` | `src/modules/vector_rag/services/vector-governance.service.ts:554` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateCollectionLifecycleDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `lifecycleState` | `string` | Sí | valores: active, sealed, deprecated | `@IsIn(COLLECTION_STATES)` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:1407` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "lifecycleState": "active"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "lifecycleState": "active"
}
```

</details>

### Respuesta — `Promise<LifecycleResponseDto>` · DTO `LifecycleResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:1418` |
| `lifecycleState` | `string` | Sí | — | — | Valor de lifecycle state mantenido por la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:1424` |
| `frozenBindings` | `number` | Sí | — | — | Vínculos de tenant congelados por el cambio | `src/modules/vector_rag/dto/vector-rag.dto.ts:1430` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/vector_rag.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 59 — Búsqueda vectorial, evidencia RAG y gobierno de embeddings — etapa `ctrl:VectorGovernanceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. POST /vector-rag/collections/{id}/re-embed

- **Origen:** CONTRATO
- **Nombre:** Migrar la colección a un modelo nuevo
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VectorGovernanceController.reEmbedCollection` — `src/modules/vector_rag/controllers/vector-governance.controller.ts:203`

### Qué es y para qué sirve (negocio)

Migrar la colección a un modelo nuevo. Caso de uso UC-59-11: Re-embeber tras cambio de modelo. Dentro del módulo (descripción del modelo, en inglés): «Stores governed embeddings and retrieval evidence for protocols, policies, education, support and carefully approved clinical contexts.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/vector_rag/README.md:57`) · MODELO (`Mantra Core Health Context/modules/diagram_59_vector_rag.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /vector-rag/collections/{id}/re-embed` la atiende `VectorGovernanceController.reEmbedCollection` (src/modules/vector_rag/controllers/vector-governance.controller.ts:203). Exige sesión con alguno de los roles AI_GOVERNANCE_OFFICER, MLOPS_ENGINEER, PLATFORM_ADMIN. Valida el cuerpo como `ReEmbedCollectionDto` (2 campos, 1 obligatorio). Delega en `EmbeddingPipelineService.reEmbedCollection`. Crea filas en messaging.domain_events, messaging.outbox_messages, vector_rag.embedding_jobs. Actualiza vector_rag.vector_embeddings. Lee messaging.outbox_messages, vector_rag.embedding_model_versions, vector_rag.vector_chunks, vector_rag.vector_collections, vector_rag.vector_documents, vector_rag.vector_embeddings. Publica CollectionReEmbedRequested.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: AI_GOVERNANCE_OFFICER, MLOPS_ENGINEER, PLATFORM_ADMIN | `src/modules/vector_rag/controllers/vector-governance.controller.ts:203` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/vector_rag/controllers/vector-governance.controller.ts:203` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | VectorGovernanceController.reEmbedCollection → EmbeddingPipelineService.reEmbedCollection → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | VectorGovernanceController.reEmbedCollection → EmbeddingPipelineService.reEmbedCollection → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | VectorGovernanceController.reEmbedCollection → EmbeddingPipelineService.reEmbedCollection → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `vector_rag.embedding_jobs` | ESCRIBE | CREA | DIRECTA | VectorGovernanceController.reEmbedCollection → EmbeddingPipelineService.reEmbedCollection → VectorCatalogRepository.createJob | `src/modules/vector_rag/repositories/vector-catalog.repository.ts:460` |
| `vector_rag.embedding_model_versions` | LEE | LEE | DIRECTA | VectorGovernanceController.reEmbedCollection → EmbeddingPipelineService.reEmbedCollection → VectorCatalogRepository.findModelVersionForUpdate | `src/modules/vector_rag/repositories/vector-catalog.repository.ts:214` |
| `vector_rag.vector_chunks` | LEE | LEE | DIRECTA | VectorGovernanceController.reEmbedCollection → EmbeddingPipelineService.reEmbedCollection → VectorCorpusRepository.findChunksByDocuments | `src/modules/vector_rag/repositories/vector-corpus.repository.ts:331` |
| `vector_rag.vector_collections` | LEE | LEE | DIRECTA | VectorGovernanceController.reEmbedCollection → EmbeddingPipelineService.reEmbedCollection → VectorCatalogRepository.findCollectionForUpdate | `src/modules/vector_rag/repositories/vector-catalog.repository.ts:292` |
| `vector_rag.vector_documents` | LEE | LEE | DIRECTA | VectorGovernanceController.reEmbedCollection → EmbeddingPipelineService.reEmbedCollection → VectorCorpusRepository.findActiveDocumentsByCollection | `src/modules/vector_rag/repositories/vector-corpus.repository.ts:261` |
| `vector_rag.vector_embeddings` | ESCRIBE | ACTUALIZA | POR_TIPO | VectorGovernanceController.reEmbedCollection → EmbeddingPipelineService.reEmbedCollection | `src/modules/vector_rag/services/embedding-pipeline.service.ts:451` |
| `vector_rag.vector_embeddings` | LEE | LEE | DIRECTA | VectorGovernanceController.reEmbedCollection → EmbeddingPipelineService.reEmbedCollection → VectorCorpusRepository.findEmbeddingsByChunksAndModelForUpdate | `src/modules/vector_rag/repositories/vector-corpus.repository.ts:389` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `CollectionReEmbedRequested` | `src/modules/vector_rag/services/embedding-pipeline.service.ts:470` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ReEmbedCollectionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `embeddingModelVersionId` | `string` | Sí | formato uuid | `@IsUUID()` | Nuevo modelo, aprobado y no retirado | `src/modules/vector_rag/dto/vector-rag.dto.ts:1242` |
| `supersedePrevious` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si los embeddings del modelo anterior pasan a `superseded` | `src/modules/vector_rag/dto/vector-rag.dto.ts:1253` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "embeddingModelVersionId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "embeddingModelVersionId": "00000000-0000-4000-8000-000000000001",
  "supersedePrevious": true
}
```

</details>

### Respuesta — `Promise<ReEmbedResponseDto>` · DTO `ReEmbedResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `vectorCollectionId` | `string` | Sí | formato uuid | — | Identificador asociado a vector collection. | `src/modules/vector_rag/dto/vector-rag.dto.ts:1264` |
| `embeddingJobId` | `string` | Sí | formato uuid | — | Job de re-embedding encolado | `src/modules/vector_rag/dto/vector-rag.dto.ts:1270` |
| `embeddingModelVersionId` | `string` | Sí | formato uuid | — | Identificador asociado a embedding model version. | `src/modules/vector_rag/dto/vector-rag.dto.ts:1276` |
| `supersededEmbeddings` | `number` | Sí | — | — | Embeddings del modelo anterior marcados como superados | `src/modules/vector_rag/dto/vector-rag.dto.ts:1284` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión de modelo no encontrada. |
| 409 | `CONFLICT` | ConflictException: La colección ya usa esa versión de modelo. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La colección no está activa.; PreconditionFailedException: El modelo de destino está retirado.; PreconditionFailedException: El modelo de destino no está aprobado para datos de paciente. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/vector_rag.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 59 — Búsqueda vectorial, evidencia RAG y gobierno de embeddings — etapa `UC-59-11`

---

## 5. POST /vector-rag/collections/{id}/reconciliation

- **Origen:** CONTRATO
- **Nombre:** Reconciliar el manifiesto canónico contra el vectorial
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VectorRuntimeController.reconcileCollection` — `src/modules/vector_rag/controllers/vector-runtime.controller.ts:210`

### Qué es y para qué sirve (negocio)

Reconciliar el manifiesto canónico contra el vectorial. Caso de uso UC-59-12: Reconciliar canónico vs vectorial. Dentro del módulo (descripción del modelo, en inglés): «Stores governed embeddings and retrieval evidence for protocols, policies, education, support and carefully approved clinical contexts.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/vector_rag/README.md:58`) · MODELO (`Mantra Core Health Context/modules/diagram_59_vector_rag.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /vector-rag/collections/{id}/reconciliation` la atiende `VectorRuntimeController.reconcileCollection` (src/modules/vector_rag/controllers/vector-runtime.controller.ts:210). Exige sesión con alguno de los roles SYSTEM, RECONCILIATION_WORKER, PLATFORM_ADMIN. Valida el cuerpo como `ReconcileCollectionDto` (3 campos, 2 obligatorios). Delega en `VectorMaintenanceService.reconcileCollection`. Crea filas en messaging.domain_events, messaging.outbox_messages, vector_rag.embedding_jobs, vector_rag.vector_deletion_jobs, vector_rag.vector_reconciliation_runs. Lee messaging.outbox_messages, vector_rag.vector_collections, vector_rag.vector_documents. Publica VectorReconciliationCompleted, DriftDetected.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, RECONCILIATION_WORKER, PLATFORM_ADMIN | `src/modules/vector_rag/controllers/vector-runtime.controller.ts:210` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/vector_rag/controllers/vector-runtime.controller.ts:210` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | VectorRuntimeController.reconcileCollection → VectorMaintenanceService.reconcileCollection → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | VectorRuntimeController.reconcileCollection → VectorMaintenanceService.reconcileCollection → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | VectorRuntimeController.reconcileCollection → VectorMaintenanceService.reconcileCollection → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `vector_rag.embedding_jobs` | ESCRIBE | CREA | DIRECTA | VectorRuntimeController.reconcileCollection → VectorMaintenanceService.reconcileCollection → VectorCatalogRepository.createJob | `src/modules/vector_rag/repositories/vector-catalog.repository.ts:460` |
| `vector_rag.vector_collections` | LEE | LEE | DIRECTA | VectorRuntimeController.reconcileCollection → VectorMaintenanceService.reconcileCollection → VectorCatalogRepository.findCollectionById | `src/modules/vector_rag/repositories/vector-catalog.repository.ts:277` |
| `vector_rag.vector_deletion_jobs` | ESCRIBE | CREA | DIRECTA | VectorRuntimeController.reconcileCollection → VectorMaintenanceService.reconcileCollection → VectorCorpusRepository.createDeletionJob | `src/modules/vector_rag/repositories/vector-corpus.repository.ts:447` |
| `vector_rag.vector_documents` | LEE | LEE | DIRECTA | VectorRuntimeController.reconcileCollection → VectorMaintenanceService.reconcileCollection → VectorCorpusRepository.findActiveDocumentsByCollection | `src/modules/vector_rag/repositories/vector-corpus.repository.ts:261` |
| `vector_rag.vector_reconciliation_runs` | ESCRIBE | CREA | DIRECTA | VectorRuntimeController.reconcileCollection → VectorMaintenanceService.reconcileCollection → VectorCorpusRepository.createReconciliationRun | `src/modules/vector_rag/repositories/vector-corpus.repository.ts:526` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `VectorReconciliationCompleted` | `src/modules/vector_rag/services/vector-maintenance.service.ts:307` |
| Evento de dominio | `DriftDetected` | `src/modules/vector_rag/services/vector-maintenance.service.ts:323` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ReconcileCollectionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `canonicalDocumentIds` | `array<string>` | Sí | formato uuid | `@IsArray()` `@IsUUID('4', { each: true })` | Documentos que la fuente autoritativa dice que deberían estar | `src/modules/vector_rag/dto/vector-rag.dto.ts:1304` |
| `canonicalManifestHash` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Hash del manifiesto canónico | `src/modules/vector_rag/dto/vector-rag.dto.ts:1312` |
| `autoRepair` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si el drift detectado encola automáticamente su reparación | `src/modules/vector_rag/dto/vector-rag.dto.ts:1323` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "canonicalDocumentIds": [
    "00000000-0000-4000-8000-000000000001"
  ],
  "canonicalManifestHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "canonicalDocumentIds": [
    "00000000-0000-4000-8000-000000000001"
  ],
  "canonicalManifestHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "autoRepair": true
}
```

</details>

### Respuesta — `Promise<ReconciliationResponseDto>` · DTO `ReconciliationResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:1334` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:1340` |
| `missingCount` | `number` | Sí | — | — | Documentos que la fuente tiene y el vector no | `src/modules/vector_rag/dto/vector-rag.dto.ts:1346` |
| `orphanCount` | `number` | Sí | — | — | Documentos que el vector tiene y la fuente ya no | `src/modules/vector_rag/dto/vector-rag.dto.ts:1354` |
| `mismatchedCount` | `number` | Sí | — | — | Documentos presentes en ambos con contenido distinto | `src/modules/vector_rag/dto/vector-rag.dto.ts:1362` |
| `repairJobId` | `string` | No | formato uuid | — | Job encolado para reparar lo que falta | `src/modules/vector_rag/dto/vector-rag.dto.ts:1371` |
| `purgeJobId` | `string` | No | formato uuid | — | Job encolado para purgar los huérfanos | `src/modules/vector_rag/dto/vector-rag.dto.ts:1380` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/vector_rag.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 59 — Búsqueda vectorial, evidencia RAG y gobierno de embeddings — etapa `UC-59-12`

---

## 6. POST /vector-rag/deletion-jobs

- **Origen:** CONTRATO
- **Nombre:** Propagar el borrado de la fuente a los embeddings
- **Bloque:** Datos y NoSQL
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VectorRuntimeController.propagateDeletion` — `src/modules/vector_rag/controllers/vector-runtime.controller.ts:189`

### Qué es y para qué sirve (negocio)

Propagar el borrado de la fuente a los embeddings. Caso de uso UC-59-10: Propagar borrado a embeddings. Dentro del módulo (descripción del modelo, en inglés): «Stores governed embeddings and retrieval evidence for protocols, policies, education, support and carefully approved clinical contexts.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/vector_rag/README.md:56`) · MODELO (`Mantra Core Health Context/modules/diagram_59_vector_rag.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /vector-rag/deletion-jobs` la atiende `VectorRuntimeController.propagateDeletion` (src/modules/vector_rag/controllers/vector-runtime.controller.ts:189). Exige sesión con alguno de los roles PRIVACY_OFFICER, DPO, SYSTEM, PLATFORM_ADMIN. Valida el cuerpo como `PropagateDeletionDto` (5 campos, 2 obligatorios). Delega en `VectorMaintenanceService.propagateDeletion`. Crea filas en messaging.domain_events, messaging.outbox_messages, vector_rag.vector_deletion_jobs. Actualiza vector_rag.vector_deletion_jobs. Borra de vector_rag.vector_chunks, vector_rag.vector_documents, vector_rag.vector_embeddings. Lee messaging.outbox_messages, vector_rag.vector_chunks, vector_rag.vector_collections, vector_rag.vector_deletion_jobs, vector_rag.vector_documents. Publica VectorEmbeddingsPurged.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRIVACY_OFFICER, DPO, SYSTEM, PLATFORM_ADMIN | `src/modules/vector_rag/controllers/vector-runtime.controller.ts:189` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | VectorRuntimeController.propagateDeletion → VectorMaintenanceService.propagateDeletion → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | VectorRuntimeController.propagateDeletion → VectorMaintenanceService.propagateDeletion → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | VectorRuntimeController.propagateDeletion → VectorMaintenanceService.propagateDeletion → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `vector_rag.vector_chunks` | BORRA | BORRA | DIRECTA | VectorRuntimeController.propagateDeletion → VectorMaintenanceService.propagateDeletion → VectorCorpusRepository.deleteChunks | `src/modules/vector_rag/repositories/vector-corpus.repository.ts:343` |
| `vector_rag.vector_chunks` | LEE | LEE | DIRECTA | VectorRuntimeController.propagateDeletion → VectorMaintenanceService.propagateDeletion → VectorCorpusRepository.findChunksByDocuments | `src/modules/vector_rag/repositories/vector-corpus.repository.ts:331` |
| `vector_rag.vector_collections` | LEE | LEE | DIRECTA | VectorRuntimeController.propagateDeletion → VectorMaintenanceService.propagateDeletion → VectorCorpusRepository.findDocumentsForDeletion | `src/modules/vector_rag/repositories/vector-corpus.repository.ts:208` |
| `vector_rag.vector_deletion_jobs` | ESCRIBE | ACTUALIZA | POR_TIPO | VectorRuntimeController.propagateDeletion → VectorMaintenanceService.propagateDeletion | `src/modules/vector_rag/services/vector-maintenance.service.ts:148` |
| `vector_rag.vector_deletion_jobs` | ESCRIBE | CREA | DIRECTA | VectorRuntimeController.propagateDeletion → VectorMaintenanceService.propagateDeletion → VectorCorpusRepository.createDeletionJob | `src/modules/vector_rag/repositories/vector-corpus.repository.ts:447` |
| `vector_rag.vector_deletion_jobs` | LEE | LEE | DIRECTA | VectorRuntimeController.propagateDeletion → VectorMaintenanceService.propagateDeletion → VectorCorpusRepository.hasPriorDeletionJob | `src/modules/vector_rag/repositories/vector-corpus.repository.ts:252` |
| `vector_rag.vector_documents` | BORRA | BORRA | DIRECTA | VectorRuntimeController.propagateDeletion → VectorMaintenanceService.propagateDeletion → VectorCorpusRepository.deleteDocuments | `src/modules/vector_rag/repositories/vector-corpus.repository.ts:277` |
| `vector_rag.vector_documents` | LEE | LEE | DIRECTA | VectorRuntimeController.propagateDeletion → VectorMaintenanceService.propagateDeletion → VectorCorpusRepository.findDocumentsForDeletion | `src/modules/vector_rag/repositories/vector-corpus.repository.ts:221` |
| `vector_rag.vector_embeddings` | BORRA | BORRA | DIRECTA | VectorRuntimeController.propagateDeletion → VectorMaintenanceService.propagateDeletion → VectorCorpusRepository.deleteEmbeddingsByChunks | `src/modules/vector_rag/repositories/vector-corpus.repository.ts:408` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `VectorEmbeddingsPurged` | `src/modules/vector_rag/services/vector-maintenance.service.ts:152` |

### Cuerpo — DTO `PropagateDeletionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:1142` |
| `sourceDocumentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Documento fuente borrado | `src/modules/vector_rag/dto/vector-rag.dto.ts:1153` |
| `patientProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Paciente cuyo dato se borra | `src/modules/vector_rag/dto/vector-rag.dto.ts:1164` |
| `deletionReason` | `string` | Sí | valores: source_document_deleted, patient_erasure, orphan_purge | `@IsIn(DELETION_REASONS)` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:1171` |
| `batchSize` | `number` | No | mínimo 1; máximo 1000 | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(1000)` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:1181` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "deletionReason": "source_document_deleted"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "sourceDocumentId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "deletionReason": "source_document_deleted",
  "batchSize": 100
}
```

</details>

### Respuesta — `Promise<DeletionResponseDto>` · DTO `DeletionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:1192` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:1198` |
| `documentsPurged` | `number` | Sí | — | — | Valor de documents purged mantenido por la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:1204` |
| `chunksPurged` | `number` | Sí | — | — | Valor de chunks purged mantenido por la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:1210` |
| `embeddingsPurged` | `number` | Sí | — | — | Valor de embeddings purged mantenido por la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:1216` |
| `verified` | `boolean` | Sí | — | — | Verdadero si no quedaba nada por purgar y el borrado queda verificado | `src/modules/vector_rag/dto/vector-rag.dto.ts:1225` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Referencia de borrado no encontrada. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Hay que declarar qué se borra: un documento fuente o un paciente. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/vector_rag.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 59 — Búsqueda vectorial, evidencia RAG y gobierno de embeddings — etapa `UC-59-10`

---

## 7. POST /vector-rag/embedding-jobs/{id}/run

- **Origen:** CONTRATO
- **Nombre:** Ejecutar un lote del job de embedding
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VectorRuntimeController.runEmbeddingJob` — `src/modules/vector_rag/controllers/vector-runtime.controller.ts:79`

### Qué es y para qué sirve (negocio)

Ejecutar un lote del job de embedding. Caso de uso UC-59-05: Chunking + embedding + upsert. Dentro del módulo (descripción del modelo, en inglés): «Stores governed embeddings and retrieval evidence for protocols, policies, education, support and carefully approved clinical contexts.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/vector_rag/README.md:51`) · MODELO (`Mantra Core Health Context/modules/diagram_59_vector_rag.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /vector-rag/embedding-jobs/{id}/run` la atiende `VectorRuntimeController.runEmbeddingJob` (src/modules/vector_rag/controllers/vector-runtime.controller.ts:79). Exige sesión con alguno de los roles SYSTEM, EMBEDDING_WORKER, PLATFORM_ADMIN. Valida el cuerpo como `RunEmbeddingJobDto` (23 campos, 0 obligatorios). Delega en `EmbeddingPipelineService.runEmbeddingJob`. Crea filas en messaging.domain_events, messaging.outbox_messages, vector_rag.vector_chunks, vector_rag.vector_documents, vector_rag.vector_embeddings. Lee messaging.outbox_messages, vector_rag.embedding_jobs, vector_rag.embedding_model_versions, vector_rag.vector_chunks, vector_rag.vector_collections, vector_rag.vector_documents, vector_rag.vector_embeddings. Publica EmbeddingJobCompleted.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, EMBEDDING_WORKER, PLATFORM_ADMIN | `src/modules/vector_rag/controllers/vector-runtime.controller.ts:79` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/vector_rag/controllers/vector-runtime.controller.ts:79` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | VectorRuntimeController.runEmbeddingJob → EmbeddingPipelineService.runEmbeddingJob → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | VectorRuntimeController.runEmbeddingJob → EmbeddingPipelineService.runEmbeddingJob → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | VectorRuntimeController.runEmbeddingJob → EmbeddingPipelineService.runEmbeddingJob → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `vector_rag.embedding_jobs` | LEE | LEE | DIRECTA | VectorRuntimeController.runEmbeddingJob → EmbeddingPipelineService.runEmbeddingJob → VectorCatalogRepository.findJobForUpdate | `src/modules/vector_rag/repositories/vector-catalog.repository.ts:495` |
| `vector_rag.embedding_model_versions` | LEE | LEE | DIRECTA | VectorRuntimeController.runEmbeddingJob → EmbeddingPipelineService.runEmbeddingJob → VectorCatalogRepository.findModelVersionById | `src/modules/vector_rag/repositories/vector-catalog.repository.ts:202` |
| `vector_rag.vector_chunks` | ESCRIBE | CREA | DIRECTA | VectorRuntimeController.runEmbeddingJob → EmbeddingPipelineService.runEmbeddingJob → VectorCorpusRepository.createChunk | `src/modules/vector_rag/repositories/vector-corpus.repository.ts:290` |
| `vector_rag.vector_chunks` | LEE | LEE | DIRECTA | VectorRuntimeController.runEmbeddingJob → EmbeddingPipelineService.runEmbeddingJob → VectorCorpusRepository.findChunkByHash | `src/modules/vector_rag/repositories/vector-corpus.repository.ts:316` |
| `vector_rag.vector_collections` | LEE | LEE | DIRECTA | VectorRuntimeController.runEmbeddingJob → EmbeddingPipelineService.runEmbeddingJob → VectorCatalogRepository.findCollectionById | `src/modules/vector_rag/repositories/vector-catalog.repository.ts:277` |
| `vector_rag.vector_documents` | ESCRIBE | CREA | DIRECTA | VectorRuntimeController.runEmbeddingJob → EmbeddingPipelineService.runEmbeddingJob → VectorCorpusRepository.createDocument | `src/modules/vector_rag/repositories/vector-corpus.repository.ts:161` |
| `vector_rag.vector_documents` | LEE | LEE | DIRECTA | VectorRuntimeController.runEmbeddingJob → EmbeddingPipelineService.runEmbeddingJob → VectorCorpusRepository.findDocument | `src/modules/vector_rag/repositories/vector-corpus.repository.ts:146` |
| `vector_rag.vector_embeddings` | ESCRIBE | CREA | DIRECTA | VectorRuntimeController.runEmbeddingJob → EmbeddingPipelineService.runEmbeddingJob → VectorCorpusRepository.createEmbedding | `src/modules/vector_rag/repositories/vector-corpus.repository.ts:375` |
| `vector_rag.vector_embeddings` | LEE | LEE | DIRECTA | VectorRuntimeController.runEmbeddingJob → EmbeddingPipelineService.runEmbeddingJob → VectorCorpusRepository.findEmbedding | `src/modules/vector_rag/repositories/vector-corpus.repository.ts:358` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `EmbeddingJobCompleted` | `src/modules/vector_rag/services/embedding-pipeline.service.ts:323` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RunEmbeddingJobDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `documents` | `array<EmbeddedDocumentDto>` | No | mínimo 1 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => EmbeddedDocumentDto)` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:690` |
| `documents[].sourceDocumentId` | `string` | No | formato uuid | `@IsUUID()` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:585` |
| `documents[].sourceVersionId` | `string` | No | formato uuid | `@IsUUID()` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:592` |
| `documents[].documentType` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:601` |
| `documents[].language` | `string` | No | longitud máxima 20 | `@IsOptional()` `@IsString()` `@MaxLength(20)` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:610` |
| `documents[].title` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:619` |
| `documents[].contentHash` | `string` | No | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:627` |
| `documents[].containsPhi` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:635` |
| `documents[].patientProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:643` |
| `documents[].securityLabels` | `array<string>` | No | — | `@IsOptional()` `@IsArray()` `@IsString({ each: true })` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:652` |
| `documents[].purposeOfUseCodes` | `array<string>` | No | — | `@IsOptional()` `@IsArray()` `@IsString({ each: true })` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:661` |
| `documents[].chunks` | `array<EmbeddedChunkDto>` | No | mínimo 1 elemento(s); máximo 500 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(MAX_CHUNKS_PER_BATCH)` `@ValidateNested({ each: true })` `@Type(() => EmbeddedChunkDto)` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:672` |
| `documents[].chunks[].chunkNumber` | `number` | No | mínimo 0 | `@IsInt()` `@Min(0)` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:516` |
| `documents[].chunks[].chunkTextRedacted` | `string` | No | — | `@IsString()` | Texto ya redactado; nunca el original | `src/modules/vector_rag/dto/vector-rag.dto.ts:523` |
| `documents[].chunks[].tokenCount` | `number` | No | mínimo 1 | `@IsInt()` `@Min(1)` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:531` |
| `documents[].chunks[].chunkHash` | `string` | No | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Hash del texto del chunk | `src/modules/vector_rag/dto/vector-rag.dto.ts:539` |
| `documents[].chunks[].sectionPath` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:548` |
| `documents[].chunks[].metadata` | `object` | No | — | `@IsOptional()` `@IsObject()` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:556` |
| `documents[].chunks[].embedding` | `string` | No | — | `@IsString()` | Vector en formato de pgvector, p. ej. `[0.1,0.2,...]` | `src/modules/vector_rag/dto/vector-rag.dto.ts:565` |
| `documents[].chunks[].embeddingHash` | `string` | No | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:573` |
| `finalBatch` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si este lote cierra el job y lo pasa a completado | `src/modules/vector_rag/dto/vector-rag.dto.ts:701` |
| `failed` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | El lote falló antes de calcular ningún embedding | `src/modules/vector_rag/dto/vector-rag.dto.ts:712` |
| `errorCode` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:721` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "documents": [
    {
      "sourceDocumentId": "00000000-0000-4000-8000-000000000001",
      "sourceVersionId": "00000000-0000-4000-8000-000000000001",
      "documentType": "valor-ejemplo",
      "language": "es-BO",
      "title": "valor-ejemplo",
      "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "containsPhi": false,
      "patientProfileId": "00000000-0000-4000-8000-000000000001",
      "securityLabels": [
        "valor-ejemplo"
      ],
      "purposeOfUseCodes": [
        "CODIGO_EJEMPLO"
      ],
      "chunks": [
        {
          "chunkNumber": 1,
          "chunkTextRedacted": "valor-ejemplo",
          "tokenCount": 1,
          "chunkHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          "sectionPath": "valor-ejemplo",
          "metadata": {},
          "embedding": "valor-ejemplo",
          "embeddingHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
        }
      ]
    }
  ],
  "finalBatch": false,
  "failed": true,
  "errorCode": "CODIGO_EJEMPLO"
}
```

</details>

### Respuesta — `Promise<RunEmbeddingJobResponseDto>` · DTO `RunEmbeddingJobResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `jobId` | `string` | Sí | formato uuid | — | Identificador asociado a job. | `src/modules/vector_rag/dto/vector-rag.dto.ts:732` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:738` |
| `documentsUpserted` | `number` | Sí | — | — | Documentos creados en este lote | `src/modules/vector_rag/dto/vector-rag.dto.ts:744` |
| `chunksCreated` | `number` | Sí | — | — | Chunks creados en este lote | `src/modules/vector_rag/dto/vector-rag.dto.ts:750` |
| `embeddingsCreated` | `number` | Sí | — | — | Embeddings creados en este lote | `src/modules/vector_rag/dto/vector-rag.dto.ts:756` |
| `chunksSkipped` | `number` | Sí | — | — | Chunks que ya estaban embebidos y no se repitieron | `src/modules/vector_rag/dto/vector-rag.dto.ts:764` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión de modelo no encontrada. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El job ya no está en cola ni en ejecución.; PreconditionFailedException: El modelo de la colección está retirado; el job no puede seguir.; PreconditionFailedException: La colección no admite datos de paciente y el documento los declara. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/vector_rag.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 59 — Búsqueda vectorial, evidencia RAG y gobierno de embeddings — etapa `UC-59-05`

---

## 8. GET /vector-rag/embedding-jobs/pending

- **Origen:** CONTRATO
- **Nombre:** Listar jobs de embedding en cola
- **Bloque:** Datos y NoSQL
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VectorRuntimeController.listQueuedJobs` — `src/modules/vector_rag/controllers/vector-runtime.controller.ts:68`

### Qué es y para qué sirve (negocio)

Listar jobs de embedding en cola. Dentro del módulo (descripción del modelo, en inglés): «Stores governed embeddings and retrieval evidence for protocols, policies, education, support and carefully approved clinical contexts.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_59_vector_rag.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`GET /vector-rag/embedding-jobs/pending` la atiende `VectorRuntimeController.listQueuedJobs` (src/modules/vector_rag/controllers/vector-runtime.controller.ts:68). Exige sesión con alguno de los roles SYSTEM, EMBEDDING_WORKER, PLATFORM_ADMIN. Delega en `EmbeddingPipelineService.listQueuedJobs`. Lee vector_rag.embedding_jobs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, EMBEDDING_WORKER, PLATFORM_ADMIN | `src/modules/vector_rag/controllers/vector-runtime.controller.ts:68` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `vector_rag.embedding_jobs` | LEE | LEE | DIRECTA | VectorRuntimeController.listQueuedJobs → EmbeddingPipelineService.listQueuedJobs → VectorCatalogRepository.findQueuedJobs | `src/modules/vector_rag/repositories/vector-catalog.repository.ts:534` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `limit` | query | Sí | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PendingEmbeddingJobsResponseDto>` · DTO `PendingEmbeddingJobsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `jobs` | `array<QueuedEmbeddingJobSummaryDto>` | Sí | — | — | Valor de jobs mantenido por la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:499` |
| `jobs[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:478` |
| `jobs[].vectorCollectionId` | `string` | Sí | formato uuid | — | Identificador asociado a vector collection. | `src/modules/vector_rag/dto/vector-rag.dto.ts:484` |
| `jobs[].jobType` | `string` | Sí | — | — | Valor de job type mantenido por la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:490` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/vector_rag.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 59 — Búsqueda vectorial, evidencia RAG y gobierno de embeddings — etapa `ctrl:VectorRuntimeController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. POST /vector-rag/embedding-model-versions

- **Origen:** CONTRATO
- **Nombre:** Registrar y aprobar una versión de modelo de embedding
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VectorGovernanceController.registerModelVersion` — `src/modules/vector_rag/controllers/vector-governance.controller.ts:63`

### Qué es y para qué sirve (negocio)

Registrar y aprobar una versión de modelo de embedding. Caso de uso UC-59-01: Registrar y aprobar versión de modelo. Dentro del módulo (descripción del modelo, en inglés): «Stores governed embeddings and retrieval evidence for protocols, policies, education, support and carefully approved clinical contexts.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/vector_rag/README.md:47`) · MODELO (`Mantra Core Health Context/modules/diagram_59_vector_rag.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /vector-rag/embedding-model-versions` la atiende `VectorGovernanceController.registerModelVersion` (src/modules/vector_rag/controllers/vector-governance.controller.ts:63). Exige sesión con alguno de los roles AI_GOVERNANCE_OFFICER, MLOPS_ENGINEER, PLATFORM_ADMIN. Valida el cuerpo como `RegisterModelVersionDto` (7 campos, 6 obligatorios). Delega en `VectorGovernanceService.registerModelVersion`. Crea filas en messaging.domain_events, messaging.outbox_messages, vector_rag.embedding_model_versions. Lee messaging.outbox_messages, vector_rag.embedding_model_versions. Publica EmbeddingModelVersionApproved.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: AI_GOVERNANCE_OFFICER, MLOPS_ENGINEER, PLATFORM_ADMIN | `src/modules/vector_rag/controllers/vector-governance.controller.ts:63` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | VectorGovernanceController.registerModelVersion → VectorGovernanceService.registerModelVersion → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | VectorGovernanceController.registerModelVersion → VectorGovernanceService.registerModelVersion → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | VectorGovernanceController.registerModelVersion → VectorGovernanceService.registerModelVersion → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `vector_rag.embedding_model_versions` | ESCRIBE | CREA | DIRECTA | VectorGovernanceController.registerModelVersion → VectorGovernanceService.registerModelVersion → VectorCatalogRepository.createModelVersion | `src/modules/vector_rag/repositories/vector-catalog.repository.ts:188` |
| `vector_rag.embedding_model_versions` | LEE | LEE | DIRECTA | VectorGovernanceController.registerModelVersion → VectorGovernanceService.registerModelVersion → VectorCatalogRepository.findModelVersion | `src/modules/vector_rag/repositories/vector-catalog.repository.ts:236` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `EmbeddingModelVersionApproved` | `src/modules/vector_rag/services/vector-governance.service.ts:98` |

### Cuerpo — DTO `RegisterModelVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `providerCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:44` |
| `modelId` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:52` |
| `modelVersion` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:60` |
| `dimension` | `number` | Sí | mínimo 1; máximo 16000 | `@IsInt()` `@Min(1)` `@Max(16000)` | Dimensión del vector que produce | `src/modules/vector_rag/dto/vector-rag.dto.ts:73` |
| `distanceMetric` | `string` | Sí | valores: cosine, l2, inner_product | `@IsIn(DISTANCE_METRICS)` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:80` |
| `tokenizerVersion` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:88` |
| `approvedForPhi` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si está aprobado para datos de paciente; queda registrado quién lo aprobó | `src/modules/vector_rag/dto/vector-rag.dto.ts:100` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "providerCode": "CODIGO_EJEMPLO",
  "modelId": "00000000-0000-4000-8000-000000000001",
  "modelVersion": "valor-ejemplo",
  "dimension": 1,
  "distanceMetric": "cosine",
  "tokenizerVersion": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "providerCode": "CODIGO_EJEMPLO",
  "modelId": "00000000-0000-4000-8000-000000000001",
  "modelVersion": "valor-ejemplo",
  "dimension": 1,
  "distanceMetric": "cosine",
  "tokenizerVersion": "valor-ejemplo",
  "approvedForPhi": false
}
```

</details>

### Respuesta — `Promise<ModelVersionResponseDto>` · DTO `ModelVersionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:111` |
| `providerCode` | `string` | Sí | — | — | Valor de provider code mantenido por la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:117` |
| `modelId` | `string` | Sí | — | — | Identificador asociado a model. | `src/modules/vector_rag/dto/vector-rag.dto.ts:123` |
| `modelVersion` | `string` | Sí | — | — | Valor de model version mantenido por la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:129` |
| `dimension` | `number` | Sí | — | — | Valor de dimension mantenido por la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:135` |
| `approvedForPhi` | `boolean` | Sí | — | — | Valor de approved for phi mantenido por la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:141` |
| `retiredAt` | `string` | No | formato date-time | — | Valor de retired at mantenido por la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:147` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Esa versión del modelo ya está registrada. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/vector_rag.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 59 — Búsqueda vectorial, evidencia RAG y gobierno de embeddings — etapa `UC-59-01`

---

## 10. POST /vector-rag/embedding-model-versions/{id}/retire

- **Origen:** CONTRATO
- **Nombre:** Retirar una versión de modelo
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VectorGovernanceController.retireModelVersion` — `src/modules/vector_rag/controllers/vector-governance.controller.ts:84`

### Qué es y para qué sirve (negocio)

Retirar una versión de modelo. Dentro del módulo (descripción del modelo, en inglés): «Stores governed embeddings and retrieval evidence for protocols, policies, education, support and carefully approved clinical contexts.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_59_vector_rag.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /vector-rag/embedding-model-versions/{id}/retire` la atiende `VectorGovernanceController.retireModelVersion` (src/modules/vector_rag/controllers/vector-governance.controller.ts:84). Exige sesión con alguno de los roles AI_GOVERNANCE_OFFICER, MLOPS_ENGINEER, PLATFORM_ADMIN. Valida el cuerpo como `RetireModelVersionDto` (1 campo, 0 obligatorios). Delega en `VectorGovernanceService.retireModelVersion`. Crea filas en messaging.domain_events, messaging.outbox_messages. Actualiza vector_rag.embedding_model_versions. Lee messaging.outbox_messages, vector_rag.embedding_jobs, vector_rag.embedding_model_versions, vector_rag.vector_collections. Publica EmbeddingModelRetired.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: AI_GOVERNANCE_OFFICER, MLOPS_ENGINEER, PLATFORM_ADMIN | `src/modules/vector_rag/controllers/vector-governance.controller.ts:84` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/vector_rag/controllers/vector-governance.controller.ts:84` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | VectorGovernanceController.retireModelVersion → VectorGovernanceService.retireModelVersion → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | VectorGovernanceController.retireModelVersion → VectorGovernanceService.retireModelVersion → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | VectorGovernanceController.retireModelVersion → VectorGovernanceService.retireModelVersion → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `vector_rag.embedding_jobs` | LEE | LEE | DIRECTA | VectorGovernanceController.retireModelVersion → VectorGovernanceService.retireModelVersion → VectorCatalogRepository.findActiveJobsByCollection | `src/modules/vector_rag/repositories/vector-catalog.repository.ts:547` |
| `vector_rag.embedding_model_versions` | ESCRIBE | ACTUALIZA | POR_TIPO | VectorGovernanceController.retireModelVersion → VectorGovernanceService.retireModelVersion | `src/modules/vector_rag/services/vector-governance.service.ts:469` |
| `vector_rag.embedding_model_versions` | LEE | LEE | DIRECTA | VectorGovernanceController.retireModelVersion → VectorGovernanceService.retireModelVersion → VectorCatalogRepository.findModelVersionForUpdate | `src/modules/vector_rag/repositories/vector-catalog.repository.ts:214` |
| `vector_rag.vector_collections` | LEE | LEE | DIRECTA | VectorGovernanceController.retireModelVersion → VectorGovernanceService.retireModelVersion → VectorCatalogRepository.findCollectionsByModel | `src/modules/vector_rag/repositories/vector-catalog.repository.ts:330` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `EmbeddingModelRetired` | `src/modules/vector_rag/services/vector-governance.service.ts:471` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RetireModelVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | No | — | `@IsOptional()` `@IsString()` | Por qué se retira; queda en el evento publicado | `src/modules/vector_rag/dto/vector-rag.dto.ts:1397` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reason": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<ModelVersionResponseDto>` · DTO `ModelVersionResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:111` |
| `providerCode` | `string` | Sí | — | — | Valor de provider code mantenido por la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:117` |
| `modelId` | `string` | Sí | — | — | Identificador asociado a model. | `src/modules/vector_rag/dto/vector-rag.dto.ts:123` |
| `modelVersion` | `string` | Sí | — | — | Valor de model version mantenido por la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:129` |
| `dimension` | `number` | Sí | — | — | Valor de dimension mantenido por la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:135` |
| `approvedForPhi` | `boolean` | Sí | — | — | Valor de approved for phi mantenido por la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:141` |
| `retiredAt` | `string` | No | formato date-time | — | Valor de retired at mantenido por la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:147` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión de modelo no encontrada. |
| 409 | `CONFLICT` | ConflictException: El modelo ya está retirado. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Hay jobs de embedding vivos que dependen del modelo. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/vector_rag.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 59 — Búsqueda vectorial, evidencia RAG y gobierno de embeddings — etapa `ctrl:VectorGovernanceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 11. POST /vector-rag/rag-access-policies

- **Origen:** CONTRATO
- **Nombre:** Definir una política de acceso RAG
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VectorGovernanceController.defineRagPolicy` — `src/modules/vector_rag/controllers/vector-governance.controller.ts:127`

### Qué es y para qué sirve (negocio)

Definir una política de acceso RAG. Caso de uso UC-59-03: Definir y publicar política. Dentro del módulo (descripción del modelo, en inglés): «Stores governed embeddings and retrieval evidence for protocols, policies, education, support and carefully approved clinical contexts.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/vector_rag/README.md:49`) · MODELO (`Mantra Core Health Context/modules/diagram_59_vector_rag.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /vector-rag/rag-access-policies` la atiende `VectorGovernanceController.defineRagPolicy` (src/modules/vector_rag/controllers/vector-governance.controller.ts:127). Exige sesión con alguno de los roles PRIVACY_OFFICER, DPO, PLATFORM_ADMIN. Valida el cuerpo como `DefineRagPolicyDto` (8 campos, 5 obligatorios). Delega en `VectorGovernanceService.defineRagPolicy`. Crea filas en vector_rag.rag_access_policies. Lee vector_rag.rag_access_policies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRIVACY_OFFICER, DPO, PLATFORM_ADMIN | `src/modules/vector_rag/controllers/vector-governance.controller.ts:127` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `vector_rag.rag_access_policies` | ESCRIBE | CREA | DIRECTA | VectorGovernanceController.defineRagPolicy → VectorGovernanceService.defineRagPolicy → VectorCatalogRepository.createPolicy | `src/modules/vector_rag/repositories/vector-catalog.repository.ts:412` |
| `vector_rag.rag_access_policies` | LEE | LEE | DIRECTA | VectorGovernanceController.defineRagPolicy → VectorGovernanceService.defineRagPolicy → VectorCatalogRepository.findPolicyByCodeForUpdate | `src/modules/vector_rag/repositories/vector-catalog.repository.ts:443` |

### Cuerpo — DTO `DefineRagPolicyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:284` |
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:292` |
| `allowedPrincipalTypes` | `array<string>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@IsIn(PRINCIPAL_TYPES, { each: true })` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:301` |
| `allowedPurposeCodes` | `array<string>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@IsString({ each: true })` | Propósitos de uso admitidos | `src/modules/vector_rag/dto/vector-rag.dto.ts:310` |
| `allowedSecurityLabels` | `array<string>` | Sí | — | `@IsArray()` `@IsString({ each: true })` | Etiquetas de seguridad admitidas | `src/modules/vector_rag/dto/vector-rag.dto.ts:321` |
| `patientScopeRequired` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si la consulta debe declarar el paciente sobre el que se hace | `src/modules/vector_rag/dto/vector-rag.dto.ts:333` |
| `consentRequired` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si exige consentimiento vigente | `src/modules/vector_rag/dto/vector-rag.dto.ts:344` |
| `fieldRedactionProfile` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:353` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "allowedPrincipalTypes": [
    "user"
  ],
  "allowedPurposeCodes": [
    "CODIGO_EJEMPLO"
  ],
  "allowedSecurityLabels": [
    "valor-ejemplo"
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "allowedPrincipalTypes": [
    "user"
  ],
  "allowedPurposeCodes": [
    "CODIGO_EJEMPLO"
  ],
  "allowedSecurityLabels": [
    "valor-ejemplo"
  ],
  "patientScopeRequired": false,
  "consentRequired": false,
  "fieldRedactionProfile": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<RagPolicyResponseDto>` · DTO `RagPolicyResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:380` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:386` |
| `state` | `string` | Sí | — | — | Valor de state mantenido por la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:392` |
| `reboundCollections` | `number` | Sí | — | — | Colecciones reenlazadas al publicar | `src/modules/vector_rag/dto/vector-rag.dto.ts:398` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una política con ese código para el tenant. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Exigir consentimiento obliga a exigir también el ámbito de paciente. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/vector_rag.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 59 — Búsqueda vectorial, evidencia RAG y gobierno de embeddings — etapa `UC-59-03`

---

## 12. PUT /vector-rag/rag-access-policies/{id}/publish

- **Origen:** CONTRATO
- **Nombre:** Publicar la política y reenlazar colecciones
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VectorGovernanceController.publishRagPolicy` — `src/modules/vector_rag/controllers/vector-governance.controller.ts:148`

### Qué es y para qué sirve (negocio)

Publicar la política y reenlazar colecciones. Dentro del módulo (descripción del modelo, en inglés): «Stores governed embeddings and retrieval evidence for protocols, policies, education, support and carefully approved clinical contexts.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_59_vector_rag.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`PUT /vector-rag/rag-access-policies/{id}/publish` la atiende `VectorGovernanceController.publishRagPolicy` (src/modules/vector_rag/controllers/vector-governance.controller.ts:148). Exige sesión con alguno de los roles PRIVACY_OFFICER, DPO, PLATFORM_ADMIN. Valida el cuerpo como `PublishRagPolicyDto` (1 campo, 0 obligatorios). Delega en `VectorGovernanceService.publishRagPolicy`. Crea filas en messaging.domain_events, messaging.outbox_messages. Lee messaging.outbox_messages, vector_rag.rag_access_policies, vector_rag.vector_collections. Publica RagAccessPolicyPublished.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRIVACY_OFFICER, DPO, PLATFORM_ADMIN | `src/modules/vector_rag/controllers/vector-governance.controller.ts:148` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/vector_rag/controllers/vector-governance.controller.ts:148` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | VectorGovernanceController.publishRagPolicy → VectorGovernanceService.publishRagPolicy → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | VectorGovernanceController.publishRagPolicy → VectorGovernanceService.publishRagPolicy → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | VectorGovernanceController.publishRagPolicy → VectorGovernanceService.publishRagPolicy → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `vector_rag.rag_access_policies` | LEE | LEE | DIRECTA | VectorGovernanceController.publishRagPolicy → VectorGovernanceService.publishRagPolicy → VectorCatalogRepository.findPolicyById | `src/modules/vector_rag/repositories/vector-catalog.repository.ts:427` |
| `vector_rag.vector_collections` | LEE | LEE | DIRECTA | VectorGovernanceController.publishRagPolicy → VectorGovernanceService.publishRagPolicy → VectorCatalogRepository.findCollectionForUpdate | `src/modules/vector_rag/repositories/vector-catalog.repository.ts:292` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `RagAccessPolicyPublished` | `src/modules/vector_rag/services/vector-governance.service.ts:381` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `PublishRagPolicyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `rebindCollectionIds` | `array<string>` | No | formato uuid | `@IsOptional()` `@IsArray()` `@IsUUID('4', { each: true })` | Colecciones que pasan a regirse por esta política | `src/modules/vector_rag/dto/vector-rag.dto.ts:369` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "rebindCollectionIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

</details>

### Respuesta — `Promise<RagPolicyResponseDto>` · DTO `RagPolicyResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:380` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:386` |
| `state` | `string` | Sí | — | — | Valor de state mantenido por la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:392` |
| `reboundCollections` | `number` | Sí | — | — | Colecciones reenlazadas al publicar | `src/modules/vector_rag/dto/vector-rag.dto.ts:398` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/vector_rag.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 59 — Búsqueda vectorial, evidencia RAG y gobierno de embeddings — etapa `ctrl:VectorGovernanceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 13. POST /vector-rag/retrieval-sessions

- **Origen:** CONTRATO
- **Nombre:** Abrir una sesión de retrieval gobernada por consentimiento
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VectorRuntimeController.openSession` — `src/modules/vector_rag/controllers/vector-runtime.controller.ts:101`

### Qué es y para qué sirve (negocio)

Abrir una sesión de retrieval gobernada por consentimiento. Caso de uso UC-59-06: Sesión consent-aware. Dentro del módulo (descripción del modelo, en inglés): «Stores governed embeddings and retrieval evidence for protocols, policies, education, support and carefully approved clinical contexts.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/vector_rag/README.md:52`) · MODELO (`Mantra Core Health Context/modules/diagram_59_vector_rag.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /vector-rag/retrieval-sessions` la atiende `VectorRuntimeController.openSession` (src/modules/vector_rag/controllers/vector-runtime.controller.ts:101). Exige sesión con alguno de los roles CLINICIAN, AGENT_RUNTIME, SYSTEM, PLATFORM_ADMIN. Valida el cuerpo como `OpenRetrievalSessionDto` (7 campos, 4 obligatorios). Delega en `RetrievalService.openSession`. Crea filas en messaging.domain_events, messaging.outbox_messages, vector_rag.retrieval_sessions. Lee messaging.outbox_messages, vector_rag.rag_access_policies, vector_rag.retrieval_sessions, vector_rag.vector_collections. Publica RetrievalSessionOpened.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, AGENT_RUNTIME, SYSTEM, PLATFORM_ADMIN | `src/modules/vector_rag/controllers/vector-runtime.controller.ts:101` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | VectorRuntimeController.openSession → RetrievalService.openSession → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | VectorRuntimeController.openSession → RetrievalService.openSession → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | VectorRuntimeController.openSession → RetrievalService.openSession → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `vector_rag.rag_access_policies` | LEE | LEE | DIRECTA | VectorRuntimeController.openSession → RetrievalService.openSession → RetrievalService.requirePublishedPolicy → VectorCatalogRepository.findPolicyById | `src/modules/vector_rag/repositories/vector-catalog.repository.ts:427` |
| `vector_rag.retrieval_sessions` | ESCRIBE | CREA | DIRECTA | VectorRuntimeController.openSession → RetrievalService.openSession → RetrievalRepository.createSession | `src/modules/vector_rag/repositories/retrieval.repository.ts:145` |
| `vector_rag.retrieval_sessions` | LEE | LEE | DIRECTA | VectorRuntimeController.openSession → RetrievalService.openSession → RetrievalRepository.findOpenSessionByHash | `src/modules/vector_rag/repositories/retrieval.repository.ts:195` |
| `vector_rag.vector_collections` | LEE | LEE | DIRECTA | VectorRuntimeController.openSession → RetrievalService.openSession → VectorCatalogRepository.findCollectionById | `src/modules/vector_rag/repositories/vector-catalog.repository.ts:277` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `RetrievalSessionOpened` | `src/modules/vector_rag/services/retrieval.service.ts:161` |

### Cuerpo — DTO `OpenRetrievalSessionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `vectorCollectionId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:778` |
| `principalType` | `string` | Sí | valores: user, agent, service | `@IsIn(PRINCIPAL_TYPES)` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:785` |
| `agentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Agente que consulta, si no es una persona | `src/modules/vector_rag/dto/vector-rag.dto.ts:796` |
| `purposeOfUseCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Propósito de uso declarado | `src/modules/vector_rag/dto/vector-rag.dto.ts:804` |
| `patientProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:812` |
| `consentDirectiveId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Directiva de consentimiento que ampara la consulta | `src/modules/vector_rag/dto/vector-rag.dto.ts:823` |
| `queryTextRedacted` | `string` | Sí | — | `@IsString()` | Consulta ya redactada; nunca la original | `src/modules/vector_rag/dto/vector-rag.dto.ts:830` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "vectorCollectionId": "00000000-0000-4000-8000-000000000001",
  "principalType": "user",
  "purposeOfUseCode": "CODIGO_EJEMPLO",
  "queryTextRedacted": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "vectorCollectionId": "00000000-0000-4000-8000-000000000001",
  "principalType": "user",
  "agentId": "00000000-0000-4000-8000-000000000001",
  "purposeOfUseCode": "CODIGO_EJEMPLO",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "consentDirectiveId": "00000000-0000-4000-8000-000000000001",
  "queryTextRedacted": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<RetrievalSessionResponseDto>` · DTO `RetrievalSessionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:841` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:847` |
| `queryHash` | `string` | Sí | — | — | Hash de la consulta; identifica la pregunta sin guardarla | `src/modules/vector_rag/dto/vector-rag.dto.ts:855` |
| `duplicate` | `boolean` | Sí | — | — | Verdadero si ya había una sesión abierta para la misma consulta | `src/modules/vector_rag/dto/vector-rag.dto.ts:864` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La colección está deprecada.; PreconditionFailedException: La colección no tiene política de acceso RAG; no se puede consultar.; PreconditionFailedException: La política de acceso RAG no está publicada.; PreconditionFailedException: La política no admite ese tipo de principal.; PreconditionFailedException: La política no admite ese propósito de uso.; PreconditionFailedException: La política exige declarar el paciente sobre el que se consulta.; PreconditionFailedException: La política exige una directiva de consentimiento vigente. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/vector_rag.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 59 — Búsqueda vectorial, evidencia RAG y gobierno de embeddings — etapa `UC-59-06`

---

## 14. POST /vector-rag/retrieval-sessions/{id}/evidence

- **Origen:** CONTRATO
- **Nombre:** Materializar la evidencia citable
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VectorRuntimeController.materializeEvidence` — `src/modules/vector_rag/controllers/vector-runtime.controller.ts:145`

### Qué es y para qué sirve (negocio)

Materializar la evidencia citable. Caso de uso UC-59-08: Evidencia citable. Dentro del módulo (descripción del modelo, en inglés): «Stores governed embeddings and retrieval evidence for protocols, policies, education, support and carefully approved clinical contexts.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/vector_rag/README.md:54`) · MODELO (`Mantra Core Health Context/modules/diagram_59_vector_rag.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /vector-rag/retrieval-sessions/{id}/evidence` la atiende `VectorRuntimeController.materializeEvidence` (src/modules/vector_rag/controllers/vector-runtime.controller.ts:145). Exige sesión con alguno de los roles SYSTEM, RETRIEVAL_WORKER, PLATFORM_ADMIN. Valida el cuerpo como `MaterializeEvidenceDto` (4 campos, 3 obligatorios). Delega en `RetrievalService.materializeEvidence`. Crea filas en messaging.domain_events, messaging.outbox_messages, vector_rag.retrieval_evidence. Lee messaging.outbox_messages, vector_rag.retrieval_candidates, vector_rag.retrieval_sessions, vector_rag.vector_chunks, vector_rag.vector_documents. Publica RetrievalEvidenceMaterialized.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, RETRIEVAL_WORKER, PLATFORM_ADMIN | `src/modules/vector_rag/controllers/vector-runtime.controller.ts:145` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/vector_rag/controllers/vector-runtime.controller.ts:145` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | VectorRuntimeController.materializeEvidence → RetrievalService.materializeEvidence → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | VectorRuntimeController.materializeEvidence → RetrievalService.materializeEvidence → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | VectorRuntimeController.materializeEvidence → RetrievalService.materializeEvidence → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `vector_rag.retrieval_candidates` | LEE | LEE | DIRECTA | VectorRuntimeController.materializeEvidence → RetrievalService.materializeEvidence → RetrievalRepository.findSelectedCandidates | `src/modules/vector_rag/repositories/retrieval.repository.ts:243` |
| `vector_rag.retrieval_evidence` | ESCRIBE | CREA | DIRECTA | VectorRuntimeController.materializeEvidence → RetrievalService.materializeEvidence → RetrievalRepository.createEvidence | `src/modules/vector_rag/repositories/retrieval.repository.ts:267` |
| `vector_rag.retrieval_sessions` | LEE | LEE | DIRECTA | VectorRuntimeController.materializeEvidence → RetrievalService.materializeEvidence → RetrievalRepository.findSessionForUpdate | `src/modules/vector_rag/repositories/retrieval.repository.ts:178` |
| `vector_rag.vector_chunks` | LEE | LEE | DIRECTA | VectorRuntimeController.materializeEvidence → RetrievalService.materializeEvidence → VectorCorpusRepository.findChunkById | `src/modules/vector_rag/repositories/vector-corpus.repository.ts:307` |
| `vector_rag.vector_documents` | LEE | LEE | DIRECTA | VectorRuntimeController.materializeEvidence → RetrievalService.materializeEvidence → VectorCorpusRepository.findDocumentById | `src/modules/vector_rag/repositories/vector-corpus.repository.ts:179` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `RetrievalEvidenceMaterialized` | `src/modules/vector_rag/services/retrieval.service.ts:441` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `MaterializeEvidenceDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `citations` | `array<VectorRagEvidenceInputDto>` | Sí | mínimo 1 elemento(s); máximo 50 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(MAX_EVIDENCE)` `@ValidateNested({ each: true })` `@Type(() => EvidenceInputDto)` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:1035` |
| `citations[].vectorChunkId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `citations[].quotedTextRedacted` | `string` | Sí | — | — | Fragmento citado, ya redactado | sin fuente |
| `citations[].sourceUri` | `string` | No | longitud máxima 500 | — | — | sin fuente |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "citations": [
    {
      "vectorChunkId": "00000000-0000-4000-8000-000000000001",
      "quotedTextRedacted": "valor-ejemplo"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "citations": [
    {
      "vectorChunkId": "00000000-0000-4000-8000-000000000001",
      "quotedTextRedacted": "valor-ejemplo",
      "sourceUri": "valor-ejemplo"
    }
  ]
}
```

</details>

### Respuesta — `Promise<EvidenceResponseDto>` · DTO `EvidenceResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `retrievalSessionId` | `string` | Sí | formato uuid | — | Identificador asociado a retrieval session. | `src/modules/vector_rag/dto/vector-rag.dto.ts:1046` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:1052` |
| `citations` | `number` | Sí | — | — | Citas materializadas | `src/modules/vector_rag/dto/vector-rag.dto.ts:1058` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La sesión tiene que estar ranqueada para materializar evidencia.; PreconditionFailedException: La sesión no tiene ningún candidato seleccionado y autorizado que citar.; PreconditionFailedException: Se intenta citar un chunk que no quedó seleccionado y autorizado. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/vector_rag.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 59 — Búsqueda vectorial, evidencia RAG y gobierno de embeddings — etapa `UC-59-08`

---

## 15. POST /vector-rag/retrieval-sessions/{id}/feedback

- **Origen:** CONTRATO
- **Nombre:** Capturar feedback de la sesión
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VectorRuntimeController.captureFeedback` — `src/modules/vector_rag/controllers/vector-runtime.controller.ts:167`

### Qué es y para qué sirve (negocio)

Capturar feedback de la sesión. Caso de uso UC-59-09: Feedback de relevancia y seguridad. Dentro del módulo (descripción del modelo, en inglés): «Stores governed embeddings and retrieval evidence for protocols, policies, education, support and carefully approved clinical contexts.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/vector_rag/README.md:55`) · MODELO (`Mantra Core Health Context/modules/diagram_59_vector_rag.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /vector-rag/retrieval-sessions/{id}/feedback` la atiende `VectorRuntimeController.captureFeedback` (src/modules/vector_rag/controllers/vector-runtime.controller.ts:167). Exige sesión con alguno de los roles CLINICIAN, AGENT_RUNTIME, PLATFORM_ADMIN. Valida el cuerpo como `CaptureFeedbackDto` (4 campos, 1 obligatorio). Delega en `RetrievalService.captureFeedback`. Crea filas en messaging.domain_events, messaging.outbox_messages, vector_rag.retrieval_feedback_events. Lee messaging.outbox_messages, vector_rag.retrieval_sessions. Publica RetrievalFeedbackCaptured, RetrievalSafetyIssueRaised.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, AGENT_RUNTIME, PLATFORM_ADMIN | `src/modules/vector_rag/controllers/vector-runtime.controller.ts:167` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/vector_rag/controllers/vector-runtime.controller.ts:167` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | VectorRuntimeController.captureFeedback → RetrievalService.captureFeedback → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | VectorRuntimeController.captureFeedback → RetrievalService.captureFeedback → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | VectorRuntimeController.captureFeedback → RetrievalService.captureFeedback → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `vector_rag.retrieval_feedback_events` | ESCRIBE | CREA | DIRECTA | VectorRuntimeController.captureFeedback → RetrievalService.captureFeedback → RetrievalRepository.createFeedback | `src/modules/vector_rag/repositories/retrieval.repository.ts:326` |
| `vector_rag.retrieval_sessions` | LEE | LEE | DIRECTA | VectorRuntimeController.captureFeedback → RetrievalService.captureFeedback → RetrievalRepository.findSessionForUpdate | `src/modules/vector_rag/repositories/retrieval.repository.ts:178` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `RetrievalFeedbackCaptured` | `src/modules/vector_rag/services/retrieval.service.ts:526` |
| Evento de dominio | `RetrievalSafetyIssueRaised` | `src/modules/vector_rag/services/retrieval.service.ts:540` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CaptureFeedbackDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `feedbackType` | `string` | Sí | valores: relevance, safety, accuracy | `@IsIn(FEEDBACK_TYPES)` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:1072` |
| `relevanceScore` | `number` | No | mínimo 0; máximo 5 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(5)` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:1082` |
| `safetyIssueCode` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Código del problema de seguridad; su presencia marca la sesión para revisión | `src/modules/vector_rag/dto/vector-rag.dto.ts:1095` |
| `commentRedacted` | `string` | No | — | `@IsOptional()` `@IsString()` | Comentario ya redactado | `src/modules/vector_rag/dto/vector-rag.dto.ts:1103` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "feedbackType": "relevance"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "feedbackType": "relevance",
  "relevanceScore": 1,
  "safetyIssueCode": "CODIGO_EJEMPLO",
  "commentRedacted": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<FeedbackResponseDto>` · DTO `FeedbackResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:1114` |
| `retrievalSessionId` | `string` | Sí | formato uuid | — | Identificador asociado a retrieval session. | `src/modules/vector_rag/dto/vector-rag.dto.ts:1120` |
| `flagged` | `boolean` | Sí | — | — | Verdadero si el feedback marcó la sesión para revisión | `src/modules/vector_rag/dto/vector-rag.dto.ts:1128` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sesión de retrieval no encontrada. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo se puede dar feedback de una sesión completada. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/vector_rag.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 59 — Búsqueda vectorial, evidencia RAG y gobierno de embeddings — etapa `UC-59-09`

---

## 16. POST /vector-rag/retrieval-sessions/{id}/search

- **Origen:** CONTRATO
- **Nombre:** Ranquear los candidatos y filtrarlos por consentimiento y etiquetas
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VectorRuntimeController.rankCandidates` — `src/modules/vector_rag/controllers/vector-runtime.controller.ts:122`

### Qué es y para qué sirve (negocio)

Ranquear los candidatos y filtrarlos por consentimiento y etiquetas. Caso de uso UC-59-07: Ranquear y filtrar. Dentro del módulo (descripción del modelo, en inglés): «Stores governed embeddings and retrieval evidence for protocols, policies, education, support and carefully approved clinical contexts.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/vector_rag/README.md:53`) · MODELO (`Mantra Core Health Context/modules/diagram_59_vector_rag.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /vector-rag/retrieval-sessions/{id}/search` la atiende `VectorRuntimeController.rankCandidates` (src/modules/vector_rag/controllers/vector-runtime.controller.ts:122). Exige sesión con alguno de los roles SYSTEM, RETRIEVAL_WORKER, PLATFORM_ADMIN. Valida el cuerpo como `RankCandidatesDto` (6 campos, 3 obligatorios). Delega en `RetrievalService.rankCandidates`. Crea filas en messaging.domain_events, messaging.outbox_messages, vector_rag.retrieval_candidates. Lee messaging.outbox_messages, vector_rag.rag_access_policies, vector_rag.retrieval_sessions, vector_rag.vector_chunks, vector_rag.vector_collections, vector_rag.vector_documents. Publica RetrievalCandidatesRanked.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, RETRIEVAL_WORKER, PLATFORM_ADMIN | `src/modules/vector_rag/controllers/vector-runtime.controller.ts:122` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/vector_rag/controllers/vector-runtime.controller.ts:122` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | VectorRuntimeController.rankCandidates → RetrievalService.rankCandidates → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | VectorRuntimeController.rankCandidates → RetrievalService.rankCandidates → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | VectorRuntimeController.rankCandidates → RetrievalService.rankCandidates → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `vector_rag.rag_access_policies` | LEE | LEE | DIRECTA | VectorRuntimeController.rankCandidates → RetrievalService.rankCandidates → RetrievalService.requirePublishedPolicy → VectorCatalogRepository.findPolicyById | `src/modules/vector_rag/repositories/vector-catalog.repository.ts:427` |
| `vector_rag.retrieval_candidates` | ESCRIBE | CREA | DIRECTA | VectorRuntimeController.rankCandidates → RetrievalService.rankCandidates → RetrievalRepository.createCandidate | `src/modules/vector_rag/repositories/retrieval.repository.ts:216` |
| `vector_rag.retrieval_sessions` | LEE | LEE | DIRECTA | VectorRuntimeController.rankCandidates → RetrievalService.rankCandidates → RetrievalRepository.findSessionForUpdate | `src/modules/vector_rag/repositories/retrieval.repository.ts:178` |
| `vector_rag.vector_chunks` | LEE | LEE | DIRECTA | VectorRuntimeController.rankCandidates → RetrievalService.rankCandidates → VectorCorpusRepository.findChunkById | `src/modules/vector_rag/repositories/vector-corpus.repository.ts:307` |
| `vector_rag.vector_collections` | LEE | LEE | DIRECTA | VectorRuntimeController.rankCandidates → RetrievalService.rankCandidates → VectorCatalogRepository.findCollectionById | `src/modules/vector_rag/repositories/vector-catalog.repository.ts:277` |
| `vector_rag.vector_documents` | LEE | LEE | DIRECTA | VectorRuntimeController.rankCandidates → RetrievalService.rankCandidates → VectorCorpusRepository.findDocumentById | `src/modules/vector_rag/repositories/vector-corpus.repository.ts:179` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `RetrievalCandidatesRanked` | `src/modules/vector_rag/services/retrieval.service.ts:326` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RankCandidatesDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `candidates` | `array<CandidateInputDto>` | Sí | mínimo 1 elemento(s); máximo 200 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(MAX_CANDIDATES)` `@ValidateNested({ each: true })` `@Type(() => CandidateInputDto)` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:917` |
| `candidates[].vectorChunkId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:880` |
| `candidates[].vectorScore` | `number` | Sí | — | `@IsNumber()` | Distancia o similitud devuelta por el índice | `src/modules/vector_rag/dto/vector-rag.dto.ts:887` |
| `candidates[].lexicalScore` | `number` | No | — | `@IsOptional()` `@IsNumber()` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:895` |
| `candidates[].rerankerScore` | `number` | No | — | `@IsOptional()` `@IsNumber()` | — | `src/modules/vector_rag/dto/vector-rag.dto.ts:903` |
| `topK` | `number` | No | mínimo 1; máximo 200 | `@IsOptional()` `@IsInt()` `@Min(1)` | Cuántos de los autorizados se marcan como seleccionados | `src/modules/vector_rag/dto/vector-rag.dto.ts:931` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "candidates": [
    {
      "vectorChunkId": "00000000-0000-4000-8000-000000000001",
      "vectorScore": 1
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "candidates": [
    {
      "vectorChunkId": "00000000-0000-4000-8000-000000000001",
      "vectorScore": 1,
      "lexicalScore": 1,
      "rerankerScore": 1
    }
  ],
  "topK": 10
}
```

</details>

### Respuesta — `Promise<RankCandidatesResponseDto>` · DTO `RankCandidatesResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `retrievalSessionId` | `string` | Sí | formato uuid | — | Identificador asociado a retrieval session. | `src/modules/vector_rag/dto/vector-rag.dto.ts:971` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:977` |
| `candidates` | `array<RankedCandidateDto>` | Sí | — | — | Valor de candidates mantenido por la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:983` |
| `candidates[].vectorChunkId` | `string` | Sí | formato uuid | — | Identificador asociado a vector chunk. | `src/modules/vector_rag/dto/vector-rag.dto.ts:942` |
| `candidates[].rank` | `number` | Sí | — | — | Valor de rank mantenido por la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:948` |
| `candidates[].authorizationDecision` | `string` | Sí | — | — | Valor de authorization decision mantenido por la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:954` |
| `candidates[].selected` | `boolean` | Sí | — | — | Valor de selected mantenido por la instancia. | `src/modules/vector_rag/dto/vector-rag.dto.ts:960` |
| `deniedByReason` | `object` | Sí | — | — | Candidatos denegados, por motivo | `src/modules/vector_rag/dto/vector-rag.dto.ts:989` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Chunk candidato no encontrado. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La sesión ya no está abierta.; PreconditionFailedException: La colección no tiene política de acceso RAG; no se puede consultar.; PreconditionFailedException: La política de acceso RAG no está publicada. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/vector_rag.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 59 — Búsqueda vectorial, evidencia RAG y gobierno de embeddings — etapa `UC-59-07`

---

