<!-- AUTOGENERADO por tools/inventario/catalogo.mjs. No editar manualmente. -->

# Catálogo del schema `cross_store_consistency`

- **Tablas:** 20 · **Columnas:** 183 (23 con descripción: 12.6 %) · **Índices:** 43
- **Dominio:** Datos y NoSQL
- Método y límites del catálogo: [README del inventario](../README.md)

## Tablas

| Tabla | Propósito | Columnas | Índices | Operaciones | ORM |
|---|---|---|---|---|---|
| [archive_jobs](#archive_jobs) | Coordina archivado de datos derivados o históricos preservando referencias y reglas de retención. | 10 | 2 | 3 | COINCIDE |
| [cache_invalidation_jobs](#cache_invalidation_jobs) | Coordina invalidación de cachés derivadas cuando cambian datos canónicos. | 9 | 2 | 4 | COINCIDE |
| [data_movement_jobs](#data_movement_jobs) | Registra movimientos controlados de datasets entre stores compatibles con sus políticas. | 10 | 2 | 2 | COINCIDE |
| [deletion_executions](#deletion_executions) | Registra acciones ejecutadas para eliminar datos de destinos secundarios. | 9 | 3 | 3 | COINCIDE |
| [deletion_requests](#deletion_requests) | Coordina solicitudes de eliminación que deben propagarse a proyecciones y almacenes secundarios. | 10 | 2 | 6 | COINCIDE |
| [deletion_targets](#deletion_targets) | Enumera stores y proyecciones afectados por una solicitud de eliminación para evitar copias residuales. | 8 | 2 | 9 | COINCIDE |
| [deletion_verifications](#deletion_verifications) | Conserva verificaciones posteriores a una eliminación para demostrar propagación y cierre. | 7 | 2 | 1 | COINCIDE |
| [projection_checkpoints](#projection_checkpoints) | Conserva posiciones procesadas por consumidores para reanudar actualización idempotente de proyecciones. | 8 | 3 | 3 | COINCIDE |
| [projection_consumers](#projection_consumers) | Cataloga consumidores encargados de aplicar eventos a proyecciones y stores secundarios. | 7 | 2 | 3 | COINCIDE |
| [projection_dead_letters](#projection_dead_letters) | Preserva eventos que no pudieron proyectarse para inspección y recuperación sin perder el origen. | 8 | 2 | 4 | COINCIDE |
| [projection_definitions](#projection_definitions) | Define proyecciones derivadas en otros almacenes para que puedan reconstruirse desde datos canónicos. | 9 | 2 | 2 | COINCIDE |
| [projection_delivery_attempts](#projection_delivery_attempts) | Registra intentos de entrega de eventos a consumidores para observar reintentos y fallos. | 11 | 3 | 7 | COINCIDE |
| [projection_drift_events](#projection_drift_events) | Registra cambios o desfases observados en proyecciones secundarias para iniciar reparación. | 11 | 2 | 4 | COINCIDE |
| [projection_repair_jobs](#projection_repair_jobs) | Gestiona reconstrucciones o reparaciones de proyecciones a partir de la fuente PostgreSQL canónica. | 8 | 2 | 2 | COINCIDE |
| [projection_subscriptions](#projection_subscriptions) | Registra suscripciones de proyecciones a eventos de origen para actualizar almacenes secundarios sin dual-write. | 9 | 2 | 3 | COINCIDE |
| [reconciliation_items](#reconciliation_items) | Detalla discrepancias o coincidencias encontradas al comparar una proyección con su fuente canónica. | 10 | 2 | 1 | COINCIDE |
| [reconciliation_runs](#reconciliation_runs) | Agrupa conciliaciones entre datos canónicos y proyecciones para detectar divergencias entre almacenes. | 9 | 2 | 2 | COINCIDE |
| [reindex_jobs](#reindex_jobs) | Programa y registra reindexaciones de stores derivados para restaurar su capacidad de búsqueda. | 11 | 2 | 1 | COINCIDE |
| [schema_migration_jobs](#schema_migration_jobs) | Gestiona cambios de esquema en stores derivados para mantener compatibilidad con proyecciones. | 11 | 2 | 1 | COINCIDE |
| [store_consistency_slos](#store_consistency_slos) | Define objetivos de consistencia entre stores para medir latencia de proyección y recuperación. | 8 | 2 | 3 | COINCIDE |

### Tablas sin relaciones dentro del schema

`cross_store_consistency.archive_jobs` · `cross_store_consistency.cache_invalidation_jobs` · `cross_store_consistency.data_movement_jobs` · `cross_store_consistency.deletion_executions` · `cross_store_consistency.deletion_requests` · `cross_store_consistency.deletion_targets` · `cross_store_consistency.deletion_verifications` · `cross_store_consistency.projection_checkpoints` · `cross_store_consistency.projection_consumers` · `cross_store_consistency.projection_dead_letters` · `cross_store_consistency.projection_definitions` · `cross_store_consistency.projection_delivery_attempts` · `cross_store_consistency.projection_drift_events` · `cross_store_consistency.projection_repair_jobs` · `cross_store_consistency.projection_subscriptions` · `cross_store_consistency.reconciliation_items` · `cross_store_consistency.reconciliation_runs` · `cross_store_consistency.reindex_jobs` · `cross_store_consistency.schema_migration_jobs` · `cross_store_consistency.store_consistency_slos`

## Fichas

### archive_jobs

#### Vista general

Coordina archivado de datos derivados o históricos preservando referencias y reglas de retención.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml: archive_jobs`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml` · **DDL:** `SQL/62_cross_store_consistency/02_tables.sql`
- **Entidad del ORM:** `ArchiveJobs` — `src/modules/cross_store_consistency/entities/archive_jobs.entity.ts`
- **Resumen:** 10 columnas · 2 índices · 0 FK salientes · 0 entrantes · 3 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/cross_store_consistency/entities/archive_jobs.entity.ts:12`)_ | coincide |
| 2 | `tenant_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `dataset_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 4 | `retention_cutoff` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 5 | `archive_manifest_object_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 6 | `status` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 7 | `archived_count` | `bigint` | Obligatoria | _sin dato_ | coincide |
| 8 | `deleted_hot_count` | `bigint` | Obligatoria | _sin dato_ | coincide |
| 9 | `started_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 10 | `completed_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_archive_job_cutoff` | no | tenant_id, dataset_id, retention_cutoff | 1 consulta(s) de repositorio filtran u ordenan por «tenant_id», la primera columna del índice _(CONSULTA)_ |
| `ix_archive_job_status` | no | status, ("started_at" ASC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /admin/archive-jobs | ACTUALIZA | POR_TIPO |
| POST /admin/archive-jobs | CREA | DIRECTA |
| POST /admin/archive-jobs | LEE | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### cache_invalidation_jobs

#### Vista general

Coordina invalidación de cachés derivadas cuando cambian datos canónicos.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml: cache_invalidation_jobs`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml` · **DDL:** `SQL/62_cross_store_consistency/02_tables.sql`
- **Entidad del ORM:** `CacheInvalidationJobs` — `src/modules/cross_store_consistency/entities/cache_invalidation_jobs.entity.ts`
- **Resumen:** 9 columnas · 2 índices · 0 FK salientes · 0 entrantes · 4 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/cross_store_consistency/entities/cache_invalidation_jobs.entity.ts:15`)_ | coincide |
| 2 | `tenant_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `dataset_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 4 | `entity_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 5 | `entity_version` | `bigint` | Obligatoria | _sin dato_ | coincide |
| 6 | `cache_scope` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 7 | `status` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 8 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/cross_store_consistency/entities/cache_invalidation_jobs.entity.ts:57`)_ | coincide |
| 9 | `completed_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_cache_invalidation_version` | no | tenant_id, dataset_id, entity_id, entity_version, cache_scope | _sin uso detectado estáticamente_ |
| `ix_cache_invalidation_status` | no | status, ("created_at" ASC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /admin/archive-jobs | CREA | DIRECTA |
| POST /admin/data-movement-jobs | CREA | DIRECTA |
| POST /workers/cache/invalidations | CREA | DIRECTA |
| POST /workers/cache/invalidations | LEE | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### data_movement_jobs

#### Vista general

Registra movimientos controlados de datasets entre stores compatibles con sus políticas.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml: data_movement_jobs`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml` · **DDL:** `SQL/62_cross_store_consistency/02_tables.sql`
- **Entidad del ORM:** `DataMovementJobs` — `src/modules/cross_store_consistency/entities/data_movement_jobs.entity.ts`
- **Resumen:** 10 columnas · 2 índices · 0 FK salientes · 0 entrantes · 2 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/cross_store_consistency/entities/data_movement_jobs.entity.ts:12`)_ | coincide |
| 2 | `tenant_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `dataset_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 4 | `source_placement_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 5 | `target_placement_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 6 | `movement_mode` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 7 | `manifest_hash` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 8 | `status` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 9 | `started_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 10 | `completed_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_data_movement_manifest` | no | tenant_id, dataset_id, manifest_hash | 1 consulta(s) de repositorio filtran u ordenan por «tenant_id», la primera columna del índice _(CONSULTA)_ |
| `ix_data_movement_status` | no | tenant_id, status, ("started_at" ASC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /admin/data-movement-jobs | CREA | DIRECTA |
| POST /admin/data-movement-jobs | LEE | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### deletion_executions

#### Vista general

Registra acciones ejecutadas para eliminar datos de destinos secundarios.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml: deletion_executions`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml` · **DDL:** `SQL/62_cross_store_consistency/02_tables.sql`
- **Entidad del ORM:** `DeletionExecutions` — `src/modules/cross_store_consistency/entities/deletion_executions.entity.ts`
- **Resumen:** 9 columnas · 3 índices · 0 FK salientes · 0 entrantes · 3 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/cross_store_consistency/entities/deletion_executions.entity.ts:12`)_ | coincide |
| 2 | `deletion_target_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `attempt_number` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `idempotency_key` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `status` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `provider_receipt` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 7 | `started_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 8 | `completed_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 9 | `error_code` | `varchar` | Opcional | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_deletion_execution_attempt` | no | deletion_target_id, attempt_number | 1 consulta(s) de repositorio filtran u ordenan por «deletion_target_id», la primera columna del índice _(CONSULTA)_ |
| `uq_deletion_execution_idem` | no | idempotency_key | 1 consulta(s) de repositorio filtran u ordenan por «idempotency_key», la primera columna del índice _(CONSULTA)_ |
| `ix_deletion_execution_status` | no | status, ("started_at" ASC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /workers/deletion-targets/{id}/executions | ACTUALIZA | POR_TIPO |
| POST /workers/deletion-targets/{id}/executions | CREA | DIRECTA |
| POST /workers/deletion-targets/{id}/executions | LEE | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### deletion_requests

#### Vista general

Coordina solicitudes de eliminación que deben propagarse a proyecciones y almacenes secundarios.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml: deletion_requests`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml` · **DDL:** `SQL/62_cross_store_consistency/02_tables.sql`
- **Entidad del ORM:** `DeletionRequests` — `src/modules/cross_store_consistency/entities/deletion_requests.entity.ts`
- **Resumen:** 10 columnas · 2 índices · 0 FK salientes · 0 entrantes · 6 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/cross_store_consistency/entities/deletion_requests.entity.ts:12`)_ | coincide |
| 2 | `tenant_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `subject_type` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 4 | `subject_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 5 | `reason_code` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `legal_basis_code` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 7 | `requested_by_user_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 8 | `requested_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 9 | `state` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 10 | `due_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_deletion_request_state_due` | no | tenant_id, state, ("due_at" ASC) | _sin uso detectado estáticamente_ |
| `ix_deletion_request_subject` | no | tenant_id, subject_type, subject_id, ("requested_at" DESC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /admin/deletion-requests | CREA | DIRECTA |
| POST /admin/deletion-requests | LEE | DIRECTA |
| PATCH /admin/deletion-requests/{id} | ACTUALIZA | POR_TIPO |
| PATCH /admin/deletion-requests/{id} | LEE | DIRECTA |
| POST /workers/deletion-requests/{id}/expand | ACTUALIZA | POR_TIPO |
| POST /workers/deletion-requests/{id}/expand | LEE | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### deletion_targets

#### Vista general

Enumera stores y proyecciones afectados por una solicitud de eliminación para evitar copias residuales.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml: deletion_targets`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml` · **DDL:** `SQL/62_cross_store_consistency/02_tables.sql`
- **Entidad del ORM:** `DeletionTargets` — `src/modules/cross_store_consistency/entities/deletion_targets.entity.ts`
- **Resumen:** 8 columnas · 2 índices · 0 FK salientes · 0 entrantes · 9 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/cross_store_consistency/entities/deletion_targets.entity.ts:12`)_ | coincide |
| 2 | `deletion_request_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `dataset_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 4 | `backend_code` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `target_locator` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `deletion_mode` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 7 | `blocked_by_legal_hold` | `boolean` | Obligatoria | _sin dato_ | coincide |
| 8 | `state` | `varchar` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_deletion_target_dataset_backend` | no | deletion_request_id, dataset_id, backend_code, target_locator | 2 consulta(s) de repositorio filtran u ordenan por «deletion_request_id», la primera columna del índice _(CONSULTA)_ |
| `ix_deletion_target_state` | no | state, blocked_by_legal_hold | 2 consulta(s) de repositorio filtran u ordenan por «state», la primera columna del índice _(CONSULTA)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| PATCH /admin/deletion-requests/{id} | LEE | DIRECTA |
| POST /workers/deletion-requests/{id}/expand | CREA | DIRECTA |
| POST /workers/deletion-requests/{id}/expand | LEE | DIRECTA |
| POST /workers/deletion-targets/{id}/executions | ACTUALIZA | POR_TIPO |
| POST /workers/deletion-targets/{id}/executions | LEE | DIRECTA |
| POST /workers/deletion-targets/{id}/verifications | ACTUALIZA | POR_TIPO |
| POST /workers/deletion-targets/{id}/verifications | LEE | DIRECTA |
| GET /workers/deletion-targets/executed | LEE | DIRECTA |
| GET /workers/deletion-targets/pending | LEE | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### deletion_verifications

#### Vista general

Conserva verificaciones posteriores a una eliminación para demostrar propagación y cierre.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml: deletion_verifications`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml` · **DDL:** `SQL/62_cross_store_consistency/02_tables.sql`
- **Entidad del ORM:** `DeletionVerifications` — `src/modules/cross_store_consistency/entities/deletion_verifications.entity.ts`
- **Resumen:** 7 columnas · 2 índices · 0 FK salientes · 0 entrantes · 1 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/cross_store_consistency/entities/deletion_verifications.entity.ts:15`)_ | coincide |
| 2 | `deletion_target_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `verification_method` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 4 | `verified_absent` | `boolean` | Obligatoria | _sin dato_ | coincide |
| 5 | `residual_reference_count` | `integer` | Obligatoria | _sin dato_ | coincide |
| 6 | `evidence_object_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 7 | `verified_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_deletion_verification_target` | no | deletion_target_id, ("verified_at" DESC) | _sin uso detectado estáticamente_ |
| `ix_deletion_verification_residual` | no | verified_absent, residual_reference_count | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /workers/deletion-targets/{id}/verifications | CREA | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### projection_checkpoints

#### Vista general

Conserva posiciones procesadas por consumidores para reanudar actualización idempotente de proyecciones.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml: projection_checkpoints`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml` · **DDL:** `SQL/62_cross_store_consistency/02_tables.sql`
- **Entidad del ORM:** `ProjectionCheckpoints` — `src/modules/cross_store_consistency/entities/projection_checkpoints.entity.ts`
- **Resumen:** 8 columnas · 3 índices · 0 FK salientes · 0 entrantes · 3 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/cross_store_consistency/entities/projection_checkpoints.entity.ts:15`)_ | coincide |
| 2 | `projection_subscription_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `tenant_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 4 | `partition_key` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `source_position` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `source_event_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 7 | `target_version` | `bigint` | Obligatoria | _sin dato_ | coincide |
| 8 | `checkpointed_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_projection_checkpoint_partition` | no | projection_subscription_id, tenant_id, partition_key | 1 consulta(s) de repositorio filtran u ordenan por «projection_subscription_id», la primera columna del índice _(CONSULTA)_ |
| `ix_projection_checkpoint_event` | no | source_event_id | _sin uso detectado estáticamente_ |
| `ix_projection_checkpoint_time` | no | ("checkpointed_at" DESC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /workers/projections/deliveries/process | ACTUALIZA | POR_TIPO |
| POST /workers/projections/deliveries/process | CREA | DIRECTA |
| POST /workers/projections/deliveries/process | LEE | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### projection_consumers

#### Vista general

Cataloga consumidores encargados de aplicar eventos a proyecciones y stores secundarios.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml: projection_consumers`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml` · **DDL:** `SQL/62_cross_store_consistency/02_tables.sql`
- **Entidad del ORM:** `ProjectionConsumers` — `src/modules/cross_store_consistency/entities/projection_consumers.entity.ts`
- **Resumen:** 7 columnas · 2 índices · 0 FK salientes · 0 entrantes · 3 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/cross_store_consistency/entities/projection_consumers.entity.ts:15`)_ | coincide |
| 2 | `code` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 3 | `service_name` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 4 | `deployment_region` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `consumer_group` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `heartbeat_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 7 | `state` | `varchar` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_projection_consumer_code_region` | no | code, deployment_region | 1 consulta(s) de repositorio filtran u ordenan por «code», la primera columna del índice _(CONSULTA)_ |
| `ix_projection_consumer_heartbeat` | no | state, ("heartbeat_at" ASC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /workers/projections/deliveries/process | ACTUALIZA | POR_TIPO |
| POST /workers/projections/deliveries/process | CREA | DIRECTA |
| POST /workers/projections/deliveries/process | LEE | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### projection_dead_letters

#### Vista general

Preserva eventos que no pudieron proyectarse para inspección y recuperación sin perder el origen.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml: projection_dead_letters`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml` · **DDL:** `SQL/62_cross_store_consistency/02_tables.sql`
- **Entidad del ORM:** `ProjectionDeadLetters` — `src/modules/cross_store_consistency/entities/projection_dead_letters.entity.ts`
- **Resumen:** 8 columnas · 2 índices · 0 FK salientes · 0 entrantes · 4 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/cross_store_consistency/entities/projection_dead_letters.entity.ts:15`)_ | coincide |
| 2 | `projection_delivery_attempt_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `tenant_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 4 | `reason_code` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `payload_object_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 6 | `state` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 7 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/cross_store_consistency/entities/projection_dead_letters.entity.ts:51`)_ | coincide |
| 8 | `resolved_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_projection_dead_letter_attempt` | no | projection_delivery_attempt_id | 1 consulta(s) de repositorio filtran u ordenan por «projection_delivery_attempt_id», la primera columna del índice _(CONSULTA)_ |
| `ix_projection_dead_letter_state` | no | tenant_id, state, ("created_at" ASC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /admin/projections/dead-letters/{id}/replay | ACTUALIZA | POR_TIPO |
| POST /admin/projections/dead-letters/{id}/replay | LEE | DIRECTA |
| POST /workers/projections/dead-letters | CREA | DIRECTA |
| POST /workers/projections/dead-letters | LEE | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### projection_definitions

#### Vista general

Define proyecciones derivadas en otros almacenes para que puedan reconstruirse desde datos canónicos.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml: projection_definitions; BIZ note`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml` · **DDL:** `SQL/62_cross_store_consistency/02_tables.sql`
- **Entidad del ORM:** `ProjectionDefinitions` — `src/modules/cross_store_consistency/entities/projection_definitions.entity.ts`
- **Resumen:** 9 columnas · 2 índices · 0 FK salientes · 0 entrantes · 2 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/cross_store_consistency/entities/projection_definitions.entity.ts:15`)_ | coincide |
| 2 | `code` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 3 | `source_dataset_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 4 | `target_dataset_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 5 | `projection_version` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `delivery_semantics` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 7 | `transformation_ref` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 8 | `state` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 9 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/cross_store_consistency/entities/projection_definitions.entity.ts:63`)_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_projection_definition_version` | no | code, projection_version | 1 consulta(s) de repositorio filtran u ordenan por «code», la primera columna del índice _(CONSULTA)_ |
| `ix_projection_definition_datasets` | no | source_dataset_id, target_dataset_id, state | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /admin/projections/definitions | CREA | DIRECTA |
| POST /admin/projections/definitions | LEE | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### projection_delivery_attempts

#### Vista general

Registra intentos de entrega de eventos a consumidores para observar reintentos y fallos.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml: projection_delivery_attempts`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml` · **DDL:** `SQL/62_cross_store_consistency/02_tables.sql`
- **Entidad del ORM:** `ProjectionDeliveryAttempts` — `src/modules/cross_store_consistency/entities/projection_delivery_attempts.entity.ts`
- **Resumen:** 11 columnas · 3 índices · 0 FK salientes · 0 entrantes · 7 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/cross_store_consistency/entities/projection_delivery_attempts.entity.ts:15`)_ | coincide |
| 2 | `projection_subscription_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `outbox_event_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 4 | `tenant_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 5 | `attempt_number` | `integer` | Obligatoria | _sin dato_ | coincide |
| 6 | `idempotency_key` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 7 | `payload_hash` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 8 | `status` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 9 | `started_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 10 | `completed_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 11 | `error_code` | `varchar` | Opcional | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_projection_delivery_attempt` | no | projection_subscription_id, outbox_event_id, attempt_number | 2 consulta(s) de repositorio filtran u ordenan por «projection_subscription_id», la primera columna del índice _(CONSULTA)_ |
| `uq_projection_delivery_idem` | no | projection_subscription_id, idempotency_key | 2 consulta(s) de repositorio filtran u ordenan por «projection_subscription_id», la primera columna del índice _(CONSULTA)_ |
| `ix_projection_delivery_status` | no | tenant_id, status, ("started_at" ASC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /admin/projections/dead-letters/{id}/replay | CREA | DIRECTA |
| POST /admin/projections/dead-letters/{id}/replay | LEE | DIRECTA |
| POST /workers/projections/dead-letters | ACTUALIZA | POR_TIPO |
| POST /workers/projections/dead-letters | LEE | DIRECTA |
| POST /workers/projections/deliveries/process | ACTUALIZA | POR_TIPO |
| POST /workers/projections/deliveries/process | CREA | DIRECTA |
| POST /workers/projections/deliveries/process | LEE | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### projection_drift_events

#### Vista general

Registra cambios o desfases observados en proyecciones secundarias para iniciar reparación.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml: projection_drift_events`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml` · **DDL:** `SQL/62_cross_store_consistency/02_tables.sql`
- **Entidad del ORM:** `ProjectionDriftEvents` — `src/modules/cross_store_consistency/entities/projection_drift_events.entity.ts`
- **Resumen:** 11 columnas · 2 índices · 0 FK salientes · 0 entrantes · 4 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/cross_store_consistency/entities/projection_drift_events.entity.ts:15`)_ | coincide |
| 2 | `tenant_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `dataset_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 4 | `canonical_entity_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 5 | `drift_type` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `severity` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 7 | `canonical_version` | `bigint` | Obligatoria | _sin dato_ | coincide |
| 8 | `target_version` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 9 | `reconciliation_item_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 10 | `status` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 11 | `detected_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_projection_drift_active` | no | tenant_id, dataset_id, canonical_entity_id, drift_type, status | _sin uso detectado estáticamente_ |
| `ix_projection_drift_severity` | no | tenant_id, status, severity, ("detected_at" ASC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /admin/projections/drift/{id}/repair-jobs | ACTUALIZA | POR_TIPO |
| POST /admin/projections/drift/{id}/repair-jobs | LEE | DIRECTA |
| POST /admin/reconciliation/runs | CREA | DIRECTA |
| POST /admin/reconciliation/runs | LEE | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### projection_repair_jobs

#### Vista general

Gestiona reconstrucciones o reparaciones de proyecciones a partir de la fuente PostgreSQL canónica.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml: projection_repair_jobs`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml` · **DDL:** `SQL/62_cross_store_consistency/02_tables.sql`
- **Entidad del ORM:** `ProjectionRepairJobs` — `src/modules/cross_store_consistency/entities/projection_repair_jobs.entity.ts`
- **Resumen:** 8 columnas · 2 índices · 0 FK salientes · 0 entrantes · 2 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/cross_store_consistency/entities/projection_repair_jobs.entity.ts:15`)_ | coincide |
| 2 | `tenant_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `projection_drift_event_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 4 | `repair_action` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `idempotency_key` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `status` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 7 | `requested_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 8 | `completed_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_projection_repair_idem` | no | idempotency_key | 1 consulta(s) de repositorio filtran u ordenan por «idempotency_key», la primera columna del índice _(CONSULTA)_ |
| `ix_projection_repair_status` | no | tenant_id, status, ("requested_at" ASC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /admin/projections/drift/{id}/repair-jobs | CREA | DIRECTA |
| POST /admin/projections/drift/{id}/repair-jobs | LEE | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### projection_subscriptions

#### Vista general

Registra suscripciones de proyecciones a eventos de origen para actualizar almacenes secundarios sin dual-write.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml: projection_subscriptions`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml` · **DDL:** `SQL/62_cross_store_consistency/02_tables.sql`
- **Entidad del ORM:** `ProjectionSubscriptions` — `src/modules/cross_store_consistency/entities/projection_subscriptions.entity.ts`
- **Resumen:** 9 columnas · 2 índices · 0 FK salientes · 0 entrantes · 3 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/cross_store_consistency/entities/projection_subscriptions.entity.ts:15`)_ | coincide |
| 2 | `projection_definition_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `source_event_type` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 4 | `consumer_code` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `target_backend_code` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `concurrency_limit` | `integer` | Obligatoria | _sin dato_ | coincide |
| 7 | `retry_policy_json` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `dead_letter_enabled` | `boolean` | Obligatoria | _sin dato_ | coincide |
| 9 | `state` | `varchar` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_projection_subscription_consumer_event` | no | projection_definition_id, source_event_type, consumer_code | 1 consulta(s) de repositorio filtran u ordenan por «projection_definition_id», la primera columna del índice _(CONSULTA)_ |
| `ix_projection_subscription_state` | no | state, target_backend_code | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /admin/projections/definitions | CREA | DIRECTA |
| POST /workers/projections/dead-letters | LEE | DIRECTA |
| POST /workers/projections/deliveries/process | LEE | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### reconciliation_items

#### Vista general

Detalla discrepancias o coincidencias encontradas al comparar una proyección con su fuente canónica.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml: reconciliation_items`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml` · **DDL:** `SQL/62_cross_store_consistency/02_tables.sql`
- **Entidad del ORM:** `ReconciliationItems` — `src/modules/cross_store_consistency/entities/reconciliation_items.entity.ts`
- **Resumen:** 10 columnas · 2 índices · 0 FK salientes · 0 entrantes · 1 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/cross_store_consistency/entities/reconciliation_items.entity.ts:15`)_ | coincide |
| 2 | `reconciliation_run_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `canonical_entity_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 4 | `canonical_version` | `bigint` | Obligatoria | _sin dato_ | coincide |
| 5 | `target_document_id` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `target_version` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 7 | `canonical_hash` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 8 | `target_hash` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 9 | `result` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 10 | `detected_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_reconciliation_item_entity` | no | reconciliation_run_id, canonical_entity_id | 1 consulta(s) de repositorio filtran u ordenan por «reconciliation_run_id», la primera columna del índice _(CONSULTA)_ |
| `ix_reconciliation_item_result` | no | reconciliation_run_id, result | 1 consulta(s) de repositorio filtran u ordenan por «reconciliation_run_id», la primera columna del índice _(CONSULTA)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /admin/reconciliation/runs | CREA | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### reconciliation_runs

#### Vista general

Agrupa conciliaciones entre datos canónicos y proyecciones para detectar divergencias entre almacenes.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml: reconciliation_runs`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml` · **DDL:** `SQL/62_cross_store_consistency/02_tables.sql`
- **Entidad del ORM:** `CrossStoreConsistencyReconciliationRuns` — `src/modules/cross_store_consistency/entities/reconciliation_runs.entity.ts`
- **Resumen:** 9 columnas · 2 índices · 0 FK salientes · 0 entrantes · 2 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/cross_store_consistency/entities/reconciliation_runs.entity.ts:12`)_ | coincide |
| 2 | `tenant_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `dataset_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 4 | `source_backend_code` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `target_backend_code` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `reconciliation_scope_json` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 7 | `status` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 8 | `started_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 9 | `completed_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_reconciliation_run_status` | no | tenant_id, status, ("started_at" ASC) | _sin uso detectado estáticamente_ |
| `ix_reconciliation_run_dataset` | no | dataset_id, ("started_at" DESC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /admin/reconciliation/runs | ACTUALIZA | POR_TIPO |
| POST /admin/reconciliation/runs | CREA | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### reindex_jobs

#### Vista general

Programa y registra reindexaciones de stores derivados para restaurar su capacidad de búsqueda.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml: reindex_jobs`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml` · **DDL:** `SQL/62_cross_store_consistency/02_tables.sql`
- **Entidad del ORM:** `ReindexJobs` — `src/modules/cross_store_consistency/entities/reindex_jobs.entity.ts`
- **Resumen:** 11 columnas · 2 índices · 0 FK salientes · 0 entrantes · 1 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/cross_store_consistency/entities/reindex_jobs.entity.ts:12`)_ | coincide |
| 2 | `tenant_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `dataset_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 4 | `source_alias` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `target_index` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `target_schema_version` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 7 | `status` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 8 | `processed_count` | `bigint` | Obligatoria | _sin dato_ | coincide |
| 9 | `failed_count` | `bigint` | Obligatoria | _sin dato_ | coincide |
| 10 | `started_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 11 | `completed_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_reindex_job_status` | no | tenant_id, status, ("started_at" ASC) | _sin uso detectado estáticamente_ |
| `uq_reindex_target_index` | no | target_index | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /admin/projections/drift/{id}/repair-jobs | CREA | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### schema_migration_jobs

#### Vista general

Gestiona cambios de esquema en stores derivados para mantener compatibilidad con proyecciones.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml: schema_migration_jobs`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml` · **DDL:** `SQL/62_cross_store_consistency/02_tables.sql`
- **Entidad del ORM:** `SchemaMigrationJobs` — `src/modules/cross_store_consistency/entities/schema_migration_jobs.entity.ts`
- **Resumen:** 11 columnas · 2 índices · 0 FK salientes · 0 entrantes · 1 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/cross_store_consistency/entities/schema_migration_jobs.entity.ts:15`)_ | coincide |
| 2 | `dataset_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `collection_definition_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 4 | `from_schema_version` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `to_schema_version` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `migration_strategy` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 7 | `status` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 8 | `migrated_count` | `bigint` | Obligatoria | _sin dato_ | coincide |
| 9 | `failed_count` | `bigint` | Obligatoria | _sin dato_ | coincide |
| 10 | `started_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 11 | `completed_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_schema_migration_versions` | no | collection_definition_id, from_schema_version, to_schema_version | _sin uso detectado estáticamente_ |
| `ix_schema_migration_status` | no | status, ("started_at" ASC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /admin/data-movement-jobs | CREA | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### store_consistency_slos

#### Vista general

Define objetivos de consistencia entre stores para medir latencia de proyección y recuperación.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml: store_consistency_slos`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml` · **DDL:** `SQL/62_cross_store_consistency/02_tables.sql`
- **Entidad del ORM:** `StoreConsistencySlos` — `src/modules/cross_store_consistency/entities/store_consistency_slos.entity.ts`
- **Resumen:** 8 columnas · 2 índices · 0 FK salientes · 0 entrantes · 3 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/cross_store_consistency/entities/store_consistency_slos.entity.ts:15`)_ | coincide |
| 2 | `dataset_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `target_backend_code` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 4 | `max_projection_lag_seconds` | `integer` | Obligatoria | _sin dato_ | coincide |
| 5 | `max_drift_rate` | `numeric(8,6)` | Obligatoria | _sin dato_ | coincide |
| 6 | `reconciliation_interval_minutes` | `integer` | Obligatoria | _sin dato_ | coincide |
| 7 | `alert_policy_code` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 8 | `state` | `varchar` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_store_consistency_slo` | no | dataset_id, target_backend_code | 1 consulta(s) de repositorio filtran u ordenan por «dataset_id», la primera columna del índice _(CONSULTA)_ |
| `ix_store_consistency_state` | no | state, target_backend_code | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /admin/projections/definitions | ACTUALIZA | POR_TIPO |
| POST /admin/projections/definitions | CREA | DIRECTA |
| POST /admin/projections/definitions | LEE | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

