<!-- AUTOGENERADO por tools/inventario/catalogo.mjs. No editar manualmente. -->

# Deriva entre el modelo, el ORM y la base

Tres vistas del mismo esquema: el **DDL canónico del modelo** (fuente de verdad), las **entidades del ORM** y la **base desplegada**. Una diferencia no dice cuál tiene razón: dice que hay que mirarla (regla 97.2).

| Concepto | Cantidad |
|---|---|
| Tablas en el DDL del modelo | 1313 |
| Entidades del ORM | 1353 |
| Tablas del DDL con entidad | 1277 |
| Tablas del DDL **sin** entidad | 36 |
| Entidades del ORM **sin** tabla en el DDL | 76 |
| Columnas del DDL ausentes en su entidad | 66 |
| Columnas con nulabilidad divergente | 7 |
| Columnas con tipo divergente | 0 |
| Columnas de la entidad que el DDL no tiene | 56 |

## Entidades del ORM sin tabla en el DDL

| Tabla que declara | Clase | Dónde la declara el modelo |
|---|---|---|
| `audit.care_space_blocks_history` | CareSpaceBlocksHistory | **en ninguna fuente de DDL del modelo** |
| `audit.care_space_category_periods_history` | CareSpaceCategoryPeriodsHistory | **en ninguna fuente de DDL del modelo** |
| `audit.charge_captures_history` | ChargeCapturesHistory | **en ninguna fuente de DDL del modelo** |
| `audit.cleaning_orders_history` | CleaningOrdersHistory | **en ninguna fuente de DDL del modelo** |
| `audit.encounter_locations_history` | EncounterLocationsHistory | **en ninguna fuente de DDL del modelo** |
| `audit.operating_room_block_series_history` | OperatingRoomBlockSeriesHistory | **en ninguna fuente de DDL del modelo** |
| `audit.operating_room_blocks_history` | OperatingRoomBlocksHistory | **en ninguna fuente de DDL del modelo** |
| `audit.placement_incidents_history` | PlacementIncidentsHistory | **en ninguna fuente de DDL del modelo** |
| `audit.space_tariffs_history` | SpaceTariffsHistory | **en ninguna fuente de DDL del modelo** |
| `billing.charge_captures` | ChargeCaptures | **en ninguna fuente de DDL del modelo** |
| `billing.space_tariffs` | SpaceTariffs | **en ninguna fuente de DDL del modelo** |
| `clinical.inpatient_census_adjustments` | InpatientCensusAdjustments | **en ninguna fuente de DDL del modelo** |
| `clinical.inpatient_census_days` | InpatientCensusDays | **en ninguna fuente de DDL del modelo** |
| `clinical.inpatient_census_entries` | InpatientCensusEntries | **en ninguna fuente de DDL del modelo** |
| `clinical.patient_reported_health_statements` | PatientReportedHealthStatements | **en ninguna fuente de DDL del modelo** |
| `clinical.placement_incidents` | PlacementIncidents | **en ninguna fuente de DDL del modelo** |
| `clinical.service_request_components` | ServiceRequestComponents | **en ninguna fuente de DDL del modelo** |
| `directory.tenant_medical_facilities` | TenantMedicalFacilities | **en ninguna fuente de DDL del modelo** |
| `directory.tenant_medical_facility_sites` | TenantMedicalFacilitySites | **en ninguna fuente de DDL del modelo** |
| `observability.alert_evaluations` | AlertEvaluations | sólo en un parche: `SQL/patches/2026-10-31_v4280_observabilidad_sistema.sql` |
| `observability.alert_rules` | AlertRules | sólo en un parche: `SQL/patches/2026-10-31_v4280_observabilidad_sistema.sql` |
| `observability.dependency_probe_runs` | DependencyProbeRuns | sólo en un parche: `SQL/patches/2026-10-31_v4280_observabilidad_sistema.sql` |
| `observability.error_events` | ErrorEvents | sólo en un parche: `SQL/patches/2026-10-31_v4280_observabilidad_sistema.sql` |
| `observability.error_groups` | ErrorGroups | sólo en un parche: `SQL/patches/2026-10-31_v4280_observabilidad_sistema.sql` |
| `observability.http_request_minute_series` | HttpRequestMinuteSeries | sólo en un parche: `SQL/patches/2026-10-31_v4280_observabilidad_sistema.sql` |
| `observability.instances` | Instances | sólo en un parche: `SQL/patches/2026-10-31_v4280_observabilidad_sistema.sql` |
| `observability.rollup_watermarks` | RollupWatermarks | sólo en un parche: `SQL/patches/2026-10-31_v4280_observabilidad_sistema.sql` |
| `observability.slow_request_samples` | SlowRequestSamples | sólo en un parche: `SQL/patches/2026-10-31_v4280_observabilidad_sistema.sql` |
| `observability.sql_statement_minute_series` | SqlStatementMinuteSeries | sólo en un parche: `SQL/patches/2026-10-31_v4280_observabilidad_sistema.sql` |
| `observability.sql_statements` | SqlStatements | sólo en un parche: `SQL/patches/2026-10-31_v4280_observabilidad_sistema.sql` |
| `observability.worker_tick_minute_series` | WorkerTickMinuteSeries | sólo en un parche: `SQL/patches/2026-10-31_v4280_observabilidad_sistema.sql` |
| `organization_extensions.data_use_agreements` | DataUseAgreements | **en ninguna fuente de DDL del modelo** |
| `payments.cash_registers` | CashRegisters | **en ninguna fuente de DDL del modelo** |
| `pharmacy_inventory.purchase_quotations` | PurchaseQuotations | sólo en un parche: `SQL/patches/2026-09-08_v428_billing_quotations.sql` |
| `practice.care_space_blocks` | CareSpaceBlocks | **en ninguna fuente de DDL del modelo** |
| `practice.care_space_category_periods` | CareSpaceCategoryPeriods | **en ninguna fuente de DDL del modelo** |
| `practice.care_space_status_events` | CareSpaceStatusEvents | **en ninguna fuente de DDL del modelo** |
| `practice.cleaning_orders` | CleaningOrders | **en ninguna fuente de DDL del modelo** |
| `procedures_perioperative.instrument_sets` | InstrumentSets | **en ninguna fuente de DDL del modelo** |
| `procedures_perioperative.operating_room_block_series` | OperatingRoomBlockSeries | **en ninguna fuente de DDL del modelo** |
| `procedures_perioperative.operating_room_blocks` | OperatingRoomBlocks | **en ninguna fuente de DDL del modelo** |
| `procedures_perioperative.sterilization_loads` | SterilizationLoads | **en ninguna fuente de DDL del modelo** |
| `profiles.admission_requirements` | AdmissionRequirements | **en ninguna fuente de DDL del modelo** |
| `profiles.practitioner_admission_events` | PractitionerAdmissionEvents | **en ninguna fuente de DDL del modelo** |
| `profiles.practitioner_admission_reviews` | PractitionerAdmissionReviews | **en ninguna fuente de DDL del modelo** |
| `profiles.practitioner_admissions` | PractitionerAdmissions | **en ninguna fuente de DDL del modelo** |
| `system_ops.accepted_risks` | AcceptedRisks | **en ninguna fuente de DDL del modelo** |
| `telemetry.client_error_events` | ClientErrorEvents | sólo en un parche: `SQL/patches/2026-10-31_v4280_observabilidad_sistema.sql` |
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

