<!-- AUTOGENERADO por tools/inventario/catalogo.mjs. No editar manualmente. -->

# Catálogo del schema `lakehouse`

- **Tablas:** 18 · **Columnas:** 156 (20 con descripción: 12.8 %) · **Índices:** 42
- **Dominio:** Datos y NoSQL
- Método y límites del catálogo: [README del inventario](../README.md)

## Tablas

| Tabla | Propósito | Columnas | Índices | Operaciones | ORM |
|---|---|---|---|---|---|
| [cohort_definitions](#cohort_definitions) | Define cohortes de investigación con criterios explícitos para estudios y análisis de salud. | 8 | 2 | 5 | COINCIDE |
| [data_lake_zones](#data_lake_zones) | Define zonas para separar datos crudos, estandarizados, curados y preparados para investigación. | 8 | 2 | 4 | COINCIDE |
| [data_product_versions](#data_product_versions) | Preserva versiones de productos para reproducir contenido, linaje y controles aplicados. | 8 | 3 | 5 | COINCIDE |
| [data_products](#data_products) | Representa productos de datos versionados y con contratos de calidad para consumo analítico o sanitario. | 9 | 2 | 5 | COINCIDE |
| [dataset_release_manifests](#dataset_release_manifests) | Enumera contenido, versiones y controles aplicados a datasets liberados para investigación o consumo autorizado. | 9 | 3 | 5 | COINCIDE |
| [dataset_release_requests](#dataset_release_requests) | Gestiona solicitudes para liberar datasets analíticos tras revisión de privacidad, calidad y propósito. | 9 | 2 | 4 | COINCIDE |
| [lakehouse_catalogs](#lakehouse_catalogs) | Cataloga datasets y tablas analíticas gobernadas para habilitar descubrimiento y consumo controlado. | 7 | 2 | 3 | COINCIDE |
| [lakehouse_datasets](#lakehouse_datasets) | Registra datasets alojados en el lakehouse para separar analítica de bases operacionales. | 11 | 3 | 5 | COINCIDE |
| [lakehouse_files](#lakehouse_files) | Relaciona archivos de almacenamiento con datasets y particiones analíticas. | 9 | 3 | 4 | COINCIDE |
| [lakehouse_lineage_edges](#lakehouse_lineage_edges) | Representa dependencias y linaje entre fuentes, transformaciones y productos de datos. | 8 | 2 | 2 | COINCIDE |
| [lakehouse_partitions](#lakehouse_partitions) | Cataloga particiones de datasets para organizar almacenamiento y consulta analítica. | 9 | 3 | 5 | COINCIDE |
| [lakehouse_quality_issues](#lakehouse_quality_issues) | Detalla problemas detectados por controles de calidad para resolverlos antes de publicar datos. | 8 | 2 | 1 | COINCIDE |
| [lakehouse_quality_rules](#lakehouse_quality_rules) | Define contratos de calidad que datasets analíticos deben cumplir antes de liberarse. | 8 | 2 | 2 | COINCIDE |
| [lakehouse_quality_runs](#lakehouse_quality_runs) | Conserva ejecuciones de controles de calidad aplicados a datasets y productos. | 9 | 2 | 2 | COINCIDE |
| [lakehouse_schema_versions](#lakehouse_schema_versions) | Versiona esquemas analíticos para mantener compatibilidad y reproducibilidad de transformaciones. | 7 | 3 | 1 | COINCIDE |
| [research_projects](#research_projects) | Agrupa proyectos de investigación que consumen datasets aprobados bajo controles de uso. | 10 | 2 | 5 | COINCIDE |
| [transformation_definitions](#transformation_definitions) | Define transformaciones explícitas y versionadas que preparan datos para análisis o investigación. | 9 | 2 | 1 | COINCIDE |
| [transformation_runs](#transformation_runs) | Registra ejecuciones reproducibles de transformaciones y sus resultados. | 10 | 2 | 4 | COINCIDE |

### Tablas sin relaciones dentro del schema

`lakehouse.cohort_definitions` · `lakehouse.data_lake_zones` · `lakehouse.data_product_versions` · `lakehouse.data_products` · `lakehouse.dataset_release_manifests` · `lakehouse.dataset_release_requests` · `lakehouse.lakehouse_catalogs` · `lakehouse.lakehouse_datasets` · `lakehouse.lakehouse_files` · `lakehouse.lakehouse_lineage_edges` · `lakehouse.lakehouse_partitions` · `lakehouse.lakehouse_quality_issues` · `lakehouse.lakehouse_quality_rules` · `lakehouse.lakehouse_quality_runs` · `lakehouse.lakehouse_schema_versions` · `lakehouse.research_projects` · `lakehouse.transformation_definitions` · `lakehouse.transformation_runs`

## Fichas

### cohort_definitions

#### Vista general

Define cohortes de investigación con criterios explícitos para estudios y análisis de salud.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_63_lakehouse.puml: cohort_definitions`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_63_lakehouse.puml` · **DDL:** `SQL/63_lakehouse/02_tables.sql`
- **Entidad del ORM:** `CohortDefinitions` — `src/modules/lakehouse/entities/cohort_definitions.entity.ts`
- **Resumen:** 8 columnas · 2 índices · 0 FK salientes · 1 entrantes · 5 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/lakehouse/entities/cohort_definitions.entity.ts:12`)_ | coincide |
| 2 | `research_project_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `code` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 4 | `version` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `inclusion_expression` | `text` | Obligatoria | _sin dato_ | coincide |
| 6 | `exclusion_expression` | `text` | Obligatoria | _sin dato_ | coincide |
| 7 | `deidentification_profile_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 8 | `state` | `varchar` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| desde | id | health_data.health_export_jobs (cohort_definition_id) | fk_health_export_jobs_cohort_definition_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_cohort_definition_version` | no | research_project_id, code, version | 1 consulta(s) de repositorio filtran u ordenan por «research_project_id», la primera columna del índice _(CONSULTA)_ |
| `ix_cohort_definition_state` | no | research_project_id, state | 1 consulta(s) de repositorio filtran u ordenan por «research_project_id», la primera columna del índice _(CONSULTA)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /fhir/r5/$export | LEE | DIRECTA |
| POST /research/dataset-releases | LEE | DIRECTA |
| POST /research/dataset-releases/{id}/approve | LEE | DIRECTA |
| POST /research/projects/{id}/cohorts | CREA | DIRECTA |
| POST /research/projects/{id}/cohorts | LEE | DIRECTA |

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

### data_lake_zones

#### Vista general

Define zonas para separar datos crudos, estandarizados, curados y preparados para investigación.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_63_lakehouse.puml: data_lake_zones; BIZ note`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_63_lakehouse.puml` · **DDL:** `SQL/63_lakehouse/02_tables.sql`
- **Entidad del ORM:** `DataLakeZones` — `src/modules/lakehouse/entities/data_lake_zones.entity.ts`
- **Resumen:** 8 columnas · 2 índices · 0 FK salientes · 0 entrantes · 4 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/lakehouse/entities/data_lake_zones.entity.ts:12`)_ | coincide |
| 2 | `code` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 3 | `name` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 4 | `zone_type` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `namespace_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 6 | `encryption_profile_code` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 7 | `retention_policy_code` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 8 | `state` | `varchar` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_data_lake_zone_code` | no | code | 1 consulta(s) de repositorio filtran u ordenan por «code», la primera columna del índice _(CONSULTA)_ |
| `ix_data_lake_zone_type_state` | no | zone_type, state | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /lakehouse/datasets | LEE | DIRECTA |
| POST /lakehouse/ingestion/curated-runs | LEE | DIRECTA |
| POST /lakehouse/zones | CREA | DIRECTA |
| POST /lakehouse/zones | LEE | DIRECTA |

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

### data_product_versions

#### Vista general

Preserva versiones de productos para reproducir contenido, linaje y controles aplicados.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_63_lakehouse.puml: data_product_versions`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_63_lakehouse.puml` · **DDL:** `SQL/63_lakehouse/02_tables.sql`
- **Entidad del ORM:** `DataProductVersions` — `src/modules/lakehouse/entities/data_product_versions.entity.ts`
- **Resumen:** 8 columnas · 3 índices · 0 FK salientes · 0 entrantes · 5 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/lakehouse/entities/data_product_versions.entity.ts:12`)_ | coincide |
| 2 | `data_product_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `version` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 4 | `contract_schema_json` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 5 | `quality_slo_json` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 6 | `effective_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 7 | `effective_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 8 | `state` | `varchar` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_data_product_version` | no | data_product_id, version | 2 consulta(s) de repositorio filtran u ordenan por «data_product_id», la primera columna del índice _(CONSULTA)_ |
| `ix_data_product_version_effective` | no | data_product_id, ("effective_from" DESC) | _sin uso detectado estáticamente_ |
| `gin_data_product_quality_slo` | no | (quality_slo_json jsonb_path_ops) | GIN para búsqueda textual gobernada _(DOCUMENTO)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /lakehouse/data-products/{id}/versions | ACTUALIZA | POR_TIPO |
| POST /lakehouse/data-products/{id}/versions | CREA | DIRECTA |
| POST /lakehouse/data-products/{id}/versions | LEE | DIRECTA |
| POST /lakehouse/datasets | LEE | DIRECTA |
| POST /research/dataset-releases | LEE | DIRECTA |

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

### data_products

#### Vista general

Representa productos de datos versionados y con contratos de calidad para consumo analítico o sanitario.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_63_lakehouse.puml: data_products`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_63_lakehouse.puml` · **DDL:** `SQL/63_lakehouse/02_tables.sql`
- **Entidad del ORM:** `DataProducts` — `src/modules/lakehouse/entities/data_products.entity.ts`
- **Resumen:** 9 columnas · 2 índices · 0 FK salientes · 0 entrantes · 5 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/lakehouse/entities/data_products.entity.ts:12`)_ | coincide |
| 2 | `tenant_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `code` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 4 | `name` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `owner_team_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 6 | `business_purpose` | `text` | Obligatoria | _sin dato_ | coincide |
| 7 | `classification_code` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 8 | `contains_phi` | `boolean` | Obligatoria | _sin dato_ | coincide |
| 9 | `lifecycle_state` | `varchar` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_data_product_tenant_code` | no | tenant_id, code | 3 consulta(s) de repositorio filtran u ordenan por «tenant_id», la primera columna del índice _(CONSULTA)_ |
| `ix_data_product_owner_state` | no | owner_team_id, lifecycle_state | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /lakehouse/data-products/{id}/versions | ACTUALIZA | POR_TIPO |
| POST /lakehouse/data-products/{id}/versions | CREA | DIRECTA |
| POST /lakehouse/data-products/{id}/versions | LEE | DIRECTA |
| POST /lakehouse/datasets | LEE | DIRECTA |
| POST /research/dataset-releases | LEE | DIRECTA |

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

### dataset_release_manifests

#### Vista general

Enumera contenido, versiones y controles aplicados a datasets liberados para investigación o consumo autorizado.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_63_lakehouse.puml: dataset_release_manifests`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_63_lakehouse.puml` · **DDL:** `SQL/63_lakehouse/02_tables.sql`
- **Entidad del ORM:** `DatasetReleaseManifests` — `src/modules/lakehouse/entities/dataset_release_manifests.entity.ts`
- **Resumen:** 9 columnas · 3 índices · 0 FK salientes · 0 entrantes · 5 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/lakehouse/entities/dataset_release_manifests.entity.ts:12`)_ | coincide |
| 2 | `dataset_release_request_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `deidentification_run_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 4 | `object_manifest_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 5 | `schema_version` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `record_count` | `bigint` | Obligatoria | _sin dato_ | coincide |
| 7 | `content_hash` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 8 | `expires_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 9 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/lakehouse/entities/dataset_release_manifests.entity.ts:60`)_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_dataset_release_manifest_request` | no | dataset_release_request_id | 1 consulta(s) de repositorio filtran u ordenan por «dataset_release_request_id», la primera columna del índice _(CONSULTA)_ |
| `uq_dataset_release_manifest_hash` | no | content_hash | _sin uso detectado estáticamente_ |
| `ix_dataset_release_expiry` | no | expires_at | 1 consulta(s) de repositorio filtran u ordenan por «expires_at», la primera columna del índice _(CONSULTA)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /research/dataset-releases/{id}/approve | CREA | DIRECTA |
| POST /research/dataset-releases/{id}/approve | LEE | DIRECTA |
| POST /research/dataset-releases/{id}/revoke | ACTUALIZA | POR_TIPO |
| POST /research/dataset-releases/{id}/revoke | LEE | DIRECTA |
| GET /research/dataset-releases/expired | LEE | DIRECTA |

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

### dataset_release_requests

#### Vista general

Gestiona solicitudes para liberar datasets analíticos tras revisión de privacidad, calidad y propósito.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_63_lakehouse.puml: dataset_release_requests; BIZ note`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_63_lakehouse.puml` · **DDL:** `SQL/63_lakehouse/02_tables.sql`
- **Entidad del ORM:** `DatasetReleaseRequests` — `src/modules/lakehouse/entities/dataset_release_requests.entity.ts`
- **Resumen:** 9 columnas · 2 índices · 0 FK salientes · 0 entrantes · 4 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/lakehouse/entities/dataset_release_requests.entity.ts:12`)_ | coincide |
| 2 | `tenant_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `research_project_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 4 | `data_product_version_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 5 | `cohort_definition_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 6 | `purpose_of_use_code` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 7 | `requested_by_user_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 8 | `requested_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 9 | `status` | `varchar` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_dataset_release_status` | no | tenant_id, status, ("requested_at" ASC) | _sin uso detectado estáticamente_ |
| `ix_dataset_release_project` | no | research_project_id, ("requested_at" DESC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /research/dataset-releases | CREA | DIRECTA |
| POST /research/dataset-releases/{id}/approve | LEE | DIRECTA |
| POST /research/dataset-releases/{id}/revoke | LEE | DIRECTA |
| GET /research/dataset-releases/expired | LEE | DIRECTA |

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

### lakehouse_catalogs

#### Vista general

Cataloga datasets y tablas analíticas gobernadas para habilitar descubrimiento y consumo controlado.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_63_lakehouse.puml: lakehouse_catalogs`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_63_lakehouse.puml` · **DDL:** `SQL/63_lakehouse/02_tables.sql`
- **Entidad del ORM:** `LakehouseCatalogs` — `src/modules/lakehouse/entities/lakehouse_catalogs.entity.ts`
- **Resumen:** 7 columnas · 2 índices · 0 FK salientes · 0 entrantes · 3 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/lakehouse/entities/lakehouse_catalogs.entity.ts:12`)_ | coincide |
| 2 | `code` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 3 | `catalog_type` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 4 | `metastore_uri` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `default_format` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `default_compression` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 7 | `state` | `varchar` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_lakehouse_catalog_code` | no | code | 1 consulta(s) de repositorio filtran u ordenan por «code», la primera columna del índice _(CONSULTA)_ |
| `ix_lakehouse_catalog_state` | no | state, catalog_type | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /lakehouse/catalogs | CREA | DIRECTA |
| POST /lakehouse/catalogs | LEE | DIRECTA |
| POST /lakehouse/datasets | LEE | DIRECTA |

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

### lakehouse_datasets

#### Vista general

Registra datasets alojados en el lakehouse para separar analítica de bases operacionales.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_63_lakehouse.puml: lakehouse_datasets; BIZ note`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_63_lakehouse.puml` · **DDL:** `SQL/63_lakehouse/02_tables.sql`
- **Entidad del ORM:** `LakehouseDatasets` — `src/modules/lakehouse/entities/lakehouse_datasets.entity.ts`
- **Resumen:** 11 columnas · 3 índices · 0 FK salientes · 0 entrantes · 5 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/lakehouse/entities/lakehouse_datasets.entity.ts:12`)_ | coincide |
| 2 | `tenant_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `data_product_version_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 4 | `data_lake_zone_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 5 | `lakehouse_catalog_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 6 | `database_name` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 7 | `table_name` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 8 | `storage_format` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 9 | `partition_spec_json` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 10 | `source_dataset_code` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 11 | `lifecycle_state` | `varchar` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_lakehouse_dataset_table` | no | lakehouse_catalog_id, database_name, table_name | 1 consulta(s) de repositorio filtran u ordenan por «lakehouse_catalog_id», la primera columna del índice _(CONSULTA)_ |
| `ix_lakehouse_dataset_product` | no | data_product_version_id, lifecycle_state | _sin uso detectado estáticamente_ |
| `gin_lakehouse_partition_spec` | no | (partition_spec_json jsonb_path_ops) | GIN para búsqueda textual gobernada _(DOCUMENTO)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /lakehouse/datasets | CREA | DIRECTA |
| POST /lakehouse/datasets | LEE | DIRECTA |
| POST /lakehouse/datasets/{id}/quality-runs | LEE | DIRECTA |
| POST /lakehouse/ingestion/curated-runs | LEE | DIRECTA |
| POST /lakehouse/transformations/{defId}/runs | LEE | DIRECTA |

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

### lakehouse_files

#### Vista general

Relaciona archivos de almacenamiento con datasets y particiones analíticas.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_63_lakehouse.puml: lakehouse_files`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_63_lakehouse.puml` · **DDL:** `SQL/63_lakehouse/02_tables.sql`
- **Entidad del ORM:** `LakehouseFiles` — `src/modules/lakehouse/entities/lakehouse_files.entity.ts`
- **Resumen:** 9 columnas · 3 índices · 0 FK salientes · 0 entrantes · 4 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/lakehouse/entities/lakehouse_files.entity.ts:12`)_ | coincide |
| 2 | `lakehouse_partition_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `object_manifest_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 4 | `file_format` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `row_count` | `bigint` | Obligatoria | _sin dato_ | coincide |
| 6 | `size_bytes` | `bigint` | Obligatoria | _sin dato_ | coincide |
| 7 | `content_hash` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 8 | `min_max_statistics_json` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 9 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/lakehouse/entities/lakehouse_files.entity.ts:64`)_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_lakehouse_file_object` | no | lakehouse_partition_id, object_manifest_id | 1 consulta(s) de repositorio filtran u ordenan por «lakehouse_partition_id», la primera columna del índice _(CONSULTA)_ |
| `uq_lakehouse_file_hash` | no | lakehouse_partition_id, content_hash | 1 consulta(s) de repositorio filtran u ordenan por «lakehouse_partition_id», la primera columna del índice _(CONSULTA)_ |
| `ix_lakehouse_file_created` | no | lakehouse_partition_id, ("created_at" DESC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /lakehouse/ingestion/curated-runs | CREA | DIRECTA |
| POST /lakehouse/ingestion/curated-runs | LEE | DIRECTA |
| POST /lakehouse/transformations/{defId}/runs | CREA | DIRECTA |
| POST /lakehouse/transformations/{defId}/runs | LEE | DIRECTA |

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

### lakehouse_lineage_edges

#### Vista general

Representa dependencias y linaje entre fuentes, transformaciones y productos de datos.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_63_lakehouse.puml: lakehouse_lineage_edges`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_63_lakehouse.puml` · **DDL:** `SQL/63_lakehouse/02_tables.sql`
- **Entidad del ORM:** `LakehouseLineageEdges` — `src/modules/lakehouse/entities/lakehouse_lineage_edges.entity.ts`
- **Resumen:** 8 columnas · 2 índices · 0 FK salientes · 0 entrantes · 2 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/lakehouse/entities/lakehouse_lineage_edges.entity.ts:12`)_ | coincide |
| 2 | `tenant_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `source_dataset_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 4 | `target_dataset_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 5 | `transformation_run_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 6 | `source_partition_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 7 | `target_partition_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 8 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_lakehouse_lineage_source` | no | source_dataset_id, source_partition_id, ("recorded_at" DESC) | _sin uso detectado estáticamente_ |
| `ix_lakehouse_lineage_target` | no | target_dataset_id, target_partition_id, ("recorded_at" DESC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /lakehouse/ingestion/curated-runs | CREA | DIRECTA |
| POST /lakehouse/transformations/{defId}/runs | CREA | DIRECTA |

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

### lakehouse_partitions

#### Vista general

Cataloga particiones de datasets para organizar almacenamiento y consulta analítica.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_63_lakehouse.puml: lakehouse_partitions`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_63_lakehouse.puml` · **DDL:** `SQL/63_lakehouse/02_tables.sql`
- **Entidad del ORM:** `LakehousePartitions` — `src/modules/lakehouse/entities/lakehouse_partitions.entity.ts`
- **Resumen:** 9 columnas · 3 índices · 0 FK salientes · 0 entrantes · 5 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/lakehouse/entities/lakehouse_partitions.entity.ts:12`)_ | coincide |
| 2 | `lakehouse_dataset_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `partition_spec_hash` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 4 | `partition_values_json` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 5 | `record_count` | `bigint` | Obligatoria | _sin dato_ | coincide |
| 6 | `size_bytes` | `bigint` | Obligatoria | _sin dato_ | coincide |
| 7 | `min_event_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 8 | `max_event_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 9 | `state` | `varchar` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_lakehouse_partition_hash` | no | lakehouse_dataset_id, partition_spec_hash | 1 consulta(s) de repositorio filtran u ordenan por «lakehouse_dataset_id», la primera columna del índice _(CONSULTA)_ |
| `ix_lakehouse_partition_time` | no | lakehouse_dataset_id, ("max_event_at" DESC) | _sin uso detectado estáticamente_ |
| `gin_lakehouse_partition_values` | no | (partition_values_json jsonb_path_ops) | GIN para búsqueda textual gobernada _(DOCUMENTO)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /lakehouse/datasets/{id}/quality-runs | LEE | DIRECTA |
| POST /lakehouse/ingestion/curated-runs | CREA | DIRECTA |
| POST /lakehouse/ingestion/curated-runs | LEE | DIRECTA |
| POST /lakehouse/transformations/{defId}/runs | CREA | DIRECTA |
| POST /lakehouse/transformations/{defId}/runs | LEE | DIRECTA |

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

### lakehouse_quality_issues

#### Vista general

Detalla problemas detectados por controles de calidad para resolverlos antes de publicar datos.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_63_lakehouse.puml: lakehouse_quality_issues`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_63_lakehouse.puml` · **DDL:** `SQL/63_lakehouse/02_tables.sql`
- **Entidad del ORM:** `LakehouseQualityIssues` — `src/modules/lakehouse/entities/lakehouse_quality_issues.entity.ts`
- **Resumen:** 8 columnas · 2 índices · 0 FK salientes · 0 entrantes · 1 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/lakehouse/entities/lakehouse_quality_issues.entity.ts:12`)_ | coincide |
| 2 | `lakehouse_quality_run_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `lakehouse_quality_rule_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 4 | `partition_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 5 | `issue_count` | `bigint` | Obligatoria | _sin dato_ | coincide |
| 6 | `sample_object_manifest_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 7 | `status` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 8 | `detected_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_lakehouse_quality_issue_run` | no | lakehouse_quality_run_id, status | _sin uso detectado estáticamente_ |
| `ix_lakehouse_quality_issue_rule` | no | lakehouse_quality_rule_id, ("detected_at" DESC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /lakehouse/datasets/{id}/quality-runs | CREA | DIRECTA |

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

### lakehouse_quality_rules

#### Vista general

Define contratos de calidad que datasets analíticos deben cumplir antes de liberarse.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_63_lakehouse.puml: lakehouse_quality_rules`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_63_lakehouse.puml` · **DDL:** `SQL/63_lakehouse/02_tables.sql`
- **Entidad del ORM:** `LakehouseQualityRules` — `src/modules/lakehouse/entities/lakehouse_quality_rules.entity.ts`
- **Resumen:** 8 columnas · 2 índices · 0 FK salientes · 0 entrantes · 2 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/lakehouse/entities/lakehouse_quality_rules.entity.ts:12`)_ | coincide |
| 2 | `data_product_version_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `rule_code` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 4 | `dimension` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `expression` | `text` | Obligatoria | _sin dato_ | coincide |
| 6 | `severity` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 7 | `threshold` | `numeric` | Obligatoria | _sin dato_ | coincide |
| 8 | `state` | `varchar` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_lakehouse_quality_rule` | no | data_product_version_id, rule_code | 2 consulta(s) de repositorio filtran u ordenan por «data_product_version_id», la primera columna del índice _(CONSULTA)_ |
| `ix_lakehouse_quality_rule_state` | no | state, severity | 1 consulta(s) de repositorio filtran u ordenan por «state», la primera columna del índice _(CONSULTA)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /lakehouse/data-products/{id}/versions | CREA | DIRECTA |
| POST /lakehouse/datasets/{id}/quality-runs | LEE | DIRECTA |

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

### lakehouse_quality_runs

#### Vista general

Conserva ejecuciones de controles de calidad aplicados a datasets y productos.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_63_lakehouse.puml: lakehouse_quality_runs`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_63_lakehouse.puml` · **DDL:** `SQL/63_lakehouse/02_tables.sql`
- **Entidad del ORM:** `LakehouseQualityRuns` — `src/modules/lakehouse/entities/lakehouse_quality_runs.entity.ts`
- **Resumen:** 9 columnas · 2 índices · 0 FK salientes · 0 entrantes · 2 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/lakehouse/entities/lakehouse_quality_runs.entity.ts:12`)_ | coincide |
| 2 | `tenant_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `lakehouse_dataset_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 4 | `transformation_run_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 5 | `status` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `evaluated_record_count` | `bigint` | Obligatoria | _sin dato_ | coincide |
| 7 | `failed_record_count` | `bigint` | Obligatoria | _sin dato_ | coincide |
| 8 | `started_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 9 | `completed_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_lakehouse_quality_run_dataset` | no | lakehouse_dataset_id, ("started_at" DESC) | _sin uso detectado estáticamente_ |
| `ix_lakehouse_quality_run_status` | no | tenant_id, status, ("started_at" ASC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /lakehouse/datasets/{id}/quality-runs | ACTUALIZA | POR_TIPO |
| POST /lakehouse/datasets/{id}/quality-runs | CREA | DIRECTA |

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

### lakehouse_schema_versions

#### Vista general

Versiona esquemas analíticos para mantener compatibilidad y reproducibilidad de transformaciones.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_63_lakehouse.puml: lakehouse_schema_versions`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_63_lakehouse.puml` · **DDL:** `SQL/63_lakehouse/02_tables.sql`
- **Entidad del ORM:** `LakehouseSchemaVersions` — `src/modules/lakehouse/entities/lakehouse_schema_versions.entity.ts`
- **Resumen:** 7 columnas · 3 índices · 0 FK salientes · 0 entrantes · 1 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/lakehouse/entities/lakehouse_schema_versions.entity.ts:12`)_ | coincide |
| 2 | `lakehouse_dataset_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `schema_version` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `schema_json` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 5 | `schema_fingerprint` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `compatibility_mode` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 7 | `effective_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_lakehouse_schema_version` | no | lakehouse_dataset_id, schema_version | 1 consulta(s) de repositorio filtran u ordenan por «lakehouse_dataset_id», la primera columna del índice _(CONSULTA)_ |
| `uq_lakehouse_schema_fingerprint` | no | lakehouse_dataset_id, schema_fingerprint | 1 consulta(s) de repositorio filtran u ordenan por «lakehouse_dataset_id», la primera columna del índice _(CONSULTA)_ |
| `gin_lakehouse_schema_json` | no | (schema_json jsonb_path_ops) | GIN para búsqueda textual gobernada _(DOCUMENTO)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /lakehouse/datasets | CREA | DIRECTA |

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

### research_projects

#### Vista general

Agrupa proyectos de investigación que consumen datasets aprobados bajo controles de uso.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_63_lakehouse.puml: research_projects`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_63_lakehouse.puml` · **DDL:** `SQL/63_lakehouse/02_tables.sql`
- **Entidad del ORM:** `ResearchProjects` — `src/modules/lakehouse/entities/research_projects.entity.ts`
- **Resumen:** 10 columnas · 2 índices · 0 FK salientes · 0 entrantes · 5 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/lakehouse/entities/research_projects.entity.ts:12`)_ | coincide |
| 2 | `tenant_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `code` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 4 | `title` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `protocol_reference` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `principal_investigator_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 7 | `ethics_approval_reference` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 8 | `approved_from` | `date` | Obligatoria | _sin dato_ | coincide |
| 9 | `approved_to` | `date` | Obligatoria | _sin dato_ | coincide |
| 10 | `state` | `varchar` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_research_project_tenant_code` | no | tenant_id, code | 3 consulta(s) de repositorio filtran u ordenan por «tenant_id», la primera columna del índice _(CONSULTA)_ |
| `ix_research_project_state_period` | no | state, approved_to | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /research/dataset-releases | LEE | DIRECTA |
| POST /research/dataset-releases/{id}/approve | LEE | DIRECTA |
| POST /research/projects/{id}/cohorts | ACTUALIZA | POR_TIPO |
| POST /research/projects/{id}/cohorts | CREA | DIRECTA |
| POST /research/projects/{id}/cohorts | LEE | DIRECTA |

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

### transformation_definitions

#### Vista general

Define transformaciones explícitas y versionadas que preparan datos para análisis o investigación.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_63_lakehouse.puml: transformation_definitions`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_63_lakehouse.puml` · **DDL:** `SQL/63_lakehouse/02_tables.sql`
- **Entidad del ORM:** `TransformationDefinitions` — `src/modules/lakehouse/entities/transformation_definitions.entity.ts`
- **Resumen:** 9 columnas · 2 índices · 0 FK salientes · 0 entrantes · 1 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/lakehouse/entities/transformation_definitions.entity.ts:12`)_ | coincide |
| 2 | `tenant_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `code` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 4 | `version` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `engine` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `source_dataset_ids` | `uuid[]` | Obligatoria | _sin dato_ | coincide |
| 7 | `target_dataset_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 8 | `transformation_ref` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 9 | `state` | `varchar` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_transformation_version` | no | tenant_id, code, version | 1 consulta(s) de repositorio filtran u ordenan por «tenant_id», la primera columna del índice _(CONSULTA)_ |
| `ix_transformation_target_state` | no | target_dataset_id, state | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /lakehouse/transformations/{defId}/runs | LEE | DIRECTA |

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

### transformation_runs

#### Vista general

Registra ejecuciones reproducibles de transformaciones y sus resultados.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_63_lakehouse.puml: transformation_runs`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_63_lakehouse.puml` · **DDL:** `SQL/63_lakehouse/02_tables.sql`
- **Entidad del ORM:** `TransformationRuns` — `src/modules/lakehouse/entities/transformation_runs.entity.ts`
- **Resumen:** 10 columnas · 2 índices · 0 FK salientes · 0 entrantes · 4 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/lakehouse/entities/transformation_runs.entity.ts:12`)_ | coincide |
| 2 | `transformation_definition_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `tenant_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 4 | `source_checkpoint` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `status` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `input_record_count` | `bigint` | Obligatoria | _sin dato_ | coincide |
| 7 | `output_record_count` | `bigint` | Obligatoria | _sin dato_ | coincide |
| 8 | `rejected_record_count` | `bigint` | Obligatoria | _sin dato_ | coincide |
| 9 | `started_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 10 | `completed_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_transformation_run_status` | no | tenant_id, status, ("started_at" ASC) | _sin uso detectado estáticamente_ |
| `ix_transformation_run_definition` | no | transformation_definition_id, ("started_at" DESC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /lakehouse/datasets/{id}/quality-runs | LEE | DIRECTA |
| POST /lakehouse/transformations/{defId}/runs | ACTUALIZA | POR_TIPO |
| POST /lakehouse/transformations/{defId}/runs | CREA | DIRECTA |
| POST /lakehouse/transformations/{defId}/runs | LEE | DIRECTA |

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

