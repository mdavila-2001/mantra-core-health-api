<!-- AUTOGENERADO por tools/inventario/catalogo.mjs. No editar manualmente. -->

# Deriva entre el modelo, el ORM y la base

Tres vistas del mismo esquema: el **DDL canónico del modelo** (fuente de verdad), las **entidades del ORM** y la **base desplegada**. Una diferencia no dice cuál tiene razón: dice que hay que mirarla (regla 97.2).

| Concepto | Cantidad |
|---|---|
| Tablas en el DDL del modelo | 1370 |
| Entidades del ORM | 1405 |
| Tablas del DDL con entidad | 1370 |
| Tablas del DDL **sin** entidad | 0 |
| Entidades del ORM **sin** tabla en el DDL | 35 |
| Columnas del DDL ausentes en su entidad | 0 |
| Columnas con nulabilidad divergente | 8 |
| Columnas con tipo divergente | 0 |
| Columnas de la entidad que el DDL no tiene | 0 |

## Entidades del ORM sin tabla en el DDL

| Tabla que declara | Clase | Dónde la declara el modelo |
|---|---|---|
| `clinical.patient_reported_health_statements` | PatientReportedHealthStatements | **en ninguna fuente de DDL del modelo** |
| `organization_extensions.data_use_agreements` | DataUseAgreements | **en ninguna fuente de DDL del modelo** |
| `payments.cash_registers` | CashRegisters | **en ninguna fuente de DDL del modelo** |
| `pharmacy_inventory.purchase_quotations` | PurchaseQuotations | sólo en un parche: `SQL/patches/2026-09-08_v428_billing_quotations.sql` |
| `procedures_perioperative.instrument_sets` | InstrumentSets | **en ninguna fuente de DDL del modelo** |
| `procedures_perioperative.sterilization_loads` | SterilizationLoads | **en ninguna fuente de DDL del modelo** |
| `system_ops.accepted_risks` | AcceptedRisks | **en ninguna fuente de DDL del modelo** |
| `time_series.ads_delivery_event_series` | AdsDeliveryEventSeries | almacén no relacional: `NoSQL/58_time_series_timescaledb/time_series.timescaledb.sql` |
| `time_series.ai_runtime_metric_series` | AiRuntimeMetricSeries | almacén no relacional: `NoSQL/58_time_series_timescaledb/time_series.timescaledb.sql` |
| `time_series.application_tracking_series` | ApplicationTrackingSeries | almacén no relacional: `NoSQL/58_time_series_timescaledb/time_series.timescaledb.sql` |
| `time_series.audit_access_metric_series` | AuditAccessMetricSeries | almacén no relacional: `NoSQL/58_time_series_timescaledb/time_series.timescaledb.sql` |
| `time_series.device_raw_reading_series` | DeviceRawReadingSeries | almacén no relacional: `NoSQL/58_time_series_timescaledb/time_series.timescaledb.sql` |
| `time_series.ingestion_pipeline_metric_series` | IngestionPipelineMetricSeries | almacén no relacional: `NoSQL/58_time_series_timescaledb/time_series.timescaledb.sql` |
| `time_series.lab_analyzer_event_series` | LabAnalyzerEventSeries | almacén no relacional: `NoSQL/58_time_series_timescaledb/time_series.timescaledb.sql` |
| `time_series.location_ping_series` | LocationPingSeries | almacén no relacional: `NoSQL/58_time_series_timescaledb/time_series.timescaledb.sql` |
| `time_series.normalized_vital_series` | NormalizedVitalSeries | almacén no relacional: `NoSQL/58_time_series_timescaledb/time_series.timescaledb.sql` |
| `time_series.payment_gateway_metric_series` | PaymentGatewayMetricSeries | almacén no relacional: `NoSQL/58_time_series_timescaledb/time_series.timescaledb.sql` |
| `time_series.service_sli_series` | ServiceSliSeries | almacén no relacional: `NoSQL/58_time_series_timescaledb/time_series.timescaledb.sql` |
| `time_series.telemetry_event_series` | TelemetryEventSeries | almacén no relacional: `NoSQL/58_time_series_timescaledb/time_series.timescaledb.sql` |
| `authz.ui_visibility_elements` | UiVisibilityElements | sólo en un parche: `SQL/patches/2026-10-31_ui_visibility.sql` |
| `authz.ui_visibility_rules` | UiVisibilityRules | sólo en un parche: `SQL/patches/2026-10-31_ui_visibility.sql` |
| `vector_rag.embedding_jobs` | EmbeddingJobs | almacén no relacional: `NoSQL/59_vector_rag_pgvector/vector_rag.pgvector.sql` |
| `vector_rag.embedding_model_versions` | EmbeddingModelVersions | almacén no relacional: `NoSQL/59_vector_rag_pgvector/vector_rag.pgvector.sql` |
| `vector_rag.rag_access_policies` | RagAccessPolicies | almacén no relacional: `NoSQL/59_vector_rag_pgvector/vector_rag.pgvector.sql` |
| `vector_rag.retrieval_candidates` | RetrievalCandidates | almacén no relacional: `NoSQL/59_vector_rag_pgvector/vector_rag.pgvector.sql` |
| `vector_rag.retrieval_evidence` | RetrievalEvidence | almacén no relacional: `NoSQL/59_vector_rag_pgvector/vector_rag.pgvector.sql` |
| `vector_rag.retrieval_feedback_events` | RetrievalFeedbackEvents | almacén no relacional: `NoSQL/59_vector_rag_pgvector/vector_rag.pgvector.sql` |
| `vector_rag.retrieval_sessions` | RetrievalSessions | almacén no relacional: `NoSQL/59_vector_rag_pgvector/vector_rag.pgvector.sql` |
| `vector_rag.vector_chunks` | VectorChunks | almacén no relacional: `NoSQL/59_vector_rag_pgvector/vector_rag.pgvector.sql` |
| `vector_rag.vector_collections` | VectorCollections | almacén no relacional: `NoSQL/59_vector_rag_pgvector/vector_rag.pgvector.sql` |
| `vector_rag.vector_deletion_jobs` | VectorDeletionJobs | almacén no relacional: `NoSQL/59_vector_rag_pgvector/vector_rag.pgvector.sql` |
| `vector_rag.vector_documents` | VectorDocuments | almacén no relacional: `NoSQL/59_vector_rag_pgvector/vector_rag.pgvector.sql` |
| `vector_rag.vector_embeddings` | VectorEmbeddings | almacén no relacional: `NoSQL/59_vector_rag_pgvector/vector_rag.pgvector.sql` |
| `vector_rag.vector_reconciliation_runs` | VectorReconciliationRuns | almacén no relacional: `NoSQL/59_vector_rag_pgvector/vector_rag.pgvector.sql` |
| `vector_rag.vector_tenant_bindings` | VectorTenantBindings | almacén no relacional: `NoSQL/59_vector_rag_pgvector/vector_rag.pgvector.sql` |