| Tabla | Diagrama |
|---|---|
| `audit.insurance_products_history` | `Mantra Core Health Context/modules/diagram_10_audit.puml` |
| `audit.procedure_cases_history` | `Mantra Core Health Context/modules/diagram_10_audit.puml` |
| `clinical_ext.cds_rule_versions` | `Mantra Core Health Context/modules/diagram_18_clinical_ext.puml` |
| `community.conversation_assignments` | `Mantra Core Health Context/modules/diagram_19_community.puml` |
| `community.conversation_internal_notes` | `Mantra Core Health Context/modules/diagram_19_community.puml` |
| `community.reply_templates` | `Mantra Core Health Context/modules/diagram_19_community.puml` |
| `crm.crm_case_owner_history` | `Mantra Core Health Context/modules/diagram_49_crm.puml` |
| `delegated_access.access_anomalies` | `Mantra Core Health Context/modules/diagram_29_delegated_access.puml` |
| `delegated_access.access_decision_log` | `Mantra Core Health Context/modules/diagram_29_delegated_access.puml` |
| `delegated_access.access_review_campaigns` | `Mantra Core Health Context/modules/diagram_29_delegated_access.puml` |
| `delegated_access.access_review_items` | `Mantra Core Health Context/modules/diagram_29_delegated_access.puml` |
| `delegated_access.effective_support_access` | `Mantra Core Health Context/modules/diagram_29_delegated_access.puml` |
| `delegated_access.engagement_request_items` | `Mantra Core Health Context/modules/diagram_29_delegated_access.puml` |
| `delegated_access.engagement_requests` | `Mantra Core Health Context/modules/diagram_29_delegated_access.puml` |
| `delegated_access.four_eyes_requests` | `Mantra Core Health Context/modules/diagram_29_delegated_access.puml` |
| `delegated_access.governance_rules` | `Mantra Core Health Context/modules/diagram_29_delegated_access.puml` |
| `delegated_access.grant_usage_stats` | `Mantra Core Health Context/modules/diagram_29_delegated_access.puml` |
| `delegated_access.handover_items` | `Mantra Core Health Context/modules/diagram_29_delegated_access.puml` |
| `delegated_access.lifecycle_cases` | `Mantra Core Health Context/modules/diagram_29_delegated_access.puml` |
| `delegated_access.patient_restriction_flags` | `Mantra Core Health Context/modules/diagram_29_delegated_access.puml` |
| `delegated_access.role_templates` | `Mantra Core Health Context/modules/diagram_29_delegated_access.puml` |
| `delegated_access.sod_exceptions` | `Mantra Core Health Context/modules/diagram_29_delegated_access.puml` |
| `delegated_access.sod_rules` | `Mantra Core Health Context/modules/diagram_29_delegated_access.puml` |
| `delegated_access.support_grant_actions` | `Mantra Core Health Context/modules/diagram_29_delegated_access.puml` |
| `delegated_access.support_scope_grants` | `Mantra Core Health Context/modules/diagram_29_delegated_access.puml` |
| `diagnostic_units.unit_medical_visitors` | `Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml` |
| `diagnostic_units.unit_visit_ratings` | `Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml` |
| `diagnostic_units.unit_visit_records` | `Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml` |
| `diagnostic_units.unit_visit_request_events` | `Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml` |
| `diagnostic_units.unit_visit_requests` | `Mantra Core Health Context/modules/diagram_23_diagnostic_units.puml` |
| `directory.affiliation_invitation_uses` | `Mantra Core Health Context/modules/diagram_04_directory.puml` |
| `directory.affiliation_invitations` | `Mantra Core Health Context/modules/diagram_04_directory.puml` |
| `iam.session_policies` | `Mantra Core Health Context/modules/diagram_01_iam.puml` |
| `insurance.insurance_terms_conditions` | `Mantra Core Health Context/modules/diagram_26_insurance.puml` |
| `practice.practitioner_location_assignments` | `Mantra Core Health Context/modules/diagram_14_practice.puml` |
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
| authz.permissions.sensitivity_concept_id | uuid | opcional |
| authz.permissions.requires_reason | boolean | obligatoria |
| authz.permissions.requires_step_up | boolean | obligatoria |
| authz.permissions.approval_mode_concept_id | uuid | opcional |
| authz.permissions.purpose_of_use_concept_id | uuid | opcional |
| authz.permissions.legal_basis_concept_id | uuid | opcional |
| authz.permissions.touches_clinical_data | boolean | obligatoria |
| authz.permissions.support_assignable | boolean | obligatoria |
| authz.resource_scope_grants.reason_text | text | opcional |
| community.direct_messages.authored_by_user_id | uuid | opcional |
| community.direct_messages.on_behalf_of_profile_id | uuid | opcional |
| community.direct_messages.delegate_assignment_id | uuid | opcional |
| community.direct_messages.disclosure_shown | boolean | obligatoria |
| community.service_reviews.verified_crm_case_id | uuid | opcional |
| crm.crm_cases.insurance_claim_id | uuid | opcional |
| delegated_access.organization_user_assignments.tenant_id | uuid | obligatoria |
| delegated_access.organization_user_assignments.origin_concept_id | uuid | opcional |
| delegated_access.organization_user_assignments.owner_kind_concept_id | uuid | opcional |
| delegated_access.organization_user_assignments.role_template_id | uuid | opcional |
| delegated_access.organization_user_assignments.recertify_every_months | integer | opcional |
| delegated_access.organization_user_assignments.next_recertification_at | timestamptz | opcional |
| delegated_access.organization_user_assignments.ended_reason_text | text | opcional |
| delegated_access.organization_user_assignments.identity_verified_at | timestamptz | opcional |
| delegated_access.organization_user_assignments.identity_verified_by_user_id | uuid | opcional |
| delegated_access.organization_user_assignments.identity_method_concept_id | uuid | opcional |
| delegated_access.organization_user_assignments.suspended_at | timestamptz | opcional |
| delegated_access.organization_user_assignments.suspension_reason_concept_id | uuid | opcional |
| delegated_access.organization_user_assignments.suspension_note_text | text | opcional |
| delegated_access.organization_user_assignments.onboarding_completed_at | timestamptz | opcional |
| delegated_access.organization_user_assignments.last_certified_at | timestamptz | opcional |
| delegated_access.organization_user_assignments.last_active_at | timestamptz | opcional |
| delegated_access.practitioner_delegate_assignments.tenant_id | uuid | obligatoria |
| delegated_access.practitioner_delegate_assignments.may_reply_on_behalf | boolean | obligatoria |
| delegated_access.practitioner_delegate_assignments.reply_disclosure_concept_id | uuid | opcional |
| delegated_access.practitioner_delegate_assignments.accepted_at | timestamptz | opcional |
| directory.tenant_memberships.origin_concept_id | uuid | opcional |
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
| practice.care_spaces.location_path | varchar | opcional |
| scheduling.appointment_bookings.pre_visit_instructions_snapshot | text | opcional |
| scheduling.appointment_bookings.care_space_id | uuid | opcional |
| scheduling.appointment_bookings.healthcare_service_id | uuid | opcional |
| scheduling.appointment_bookings.booked_via_grant_id | uuid | opcional |
| scheduling.bookable_slots.care_space_id | uuid | opcional |
| scheduling.bookable_slots.healthcare_service_id | uuid | opcional |
| scheduling.booking_policies.no_show_fee_percentage | numeric | opcional |
| scheduling.booking_policies.no_show_retains_deposit | boolean | opcional |
| scheduling.practitioner_service_offerings.pre_visit_instructions | text | opcional |

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

