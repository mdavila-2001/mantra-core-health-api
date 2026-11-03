# Inventario de RLS sobre tablas con `tenant_id`

Qué tablas del modelo relacional tienen columna `tenant_id` y con qué mecanismo les llega
`ENABLE ROW LEVEL SECURITY` + `FORCE` + la política `tenant_isolation`. Es un análisis **estático**
del DDL: no se ejecutó contra una base viva (ver «Límites»).

Fecha: 2026-10-31. Fuentes:

- Modelo: `mantra-core-technologies/mantra-core-health-model`, commit `67fb7f1` (= `origin/dev` a esa fecha).
- Copia vendorizada que aplica la API: `database/` de este repo (la que monta `postgres-init` por defecto).

## Comando

```bash
python3 -I docs/seguridad/inventario-rls.py ../mantra-core-health-model   # modelo
python3 -I docs/seguridad/inventario-rls.py database                       # copia vendorizada
```

El script recorre el DDL en el orden de `docker/db-init/init-postgres.sh`: `apply_all.sql` y
`apply_deferred.sql` → NoSQL 58 (TimescaleDB) → NoSQL 59 (pgvector) → `SQL/patches/*.sql` por nombre.
Para cada tabla con columna `tenant_id` registra el tipo, el archivo que la crea (o que le agrega la
columna) y cuál de estos mecanismos la cubre en una base **nueva**:

1. **Literal**: `ALTER TABLE <tabla> ENABLE ROW LEVEL SECURITY` y `CREATE POLICY … ON <tabla>` escritos con el nombre de la tabla.
2. **Bucle 2026-08-05**: `SQL/patches/2026-08-05_tenant_rls.sql` recorre `information_schema.columns` y
   aplica RLS + FORCE + `tenant_isolation` a **toda** tabla base con `tenant_id uuid` que exista cuando corre.
   Cubre la tabla si su tipo es `uuid` y se crea antes que ese patch.
3. **Lista de su propio patch**: un patch posterior que nombra la tabla en una lista `('esquema', 'tabla')`
   dentro de un bloque que hace `ENABLE ROW LEVEL SECURITY` y crea `tenant_isolation` (p. ej. `v4279`, que
   además falla si a alguna de sus 27 tablas le falta la política).

## Conteo

| | Modelo `67fb7f1` | Copia `database/` |
|---|---:|---:|
| Tablas con columna `tenant_id` | 333 | 360 |
| Con `ENABLE ROW LEVEL SECURITY` y política **literales** | 1 | 2 |
| **Sin** `ENABLE ROW LEVEL SECURITY`/política literales | 332 | 358 |
| … de esas, cubiertas por el bucle 2026-08-05 | 332 | 331 |
| … creadas después del bucle y cubiertas por la lista de su patch | 0 | 27 |
| `tenant_id` de tipo distinto de `uuid` (el bucle no las toma) | 0 | 0 |
| **Sin ningún mecanismo en una base nueva** | **0** | **0** |

Lectura: el «12 de 1.700 tablas con RLS» de la auditoría del 31/10/2026 cuenta sentencias
`ENABLE ROW LEVEL SECURITY` literales. El modelo declara 1.741 `CREATE TABLE`, de las que
333 tienen `tenant_id`; casi todas reciben la política por el bucle dinámico, que una búsqueda
de texto no ve. Estáticamente, ninguna tabla con `tenant_id` queda sin mecanismo de RLS en el DDL.

## Límites

Este inventario no prueba aislamiento. Lo que **no** cubre:

- **Base viva.** No se consultó `pg_class.relrowsecurity`/`pg_policies` de ninguna base. La comprobación
  que cuenta es la del entorno: `select n.nspname, c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
  join pg_attribute a on a.attrelid = c.oid and a.attname = 'tenant_id' where c.relkind in ('r','p') and not (c.relrowsecurity and c.relforcerowsecurity);`
- **Hypertables de TimescaleDB.** El bucle omite, con un `WARNING`, toda tabla cuyo `ALTER` dé
  `feature_not_supported` (hypertable con *columnstore*). El DDL 58 no activa compresión (las líneas
  `COMPRESSION` están comentadas), pero si el motor o una política posterior la activa, esas tablas quedan
  sin RLS. Las 12 hypertables con `tenant_id`: `time_series.ads_delivery_event_series`, `time_series.ai_runtime_metric_series`, `time_series.application_tracking_series`, `time_series.audit_access_metric_series`, `time_series.device_raw_reading_series`, `time_series.ingestion_pipeline_metric_series`, `time_series.lab_analyzer_event_series`, `time_series.location_ping_series`, `time_series.normalized_vital_series`, `time_series.payment_gateway_metric_series`, `time_series.service_sli_series`, `time_series.telemetry_event_series`.
- **Tablas que crea el ORM.** Con `ORM_SCHEMA_SYNC=safe` (`api-migrate`) MikroORM crea tablas que el DDL no
  declare; el bucle 2026-08-05 solo las cubre en la siguiente pasada de `postgres-init`.
- **`custodian_tenant_id`.** Las tablas clínicas aisladas por esa columna las cubre otro patch
  (`2026-09-26_v4226_custodian_tenant_rls.sql`) y no entran en este conteo.
- **Que la política se aplique.** RLS solo rige si la API conecta con `mantra_app` (sin `BYPASSRLS`, no dueño)
  y con `RLS_ENFORCE=true`; ver `src/orm/config/runtime-role.guard.ts`.

## Diferencia entre el modelo y la copia vendorizada

`database/` no coincide con el modelo en `67fb7f1`: tiene 29 tablas con `tenant_id` que el modelo no
declara, y le faltan 2. `yarn db:vendor:check` es la comprobación de esa deriva.

En la copia y no en el modelo: `accounting.cost_centers`, `accounting.infrastructure_items`, `audit.care_space_blocks_history`, `audit.care_space_category_periods_history`, `audit.charge_captures_history`, `audit.cleaning_orders_history`, `audit.encounter_locations_history`, `audit.operating_room_block_series_history`, `audit.operating_room_blocks_history`, `audit.placement_incidents_history`, `audit.space_tariffs_history`, `billing.charge_captures`, `billing.space_tariffs`, `clinical.encounter_locations`, `clinical.inpatient_census_adjustments`, `clinical.inpatient_census_days`, `clinical.inpatient_census_entries`, `clinical.patient_admission_footprints`, `clinical.placement_incidents`, `directory.tenant_medical_facilities`, `directory.tenant_medical_facility_sites`, `practice.care_space_blocks`, `practice.care_space_category_periods`, `practice.care_space_status_events`, `practice.cleaning_orders`, `practice.healthcare_services`, `procedures_perioperative.operating_room_block_series`, `procedures_perioperative.operating_room_blocks`, `procedures_perioperative.operating_room_utilization_events`.