## Tablas del DDL sin entidad en el ORM

_Ninguna._

## Columnas del DDL ausentes en la entidad

_Ninguna._

## Nulabilidad divergente

| Columna | Diferencia |
|---|---|
| object_storage.dicom_series_manifests.modality | el modelo dice obligatoria y la entidad opcional |
| pharmacy.pharmacy_integration_connections.connection_id | el modelo dice obligatoria y la entidad opcional |
| polyglot_storage.collection_definitions.routing_key_expression | el modelo dice obligatoria y la entidad opcional |
| polyglot_storage.collection_definitions.shard_key_expression | el modelo dice obligatoria y la entidad opcional |
| polyglot_storage.residency_policies.forbidden_country_codes | el modelo dice obligatoria y la entidad opcional |
| polyglot_storage.residency_policies.allowed_region_codes | el modelo dice obligatoria y la entidad opcional |
| polyglot_storage.residency_policies.cross_border_transfer_basis | el modelo dice obligatoria y la entidad opcional |
| polyglot_storage.storage_capabilities.verified_at | el modelo dice obligatoria y la entidad opcional |

## Base desplegada

Se construyó una base descartable con SQL/apply_all.sql + SQL/apply_deferred.sql del modelo (sin SQL/patches) (PostgreSQL 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)) y se comparó con el catálogo mediante `tools/inventario/deriva-bd.mjs`.

| Concepto | Cantidad |
|---|---|
| Tablas del catálogo / en la base | 1230 / 1230 |
| Tablas que coinciden por completo | 1230 |
| Tablas ausentes en la base | 0 |
| Columnas ausentes / de más | 0 / 0 |
| Nulabilidad divergente | 0 |
| Tipo divergente | 0 |
| Índices ausentes / de más | 0 / 0 |
| FK ausentes | 0 |

**Alcance:** la base se construyó con el DDL canónico, no es una base de producción: demuestra que el modelo y su DDL son coherentes entre sí, no que un despliegue real esté al día. Los parches de `SQL/patches` no se aplicaron.

## Schemas del DDL que el catálogo de la API no lista

El arranque de la API crea el esquema desde `src/orm/catalog/schemas.catalog.ts`: un schema que no figura ahí no se crea al arrancar contra una base vacía.

_Ninguno._

## Schemas del DDL sin dominio en el modelo

No figuran en la tabla de dominios de `semantic-data-analysis.md`; sus tablas quedan con dominio «sin dato».

`audio_assets` · `data_catalog` · `medical_groups` · `observability` · `pharma_lab` · `qa_execution` · `surveys`

