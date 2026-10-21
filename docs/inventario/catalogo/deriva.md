<!-- AUTOGENERADO por tools/inventario/catalogo.mjs. No editar manualmente. -->

# Deriva entre el modelo, el ORM y la base

Tres vistas del mismo esquema: el **DDL canónico del modelo** (fuente de verdad), las **entidades del ORM** y la **base desplegada**. Una diferencia no dice cuál tiene razón: dice que hay que mirarla (regla 97.2).

| Concepto | Cantidad |
|---|---|
| Tablas en el DDL del modelo | 1230 |
| Entidades del ORM | 1240 |
| Tablas del DDL con entidad | 1208 |
| Tablas del DDL **sin** entidad | 22 |
| Entidades del ORM **sin** tabla en el DDL | 32 |
| Columnas del DDL ausentes en su entidad | 42 |
| Columnas con nulabilidad divergente | 25 |
| Columnas con tipo divergente | 0 |
| Columnas de la entidad que el DDL no tiene | 0 |

## Entidades del ORM sin tabla en el DDL

| Tabla que declara | Clase | Dónde la declara el modelo |
|---|---|---|
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
| `billing.quotation_installments` | `Mantra Core Health Context/modules/diagram_17_billing.puml` |
| `billing.quotations` | `Mantra Core Health Context/modules/diagram_17_billing.puml` |
| `community.chat_auto_replies` | `Mantra Core Health Context/modules/diagram_19_community.puml` |
| `community.comment_media` | `Mantra Core Health Context/modules/diagram_19_community.puml` |
| `community.party_ratings` | `Mantra Core Health Context/modules/diagram_19_community.puml` |
| `data_catalog.catalog_annotation_revisions` | `Mantra Core Health Context/modules/diagram_67_data_catalog.puml` |
| `data_catalog.catalog_annotations` | `Mantra Core Health Context/modules/diagram_67_data_catalog.puml` |
| `data_catalog.catalog_change_events` | `Mantra Core Health Context/modules/diagram_67_data_catalog.puml` |
| `data_catalog.catalog_columns` | `Mantra Core Health Context/modules/diagram_67_data_catalog.puml` |
| `data_catalog.catalog_evidence_items` | `Mantra Core Health Context/modules/diagram_67_data_catalog.puml` |
| `data_catalog.catalog_objects` | `Mantra Core Health Context/modules/diagram_67_data_catalog.puml` |
| `data_catalog.catalog_review_decisions` | `Mantra Core Health Context/modules/diagram_67_data_catalog.puml` |
| `data_catalog.catalog_scan_runs` | `Mantra Core Health Context/modules/diagram_67_data_catalog.puml` |
| `insurance.insurance_campaign_partners` | `Mantra Core Health Context/modules/diagram_26_insurance.puml` |
| `insurance.insurance_campaigns` | `Mantra Core Health Context/modules/diagram_26_insurance.puml` |
| `medical_groups.group_members` | `Mantra Core Health Context/modules/diagram_66_medical_groups.puml` |
| `medical_groups.groups` | `Mantra Core Health Context/modules/diagram_66_medical_groups.puml` |
| `qa_execution.execution_plans` | `Mantra Core Health Context/modules/diagram_68_qa_execution.puml` |
| `qa_execution.execution_targets` | `Mantra Core Health Context/modules/diagram_68_qa_execution.puml` |
| `qa_execution.plan_approvals` | `Mantra Core Health Context/modules/diagram_68_qa_execution.puml` |
| `qa_execution.plan_events` | `Mantra Core Health Context/modules/diagram_68_qa_execution.puml` |
| `scheduling.practitioner_service_offerings` | `Mantra Core Health Context/modules/diagram_41_scheduling.puml` |

## Columnas del DDL ausentes en la entidad

