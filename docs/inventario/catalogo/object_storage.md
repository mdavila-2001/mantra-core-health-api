<!-- AUTOGENERADO por tools/inventario/catalogo.mjs. No editar manualmente. -->

# Catálogo del schema `object_storage`

- **Tablas:** 17 · **Columnas:** 151 (24 con descripción: 15.9 %) · **Índices:** 41
- **Dominio:** Datos y NoSQL
- Método y límites del catálogo: [README del inventario](../README.md)

## Tablas

| Tabla | Propósito | Columnas | Índices | Operaciones | ORM |
|---|---|---|---|---|---|
| [archive_manifests](#archive_manifests) | Describe conjuntos archivados y sus objetos para mantener inventario de contenido trasladado a archivo. | 9 | 2 | 2 | DIVERGE |
| [dicom_instance_manifests](#dicom_instance_manifests) | Registra instancias DICOM y sus ubicaciones para resolver objetos individuales de imagenología. | 9 | 3 | 5 | DIVERGE |
| [dicom_series_manifests](#dicom_series_manifests) | Cataloga series DICOM dentro de estudios para organizar referencias a imágenes diagnósticas. | 8 | 2 | 6 | DIVERGE |
| [dicom_study_manifests](#dicom_study_manifests) | Registra manifests de estudios DICOM para localizar y gobernar imágenes médicas en PACS u object storage. | 11 | 3 | 6 | DIVERGE |
| [dicomweb_access_logs](#dicomweb_access_logs) | Traza accesos por DICOMweb a objetos de imagen médica para auditoría y control de uso. | 10 | 3 | 3 | COINCIDE |
| [large_payload_manifests](#large_payload_manifests) | Cataloga payloads grandes almacenados fuera de PostgreSQL y permite resolver su contenido por referencias. | 9 | 2 | 2 | COINCIDE |
| [multipart_uploads](#multipart_uploads) | Gestiona cargas fragmentadas de objetos grandes para completar transferencias de forma recuperable. | 10 | 3 | 7 | COINCIDE |
| [object_checksums](#object_checksums) | Conserva hashes de objetos para verificar integridad durante carga, copia y lectura. | 7 | 2 | 6 | DIVERGE |
| [object_deletion_markers](#object_deletion_markers) | Marca objetos eliminados de manera lógica para propagar borrados y conservar trazabilidad de la operación. | 7 | 2 | 2 | COINCIDE |
| [object_encryption_envelopes](#object_encryption_envelopes) | Registra metadata de claves y envolturas de cifrado usadas para proteger objetos almacenados. | 8 | 2 | 3 | COINCIDE |
| [object_integrity_checks](#object_integrity_checks) | Registra verificaciones de integridad de objetos para detectar alteraciones o daños en contenido almacenado. | 8 | 2 | 1 | COINCIDE |
| [object_legal_holds](#object_legal_holds) | Mantiene retenciones legales sobre objetos para impedir su eliminación mientras exista una obligación vigente. | 7 | 2 | 9 | DIVERGE |
| [object_locations](#object_locations) | Registra ubicaciones físicas o remotas donde se guarda cada objeto binario. | 8 | 2 | 10 | DIVERGE |
| [object_manifests](#object_manifests) | Cataloga metadata de objetos binarios —incluidos medios médicos y documentos— mientras el contenido reside en object storage o PACS. | 11 | 3 | 23 | DIVERGE |
| [object_namespaces](#object_namespaces) | Define espacios de nombres aislados para organizar objetos binarios por tenant y propósito. | 10 | 2 | 5 | COINCIDE |
| [object_retention_locks](#object_retention_locks) | Aplica bloqueos de retención a objetos que deben preservarse durante un período definido. | 7 | 2 | 7 | DIVERGE |
| [object_versions](#object_versions) | Preserva versiones de objetos para mantener referencias a documentos y medios inmutables o versionados. | 12 | 4 | 15 | COINCIDE |

### Tablas sin relaciones dentro del schema

`object_storage.archive_manifests` · `object_storage.dicom_instance_manifests` · `object_storage.dicom_series_manifests` · `object_storage.dicom_study_manifests` · `object_storage.dicomweb_access_logs` · `object_storage.large_payload_manifests` · `object_storage.multipart_uploads` · `object_storage.object_checksums` · `object_storage.object_deletion_markers` · `object_storage.object_encryption_envelopes` · `object_storage.object_integrity_checks` · `object_storage.object_legal_holds` · `object_storage.object_locations` · `object_storage.object_manifests` · `object_storage.object_namespaces` · `object_storage.object_retention_locks` · `object_storage.object_versions`

## Fichas

### archive_manifests

#### Vista general

Describe conjuntos archivados y sus objetos para mantener inventario de contenido trasladado a archivo.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_60_object_storage.puml: archive_manifests`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_60_object_storage.puml` · **DDL:** `SQL/60_object_storage/02_tables.sql`
- **Entidad del ORM:** `ArchiveManifests` — `src/modules/object_storage/entities/archive_manifests.entity.ts`
- **Resumen:** 9 columnas · 2 índices · 0 FK salientes · 0 entrantes · 2 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/object_storage/entities/archive_manifests.entity.ts:12`)_ | coincide |
| 2 | `tenant_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `archive_type` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 4 | `source_scope_json` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 5 | `object_manifest_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 6 | `record_count` | `bigint` | Obligatoria | _sin dato_ | coincide |
| 7 | `manifest_hash` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 8 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/object_storage/entities/archive_manifests.entity.ts:58`)_ | coincide |
| 9 | `verified_at` | `timestamptz` | Obligatoria | _sin dato_ | **NULABILIDAD_DIVERGE** — el modelo dice obligatoria y la entidad opcional |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_archive_manifest_hash` | no | tenant_id, manifest_hash | 1 consulta(s) de repositorio filtran u ordenan por «tenant_id», la primera columna del índice _(CONSULTA)_ |
| `ix_archive_manifest_created` | no | tenant_id, archive_type, ("created_at" DESC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /object-storage/archive-jobs/build | CREA | DIRECTA |
| POST /object-storage/archive-jobs/build | LEE | DIRECTA |

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

### dicom_instance_manifests

#### Vista general

Registra instancias DICOM y sus ubicaciones para resolver objetos individuales de imagenología.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_60_object_storage.puml: dicom_instance_manifests`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_60_object_storage.puml` · **DDL:** `SQL/60_object_storage/02_tables.sql`
- **Entidad del ORM:** `DicomInstanceManifests` — `src/modules/object_storage/entities/dicom_instance_manifests.entity.ts`
- **Resumen:** 9 columnas · 3 índices · 0 FK salientes · 0 entrantes · 5 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/object_storage/entities/dicom_instance_manifests.entity.ts:12`)_ | coincide |
| 2 | `dicom_series_manifest_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `sop_instance_uid` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 4 | `sop_class_uid` | `varchar` | Obligatoria | _sin dato_ | **NULABILIDAD_DIVERGE** — el modelo dice obligatoria y la entidad opcional |
| 5 | `instance_number` | `integer` | Obligatoria | _sin dato_ | **NULABILIDAD_DIVERGE** — el modelo dice obligatoria y la entidad opcional |
| 6 | `transfer_syntax_uid` | `varchar` | Obligatoria | _sin dato_ | **NULABILIDAD_DIVERGE** — el modelo dice obligatoria y la entidad opcional |
| 7 | `object_manifest_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 8 | `frame_count` | `integer` | Obligatoria | _sin dato_ | **NULABILIDAD_DIVERGE** — el modelo dice obligatoria y la entidad opcional |
| 9 | `metadata_json` | `jsonb` | Obligatoria | _sin dato_ | **NULABILIDAD_DIVERGE** — el modelo dice obligatoria y la entidad opcional |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_dicom_instance_uid` | no | dicom_series_manifest_id, sop_instance_uid | 2 consulta(s) de repositorio filtran u ordenan por «dicom_series_manifest_id», la primera columna del índice _(CONSULTA)_ |
| `ix_dicom_instance_number` | no | dicom_series_manifest_id, instance_number | 2 consulta(s) de repositorio filtran u ordenan por «dicom_series_manifest_id», la primera columna del índice _(CONSULTA)_ |
| `gin_dicom_instance_metadata` | no | (metadata_json jsonb_path_ops) | GIN para búsqueda textual gobernada _(DOCUMENTO)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| GET /dicomweb/studies/{studyUid}/series/{seriesUid}/instances/{sopUid} | LEE | DIRECTA |
| POST /object-storage/dicom/studies/catalog | CREA | DIRECTA |
| POST /object-storage/dicom/studies/catalog | LEE | DIRECTA |
| GET /object-storage/versions/{versionId}/content/{token} | LEE | DIRECTA |
| POST /object-storage/versions/{versionId}/signed-url | LEE | DIRECTA |

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

### dicom_series_manifests

#### Vista general

Cataloga series DICOM dentro de estudios para organizar referencias a imágenes diagnósticas.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_60_object_storage.puml: dicom_series_manifests`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_60_object_storage.puml` · **DDL:** `SQL/60_object_storage/02_tables.sql`
- **Entidad del ORM:** `DicomSeriesManifests` — `src/modules/object_storage/entities/dicom_series_manifests.entity.ts`
- **Resumen:** 8 columnas · 2 índices · 0 FK salientes · 0 entrantes · 6 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/object_storage/entities/dicom_series_manifests.entity.ts:12`)_ | coincide |
| 2 | `dicom_study_manifest_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `series_instance_uid` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 4 | `modality` | `varchar` | Obligatoria | _sin dato_ | **NULABILIDAD_DIVERGE** — el modelo dice obligatoria y la entidad opcional |
| 5 | `series_number` | `integer` | Obligatoria | _sin dato_ | coincide |
| 6 | `body_part_examined` | `varchar` | Obligatoria | _sin dato_ | **NULABILIDAD_DIVERGE** — el modelo dice obligatoria y la entidad opcional |
| 7 | `instance_count` | `integer` | Obligatoria | _sin dato_ | coincide |
| 8 | `thumbnail_object_manifest_id` | `uuid` | Obligatoria | _sin dato_ | **NULABILIDAD_DIVERGE** — el modelo dice obligatoria y la entidad opcional |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_dicom_series_uid` | no | dicom_study_manifest_id, series_instance_uid | 3 consulta(s) de repositorio filtran u ordenan por «dicom_study_manifest_id», la primera columna del índice _(CONSULTA)_ |
| `ix_dicom_series_modality` | no | modality, body_part_examined | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| GET /dicomweb/studies/{studyUid}/series/{seriesUid}/instances/{sopUid} | LEE | DIRECTA |
| POST /object-storage/dicom/studies/catalog | ACTUALIZA | POR_TIPO |
| POST /object-storage/dicom/studies/catalog | CREA | DIRECTA |
| POST /object-storage/dicom/studies/catalog | LEE | DIRECTA |
| GET /object-storage/versions/{versionId}/content/{token} | LEE | DIRECTA |
| POST /object-storage/versions/{versionId}/signed-url | LEE | DIRECTA |

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

### dicom_study_manifests

#### Vista general

Registra manifests de estudios DICOM para localizar y gobernar imágenes médicas en PACS u object storage.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_60_object_storage.puml: dicom_study_manifests`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_60_object_storage.puml` · **DDL:** `SQL/60_object_storage/02_tables.sql`
- **Entidad del ORM:** `DicomStudyManifests` — `src/modules/object_storage/entities/dicom_study_manifests.entity.ts`
- **Resumen:** 11 columnas · 3 índices · 0 FK salientes · 0 entrantes · 6 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/object_storage/entities/dicom_study_manifests.entity.ts:12`)_ | coincide |
| 2 | `tenant_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `patient_profile_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 4 | `imaging_study_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 5 | `study_instance_uid` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `accession_number` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 7 | `study_date` | `date` | Obligatoria | _sin dato_ | **NULABILIDAD_DIVERGE** — el modelo dice obligatoria y la entidad opcional |
| 8 | `modality_codes` | `varchar[]` | Obligatoria | _sin dato_ | **NULABILIDAD_DIVERGE** — el modelo dice obligatoria y la entidad opcional |
| 9 | `series_count` | `integer` | Obligatoria | _sin dato_ | coincide |
| 10 | `instance_count` | `integer` | Obligatoria | _sin dato_ | coincide |
| 11 | `lifecycle_state` | `varchar` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_dicom_study_uid` | no | tenant_id, study_instance_uid | 2 consulta(s) de repositorio filtran u ordenan por «tenant_id», la primera columna del índice _(CONSULTA)_ |
| `ix_dicom_study_patient_date` | no | tenant_id, patient_profile_id, ("study_date" DESC) | _sin uso detectado estáticamente_ |
| `ix_dicom_study_accession` | no | tenant_id, accession_number | 2 consulta(s) de repositorio filtran u ordenan por «tenant_id», la primera columna del índice _(CONSULTA)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| GET /dicomweb/studies/{studyUid}/series/{seriesUid}/instances/{sopUid} | LEE | DIRECTA |
| POST /object-storage/dicom/studies/catalog | ACTUALIZA | POR_TIPO |
| POST /object-storage/dicom/studies/catalog | CREA | DIRECTA |
| POST /object-storage/dicom/studies/catalog | LEE | DIRECTA |
| GET /object-storage/versions/{versionId}/content/{token} | LEE | DIRECTA |
| POST /object-storage/versions/{versionId}/signed-url | LEE | DIRECTA |

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

### dicomweb_access_logs

#### Vista general

Traza accesos por DICOMweb a objetos de imagen médica para auditoría y control de uso.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_60_object_storage.puml: dicomweb_access_logs`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_60_object_storage.puml` · **DDL:** `SQL/60_object_storage/02_tables.sql`
- **Entidad del ORM:** `DicomwebAccessLogs` — `src/modules/object_storage/entities/dicomweb_access_logs.entity.ts`
- **Resumen:** 10 columnas · 3 índices · 0 FK salientes · 0 entrantes · 3 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/object_storage/entities/dicomweb_access_logs.entity.ts:12`)_ | coincide |
| 2 | `tenant_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `principal_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 4 | `operation` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `study_instance_uid` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `series_instance_uid` | `varchar` | Opcional | _sin dato_ | coincide |
| 7 | `sop_instance_uid` | `varchar` | Opcional | _sin dato_ | coincide |
| 8 | `purpose_of_use_code` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 9 | `outcome` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 10 | `occurred_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_dicomweb_principal_time` | no | tenant_id, principal_id, ("occurred_at" DESC) | _sin uso detectado estáticamente_ |
| `ix_dicomweb_study_time` | no | tenant_id, study_instance_uid, ("occurred_at" DESC) | _sin uso detectado estáticamente_ |
| `brin_dicomweb_occurred` | no | occurred_at | BRIN para logs e historiales append-only de gran volumen _(DOCUMENTO)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| GET /dicomweb/studies/{studyUid}/series/{seriesUid}/instances/{sopUid} | CREA | DIRECTA |
| GET /object-storage/versions/{versionId}/content/{token} | CREA | DIRECTA |
| POST /object-storage/versions/{versionId}/signed-url | CREA | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/object_storage/README.md:78` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### large_payload_manifests

#### Vista general

Cataloga payloads grandes almacenados fuera de PostgreSQL y permite resolver su contenido por referencias.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_60_object_storage.puml: large_payload_manifests`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_60_object_storage.puml` · **DDL:** `SQL/60_object_storage/02_tables.sql`
- **Entidad del ORM:** `LargePayloadManifests` — `src/modules/object_storage/entities/large_payload_manifests.entity.ts`
- **Resumen:** 9 columnas · 2 índices · 0 FK salientes · 0 entrantes · 2 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/object_storage/entities/large_payload_manifests.entity.ts:12`)_ | coincide |
| 2 | `tenant_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `payload_type` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 4 | `source_entity_type` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `source_entity_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 6 | `object_manifest_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 7 | `content_hash` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 8 | `contains_phi` | `boolean` | Obligatoria | _sin dato_ | coincide |
| 9 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/object_storage/entities/large_payload_manifests.entity.ts:60`)_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_large_payload_source` | no | tenant_id, source_entity_type, source_entity_id, payload_type | 1 consulta(s) de repositorio filtran u ordenan por «tenant_id», la primera columna del índice _(CONSULTA)_ |
| `ix_large_payload_object` | no | object_manifest_id | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /object-storage/large-payloads | CREA | DIRECTA |
| POST /object-storage/large-payloads | LEE | DIRECTA |

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

### multipart_uploads

#### Vista general

Gestiona cargas fragmentadas de objetos grandes para completar transferencias de forma recuperable.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_60_object_storage.puml: multipart_uploads`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_60_object_storage.puml` · **DDL:** `SQL/60_object_storage/02_tables.sql`
- **Entidad del ORM:** `MultipartUploads` — `src/modules/object_storage/entities/multipart_uploads.entity.ts`
- **Resumen:** 10 columnas · 3 índices · 0 FK salientes · 0 entrantes · 7 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/object_storage/entities/multipart_uploads.entity.ts:12`)_ | coincide |
| 2 | `tenant_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `namespace_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 4 | `provider_upload_id` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `target_object_key` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `expected_size_bytes` | `bigint` | Obligatoria | _sin dato_ | coincide |
| 7 | `received_size_bytes` | `bigint` | Obligatoria | _sin dato_ | coincide |
| 8 | `status` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 9 | `expires_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 10 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/object_storage/entities/multipart_uploads.entity.ts:66`)_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_multipart_provider_upload` | no | namespace_id, provider_upload_id | 1 consulta(s) de repositorio filtran u ordenan por «namespace_id», la primera columna del índice _(CONSULTA)_ |
| `ix_multipart_expiry` | no | status, expires_at | _sin uso detectado estáticamente_ |
| `ix_multipart_tenant_created` | no | tenant_id, ("created_at" DESC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /internal/identity/evidence/lifecycle-scan | LEE | POR_SQL |
| POST /internal/identity/evidence/storage-purge-review | LEE | POR_SQL |
| POST /object-storage/namespaces/{code}/uploads/initiate | CREA | DIRECTA |
| POST /object-storage/namespaces/{code}/uploads/initiate | LEE | DIRECTA |
| POST /object-storage/uploads/{id}/complete | ACTUALIZA | POR_TIPO |
| POST /object-storage/uploads/{id}/complete | LEE | DIRECTA |
| POST /internal/governance/retention-executions/run | LEE | POR_SQL |

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

### object_checksums

#### Vista general

Conserva hashes de objetos para verificar integridad durante carga, copia y lectura.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_60_object_storage.puml: object_checksums`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_60_object_storage.puml` · **DDL:** `SQL/60_object_storage/02_tables.sql`
- **Entidad del ORM:** `ObjectChecksums` — `src/modules/object_storage/entities/object_checksums.entity.ts`
- **Resumen:** 7 columnas · 2 índices · 0 FK salientes · 0 entrantes · 6 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/object_storage/entities/object_checksums.entity.ts:12`)_ | coincide |
| 2 | `object_version_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `algorithm` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 4 | `checksum` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `source` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `verified_at` | `timestamptz` | Obligatoria | _sin dato_ | **NULABILIDAD_DIVERGE** — el modelo dice obligatoria y la entidad opcional |
| 7 | `verification_status` | `varchar` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_object_checksum_algorithm_source` | no | object_version_id, algorithm, source | 2 consulta(s) de repositorio filtran u ordenan por «object_version_id», la primera columna del índice _(CONSULTA)_ |
| `ix_object_checksum_status` | no | verification_status, ("verified_at" ASC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /object-storage/objects/{manifestId}/versions | CREA | DIRECTA |
| POST /object-storage/uploads/{id}/complete | CREA | DIRECTA |
| GET /object-storage/versions/{versionId}/content/{token} | LEE | DIRECTA |
| POST /object-storage/versions/{versionId}/integrity-checks | ACTUALIZA | POR_TIPO |
| POST /object-storage/versions/{versionId}/integrity-checks | LEE | DIRECTA |
| POST /object-storage/versions/{versionId}/signed-url | LEE | DIRECTA |

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

### object_deletion_markers

#### Vista general

Marca objetos eliminados de manera lógica para propagar borrados y conservar trazabilidad de la operación.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_60_object_storage.puml: object_deletion_markers`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_60_object_storage.puml` · **DDL:** `SQL/60_object_storage/02_tables.sql`
- **Entidad del ORM:** `ObjectDeletionMarkers` — `src/modules/object_storage/entities/object_deletion_markers.entity.ts`
- **Resumen:** 7 columnas · 2 índices · 0 FK salientes · 0 entrantes · 2 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/object_storage/entities/object_deletion_markers.entity.ts:12`)_ | coincide |
| 2 | `object_manifest_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `requested_by_job_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 4 | `provider_delete_marker` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `requested_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 6 | `effective_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 7 | `verification_status` | `varchar` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_object_delete_manifest` | no | object_manifest_id, ("requested_at" DESC) | _sin uso detectado estáticamente_ |
| `ix_object_delete_verification` | no | verification_status, ("requested_at" ASC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /object-storage/objects/{manifestId}/request-deletion | CREA | DIRECTA |
| POST /object-storage/objects/{manifestId}/request-deletion | LEE | DIRECTA |

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

### object_encryption_envelopes

#### Vista general

Registra metadata de claves y envolturas de cifrado usadas para proteger objetos almacenados.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_60_object_storage.puml: object_encryption_envelopes`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_60_object_storage.puml` · **DDL:** `SQL/60_object_storage/02_tables.sql`
- **Entidad del ORM:** `ObjectEncryptionEnvelopes` — `src/modules/object_storage/entities/object_encryption_envelopes.entity.ts`
- **Resumen:** 8 columnas · 2 índices · 0 FK salientes · 0 entrantes · 3 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/object_storage/entities/object_encryption_envelopes.entity.ts:12`)_ | coincide |
| 2 | `object_version_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `algorithm` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 4 | `key_management_provider` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `encrypted_data_key` | `bytea` | Obligatoria | _sin dato_ | coincide |
| 6 | `key_version` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 7 | `encryption_context_hash` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 8 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/object_storage/entities/object_encryption_envelopes.entity.ts:54`)_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_object_encryption_version` | no | object_version_id | 1 consulta(s) de repositorio filtran u ordenan por «object_version_id», la primera columna del índice _(CONSULTA)_ |
| `ix_object_encryption_key_version` | no | key_management_provider, key_version | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /object-storage/objects/{manifestId}/versions | CREA | DIRECTA |
| POST /object-storage/uploads/{id}/complete | CREA | DIRECTA |
| POST /object-storage/versions/{versionId}/signed-url | LEE | DIRECTA |

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

### object_integrity_checks

#### Vista general

Registra verificaciones de integridad de objetos para detectar alteraciones o daños en contenido almacenado.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_60_object_storage.puml: object_integrity_checks`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_60_object_storage.puml` · **DDL:** `SQL/60_object_storage/02_tables.sql`
- **Entidad del ORM:** `ObjectIntegrityChecks` — `src/modules/object_storage/entities/object_integrity_checks.entity.ts`
- **Resumen:** 8 columnas · 2 índices · 0 FK salientes · 0 entrantes · 1 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/object_storage/entities/object_integrity_checks.entity.ts:12`)_ | coincide |
| 2 | `object_version_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `check_type` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 4 | `expected_hash` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `actual_hash` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `status` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 7 | `checked_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 8 | `repair_job_id` | `uuid` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_object_integrity_version_time` | no | object_version_id, ("checked_at" DESC) | _sin uso detectado estáticamente_ |
| `ix_object_integrity_status` | no | status, ("checked_at" ASC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /object-storage/versions/{versionId}/integrity-checks | CREA | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | sí (declarado) | `src/modules/object_storage/README.md:79` |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### object_legal_holds

#### Vista general

Mantiene retenciones legales sobre objetos para impedir su eliminación mientras exista una obligación vigente.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_60_object_storage.puml: object_legal_holds`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_60_object_storage.puml` · **DDL:** `SQL/60_object_storage/02_tables.sql`
- **Entidad del ORM:** `ObjectLegalHolds` — `src/modules/object_storage/entities/object_legal_holds.entity.ts`
- **Resumen:** 7 columnas · 2 índices · 0 FK salientes · 0 entrantes · 9 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/object_storage/entities/object_legal_holds.entity.ts:12`)_ | coincide |
| 2 | `object_version_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `legal_case_reference` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 4 | `hold_state` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `placed_by_user_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 6 | `placed_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 7 | `released_at` | `timestamptz` | Obligatoria | _sin dato_ | **NULABILIDAD_DIVERGE** — el modelo dice obligatoria y la entidad opcional |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_object_hold_active` | no | object_version_id, hold_state | 2 consulta(s) de repositorio filtran u ordenan por «object_version_id», la primera columna del índice _(CONSULTA)_ |
| `ix_object_hold_case` | no | legal_case_reference, hold_state | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /internal/identity/evidence/lifecycle-scan | LEE | POR_SQL |
| POST /internal/identity/evidence/storage-purge-review | LEE | POR_SQL |
| POST /object-storage/archive-jobs/build | LEE | DIRECTA |
| POST /object-storage/objects/{manifestId}/request-deletion | LEE | DIRECTA |
| POST /object-storage/versions/{versionId}/legal-holds | CREA | DIRECTA |
| POST /object-storage/versions/{versionId}/legal-holds | LEE | DIRECTA |
| DELETE /object-storage/versions/{versionId}/legal-holds/{holdId} | ACTUALIZA | POR_TIPO |
| DELETE /object-storage/versions/{versionId}/legal-holds/{holdId} | LEE | DIRECTA |
| POST /internal/governance/retention-executions/run | LEE | POR_SQL |

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

### object_locations

#### Vista general

Registra ubicaciones físicas o remotas donde se guarda cada objeto binario.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_60_object_storage.puml: object_locations`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_60_object_storage.puml` · **DDL:** `SQL/60_object_storage/02_tables.sql`
- **Entidad del ORM:** `ObjectLocations` — `src/modules/object_storage/entities/object_locations.entity.ts`
- **Resumen:** 8 columnas · 2 índices · 0 FK salientes · 0 entrantes · 10 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/object_storage/entities/object_locations.entity.ts:12`)_ | coincide |
| 2 | `object_version_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `namespace_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 4 | `placement_role` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `provider_uri` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `storage_class` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 7 | `replication_state` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 8 | `verified_at` | `timestamptz` | Obligatoria | _sin dato_ | **NULABILIDAD_DIVERGE** — el modelo dice obligatoria y la entidad opcional |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_object_location_role` | no | object_version_id, namespace_id, placement_role | 2 consulta(s) de repositorio filtran u ordenan por «object_version_id», la primera columna del índice _(CONSULTA)_ |
| `ix_object_location_replication` | no | namespace_id, replication_state, ("verified_at" ASC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /internal/identity/evidence/lifecycle-scan | LEE | POR_SQL |
| POST /internal/identity/evidence/storage-purge-review | LEE | POR_SQL |
| POST /object-storage/archive-jobs/build | CREA | DIRECTA |
| POST /object-storage/objects/{manifestId}/versions | CREA | DIRECTA |
| POST /object-storage/uploads/{id}/complete | CREA | DIRECTA |
| GET /object-storage/versions/{versionId}/content/{token} | LEE | DIRECTA |
| POST /object-storage/versions/{versionId}/integrity-checks | ACTUALIZA | POR_TIPO |
| POST /object-storage/versions/{versionId}/integrity-checks | LEE | DIRECTA |
| POST /object-storage/versions/{versionId}/signed-url | LEE | DIRECTA |
| POST /internal/governance/retention-executions/run | LEE | POR_SQL |

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

### object_manifests

#### Vista general

Cataloga metadata de objetos binarios —incluidos medios médicos y documentos— mientras el contenido reside en object storage o PACS.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_60_object_storage.puml: object_manifests; BIZ note`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_60_object_storage.puml` · **DDL:** `SQL/60_object_storage/02_tables.sql`
- **Entidad del ORM:** `ObjectManifests` — `src/modules/object_storage/entities/object_manifests.entity.ts`
- **Resumen:** 11 columnas · 3 índices · 0 FK salientes · 0 entrantes · 23 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/object_storage/entities/object_manifests.entity.ts:12`)_ | coincide |
| 2 | `tenant_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `namespace_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 4 | `logical_object_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 5 | `object_type` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `patient_profile_id` | `uuid` | Obligatoria | _sin dato_ | **NULABILIDAD_DIVERGE** — el modelo dice obligatoria y la entidad opcional |
| 7 | `current_version_id` | `uuid` | Obligatoria | _sin dato_ | **NULABILIDAD_DIVERGE** — el modelo dice obligatoria y la entidad opcional |
| 8 | `lifecycle_state` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 9 | `retention_policy_code` | `varchar` | Obligatoria | _sin dato_ | **NULABILIDAD_DIVERGE** — el modelo dice obligatoria y la entidad opcional |
| 10 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/object_storage/entities/object_manifests.entity.ts:70`)_ | coincide |
| 11 | `updated_at` | `timestamptz` | Obligatoria | Fecha y hora de la última actualización. _(JSDOC_ESTANDAR, `src/modules/object_storage/entities/object_manifests.entity.ts:76`)_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_object_manifest_logical` | no | tenant_id, logical_object_id | _sin uso detectado estáticamente_ |
| `ix_object_manifest_patient` | no | tenant_id, patient_profile_id, ("updated_at" DESC) donde WHERE patient_profile_id IS NOT NULL | Índice parcial: sólo indexa las filas donde WHERE patient_profile_id IS NOT NULL _(ESTRUCTURAL)_ |
| `ix_object_manifest_state` | no | tenant_id, lifecycle_state, ("updated_at" DESC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| GET /dicomweb/studies/{studyUid}/series/{seriesUid}/instances/{sopUid} | LEE | DIRECTA |
| POST /object-storage/archive-jobs/build | ACTUALIZA | POR_TIPO |
| POST /object-storage/archive-jobs/build | LEE | DIRECTA |
| POST /object-storage/dicom/studies/catalog | LEE | DIRECTA |
| POST /object-storage/large-payloads | ACTUALIZA | POR_TIPO |
| POST /object-storage/large-payloads | LEE | DIRECTA |
| POST /object-storage/objects/{manifestId}/request-deletion | ACTUALIZA | POR_TIPO |
| POST /object-storage/objects/{manifestId}/request-deletion | LEE | DIRECTA |
| POST /object-storage/objects/{manifestId}/versions | ACTUALIZA | POR_TIPO |
| POST /object-storage/objects/{manifestId}/versions | LEE | DIRECTA |
| POST /object-storage/uploads/{id}/complete | ACTUALIZA | POR_TIPO |
| POST /object-storage/uploads/{id}/complete | CREA | DIRECTA |
| POST /object-storage/uploads/{id}/complete | LEE | DIRECTA |
| GET /object-storage/versions/{versionId}/content/{token} | LEE | DIRECTA |
| POST /object-storage/versions/{versionId}/integrity-checks | ACTUALIZA | POR_TIPO |
| POST /object-storage/versions/{versionId}/integrity-checks | LEE | DIRECTA |
| POST /object-storage/versions/{versionId}/legal-holds | ACTUALIZA | POR_TIPO |
| POST /object-storage/versions/{versionId}/legal-holds | LEE | DIRECTA |
| DELETE /object-storage/versions/{versionId}/legal-holds/{holdId} | ACTUALIZA | POR_TIPO |
| DELETE /object-storage/versions/{versionId}/legal-holds/{holdId} | LEE | DIRECTA |
| POST /object-storage/versions/{versionId}/retention-lock | ACTUALIZA | POR_TIPO |
| POST /object-storage/versions/{versionId}/retention-lock | LEE | DIRECTA |
| POST /object-storage/versions/{versionId}/signed-url | LEE | DIRECTA |

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

### object_namespaces

#### Vista general

Define espacios de nombres aislados para organizar objetos binarios por tenant y propósito.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_60_object_storage.puml: object_namespaces; BIZ note`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_60_object_storage.puml` · **DDL:** `SQL/60_object_storage/02_tables.sql`
- **Entidad del ORM:** `ObjectNamespaces` — `src/modules/object_storage/entities/object_namespaces.entity.ts`
- **Resumen:** 10 columnas · 2 índices · 0 FK salientes · 0 entrantes · 5 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/object_storage/entities/object_namespaces.entity.ts:12`)_ | coincide |
| 2 | `code` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 3 | `backend_code` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 4 | `region_code` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `bucket_or_container` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `object_key_prefix` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 7 | `default_storage_class` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 8 | `versioning_enabled` | `boolean` | Obligatoria | _sin dato_ | coincide |
| 9 | `object_lock_enabled` | `boolean` | Obligatoria | _sin dato_ | coincide |
| 10 | `state` | `varchar` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_object_namespace_code` | no | code | 1 consulta(s) de repositorio filtran u ordenan por «code», la primera columna del índice _(CONSULTA)_ |
| `uq_object_namespace_location` | no | backend_code, region_code, bucket_or_container, object_key_prefix | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /object-storage/namespaces/{code}/uploads/initiate | LEE | DIRECTA |
| POST /object-storage/objects/{manifestId}/versions | LEE | DIRECTA |
| POST /object-storage/uploads/{id}/complete | LEE | DIRECTA |
| GET /object-storage/versions/{versionId}/content/{token} | LEE | DIRECTA |
| POST /object-storage/versions/{versionId}/retention-lock | LEE | DIRECTA |

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

### object_retention_locks

#### Vista general

Aplica bloqueos de retención a objetos que deben preservarse durante un período definido.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_60_object_storage.puml: object_retention_locks`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_60_object_storage.puml` · **DDL:** `SQL/60_object_storage/02_tables.sql`
- **Entidad del ORM:** `ObjectRetentionLocks` — `src/modules/object_storage/entities/object_retention_locks.entity.ts`
- **Resumen:** 7 columnas · 2 índices · 0 FK salientes · 0 entrantes · 7 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/object_storage/entities/object_retention_locks.entity.ts:12`)_ | coincide |
| 2 | `object_version_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `lock_mode` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 4 | `retain_until` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 5 | `policy_code` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `applied_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 7 | `released_at` | `timestamptz` | Obligatoria | _sin dato_ | **NULABILIDAD_DIVERGE** — el modelo dice obligatoria y la entidad opcional |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_object_retention_active` | no | object_version_id donde WHERE released_at IS NULL | Índice parcial: sólo indexa las filas donde WHERE released_at IS NULL _(ESTRUCTURAL)_; 2 consulta(s) de repositorio filtran u ordenan por «object_version_id», la primera columna del índice _(CONSULTA)_ |
| `ix_object_retention_until` | no | retain_until | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /internal/identity/evidence/lifecycle-scan | LEE | POR_SQL |
| POST /internal/identity/evidence/storage-purge-review | LEE | POR_SQL |
| POST /object-storage/objects/{manifestId}/request-deletion | LEE | DIRECTA |
| DELETE /object-storage/versions/{versionId}/legal-holds/{holdId} | LEE | DIRECTA |
| POST /object-storage/versions/{versionId}/retention-lock | CREA | DIRECTA |
| POST /object-storage/versions/{versionId}/retention-lock | LEE | DIRECTA |
| POST /internal/governance/retention-executions/run | LEE | POR_SQL |

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

### object_versions

#### Vista general

Preserva versiones de objetos para mantener referencias a documentos y medios inmutables o versionados.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_60_object_storage.puml: object_versions`
- **Dominio:** Datos y NoSQL · **Diagrama:** `Mantra Core Health Context/modules/diagram_60_object_storage.puml` · **DDL:** `SQL/60_object_storage/02_tables.sql`
- **Entidad del ORM:** `ObjectVersions` — `src/modules/object_storage/entities/object_versions.entity.ts`
- **Resumen:** 12 columnas · 4 índices · 0 FK salientes · 0 entrantes · 15 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/object_storage/entities/object_versions.entity.ts:12`)_ | coincide |
| 2 | `object_manifest_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 3 | `version_number` | `integer` | Obligatoria | _sin dato_ | coincide |
| 4 | `provider_version_id` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `object_key` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 6 | `mime_type` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 7 | `size_bytes` | `bigint` | Obligatoria | _sin dato_ | coincide |
| 8 | `sha256` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 9 | `etag` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 10 | `compression` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 11 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/object_storage/entities/object_versions.entity.ts:72`)_ | coincide |
| 12 | `supersedes_version_id` | `uuid` | Obligatoria | _sin dato_ | coincide |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_object_version_number` | no | object_manifest_id, version_number | 2 consulta(s) de repositorio filtran u ordenan por «object_manifest_id», la primera columna del índice _(CONSULTA)_ |
| `uq_object_version_provider` | no | object_manifest_id, provider_version_id | 2 consulta(s) de repositorio filtran u ordenan por «object_manifest_id», la primera columna del índice _(CONSULTA)_ |
| `uq_object_version_sha` | no | object_manifest_id, sha256 | 2 consulta(s) de repositorio filtran u ordenan por «object_manifest_id», la primera columna del índice _(CONSULTA)_ |
| `ix_object_version_created` | no | object_manifest_id, ("created_at" DESC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /internal/identity/evidence/lifecycle-scan | LEE | POR_SQL |
| POST /internal/identity/evidence/storage-purge-review | LEE | POR_SQL |
| POST /object-storage/archive-jobs/build | LEE | DIRECTA |
| POST /object-storage/objects/{manifestId}/request-deletion | LEE | DIRECTA |
| POST /object-storage/objects/{manifestId}/versions | CREA | DIRECTA |
| POST /object-storage/objects/{manifestId}/versions | LEE | DIRECTA |
| POST /object-storage/uploads/{id}/complete | CREA | DIRECTA |
| POST /object-storage/uploads/{id}/complete | LEE | DIRECTA |
| GET /object-storage/versions/{versionId}/content/{token} | LEE | DIRECTA |
| POST /object-storage/versions/{versionId}/integrity-checks | LEE | DIRECTA |
| POST /object-storage/versions/{versionId}/legal-holds | LEE | DIRECTA |
| DELETE /object-storage/versions/{versionId}/legal-holds/{holdId} | LEE | DIRECTA |
| POST /object-storage/versions/{versionId}/retention-lock | LEE | DIRECTA |
| POST /object-storage/versions/{versionId}/signed-url | LEE | DIRECTA |
| POST /internal/governance/retention-executions/run | LEE | POR_SQL |

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