En el modelo y no en la copia: `system_ops.bulk_import_batch_rows`, `system_ops.bulk_import_batches`.

## Lista: tablas con `tenant_id` sin `ENABLE ROW LEVEL SECURITY`/política literales (modelo, 332)

Columna «Cobertura»: el mecanismo que les aplica RLS en una base nueva.

| Tabla | Archivo que la crea | Cobertura |
|---|---|---|
| `accounting.account_determination_rules` | `SQL/16_accounting/02_tables.sql` | bucle 2026-08-05 |
| `accounting.accrual_objects` | `SQL/16_accounting/02_tables.sql` | bucle 2026-08-05 |
| `accounting.asset_classes` | `SQL/16_accounting/02_tables.sql` | bucle 2026-08-05 |
| `accounting.clearing_documents` | `SQL/16_accounting/02_tables.sql` | bucle 2026-08-05 |
| `accounting.company_bank_accounts` | `SQL/16_accounting/02_tables.sql` | bucle 2026-08-05 |
| `accounting.controlling_areas` | `SQL/16_accounting/02_tables.sql` | bucle 2026-08-05 |
| `accounting.depreciation_areas` | `SQL/16_accounting/02_tables.sql` | bucle 2026-08-05 |
| `accounting.functional_areas` | `SQL/16_accounting/02_tables.sql` | bucle 2026-08-05 |
| `accounting.internal_orders` | `SQL/16_accounting/02_tables.sql` | bucle 2026-08-05 |
| `accounting.open_items` | `SQL/16_accounting/02_tables.sql` | bucle 2026-08-05 |
| `accounting.profit_centers` | `SQL/16_accounting/02_tables.sql` | bucle 2026-08-05 |
| `accounting.segments` | `SQL/16_accounting/02_tables.sql` | bucle 2026-08-05 |
| `accounting.subledger_accounts` | `SQL/16_accounting/02_tables.sql` | bucle 2026-08-05 |
| `ads.ad_event_data_policies` | `SQL/43_ads/02_tables.sql` | bucle 2026-08-05 |
| `ads.ad_identity_assets` | `SQL/43_ads/02_tables.sql` | bucle 2026-08-05 |
| `ads.ad_partners` | `SQL/43_ads/02_tables.sql` | bucle 2026-08-05 |
| `ads.ad_platform_connections` | `SQL/43_ads/02_tables.sql` | bucle 2026-08-05 |
| `ads.blocked_ad_events` | `SQL/43_ads/02_tables.sql` | bucle 2026-08-05 |
| `ads.business_managers` | `SQL/43_ads/02_tables.sql` | bucle 2026-08-05 |
| `ads.conversion_datasets` | `SQL/43_ads/02_tables.sql` | bucle 2026-08-05 |
| `ads.insight_query_runs` | `SQL/43_ads/02_tables.sql` | bucle 2026-08-05 |
| `ads.lead_forms` | `SQL/43_ads/02_tables.sql` | bucle 2026-08-05 |
| `ads.lead_submissions` | `SQL/43_ads/02_tables.sql` | bucle 2026-08-05 |
| `ads.server_conversion_events` | `SQL/43_ads/02_tables.sql` | bucle 2026-08-05 |
| `audio_assets.audio_assets` | `SQL/64_audio_assets/02_tables.sql` | bucle 2026-08-05 |
| `audit.audit_log` | `SQL/10_audit/02_tables.sql` | bucle 2026-08-05 |
| `audit.care_spaces_history` | `SQL/10_audit/02_tables.sql` | bucle 2026-08-05 |
| `audit.clinical_units_history` | `SQL/10_audit/02_tables.sql` | bucle 2026-08-05 |
| `audit.data_access_log` | `SQL/10_audit/02_tables.sql` | bucle 2026-08-05 |
| `audit.practice_sites_history` | `SQL/10_audit/02_tables.sql` | bucle 2026-08-05 |
| `audit.tenants_history` | `SQL/10_audit/02_tables.sql` | bucle 2026-08-05 |
| `auth_providers.federated_login_attempts` | `SQL/40_auth_providers/02_tables.sql` | bucle 2026-08-05 |
| `auth_providers.identity_providers` | `SQL/40_auth_providers/02_tables.sql` | bucle 2026-08-05 |
| `auth_providers.provider_tenant_bindings` | `SQL/40_auth_providers/02_tables.sql` | bucle 2026-08-05 |
| `auth_providers.provisioning_rules` | `SQL/40_auth_providers/02_tables.sql` | bucle 2026-08-05 |
| `authz.access_policies` | `SQL/06_authz/02_tables.sql` | bucle 2026-08-05 |
| `authz.break_glass_sessions` | `SQL/06_authz/02_tables.sql` | bucle 2026-08-05 |
| `authz.care_relationships` | `SQL/06_authz/02_tables.sql` | bucle 2026-08-05 |
| `authz.clinical_access_grants` | `SQL/06_authz/02_tables.sql` | bucle 2026-08-05 |
| `authz.ip_access_rules` | `SQL/06_authz/02_tables.sql` | bucle 2026-08-05 |
| `authz.patient_legal_representations` | `SQL/06_authz/02_tables.sql` | bucle 2026-08-05 |
| `authz.resource_scope_grants` | `SQL/06_authz/02_tables.sql` | bucle 2026-08-05 |
| `authz.roles` | `SQL/06_authz/02_tables.sql` | bucle 2026-08-05 |
| `authz.user_permission_grants` | `SQL/06_authz/02_tables.sql` | bucle 2026-08-05 |
| `authz.user_role_assignments` | `SQL/06_authz/02_tables.sql` | bucle 2026-08-05 |
| `automation.agents` | `SQL/48_automation/02_tables.sql` | bucle 2026-08-05 |
| `automation.automation_triggers` | `SQL/48_automation/02_tables.sql` | bucle 2026-08-05 |
| `automation.guardrail_policies` | `SQL/48_automation/02_tables.sql` | bucle 2026-08-05 |
| `automation.knowledge_sources` | `SQL/48_automation/02_tables.sql` | bucle 2026-08-05 |
| `automation.record_automations` | `SQL/48_automation/02_tables.sql` | bucle 2026-08-05 |
| `automation.workflow_runs` | `SQL/48_automation/02_tables.sql` | bucle 2026-08-05 |
| `automation.workflows` | `SQL/48_automation/02_tables.sql` | bucle 2026-08-05 |
| `billing.billing_document_links` | `SQL/17_billing/02_tables.sql` | bucle 2026-08-05 |
| `billing.dunning_runs` | `SQL/17_billing/02_tables.sql` | bucle 2026-08-05 |
| `chart.document_records` | `SQL/15_chart/02_tables.sql` | bucle 2026-08-05 |
| `chart.specialty_chart_templates` | `SQL/15_chart/02_tables.sql` | bucle 2026-08-05 |
| `clinical.appointments` | `SQL/08_clinical/02_tables.sql` | bucle 2026-08-05 |
| `clinical.care_episodes` | `SQL/08_clinical/02_tables.sql` | bucle 2026-08-05 |
| `clinical.encounters` | `SQL/08_clinical/02_tables.sql` | bucle 2026-08-05 |
| `clinical.prescription_signature_policies` | `SQL/08_clinical/02_tables.sql` | bucle 2026-08-05 |
| `clinical_ext.care_teams` | `SQL/18_clinical_ext/02_tables.sql` | bucle 2026-08-05 |
| `clinical_ext.cds_rules` | `SQL/18_clinical_ext/02_tables.sql` | bucle 2026-08-05 |
| `clinical_ext.immunization_schedules` | `SQL/18_clinical_ext/02_tables.sql` | bucle 2026-08-05 |
| `clinical_ext.order_sets` | `SQL/18_clinical_ext/02_tables.sql` | bucle 2026-08-05 |
| `common.files` | `SQL/02_common/02_tables.sql` | bucle 2026-08-05 |
| `community.comments` | `SQL/19_community/02_tables.sql` | bucle 2026-08-05 |
| `community.conversation_assignments` | `SQL/19_community/02_tables.sql` | bucle 2026-08-05 |
| `community.conversation_internal_notes` | `SQL/19_community/02_tables.sql` | bucle 2026-08-05 |
| `community.conversations` | `SQL/19_community/02_tables.sql` | bucle 2026-08-05 |
| `community.feedback_tickets` | `SQL/19_community/02_tables.sql` | bucle 2026-08-05 |
| `community.groups` | `SQL/19_community/02_tables.sql` | bucle 2026-08-05 |
| `community.moderation_queue` | `SQL/19_community/02_tables.sql` | bucle 2026-08-05 |
| `community.prestige_awards` | `SQL/19_community/02_tables.sql` | bucle 2026-08-05 |
| `community.prestige_scores` | `SQL/19_community/02_tables.sql` | bucle 2026-08-05 |
| `community.public_profiles` | `SQL/19_community/02_tables.sql` | bucle 2026-08-05 |
| `community.reply_templates` | `SQL/19_community/02_tables.sql` | bucle 2026-08-05 |
| `consent.consents` | `SQL/07_consent/02_tables.sql` | bucle 2026-08-05 |
| `consent.hipaa_authorizations` | `SQL/07_consent/02_tables.sql` | bucle 2026-08-05 |
| `consent.patient_objections` | `SQL/07_consent/02_tables.sql` | bucle 2026-08-05 |
| `consent.privacy_restrictions` | `SQL/07_consent/02_tables.sql` | bucle 2026-08-05 |
| `consent.processing_legal_bases` | `SQL/07_consent/02_tables.sql` | bucle 2026-08-05 |
| `consent.treatment_informed_consents` | `SQL/07_consent/02_tables.sql` | bucle 2026-08-05 |
| `crm.contact_channel_endpoints` | `SQL/49_crm/02_tables.sql` | bucle 2026-08-05 |
| `crm.contacts` | `SQL/49_crm/02_tables.sql` | bucle 2026-08-05 |
| `crm.crm_accounts` | `SQL/49_crm/02_tables.sql` | bucle 2026-08-05 |
| `crm.crm_activities` | `SQL/49_crm/02_tables.sql` | bucle 2026-08-05 |
| `crm.crm_cases` | `SQL/49_crm/02_tables.sql` | bucle 2026-08-05 |
| `crm.crm_entitlements` | `SQL/49_crm/02_tables.sql` | bucle 2026-08-05 |
| `crm.crm_recurrence_rules` | `SQL/49_crm/02_tables.sql` | bucle 2026-08-05 |
| `crm.leads` | `SQL/49_crm/02_tables.sql` | bucle 2026-08-05 |
| `crm.opportunities` | `SQL/49_crm/02_tables.sql` | bucle 2026-08-05 |
| `crm.partnerships` | `SQL/49_crm/02_tables.sql` | bucle 2026-08-05 |
| `crm.pipelines` | `SQL/49_crm/02_tables.sql` | bucle 2026-08-05 |
| `cross_store_consistency.archive_jobs` | `SQL/62_cross_store_consistency/02_tables.sql` | bucle 2026-08-05 |
| `cross_store_consistency.cache_invalidation_jobs` | `SQL/62_cross_store_consistency/02_tables.sql` | bucle 2026-08-05 |
| `cross_store_consistency.data_movement_jobs` | `SQL/62_cross_store_consistency/02_tables.sql` | bucle 2026-08-05 |
| `cross_store_consistency.deletion_requests` | `SQL/62_cross_store_consistency/02_tables.sql` | bucle 2026-08-05 |
| `cross_store_consistency.projection_checkpoints` | `SQL/62_cross_store_consistency/02_tables.sql` | bucle 2026-08-05 |
| `cross_store_consistency.projection_dead_letters` | `SQL/62_cross_store_consistency/02_tables.sql` | bucle 2026-08-05 |
| `cross_store_consistency.projection_delivery_attempts` | `SQL/62_cross_store_consistency/02_tables.sql` | bucle 2026-08-05 |
| `cross_store_consistency.projection_drift_events` | `SQL/62_cross_store_consistency/02_tables.sql` | bucle 2026-08-05 |
| `cross_store_consistency.projection_repair_jobs` | `SQL/62_cross_store_consistency/02_tables.sql` | bucle 2026-08-05 |
| `cross_store_consistency.reconciliation_runs` | `SQL/62_cross_store_consistency/02_tables.sql` | bucle 2026-08-05 |
| `cross_store_consistency.reindex_jobs` | `SQL/62_cross_store_consistency/02_tables.sql` | bucle 2026-08-05 |
| `delegated_access.access_anomalies` | `SQL/29_delegated_access/02_tables.sql` | bucle 2026-08-05 |
| `delegated_access.access_decision_log` | `SQL/29_delegated_access/02_tables.sql` | bucle 2026-08-05 |
| `delegated_access.access_review_campaigns` | `SQL/29_delegated_access/02_tables.sql` | bucle 2026-08-05 |
| `delegated_access.access_review_items` | `SQL/29_delegated_access/02_tables.sql` | bucle 2026-08-05 |
| `delegated_access.delegated_permission_sets` | `SQL/29_delegated_access/02_tables.sql` | bucle 2026-08-05 |
| `delegated_access.effective_support_access` | `SQL/29_delegated_access/02_tables.sql` | bucle 2026-08-05 |
| `delegated_access.engagement_request_items` | `SQL/29_delegated_access/02_tables.sql` | bucle 2026-08-05 |
| `delegated_access.engagement_requests` | `SQL/29_delegated_access/02_tables.sql` | bucle 2026-08-05 |
| `delegated_access.four_eyes_requests` | `SQL/29_delegated_access/02_tables.sql` | bucle 2026-08-05 |
| `delegated_access.governance_rules` | `SQL/29_delegated_access/02_tables.sql` | bucle 2026-08-05 |
| `delegated_access.grant_usage_stats` | `SQL/29_delegated_access/02_tables.sql` | bucle 2026-08-05 |
| `delegated_access.handover_items` | `SQL/29_delegated_access/02_tables.sql` | bucle 2026-08-05 |
| `delegated_access.lifecycle_cases` | `SQL/29_delegated_access/02_tables.sql` | bucle 2026-08-05 |
| `delegated_access.organization_user_assignments` | `SQL/29_delegated_access/02_tables.sql` | bucle 2026-08-05 |
| `delegated_access.patient_restriction_flags` | `SQL/29_delegated_access/02_tables.sql` | bucle 2026-08-05 |
| `delegated_access.practitioner_delegate_assignments` | `SQL/29_delegated_access/02_tables.sql` | bucle 2026-08-05 |
| `delegated_access.role_templates` | `SQL/29_delegated_access/02_tables.sql` | bucle 2026-08-05 |
| `delegated_access.shared_access_links` | `SQL/29_delegated_access/02_tables.sql` | bucle 2026-08-05 |
| `delegated_access.sod_exceptions` | `SQL/29_delegated_access/02_tables.sql` | bucle 2026-08-05 |
| `delegated_access.sod_rules` | `SQL/29_delegated_access/02_tables.sql` | bucle 2026-08-05 |
| `delegated_access.support_grant_actions` | `SQL/29_delegated_access/02_tables.sql` | bucle 2026-08-05 |
| `delegated_access.support_scope_grants` | `SQL/29_delegated_access/02_tables.sql` | bucle 2026-08-05 |
| `diagnostic_units.diagnostic_units` | `SQL/23_diagnostic_units/02_tables.sql` | bucle 2026-08-05 |
| `diagnostics.imaging_endpoints` | `SQL/20_diagnostics/02_tables.sql` | bucle 2026-08-05 |
| `directory.affiliation_invitation_uses` | `SQL/04_directory/02_tables.sql` | bucle 2026-08-05 |
| `directory.affiliation_invitations` | `SQL/04_directory/02_tables.sql` | bucle 2026-08-05 |
| `directory.branches` | `SQL/04_directory/02_tables.sql` | bucle 2026-08-05 |
| `directory.tenant_affiliation_documents` | `SQL/04_directory/02_tables.sql` | bucle 2026-08-05 |
| `directory.tenant_legal_representatives` | `SQL/04_directory/02_tables.sql` | bucle 2026-08-05 |
| `directory.tenant_memberships` | `SQL/04_directory/02_tables.sql` | bucle 2026-08-05 |
| `directory.tenant_web_configs` | `SQL/04_directory/02_tables.sql` | bucle 2026-08-05 |
| `education.courses` | `SQL/47_education/02_tables.sql` | bucle 2026-08-05 |
| `education.instructors` | `SQL/47_education/02_tables.sql` | bucle 2026-08-05 |
| `erp.business_partners` | `SQL/38_erp/02_tables.sql` | bucle 2026-08-05 |
| `erp.contract_clauses` | `SQL/38_erp/02_tables.sql` | bucle 2026-08-05 |
| `erp.contracts` | `SQL/38_erp/02_tables.sql` | bucle 2026-08-05 |
| `erp.departments` | `SQL/38_erp/02_tables.sql` | bucle 2026-08-05 |
| `erp.employment_records` | `SQL/38_erp/02_tables.sql` | bucle 2026-08-05 |
| `erp.enterprise_document_flow` | `SQL/38_erp/02_tables.sql` | bucle 2026-08-05 |
| `erp.goods_receipts` | `SQL/38_erp/02_tables.sql` | bucle 2026-08-05 |
| `erp.invoice_match_runs` | `SQL/38_erp/02_tables.sql` | bucle 2026-08-05 |
| `erp.positions` | `SQL/38_erp/02_tables.sql` | bucle 2026-08-05 |
| `erp.projects` | `SQL/38_erp/02_tables.sql` | bucle 2026-08-05 |
| `erp.purchase_orders` | `SQL/38_erp/02_tables.sql` | bucle 2026-08-05 |
| `erp.purchase_requisitions` | `SQL/38_erp/02_tables.sql` | bucle 2026-08-05 |
| `erp.sales_orders` | `SQL/38_erp/02_tables.sql` | bucle 2026-08-05 |
| `erp.service_entry_sheets` | `SQL/38_erp/02_tables.sql` | bucle 2026-08-05 |
| `forms.extension_target_policies` | `SQL/09_forms/02_tables.sql` | bucle 2026-08-05 |
| `forms.field_assignments` | `SQL/09_forms/02_tables.sql` | bucle 2026-08-05 |
| `geo.geofences` | `SQL/13_geo/02_tables.sql` | bucle 2026-08-05 |
| `geo.tracked_subjects` | `SQL/13_geo/02_tables.sql` | bucle 2026-08-05 |
| `graph_intelligence.graph_access_scopes` | `SQL/61_graph_intelligence/02_tables.sql` | bucle 2026-08-05 |
| `graph_intelligence.graph_communities` | `SQL/61_graph_intelligence/02_tables.sql` | bucle 2026-08-05 |
| `graph_intelligence.graph_deletion_jobs` | `SQL/61_graph_intelligence/02_tables.sql` | bucle 2026-08-05 |
| `graph_intelligence.graph_edges` | `SQL/61_graph_intelligence/02_tables.sql` | bucle 2026-08-05 |
| `graph_intelligence.graph_nodes` | `SQL/61_graph_intelligence/02_tables.sql` | bucle 2026-08-05 |
| `graph_intelligence.graph_path_cache` | `SQL/61_graph_intelligence/02_tables.sql` | bucle 2026-08-05 |
| `graph_intelligence.graph_projection_definitions` | `SQL/61_graph_intelligence/02_tables.sql` | bucle 2026-08-05 |
| `graph_intelligence.graph_projection_runs` | `SQL/61_graph_intelligence/02_tables.sql` | bucle 2026-08-05 |
| `graph_intelligence.graph_risk_scores` | `SQL/61_graph_intelligence/02_tables.sql` | bucle 2026-08-05 |
| `graph_intelligence.graph_rule_definitions` | `SQL/61_graph_intelligence/02_tables.sql` | bucle 2026-08-05 |
| `graph_intelligence.graph_rule_hits` | `SQL/61_graph_intelligence/02_tables.sql` | bucle 2026-08-05 |
| `health_data.fhir_validation_runs` | `SQL/52_health_data/02_tables.sql` | bucle 2026-08-05 |
| `health_data.health_data_quality_rule_sets` | `SQL/52_health_data/02_tables.sql` | bucle 2026-08-05 |
| `health_data.health_data_quality_runs` | `SQL/52_health_data/02_tables.sql` | bucle 2026-08-05 |
| `health_data.health_deidentification_profiles` | `SQL/52_health_data/02_tables.sql` | bucle 2026-08-05 |
| `health_data.health_deidentification_runs` | `SQL/52_health_data/02_tables.sql` | bucle 2026-08-05 |
| `health_data.health_export_jobs` | `SQL/52_health_data/02_tables.sql` | bucle 2026-08-05 |
| `health_data.health_ingestion_batches` | `SQL/52_health_data/02_tables.sql` | bucle 2026-08-05 |
| `health_data.health_lineage_edges` | `SQL/52_health_data/02_tables.sql` | bucle 2026-08-05 |
| `health_data.health_source_systems` | `SQL/52_health_data/02_tables.sql` | bucle 2026-08-05 |
| `health_data.health_terminology_mapping_sets` | `SQL/52_health_data/02_tables.sql` | bucle 2026-08-05 |
| `health_data.omop_mapping_sets` | `SQL/52_health_data/02_tables.sql` | bucle 2026-08-05 |
| `health_data.omop_transformation_runs` | `SQL/52_health_data/02_tables.sql` | bucle 2026-08-05 |
| `health_data.patient_identity_clusters` | `SQL/52_health_data/02_tables.sql` | bucle 2026-08-05 |
| `health_data.patient_match_candidates` | `SQL/52_health_data/02_tables.sql` | bucle 2026-08-05 |
| `iam.account_lockouts` | `SQL/01_iam/02_tables.sql` | bucle 2026-08-05 |
| `iam.api_keys` | `SQL/01_iam/02_tables.sql` | bucle 2026-08-05 |
| `iam.session_policies` | `SQL/01_iam/02_tables.sql` | bucle 2026-08-05 |
| `identity_assurance.identity_authorities` | `SQL/27_identity_assurance/02_tables.sql` | bucle 2026-08-05 |
| `identity_assurance.identity_verification_cases` | `SQL/27_identity_assurance/02_tables.sql` | bucle 2026-08-05 |
| `insurance.employer_groups` | `SQL/26_insurance/02_tables.sql` | bucle 2026-08-05 |
| `insurance.insurance_brokers` | `SQL/26_insurance/02_tables.sql` | bucle 2026-08-05 |
| `insurance.insurance_carriers` | `SQL/26_insurance/02_tables.sql` | bucle 2026-08-05 |
| `integration_contracts.integration_contracts` | `SQL/31_integration_contracts/02_tables.sql` | bucle 2026-08-05 |
| `integrations.provider_connections` | `SQL/12_integrations/02_tables.sql` | bucle 2026-08-05 |
| `integrations.webhook_subscriptions` | `SQL/12_integrations/02_tables.sql` | bucle 2026-08-05 |
| `lakehouse.data_products` | `SQL/63_lakehouse/02_tables.sql` | bucle 2026-08-05 |
| `lakehouse.dataset_release_requests` | `SQL/63_lakehouse/02_tables.sql` | bucle 2026-08-05 |
| `lakehouse.lakehouse_datasets` | `SQL/63_lakehouse/02_tables.sql` | bucle 2026-08-05 |
| `lakehouse.lakehouse_lineage_edges` | `SQL/63_lakehouse/02_tables.sql` | bucle 2026-08-05 |
| `lakehouse.lakehouse_quality_runs` | `SQL/63_lakehouse/02_tables.sql` | bucle 2026-08-05 |
| `lakehouse.research_projects` | `SQL/63_lakehouse/02_tables.sql` | bucle 2026-08-05 |
| `lakehouse.transformation_definitions` | `SQL/63_lakehouse/02_tables.sql` | bucle 2026-08-05 |
| `lakehouse.transformation_runs` | `SQL/63_lakehouse/02_tables.sql` | bucle 2026-08-05 |
| `marketing.campaign_dispatches` | `SQL/50_marketing/02_tables.sql` | bucle 2026-08-05 |
| `marketing.campaign_schedules` | `SQL/50_marketing/02_tables.sql` | bucle 2026-08-05 |
| `marketing.content_templates` | `SQL/50_marketing/02_tables.sql` | bucle 2026-08-05 |
| `marketing.journeys` | `SQL/50_marketing/02_tables.sql` | bucle 2026-08-05 |
| `marketing.marketing_campaigns` | `SQL/50_marketing/02_tables.sql` | bucle 2026-08-05 |
| `marketing.segments` | `SQL/50_marketing/02_tables.sql` | bucle 2026-08-05 |
| `medical_groups.groups` | `SQL/66_medical_groups/02_tables.sql` | bucle 2026-08-05 |
| `messaging.domain_events` | `SQL/35_messaging/02_tables.sql` | bucle 2026-08-05 |
| `messaging.event_subscriptions` | `SQL/35_messaging/02_tables.sql` | bucle 2026-08-05 |
| `messaging.in_app_notifications` | `SQL/35_messaging/02_tables.sql` | bucle 2026-08-05 |
| `messaging.message_templates` | `SQL/35_messaging/02_tables.sql` | bucle 2026-08-05 |
| `messaging.notification_requests` | `SQL/35_messaging/02_tables.sql` | bucle 2026-08-05 |
| `messaging.outbox_messages` | `SQL/35_messaging/02_tables.sql` | bucle 2026-08-05 |
| `messaging.provider_channel_configs` | `SQL/35_messaging/02_tables.sql` | bucle 2026-08-05 |
| `messaging.queued_jobs` | `SQL/35_messaging/02_tables.sql` | bucle 2026-08-05 |
| `messaging.recipient_preferences` | `SQL/35_messaging/02_tables.sql` | bucle 2026-08-05 |
| `object_storage.archive_manifests` | `SQL/60_object_storage/02_tables.sql` | bucle 2026-08-05 |
| `object_storage.dicom_study_manifests` | `SQL/60_object_storage/02_tables.sql` | bucle 2026-08-05 |
| `object_storage.dicomweb_access_logs` | `SQL/60_object_storage/02_tables.sql` | bucle 2026-08-05 |
| `object_storage.large_payload_manifests` | `SQL/60_object_storage/02_tables.sql` | bucle 2026-08-05 |
| `object_storage.multipart_uploads` | `SQL/60_object_storage/02_tables.sql` | bucle 2026-08-05 |
| `object_storage.object_manifests` | `SQL/60_object_storage/02_tables.sql` | bucle 2026-08-05 |
| `organization_extensions.facility_licenses` | `SQL/22_organization_extensions/02_tables.sql` | bucle 2026-08-05 |
| `organization_extensions.hospitals` | `SQL/22_organization_extensions/02_tables.sql` | bucle 2026-08-05 |
| `organization_extensions.organization_data_boundaries` | `SQL/22_organization_extensions/02_tables.sql` | bucle 2026-08-05 |
| `payments.cashier_payment_contexts` | `SQL/42_payments/02_tables.sql` | bucle 2026-08-05 |
| `payments.connected_accounts` | `SQL/42_payments/02_tables.sql` | bucle 2026-08-05 |
| `payments.fee_schedules` | `SQL/42_payments/02_tables.sql` | bucle 2026-08-05 |
| `payments.gateway_connections` | `SQL/42_payments/02_tables.sql` | bucle 2026-08-05 |
| `payments.invoice_regeneration_requests` | `SQL/42_payments/02_tables.sql` | bucle 2026-08-05 |
| `payments.payment_cancellation_requests` | `SQL/42_payments/02_tables.sql` | bucle 2026-08-05 |
| `payments.payment_checkout_sessions` | `SQL/42_payments/02_tables.sql` | bucle 2026-08-05 |
| `payments.payment_debts` | `SQL/42_payments/02_tables.sql` | bucle 2026-08-05 |
| `payments.payment_intents` | `SQL/42_payments/02_tables.sql` | bucle 2026-08-05 |
| `payments.payment_mandates` | `SQL/42_payments/02_tables.sql` | bucle 2026-08-05 |
| `payments.payment_methods` | `SQL/42_payments/02_tables.sql` | bucle 2026-08-05 |
| `payments.payment_receipts` | `SQL/42_payments/02_tables.sql` | bucle 2026-08-05 |
| `payments.payouts` | `SQL/42_payments/02_tables.sql` | bucle 2026-08-05 |
| `payments.reconciliation_runs` | `SQL/42_payments/02_tables.sql` | bucle 2026-08-05 |
| `payments.subscription_plans` | `SQL/42_payments/02_tables.sql` | bucle 2026-08-05 |
| `payments.subscriptions` | `SQL/42_payments/02_tables.sql` | bucle 2026-08-05 |
| `payments.wallets` | `SQL/42_payments/02_tables.sql` | bucle 2026-08-05 |
| `pharma_lab.doctor_visit_policies` | `SQL/69_pharma_lab/02_tables.sql` | bucle 2026-08-05 |
| `pharma_lab.pharma_lab_notices` | `SQL/69_pharma_lab/02_tables.sql` | bucle 2026-08-05 |
| `pharma_lab.pharma_labs` | `SQL/69_pharma_lab/02_tables.sql` | bucle 2026-08-05 |
| `pharmacy.pharmacies` | `SQL/24_pharmacy/02_tables.sql` | bucle 2026-08-05 |
| `platform_ops.artifacts` | `SQL/46_platform_ops/02_tables.sql` | bucle 2026-08-05 |
| `platform_ops.change_requests` | `SQL/46_platform_ops/02_tables.sql` | bucle 2026-08-05 |
| `platform_ops.deployments` | `SQL/46_platform_ops/02_tables.sql` | bucle 2026-08-05 |
| `platform_ops.escalation_policies` | `SQL/46_platform_ops/02_tables.sql` | bucle 2026-08-05 |
| `platform_ops.health_checks` | `SQL/46_platform_ops/02_tables.sql` | bucle 2026-08-05 |
| `platform_ops.health_incidents` | `SQL/46_platform_ops/02_tables.sql` | bucle 2026-08-05 |
| `platform_ops.maintenance_windows` | `SQL/46_platform_ops/02_tables.sql` | bucle 2026-08-05 |
| `platform_ops.operational_improvement_items` | `SQL/46_platform_ops/02_tables.sql` | bucle 2026-08-05 |
| `platform_ops.operational_teams` | `SQL/46_platform_ops/02_tables.sql` | bucle 2026-08-05 |
| `platform_ops.resilience_exercises` | `SQL/46_platform_ops/02_tables.sql` | bucle 2026-08-05 |
| `platform_ops.runbooks` | `SQL/46_platform_ops/02_tables.sql` | bucle 2026-08-05 |
| `platform_ops.service_components` | `SQL/46_platform_ops/02_tables.sql` | bucle 2026-08-05 |
| `platform_ops.tool_registry` | `SQL/46_platform_ops/02_tables.sql` | bucle 2026-08-05 |
| `polyglot_storage.storage_cost_snapshots` | `SQL/54_polyglot_storage/02_tables.sql` | bucle 2026-08-05 |
| `polyglot_storage.tenant_storage_bindings` | `SQL/54_polyglot_storage/02_tables.sql` | bucle 2026-08-05 |
| `practice.care_spaces` | `SQL/14_practice/02_tables.sql` | bucle 2026-08-05 |
| `practice.clinical_units` | `SQL/14_practice/02_tables.sql` | bucle 2026-08-05 |
| `practice.practice_sites` | `SQL/14_practice/02_tables.sql` | bucle 2026-08-05 |
| `practice.practices` | `SQL/14_practice/02_tables.sql` | bucle 2026-08-05 |
| `practice.practitioner_location_assignments` | `SQL/14_practice/02_tables.sql` | bucle 2026-08-05 |
| `practice.site_declared_capacities` | `SQL/14_practice/02_tables.sql` | bucle 2026-08-05 |
| `practice.space_unit_assignments` | `SQL/14_practice/02_tables.sql` | bucle 2026-08-05 |
| `promotions.loyalty_programs` | `SQL/51_promotions/02_tables.sql` | bucle 2026-08-05 |
| `promotions.promotions` | `SQL/51_promotions/02_tables.sql` | bucle 2026-08-05 |
| `promotions.referral_programs` | `SQL/51_promotions/02_tables.sql` | bucle 2026-08-05 |
| `qa_lab.test_defects` | `SQL/36_qa_lab/02_tables.sql` | bucle 2026-08-05 |
| `qa_lab.test_environments` | `SQL/36_qa_lab/02_tables.sql` | bucle 2026-08-05 |
| `qa_lab.test_runs` | `SQL/36_qa_lab/02_tables.sql` | bucle 2026-08-05 |
| `qa_lab.test_schedules` | `SQL/36_qa_lab/02_tables.sql` | bucle 2026-08-05 |
| `qa_lab.test_suites` | `SQL/36_qa_lab/02_tables.sql` | bucle 2026-08-05 |
| `read_models.user_view_preferences` | `SQL/30_read_models/02_tables.sql` | bucle 2026-08-05 |
| `reporting.dashboards` | `SQL/39_reporting/02_tables.sql` | bucle 2026-08-05 |
| `reporting.report_data_sources` | `SQL/39_reporting/02_tables.sql` | bucle 2026-08-05 |
| `reporting.report_definitions` | `SQL/39_reporting/02_tables.sql` | bucle 2026-08-05 |
| `reporting.report_executions` | `SQL/39_reporting/02_tables.sql` | bucle 2026-08-05 |
| `reporting.report_schedules` | `SQL/39_reporting/02_tables.sql` | bucle 2026-08-05 |
| `scheduling.appointment_bookings` | `SQL/41_scheduling/02_tables.sql` | bucle 2026-08-05 |
| `scheduling.appointment_payment_states` | `SQL/41_scheduling/02_tables.sql` | bucle 2026-08-05 |
| `scheduling.booking_confirmation_rules` | `SQL/41_scheduling/02_tables.sql` | bucle 2026-08-05 |
| `scheduling.booking_policies` | `SQL/41_scheduling/02_tables.sql` | bucle 2026-08-05 |
| `scheduling.calendar_absences` | `SQL/41_scheduling/02_tables.sql` | bucle 2026-08-05 |
| `scheduling.schedulable_resources` | `SQL/41_scheduling/02_tables.sql` | bucle 2026-08-05 |
| `scheduling.waitlist_entries` | `SQL/41_scheduling/02_tables.sql` | bucle 2026-08-05 |
| `surveys.survey_assignments` | `SQL/65_surveys/02_tables.sql` | bucle 2026-08-05 |
| `surveys.survey_invitations` | `SQL/65_surveys/02_tables.sql` | bucle 2026-08-05 |
| `surveys.survey_responses` | `SQL/65_surveys/02_tables.sql` | bucle 2026-08-05 |
| `surveys.survey_templates` | `SQL/65_surveys/02_tables.sql` | bucle 2026-08-05 |
| `system_context.dynamic_enum_definitions` | `SQL/45_system_context/02_tables.sql` | bucle 2026-08-05 |
| `system_context.system_context_bindings` | `SQL/45_system_context/02_tables.sql` | bucle 2026-08-05 |
| `system_context.system_contexts` | `SQL/45_system_context/02_tables.sql` | bucle 2026-08-05 |
| `system_ops.backup_policies` | `SQL/11_system_ops/02_tables.sql` | bucle 2026-08-05 |
| `system_ops.bulk_import_batch_rows` | `SQL/11_system_ops/02_tables.sql` | bucle 2026-08-05 |
| `system_ops.bulk_import_batches` | `SQL/11_system_ops/02_tables.sql` | bucle 2026-08-05 |
| `system_ops.cross_border_transfer_events` | `SQL/11_system_ops/02_tables.sql` | bucle 2026-08-05 |
| `system_ops.draft_records` | `SQL/11_system_ops/02_tables.sql` | bucle 2026-08-05 |
| `system_ops.legal_holds` | `SQL/11_system_ops/02_tables.sql` | bucle 2026-08-05 |
| `system_ops.remediation_plans` | `SQL/11_system_ops/02_tables.sql` | bucle 2026-08-05 |
| `system_ops.security_incidents` | `SQL/11_system_ops/02_tables.sql` | bucle 2026-08-05 |
| `system_ops.tenant_residency_bindings` | `SQL/11_system_ops/02_tables.sql` | bucle 2026-08-05 |
| `system_ops.workload_assessments` | `SQL/11_system_ops/02_tables.sql` | bucle 2026-08-05 |
| `telemetry.user_activity_events` | `SQL/28_telemetry/02_tables.sql` | bucle 2026-08-05 |
| `terminology.tenant_catalog_policies` | `SQL/03_terminology/02_tables.sql` | bucle 2026-08-05 |
| `terminology.tenant_concept_config` | `SQL/03_terminology/02_tables.sql` | bucle 2026-08-05 |
| `time_series.ads_delivery_event_series` | `NoSQL/58_time_series_timescaledb/time_series.timescaledb.sql` | bucle 2026-08-05 |
| `time_series.ai_runtime_metric_series` | `NoSQL/58_time_series_timescaledb/time_series.timescaledb.sql` | bucle 2026-08-05 |
| `time_series.application_tracking_series` | `NoSQL/58_time_series_timescaledb/time_series.timescaledb.sql` | bucle 2026-08-05 |
| `time_series.audit_access_metric_series` | `NoSQL/58_time_series_timescaledb/time_series.timescaledb.sql` | bucle 2026-08-05 |
| `time_series.device_raw_reading_series` | `NoSQL/58_time_series_timescaledb/time_series.timescaledb.sql` | bucle 2026-08-05 |
| `time_series.ingestion_pipeline_metric_series` | `NoSQL/58_time_series_timescaledb/time_series.timescaledb.sql` | bucle 2026-08-05 |
| `time_series.lab_analyzer_event_series` | `NoSQL/58_time_series_timescaledb/time_series.timescaledb.sql` | bucle 2026-08-05 |
| `time_series.location_ping_series` | `NoSQL/58_time_series_timescaledb/time_series.timescaledb.sql` | bucle 2026-08-05 |
| `time_series.normalized_vital_series` | `NoSQL/58_time_series_timescaledb/time_series.timescaledb.sql` | bucle 2026-08-05 |
| `time_series.payment_gateway_metric_series` | `NoSQL/58_time_series_timescaledb/time_series.timescaledb.sql` | bucle 2026-08-05 |
| `time_series.service_sli_series` | `NoSQL/58_time_series_timescaledb/time_series.timescaledb.sql` | bucle 2026-08-05 |
| `time_series.telemetry_event_series` | `NoSQL/58_time_series_timescaledb/time_series.timescaledb.sql` | bucle 2026-08-05 |
| `tracking.milestone_definitions` | `SQL/37_tracking/02_tables.sql` | bucle 2026-08-05 |
| `tracking.shipments` | `SQL/37_tracking/02_tables.sql` | bucle 2026-08-05 |
| `tracking.trackable_subjects` | `SQL/37_tracking/02_tables.sql` | bucle 2026-08-05 |
| `tracking.tracking_carriers` | `SQL/37_tracking/02_tables.sql` | bucle 2026-08-05 |
| `vector_rag.embedding_jobs` | `NoSQL/59_vector_rag_pgvector/vector_rag.pgvector.sql` | bucle 2026-08-05 |
| `vector_rag.rag_access_policies` | `NoSQL/59_vector_rag_pgvector/vector_rag.pgvector.sql` | bucle 2026-08-05 |
| `vector_rag.retrieval_sessions` | `NoSQL/59_vector_rag_pgvector/vector_rag.pgvector.sql` | bucle 2026-08-05 |
| `vector_rag.vector_collections` | `NoSQL/59_vector_rag_pgvector/vector_rag.pgvector.sql` | bucle 2026-08-05 |
| `vector_rag.vector_deletion_jobs` | `NoSQL/59_vector_rag_pgvector/vector_rag.pgvector.sql` | bucle 2026-08-05 |
| `vector_rag.vector_reconciliation_runs` | `NoSQL/59_vector_rag_pgvector/vector_rag.pgvector.sql` | bucle 2026-08-05 |
| `vector_rag.vector_tenant_bindings` | `NoSQL/59_vector_rag_pgvector/vector_rag.pgvector.sql` | bucle 2026-08-05 |
| `workflow.workflow_instances` | `SQL/32_workflow/02_tables.sql` | bucle 2026-08-05 |

