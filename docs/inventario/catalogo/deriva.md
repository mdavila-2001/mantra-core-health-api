<!-- AUTOGENERADO por tools/inventario/catalogo.mjs. No editar manualmente. -->

# Deriva entre el modelo, el ORM y la base

Tres vistas del mismo esquema: el **DDL canónico del modelo** (fuente de verdad), las **entidades del ORM** y la **base desplegada**. Una diferencia no dice cuál tiene razón: dice que hay que mirarla (regla 97.2).

| Concepto | Cantidad |
|---|---|
| Tablas en el DDL del modelo | 1274 |
| Entidades del ORM | 1294 |
| Tablas del DDL con entidad | 1261 |
| Tablas del DDL **sin** entidad | 13 |
| Entidades del ORM **sin** tabla en el DDL | 33 |
| Columnas del DDL ausentes en su entidad | 45 |
| Columnas con nulabilidad divergente | 9 |
| Columnas con tipo divergente | 2 |
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

| Tabla | Diagrama |
|---|---|
| `audit.insurance_products_history` | `Mantra Core Health Context/modules/diagram_10_audit.puml` |
| `audit.procedure_cases_history` | `Mantra Core Health Context/modules/diagram_10_audit.puml` |
| `clinical_ext.cds_rule_versions` | `Mantra Core Health Context/modules/diagram_18_clinical_ext.puml` |
| `crm.crm_case_owner_history` | `Mantra Core Health Context/modules/diagram_49_crm.puml` |
| `delegated_access.shared_access_link_uses` | `Mantra Core Health Context/modules/diagram_29_delegated_access.puml` |
| `delegated_access.shared_access_links` | `Mantra Core Health Context/modules/diagram_29_delegated_access.puml` |
| `diagnostic_units.unit_medical_visitors` | `Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml` |
| `diagnostic_units.unit_visit_ratings` | `Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml` |
| `diagnostic_units.unit_visit_records` | `Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml` |
| `diagnostic_units.unit_visit_request_events` | `Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml` |
| `diagnostic_units.unit_visit_requests` | `Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml` |
| `insurance.insurance_terms_conditions` | `Mantra Core Health Context/modules/diagram_26_insurance.puml` |
| `surveys.survey_invitation_reminders` | `Mantra Core Health Context/modules/diagram_65_surveys.puml` |

## Columnas del DDL ausentes en la entidad

| Columna | Tipo | En el modelo |
|---|---|---|
| ads.campaigns.version_number | integer | opcional |
| ads.custom_audiences.version_number | integer | opcional |
| ads.saved_audiences.version_number | integer | opcional |
| audit.audit_log.session_id | uuid | opcional |
| audit.audit_log.correlation_id | uuid | opcional |
| audit.audit_log.actor_role_snapshot | varchar | opcional |
| authz.resource_scope_grants.reason_text | text | opcional |
| community.service_reviews.verified_crm_case_id | uuid | opcional |
| crm.crm_cases.insurance_claim_id | uuid | opcional |
| directory.branch_memberships.workday_concept_id | uuid | opcional |
| directory.branch_memberships.responsible_user_id | uuid | opcional |
| directory.tenant_memberships.workday_concept_id | uuid | opcional |
| directory.tenant_memberships.responsible_user_id | uuid | opcional |
| identity_assurance.identity_verification_cases.tenant_id | uuid | opcional |
| insurance.broker_carrier_agreements.representation_mode_concept_id | uuid | opcional |
| insurance.broker_carrier_agreements.relationship_type_concept_id | uuid | opcional |
| insurance.broker_carrier_agreements.branch_id | uuid | opcional |
| insurance.broker_carrier_agreements.commercial_area | varchar | opcional |
| insurance.broker_carrier_agreements.supervisor_user_id | uuid | opcional |
| insurance.broker_carrier_agreements.assigned_zone | varchar | opcional |
| insurance.insurance_products.version_number | integer | opcional |
| insurance.insurance_products.effective_from | date | opcional |
| insurance.insurance_products.effective_to | date | opcional |
| insurance.insurance_products.min_age_years | integer | opcional |
| insurance.insurance_products.max_age_years | integer | opcional |
| insurance.insurance_products.eligibility_requirements | jsonb | opcional |
| marketing.segments.version_number | integer | opcional |
| practice.care_spaces.prep_minutes | integer | opcional |
| practice.care_spaces.cleanup_minutes | integer | opcional |
| practice.clinical_units.responsible_user_id | uuid | opcional |
| procedures_perioperative.procedure_case_team_members.accepted_version_number | integer | opcional |
| procedures_perioperative.procedure_cases.prep_minutes | integer | opcional |
| procedures_perioperative.procedure_cases.cleanup_minutes | integer | opcional |
| procedures_perioperative.procedure_cases.version_number | integer | opcional |
| scheduling.appointment_bookings.pre_visit_instructions_snapshot | text | opcional |
| scheduling.appointment_payment_states.invoice_id | uuid | opcional |
| scheduling.booking_policies.no_show_fee_percentage | numeric | opcional |
| scheduling.booking_policies.no_show_retains_deposit | boolean | opcional |
| scheduling.practitioner_service_offerings.pre_visit_instructions | text | opcional |
| surveys.survey_invitations.extension_survey_version_id | uuid | opcional |
| surveys.survey_invitations.subject_type_concept_id | uuid | opcional |
| surveys.survey_invitations.subject_id | uuid | opcional |
| surveys.survey_templates.owner_type_concept_id | uuid | opcional |
| surveys.survey_templates.owner_id | uuid | opcional |
| surveys.survey_versions.max_reminders | integer | opcional |

## Nulabilidad divergente

| Columna | Diferencia |
|---|---|
| object_storage.dicom_series_manifests.modality | el modelo dice obligatoria y la entidad opcional |
| polyglot_storage.collection_definitions.routing_key_expression | el modelo dice obligatoria y la entidad opcional |
| polyglot_storage.collection_definitions.shard_key_expression | el modelo dice obligatoria y la entidad opcional |
| polyglot_storage.residency_policies.forbidden_country_codes | el modelo dice obligatoria y la entidad opcional |
| polyglot_storage.residency_policies.allowed_region_codes | el modelo dice obligatoria y la entidad opcional |
| polyglot_storage.residency_policies.cross_border_transfer_basis | el modelo dice obligatoria y la entidad opcional |
| polyglot_storage.storage_capabilities.verified_at | el modelo dice obligatoria y la entidad opcional |
| surveys.survey_invitations.appointment_booking_id | el modelo dice opcional y la entidad obligatoria |
| surveys.survey_templates.owner_practitioner_id | el modelo dice opcional y la entidad obligatoria |

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

`audio_assets` · `data_catalog` · `medical_groups` · `pharma_lab` · `qa_execution` · `surveys`