| Columna | Tipo | En el modelo |
|---|---|---|
| accounting.assets.automated | boolean | obligatoria |
| accounting.liabilities.automated | boolean | obligatoria |
| authz.resource_scope_grants.reason_text | text | opcional |
| billing.service_catalog.description_text | text | opcional |
| billing.service_catalog.image_file_id | uuid | opcional |
| clinical.encounters.content_hash | varchar | opcional |
| clinical.encounters.sealed_at | timestamptz | opcional |
| clinical.service_requests.previous_diagnostic_report_id | uuid | opcional |
| clinical.service_requests.duplicate_override_reason | text | opcional |
| community.conversation_participants.last_auto_reply_at | timestamptz | opcional |
| community.conversation_participants.is_favorite | boolean | obligatoria |
| community.conversation_participants.is_pinned | boolean | obligatoria |
| community.conversation_participants.archived_at | timestamptz | opcional |
| community.conversations.pinned_message_id | uuid | opcional |
| insurance.claim_line_adjudications.policy_clause_reference | varchar | opcional |
| insurance.claim_line_adjudications.denial_rationale | text | opcional |
| insurance.insurance_carriers.whatsapp_number | varchar | opcional |
| insurance.insurance_carriers.call_center_phone | varchar | opcional |
| insurance.insurance_carriers.support_email | varchar | opcional |
| insurance.insurance_claim_lines.inventory_reservation_line_id | uuid | opcional |
| insurance.insurance_claims.inventory_reservation_id | uuid | opcional |
| insurance.insurance_claims.service_request_id | uuid | opcional |
| insurance.insurance_plans.monthly_premium_amount | numeric | opcional |
| insurance.prior_authorization_determinations.policy_clause_reference | varchar | opcional |
| insurance.prior_authorization_determinations.denial_rationale | text | opcional |
| insurance.prior_authorization_requests.inventory_reservation_id | uuid | opcional |
| pharmacy.pharmacy_products.catalog_product_concept_id | uuid | opcional |
| pharmacy.pharmacy_products.catalog_presentation_code | varchar | opcional |
| practice.practice_sites.bank_qr_file_id | uuid | opcional |
| practice.practitioner_role_assignments.contact_phone | varchar | opcional |
| profiles.health_practitioner_profiles.signature_file_id | uuid | opcional |
| profiles.health_practitioner_profiles.seal_file_id | uuid | opcional |
| profiles.jurisdiction_authorizations.file_id | uuid | opcional |
| profiles.professional_credentials.issuing_city_text | varchar | opcional |
| profiles.professional_credentials.issuing_country_text | varchar | opcional |
| profiles.professional_credentials.profession_concept_id | uuid | opcional |
| profiles.professional_credentials.title_text | varchar | opcional |
| scheduling.appointment_bookings.practitioner_service_offering_id | uuid | opcional |
| scheduling.appointment_bookings.service_snapshot | jsonb | opcional |
| scheduling.bookable_slots.practitioner_service_offering_id | uuid | opcional |
| scheduling.schedule_rules.booking_mode_concept_id | uuid | opcional |
| system_ops.restore_test_runs.objective_status | varchar | obligatoria |

## Nulabilidad divergente

| Columna | Diferencia |
|---|---|
| object_storage.archive_manifests.verified_at | el modelo dice obligatoria y la entidad opcional |
| object_storage.dicom_instance_manifests.sop_class_uid | el modelo dice obligatoria y la entidad opcional |
| object_storage.dicom_instance_manifests.instance_number | el modelo dice obligatoria y la entidad opcional |
| object_storage.dicom_instance_manifests.transfer_syntax_uid | el modelo dice obligatoria y la entidad opcional |
| object_storage.dicom_instance_manifests.frame_count | el modelo dice obligatoria y la entidad opcional |
| object_storage.dicom_instance_manifests.metadata_json | el modelo dice obligatoria y la entidad opcional |
| object_storage.dicom_series_manifests.modality | el modelo dice obligatoria y la entidad opcional |
| object_storage.dicom_series_manifests.body_part_examined | el modelo dice obligatoria y la entidad opcional |
| object_storage.dicom_series_manifests.thumbnail_object_manifest_id | el modelo dice obligatoria y la entidad opcional |
| object_storage.dicom_study_manifests.study_date | el modelo dice obligatoria y la entidad opcional |
| object_storage.dicom_study_manifests.modality_codes | el modelo dice obligatoria y la entidad opcional |
| object_storage.object_checksums.verified_at | el modelo dice obligatoria y la entidad opcional |
| object_storage.object_legal_holds.released_at | el modelo dice obligatoria y la entidad opcional |
| object_storage.object_locations.verified_at | el modelo dice obligatoria y la entidad opcional |
| object_storage.object_manifests.patient_profile_id | el modelo dice obligatoria y la entidad opcional |
| object_storage.object_manifests.current_version_id | el modelo dice obligatoria y la entidad opcional |
| object_storage.object_manifests.retention_policy_code | el modelo dice obligatoria y la entidad opcional |
| object_storage.object_retention_locks.released_at | el modelo dice obligatoria y la entidad opcional |
| polyglot_storage.collection_definitions.routing_key_expression | el modelo dice obligatoria y la entidad opcional |
| polyglot_storage.collection_definitions.shard_key_expression | el modelo dice obligatoria y la entidad opcional |
| polyglot_storage.residency_policies.forbidden_country_codes | el modelo dice obligatoria y la entidad opcional |
| polyglot_storage.residency_policies.allowed_region_codes | el modelo dice obligatoria y la entidad opcional |
| polyglot_storage.residency_policies.cross_border_transfer_basis | el modelo dice obligatoria y la entidad opcional |
| polyglot_storage.storage_capabilities.verified_at | el modelo dice obligatoria y la entidad opcional |
| profiles.practitioner_affiliations.role_title | el modelo dice opcional y la entidad obligatoria |

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

## Schemas del DDL que el catálogo de la API no declara

`audio_assets` · `data_catalog` · `medical_groups` · `pharma_lab` · `qa_execution` · `surveys`