Con RLS literal en el modelo (1): `scheduling.appointment_payment_receipts` (`SQL/41_scheduling/02_tables.sql`).

## Lista: copia vendorizada, tablas creadas después del bucle 2026-08-05 (27)

| Tabla | Archivo que la crea | Cobertura |
|---|---|---|
| `community.conversation_assignments` | `SQL/patches/2026-10-31_v4275_personal_apoyo.sql` | lista 2026-10-31_v4279_revision_seguridad_gobierno.sql |
| `community.conversation_internal_notes` | `SQL/patches/2026-10-31_v4275_personal_apoyo.sql` | lista 2026-10-31_v4279_revision_seguridad_gobierno.sql |
| `community.reply_templates` | `SQL/patches/2026-10-31_v4275_personal_apoyo.sql` | lista 2026-10-31_v4279_revision_seguridad_gobierno.sql |
| `delegated_access.access_anomalies` | `SQL/patches/2026-10-31_v4278_gobierno_de_accesos.sql` | lista 2026-10-31_v4279_revision_seguridad_gobierno.sql |
| `delegated_access.access_decision_log` | `SQL/patches/2026-10-31_v4278_gobierno_de_accesos.sql` | lista 2026-10-31_v4279_revision_seguridad_gobierno.sql |
| `delegated_access.access_review_campaigns` | `SQL/patches/2026-10-31_v4278_gobierno_de_accesos.sql` | lista 2026-10-31_v4279_revision_seguridad_gobierno.sql |
| `delegated_access.access_review_items` | `SQL/patches/2026-10-31_v4278_gobierno_de_accesos.sql` | lista 2026-10-31_v4279_revision_seguridad_gobierno.sql |
| `delegated_access.effective_support_access` | `SQL/patches/2026-10-31_v4275_personal_apoyo.sql` | lista 2026-10-31_v4279_revision_seguridad_gobierno.sql |
| `delegated_access.engagement_request_items` | `SQL/patches/2026-10-31_v4275_personal_apoyo.sql` | lista 2026-10-31_v4279_revision_seguridad_gobierno.sql |
| `delegated_access.engagement_requests` | `SQL/patches/2026-10-31_v4275_personal_apoyo.sql` | lista 2026-10-31_v4279_revision_seguridad_gobierno.sql |
| `delegated_access.four_eyes_requests` | `SQL/patches/2026-10-31_v4278_gobierno_de_accesos.sql` | lista 2026-10-31_v4279_revision_seguridad_gobierno.sql |
| `delegated_access.governance_rules` | `SQL/patches/2026-10-31_v4278_gobierno_de_accesos.sql` | lista 2026-10-31_v4279_revision_seguridad_gobierno.sql |
| `delegated_access.grant_usage_stats` | `SQL/patches/2026-10-31_v4278_gobierno_de_accesos.sql` | lista 2026-10-31_v4279_revision_seguridad_gobierno.sql |
| `delegated_access.handover_items` | `SQL/patches/2026-10-31_v4278_gobierno_de_accesos.sql` | lista 2026-10-31_v4279_revision_seguridad_gobierno.sql |
| `delegated_access.lifecycle_cases` | `SQL/patches/2026-10-31_v4278_gobierno_de_accesos.sql` | lista 2026-10-31_v4279_revision_seguridad_gobierno.sql |
| `delegated_access.organization_user_assignments` | `SQL/patches/2026-10-31_v4279_revision_seguridad_gobierno.sql` | lista 2026-10-31_v4279_revision_seguridad_gobierno.sql |
| `delegated_access.patient_restriction_flags` | `SQL/patches/2026-10-31_v4278_gobierno_de_accesos.sql` | lista 2026-10-31_v4279_revision_seguridad_gobierno.sql |
| `delegated_access.practitioner_delegate_assignments` | `SQL/patches/2026-10-31_v4279_revision_seguridad_gobierno.sql` | lista 2026-10-31_v4279_revision_seguridad_gobierno.sql |
| `delegated_access.role_templates` | `SQL/patches/2026-10-31_v4275_personal_apoyo.sql` | lista 2026-10-31_v4279_revision_seguridad_gobierno.sql |
| `delegated_access.sod_exceptions` | `SQL/patches/2026-10-31_v4278_gobierno_de_accesos.sql` | lista 2026-10-31_v4279_revision_seguridad_gobierno.sql |
| `delegated_access.sod_rules` | `SQL/patches/2026-10-31_v4278_gobierno_de_accesos.sql` | lista 2026-10-31_v4279_revision_seguridad_gobierno.sql |
| `delegated_access.support_grant_actions` | `SQL/patches/2026-10-31_v4275_personal_apoyo.sql` | lista 2026-10-31_v4279_revision_seguridad_gobierno.sql |
| `delegated_access.support_scope_grants` | `SQL/patches/2026-10-31_v4275_personal_apoyo.sql` | lista 2026-10-31_v4279_revision_seguridad_gobierno.sql |
| `directory.affiliation_invitation_uses` | `SQL/patches/2026-10-31_v4275_personal_apoyo.sql` | lista 2026-10-31_v4279_revision_seguridad_gobierno.sql |
| `directory.affiliation_invitations` | `SQL/patches/2026-10-31_v4275_personal_apoyo.sql` | lista 2026-10-31_v4279_revision_seguridad_gobierno.sql |
| `iam.session_policies` | `SQL/patches/2026-10-31_v4275_personal_apoyo.sql` | lista 2026-10-31_v4279_revision_seguridad_gobierno.sql |
| `practice.practitioner_location_assignments` | `SQL/patches/2026-10-31_v4275_personal_apoyo.sql` | lista 2026-10-31_v4279_revision_seguridad_gobierno.sql |
