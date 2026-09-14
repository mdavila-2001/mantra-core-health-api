# Catálogo de entidades

> Generado por `yarn docs:data:sync` (`tools/docs/generate-data-catalog.mjs`) cruzando las
> **1246 entidades MikroORM reales** (`tools/catalog/lib/tsentities.mjs`) contra el
> propósito de negocio real de la bóveda SALUD (Obsidian, sibling de este repositorio —
> `../Mantra Core Health Vault/SALUD/Entidades` vía `vault.mjs`, la misma fuente que usa
> `yarn orm:catalog`; `SALUD_VAULT` la sobreescribe) y fallbacks respaldados por el JSDoc de la entidad en este
> repositorio. **1195/1246** entidades tienen descripción de negocio
> verificada; las que no, se marcan explícitamente en vez de fabricar una frase genérica.
>
> Este es el catálogo de lo **implementado**. La bóveda describe 1353 entidades en total
> — la diferencia (107) son entidades diseñadas pero no materializadas aún en
> código; ver [entidades no implementadas](#entidades-disenadas-no-implementadas) al final.

## Por schema (61 schemas · 1246 entidades)

### `accounting` (42 entidades, módulo `accounting`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `account_determination_rules` | `AccountDeterminationRules` | 20 | `id` | ✅ | account_determination_rules guarda reglas y configuración de gobierno del módulo 16 · accounting (dominio Financiero y ERP): parametriza el comportamiento del negocio sin tocar código. |
| `account_groups` | `AccountGroups` | 13 | `id` | ✅ | account_groups es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |
| `accounting_document_links` | `AccountingDocumentLinks` | 10 | `id` | — | accounting_document_links es una tabla de asociación del módulo 16 · accounting (dominio Financiero y ERP): conecta entidades (`journal_transactions`) para representar relaciones muchos-a-muchos. |
| `accounts` | `Accounts` | 18 | `id` | ✅ | accounts es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |
| `accrual_objects` | `AccrualObjects` | 20 | `id` | ✅ | accrual_objects es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |
| `accrual_postings` | `AccrualPostings` | 8 | `id` | — | accrual_postings es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |
| `accrual_schedule_lines` | `AccrualScheduleLines` | 12 | `id` | ✅ | accrual_schedule_lines es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |
| `asset_assignments` | `AssetAssignments` | 17 | `id` | ✅ | asset_assignments es una tabla de asociación del módulo 16 · accounting (dominio Financiero y ERP): conecta entidades (`assets`, `asset_components`) para representar relaciones muchos-a-muchos. |
| `asset_classes` | `AssetClasses` | 17 | `id` | ✅ | asset_classes es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |
| `asset_components` | `AssetComponents` | 15 | `id` | ✅ | asset_components es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |
| `asset_depreciations` | `AssetDepreciations` | 11 | `id` | ✅ | asset_depreciations es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |
| `asset_postings` | `AssetPostings` | 11 | `id` | — | asset_postings es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |
| `asset_valuations` | `AssetValuations` | 17 | `id` | ✅ | asset_valuations es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |
| `assets` | `Assets` | 20 | `id` | ✅ | assets es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |
| `clearing_documents` | `ClearingDocuments` | 10 | `id` | — | clearing_documents es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |
| `clearing_items` | `ClearingItems` | 10 | `id` | — | clearing_items es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |
| `company_bank_accounts` | `CompanyBankAccounts` | 18 | `id` | ✅ | company_bank_accounts es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |
| `controlling_areas` | `ControllingAreas` | 13 | `id` | ✅ | controlling_areas es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |
| `cost_center_maps` | `CostCenterMaps` | 11 | `id` | ✅ | cost_center_maps es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |
| `cost_centers` | `CostCenters` | 12 | `id` | ✅ | cost_centers es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |
| `depreciation_areas` | `DepreciationAreas` | 13 | `id` | ✅ | depreciation_areas es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |
| `employee_payments` | `EmployeePayments` | 14 | `id` | ✅ | employee_payments es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |
| `exchange_rates` | `ExchangeRates` | 11 | `id` | ✅ | exchange_rates es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |
| `fiscal_periods` | `FiscalPeriods` | 11 | `id` | ✅ | fiscal_periods es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |
| `fiscal_years` | `FiscalYears` | 11 | `id` | ✅ | fiscal_years es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |
| `functional_areas` | `FunctionalAreas` | 11 | `id` | ✅ | functional_areas es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |
| `infrastructure_items` | `InfrastructureItems` | 14 | `id` | ✅ | infrastructure_items es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |
| `internal_orders` | `InternalOrders` | 20 | `id` | ✅ | internal_orders es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |
| `journal_entry_assignments` | `JournalEntryAssignments` | 30 | `id` | — | journal_entry_assignments es una tabla de asociación del módulo 16 · accounting (dominio Financiero y ERP): conecta entidades (`ledger_entries`, `cost_centers`, `profit_centers`) para representar relaciones muchos-a-much… |
| `journal_transactions` | `JournalTransactions` | 22 | `id` | ✅ | journal_transactions es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |
| `ledger_entries` | `LedgerEntries` | 16 | `id` | ✅ | ledger_entries es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |
| `liabilities` | `Liabilities` | 19 | `id` | ✅ | liabilities es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |
| `liability_payments` | `LiabilityPayments` | 12 | `id` | ✅ | liability_payments es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |
| `liability_postings` | `LiabilityPostings` | 10 | `id` | — | liability_postings es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |
| `liability_schedules` | `LiabilitySchedules` | 15 | `id` | ✅ | liability_schedules es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |
| `open_items` | `OpenItems` | 20 | `id` | ✅ | open_items es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |
| `profit_centers` | `ProfitCenters` | 16 | `id` | ✅ | profit_centers es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |
| `purchases` | `Purchases` | 15 | `id` | ✅ | purchases es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |
| `sales` | `Sales` | 16 | `id` | ✅ | sales es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |
| `segments` | `AccountingSegments` | 11 | `id` | ✅ | segments es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |
| `subledger_accounts` | `SubledgerAccounts` | 14 | `id` | ✅ | subledger_accounts es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |
| `transaction_files` | `TransactionFiles` | 9 | `id` | ✅ | transaction_files es un registro central de negocio del módulo 16 · accounting (libro mayor y sub-libros contables), dominio Financiero y ERP. |

### `ads` (73 entidades, módulo `ads`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `ad_account_users` | `AdAccountUsers` | 12 | `id` | ✅ | ad_account_users es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `ad_accounts` | `AdAccounts` | 16 | `id` | ✅ | ad_accounts es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `ad_billing_events` | `AdBillingEvents` | 11 | `id` | — | ad_billing_events es un ledger inmutable (append-only) del módulo 43 · ads (dominio Marketing y Crecimiento): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `ad_creatives` | `AdCreatives` | 16 | `id` | ✅ | ad_creatives es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `ad_event_data_policies` | `AdEventDataPolicies` | 16 | `id` | ✅ | ad_event_data_policies guarda reglas y configuración de gobierno del módulo 43 · ads (dominio Marketing y Crecimiento): parametriza el comportamiento del negocio sin tocar código. |
| `ad_event_field_rules` | `AdEventFieldRules` | 13 | `id` | ✅ | ad_event_field_rules guarda reglas y configuración de gobierno del módulo 43 · ads (dominio Marketing y Crecimiento): parametriza el comportamiento del negocio sin tocar código. |
| `ad_experiments` | `AdExperiments` | 17 | `id` | ✅ | ad_experiments es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `ad_identity_asset_assignments` | `AdIdentityAssetAssignments` | 12 | `id` | ✅ | ad_identity_asset_assignments es una tabla de asociación del módulo 43 · ads (dominio Marketing y Crecimiento): conecta entidades (`ad_identity_assets`) para representar relaciones muchos-a-muchos. |
| `ad_identity_assets` | `AdIdentityAssets` | 15 | `id` | ✅ | ad_identity_assets es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `ad_invoice_lines` | `AdInvoiceLines` | 12 | `id` | ✅ | ad_invoice_lines es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `ad_invoices` | `AdInvoices` | 17 | `id` | ✅ | ad_invoices es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `ad_partners` | `AdPartners` | 12 | `id` | ✅ | ad_partners es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `ad_placements` | `AdPlacements` | 11 | `id` | ✅ | ad_placements es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `ad_platform_connections` | `AdPlatformConnections` | 19 | `id` | ✅ | ad_platform_connections es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `ad_policy_appeals` | `AdPolicyAppeals` | 15 | `id` | ✅ | ad_policy_appeals es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `ad_policy_violations` | `AdPolicyViolations` | 15 | `id` | ✅ | ad_policy_violations es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `ad_review_events` | `AdReviewEvents` | 9 | `id` | — | ad_review_events es un ledger inmutable (append-only) del módulo 43 · ads (dominio Marketing y Crecimiento): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `ad_sets` | `AdSets` | 22 | `id` | ✅ | ad_sets es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `ad_sync_checkpoints` | `AdSyncCheckpoints` | 8 | `id` | ✅ | ad_sync_checkpoints es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `ad_sync_runs` | `AdSyncRuns` | 12 | `id` | — | ad_sync_runs es un ledger inmutable (append-only) del módulo 43 · ads (dominio Marketing y Crecimiento): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `ads` | `Ads` | 15 | `id` | ✅ | ads es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `adset_learning_snapshots` | `AdsetLearningSnapshots` | 9 | `id` | — | adset_learning_snapshots es un ledger inmutable (append-only) del módulo 43 · ads (dominio Marketing y Crecimiento): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `attribution_settings` | `AttributionSettings` | 11 | `id` | ✅ | attribution_settings guarda reglas y configuración de gobierno del módulo 43 · ads (dominio Marketing y Crecimiento): parametriza el comportamiento del negocio sin tocar código. |
| `automated_rules` | `AutomatedRules` | 17 | `id` | ✅ | automated_rules guarda reglas y configuración de gobierno del módulo 43 · ads (dominio Marketing y Crecimiento): parametriza el comportamiento del negocio sin tocar código. |
| `blocked_ad_events` | `BlockedAdEvents` | 11 | `id` | — | blocked_ad_events es un ledger inmutable (append-only) del módulo 43 · ads (dominio Marketing y Crecimiento): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `brand_lift_studies` | `BrandLiftStudies` | 16 | `id` | ✅ | brand_lift_studies es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `budget_schedules` | `BudgetSchedules` | 14 | `id` | ✅ | budget_schedules es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `business_managers` | `BusinessManagers` | 13 | `id` | ✅ | business_managers es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `campaigns` | `Campaigns` | 20 | `id` | ✅ | campaigns es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `catalog_feeds` | `CatalogFeeds` | 17 | `id` | ✅ | catalog_feeds forma parte del motor de terminología del módulo 43 · ads: convierte valores de negocio en referencias a un catálogo versionado en vez de enums fijos, para adaptarse a distintos países y estándares (LOINC, … |
| `catalog_products` | `CatalogProducts` | 25 | `id` | ✅ | catalog_products forma parte del motor de terminología del módulo 43 · ads: convierte valores de negocio en referencias a un catálogo versionado en vez de enums fijos, para adaptarse a distintos países y estándares (LOIN… |
| `collection_ads` | `CollectionAds` | 13 | `id` | ✅ | collection_ads es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `conversion_attributions` | `ConversionAttributions` | 10 | `id` | — | conversion_attributions es un ledger inmutable (append-only) del módulo 43 · ads (dominio Marketing y Crecimiento): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `conversion_datasets` | `ConversionDatasets` | 15 | `id` | ✅ | conversion_datasets es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `conversion_event_custom_data` | `ConversionEventCustomData` | 11 | `id` | — | conversion_event_custom_data es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `conversion_event_deduplication` | `ConversionEventDeduplication` | 11 | `id` | — | conversion_event_deduplication es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `conversion_event_delivery_attempts` | `ConversionEventDeliveryAttempts` | 12 | `id` | — | conversion_event_delivery_attempts es un ledger inmutable (append-only) del módulo 43 · ads (dominio Marketing y Crecimiento): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `conversion_event_user_data` | `ConversionEventUserData` | 14 | `id` | — | conversion_event_user_data es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `creative_assets` | `CreativeAssets` | 15 | `id` | ✅ | creative_assets es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `custom_audiences` | `CustomAudiences` | 18 | `id` | ✅ | custom_audiences es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `custom_conversions` | `CustomConversions` | 14 | `id` | ✅ | custom_conversions es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `dataset_connections` | `DatasetConnections` | 13 | `id` | ✅ | dataset_connections es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `dataset_quality_snapshots` | `DatasetQualitySnapshots` | 10 | `id` | — | dataset_quality_snapshots es un ledger inmutable (append-only) del módulo 43 · ads (dominio Marketing y Crecimiento): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `delivery_status_snapshots` | `DeliveryStatusSnapshots` | 10 | `id` | — | delivery_status_snapshots es un ledger inmutable (append-only) del módulo 43 · ads (dominio Marketing y Crecimiento): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `dynamic_ad_templates` | `DynamicAdTemplates` | 16 | `id` | ✅ | dynamic_ad_templates guarda reglas y configuración de gobierno del módulo 43 · ads (dominio Marketing y Crecimiento): parametriza el comportamiento del negocio sin tocar código. |
| `experiment_variants` | `ExperimentVariants` | 13 | `id` | ✅ | experiment_variants es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `external_ad_object_snapshots` | `ExternalAdObjectSnapshots` | 9 | `id` | — | external_ad_object_snapshots es un ledger inmutable (append-only) del módulo 43 · ads (dominio Marketing y Crecimiento): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `feed_run_logs` | `FeedRunLogs` | 11 | `id` | — | feed_run_logs es un ledger inmutable (append-only) del módulo 43 · ads (dominio Marketing y Crecimiento): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `frequency_caps` | `FrequencyCaps` | 11 | `id` | ✅ | frequency_caps es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `insight_breakdown_definitions` | `InsightBreakdownDefinitions` | 12 | `id` | ✅ | insight_breakdown_definitions es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `insight_fact_rows` | `InsightFactRows` | 11 | `id` | — | insight_fact_rows es un ledger inmutable (append-only) del módulo 43 · ads (dominio Marketing y Crecimiento): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `insight_metric_definitions` | `InsightMetricDefinitions` | 14 | `id` | ✅ | insight_metric_definitions es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `insight_query_runs` | `InsightQueryRuns` | 16 | `id` | — | insight_query_runs es un ledger inmutable (append-only) del módulo 43 · ads (dominio Marketing y Crecimiento): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `insights_daily` | `InsightsDaily` | 22 | `id` | — | insights_daily es un ledger inmutable (append-only) del módulo 43 · ads (dominio Marketing y Crecimiento): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `lead_answers` | `LeadAnswers` | 7 | `id` | — | lead_answers es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `lead_delivery_events` | `LeadDeliveryEvents` | 10 | `id` | — | lead_delivery_events es un ledger inmutable (append-only) del módulo 43 · ads (dominio Marketing y Crecimiento): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `lead_form_questions` | `LeadFormQuestions` | 14 | `id` | ✅ | lead_form_questions es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `lead_forms` | `LeadForms` | 17 | `id` | ✅ | lead_forms es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `lead_submissions` | `LeadSubmissions` | 14 | `id` | — | lead_submissions es un ledger inmutable (append-only) del módulo 43 · ads (dominio Marketing y Crecimiento): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `lookalike_specs` | `LookalikeSpecs` | 13 | `id` | ✅ | lookalike_specs es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `offline_conversion_events` | `OfflineConversionEvents` | 12 | `id` | — | offline_conversion_events es un ledger inmutable (append-only) del módulo 43 · ads (dominio Marketing y Crecimiento): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `offline_conversion_sets` | `OfflineConversionSets` | 16 | `id` | ✅ | offline_conversion_sets es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `partner_relationships` | `PartnerRelationships` | 14 | `id` | ✅ | partner_relationships es una tabla de asociación del módulo 43 · ads (dominio Marketing y Crecimiento): conecta entidades (`business_managers`, `ad_partners`) para representar relaciones muchos-a-muchos. |
| `pixel_events` | `PixelEvents` | 15 | `id` | — | pixel_events es un ledger inmutable (append-only) del módulo 43 · ads (dominio Marketing y Crecimiento): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `product_catalogs` | `ProductCatalogs` | 13 | `id` | ✅ | product_catalogs es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `product_localizations` | `ProductLocalizations` | 13 | `id` | ✅ | product_localizations es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `product_set_members` | `ProductSetMembers` | 9 | `id` | ✅ | product_set_members es una tabla de asociación del módulo 43 · ads (dominio Marketing y Crecimiento): conecta entidades (`product_sets`, `catalog_products`) para representar relaciones muchos-a-muchos. |
| `product_sets` | `ProductSets` | 13 | `id` | ✅ | product_sets es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `rule_executions` | `RuleExecutions` | 10 | `id` | — | rule_executions es un ledger inmutable (append-only) del módulo 43 · ads (dominio Marketing y Crecimiento): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `saved_audiences` | `SavedAudiences` | 11 | `id` | ✅ | saved_audiences es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `server_conversion_events` | `ServerConversionEvents` | 18 | `id` | — | server_conversion_events es un ledger inmutable (append-only) del módulo 43 · ads (dominio Marketing y Crecimiento): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `targeting_specs` | `TargetingSpecs` | 20 | `id` | ✅ | targeting_specs es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |
| `tracking_pixels` | `TrackingPixels` | 12 | `id` | ✅ | tracking_pixels es un registro central de negocio del módulo 43 · ads (publicidad, assets, entrega, comercio y optimización), dominio Marketing y Crecimiento. |

### `audio_assets` (4 entidades, módulo `audio_assets`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `audio_assets` | `AudioAssets` | 33 | `id` | — | audio_assets es la caché de audio ya sintetizado. Una fila = una frase concreta convertida en voz, con dónde están sus bytes y en qué estado quedó la generación. |
| `audio_generation_events` | `AudioGenerationEvents` | 13 | `id` | — | audio_generation_events es la bitácora de qué pasó en cada intento de generar audio: qué se pidió, contra qué proveedor, cómo salió y cuánto tardó. |
| `audio_generation_usage` | `AudioGenerationUsage` | 10 | `id` | — | audio_generation_usage es el contador de consumo del proveedor de voz, una fila por mes y por proveedor. Es lo que decide si todavía se puede generar audio nuevo o si hay que degradar a fallback. |
| `audio_templates` | `AudioTemplates` | 13 | `id` | — | audio_templates es el catálogo de frases que la plataforma tiene permiso de sintetizar. Cada fila es una plantilla registrada con su texto, su versión, su idioma y los campos dinámicos que admite. |

### `audit` (131 entidades, módulo `audit`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `accounts_history` | `AccountsHistory` | 10 | `history_id` | — | accounts_history es el historial auditable de `accounts` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `ad_accounts_history` | `AdAccountsHistory` | 10 | `history_id` | — | ad_accounts_history es el historial auditable de `ad_accounts` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `ad_creatives_history` | `AdCreativesHistory` | 10 | `history_id` | — | ad_creatives_history es el historial auditable de `ad_creatives` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `ad_experiments_history` | `AdExperimentsHistory` | 10 | `history_id` | ✅ | ad_experiments_history es el historial auditable de `ad_experiments` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensibl… |
| `ad_sets_history` | `AdSetsHistory` | 10 | `history_id` | — | ad_sets_history es el historial auditable de `ad_sets` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `ads_history` | `AdsHistory` | 10 | `history_id` | — | ads_history es el historial auditable de `ads` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `agent_versions_history` | `AgentVersionsHistory` | 10 | `history_id` | ✅ | agent_versions_history es el historial auditable de `agent_versions` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensibl… |
| `agents_history` | `AgentsHistory` | 10 | `history_id` | ✅ | agents_history es el historial auditable de `agents` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `allergy_intolerances_history` | `AllergyIntolerancesHistory` | 10 | `history_id` | — | allergy_intolerances_history es el historial auditable de `allergy_intolerances` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un … |
| `analytics_governance_log` | `AnalyticsGovernanceLog` | 9 | `id` | — | analytics_governance_log es un ledger inmutable (append-only) del módulo 10 · audit (dominio Auditoría y Reporting): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `appointment_bookings_history` | `AppointmentBookingsHistory` | 10 | `history_id` | — | appointment_bookings_history es el historial auditable de `appointment_bookings` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un … |
| `assets_history` | `AssetsHistory` | 10 | `history_id` | — | assets_history es el historial auditable de `assets` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `audit_log` | `AuditLog` | 14 | `id` | — | audit_log es un ledger inmutable (append-only) del módulo 10 · audit (dominio Auditoría y Reporting): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `automated_rules_history` | `AutomatedRulesHistory` | 10 | `history_id` | ✅ | automated_rules_history es el historial auditable de `automated_rules` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensi… |
| `bills_history` | `BillsHistory` | 10 | `history_id` | — | bills_history es el historial auditable de `bills` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `booking_policies_history` | `BookingPoliciesHistory` | 10 | `history_id` | — | booking_policies_history es el historial auditable de `booking_policies` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sen… |
| `campaigns_history` | `CampaignsHistory` | 10 | `history_id` | — | campaigns_history es el historial auditable de `campaigns` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `care_plans_history` | `CarePlansHistory` | 10 | `history_id` | — | care_plans_history es el historial auditable de `care_plans` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `care_spaces_history` | `CareSpacesHistory` | 10 | `history_id` | — | care_spaces_history es el historial auditable de `care_spaces` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `care_teams_history` | `CareTeamsHistory` | 10 | `history_id` | — | care_teams_history es el historial auditable de `care_teams` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `catalog_products_history` | `CatalogProductsHistory` | 10 | `history_id` | ✅ | catalog_products_history es el historial auditable de `catalog_products` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sen… |
| `cds_rules_history` | `CdsRulesHistory` | 10 | `history_id` | — | cds_rules_history es el historial auditable de `cds_rules` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `certificates_history` | `CertificatesHistory` | 10 | `history_id` | ✅ | certificates_history es el historial auditable de `certificates` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `clinical_alerts_history` | `ClinicalAlertsHistory` | 10 | `history_id` | — | clinical_alerts_history es el historial auditable de `clinical_alerts` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensi… |
| `clinical_note_headers_history` | `ClinicalNoteHeadersHistory` | 10 | `history_id` | — | clinical_note_headers_history es el historial auditable de `clinical_note_headers` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de u… |
| `clinical_units_history` | `ClinicalUnitsHistory` | 10 | `history_id` | — | clinical_units_history es el historial auditable de `clinical_units` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensibl… |
| `comments_history` | `CommentsHistory` | 10 | `history_id` | ✅ | comments_history es el historial auditable de `comments` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `conditions_history` | `ConditionsHistory` | 10 | `history_id` | — | conditions_history es el historial auditable de `conditions` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `connected_accounts_history` | `ConnectedAccountsHistory` | 10 | `history_id` | ✅ | connected_accounts_history es el historial auditable de `connected_accounts` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato… |
| `consents_history` | `ConsentsHistory` | 10 | `history_id` | — | consents_history es el historial auditable de `consents` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `contacts_history` | `ContactsHistory` | 10 | `history_id` | ✅ | contacts_history es el historial auditable de `contacts` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `contracts_history` | `ContractsHistory` | 10 | `history_id` | — | contracts_history es el historial auditable de `contracts` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `conversations_history` | `ConversationsHistory` | 10 | `history_id` | ✅ | conversations_history es el historial auditable de `conversations` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `coupons_history` | `CouponsHistory` | 10 | `history_id` | ✅ | coupons_history es el historial auditable de `coupons` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `course_versions_history` | `CourseVersionsHistory` | 10 | `history_id` | ✅ | course_versions_history es el historial auditable de `course_versions` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensi… |
| `courses_history` | `CoursesHistory` | 10 | `history_id` | ✅ | courses_history es el historial auditable de `courses` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `crm_accounts_history` | `CrmAccountsHistory` | 10 | `history_id` | ✅ | crm_accounts_history es el historial auditable de `crm_accounts` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `custom_audiences_history` | `CustomAudiencesHistory` | 10 | `history_id` | — | custom_audiences_history es el historial auditable de `custom_audiences` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sen… |
| `custom_conversions_history` | `CustomConversionsHistory` | 10 | `history_id` | ✅ | custom_conversions_history es el historial auditable de `custom_conversions` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato… |
| `data_access_log` | `DataAccessLog` | 11 | `id` | — | data_access_log es un ledger inmutable (append-only) del módulo 10 · audit (dominio Auditoría y Reporting): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `delegated_access_audit_log` | `DelegatedAccessAuditLog` | 10 | `id` | — | delegated_access_audit_log es un ledger inmutable (append-only) del módulo 10 · audit (dominio Auditoría y Reporting): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `departments_history` | `DepartmentsHistory` | 10 | `history_id` | — | departments_history es el historial auditable de `departments` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `diagnostic_reports_history` | `DiagnosticReportsHistory` | 10 | `history_id` | — | diagnostic_reports_history es el historial auditable de `diagnostic_reports` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato… |
| `diagnostic_study_prices_history` | `DiagnosticStudyPricesHistory` | 10 | `history_id` | — | diagnostic_study_prices_history es el historial auditable de `diagnostic_study_prices` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' … |
| `document_records_history` | `DocumentRecordsHistory` | 10 | `history_id` | — | document_records_history es el historial auditable de `document_records` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sen… |
| `dsar_requests` | `DsarRequests` | 13 | `id` | ✅ | dsar_requests registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 10 · audit (dominio Auditoría y Reporting): responde a '¿qué está pasando ahora mismo?'. |
| `employment_records_history` | `EmploymentRecordsHistory` | 10 | `history_id` | — | employment_records_history es el historial auditable de `employment_records` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato… |
| `enrollments_history` | `EnrollmentsHistory` | 10 | `history_id` | ✅ | enrollments_history es el historial auditable de `enrollments` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `event_subscriptions_history` | `EventSubscriptionsHistory` | 10 | `history_id` | — | event_subscriptions_history es el historial auditable de `event_subscriptions` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un da… |
| `federated_identities_history` | `FederatedIdentitiesHistory` | 10 | `history_id` | — | federated_identities_history es el historial auditable de `federated_identities` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un … |
| `groups_history` | `GroupsHistory` | 10 | `history_id` | ✅ | groups_history es el historial auditable de `groups` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `guardrail_policies_history` | `GuardrailPoliciesHistory` | 10 | `history_id` | ✅ | guardrail_policies_history es el historial auditable de `guardrail_policies` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato… |
| `health_practitioner_profiles_history` | `HealthPractitionerProfilesHistory` | 10 | `history_id` | — | health_practitioner_profiles_history es el historial auditable de `health_practitioner_profiles` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y… |
| `identity_providers_history` | `IdentityProvidersHistory` | 10 | `history_id` | — | identity_providers_history es el historial auditable de `identity_providers` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato… |
| `identity_verification_access_log` | `IdentityVerificationAccessLog` | 9 | `id` | — | identity_verification_access_log es un ledger inmutable (append-only) del módulo 10 · audit (dominio Auditoría y Reporting): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `imaging_studies_history` | `ImagingStudiesHistory` | 10 | `history_id` | — | imaging_studies_history es el historial auditable de `imaging_studies` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensi… |
| `inbound_messages_history` | `InboundMessagesHistory` | 10 | `history_id` | — | inbound_messages_history es el historial auditable de `inbound_messages` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sen… |
| `informational_materials_history` | `InformationalMaterialsHistory` | 10 | `history_id` | — | _sin descripción verificada en la bóveda_ |
| `insurance_claims_history` | `InsuranceClaimsHistory` | 10 | `history_id` | — | insurance_claims_history es el historial auditable de `insurance_claims` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sen… |
| `insurance_decision_access_log` | `InsuranceDecisionAccessLog` | 10 | `id` | — | insurance_decision_access_log es un ledger inmutable (append-only) del módulo 10 · audit (dominio Auditoría y Reporting): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `integration_endpoints_history` | `IntegrationEndpointsHistory` | 10 | `history_id` | — | integration_endpoints_history es el historial auditable de `integration_endpoints` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de u… |
| `invoices_history` | `InvoicesHistory` | 10 | `history_id` | — | invoices_history es el historial auditable de `invoices` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `journal_transactions_history` | `JournalTransactionsHistory` | 10 | `history_id` | — | journal_transactions_history es el historial auditable de `journal_transactions` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un … |
| `journeys_history` | `JourneysHistory` | 10 | `history_id` | ✅ | journeys_history es el historial auditable de `journeys` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `jurisdiction_authorizations_history` | `JurisdictionAuthorizationsHistory` | 10 | `history_id` | — | jurisdiction_authorizations_history es el historial auditable de `jurisdiction_authorizations` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y d… |
| `liabilities_history` | `LiabilitiesHistory` | 10 | `history_id` | — | liabilities_history es el historial auditable de `liabilities` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `loyalty_memberships_history` | `LoyaltyMembershipsHistory` | 10 | `history_id` | ✅ | loyalty_memberships_history es el historial auditable de `loyalty_memberships` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un da… |
| `loyalty_programs_history` | `LoyaltyProgramsHistory` | 10 | `history_id` | ✅ | loyalty_programs_history es el historial auditable de `loyalty_programs` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sen… |
| `marketing_campaigns_history` | `MarketingCampaignsHistory` | 10 | `history_id` | ✅ | marketing_campaigns_history es el historial auditable de `marketing_campaigns` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un da… |
| `medical_visitors_history` | `MedicalVisitorsHistory` | 10 | `history_id` | — | _sin descripción verificada en la bóveda_ |
| `medication_requests_history` | `MedicationRequestsHistory` | 10 | `history_id` | — | medication_requests_history es el historial auditable de `medication_requests` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un da… |
| `message_retries_history` | `MessageRetriesHistory` | 10 | `history_id` | — | message_retries_history es el historial auditable de `message_retries` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensi… |
| `message_templates_history` | `MessageTemplatesHistory` | 10 | `history_id` | — | message_templates_history es el historial auditable de `message_templates` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato s… |
| `moderation_decisions_history` | `ModerationDecisionsHistory` | 10 | `history_id` | ✅ | moderation_decisions_history es el historial auditable de `moderation_decisions` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un … |
| `moderation_events` | `ModerationEvents` | 9 | `id` | — | moderation_events es un ledger inmutable (append-only) del módulo 10 · audit (dominio Auditoría y Reporting): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `opportunities_history` | `OpportunitiesHistory` | 10 | `history_id` | ✅ | opportunities_history es el historial auditable de `opportunities` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `order_sets_history` | `OrderSetsHistory` | 10 | `history_id` | — | order_sets_history es el historial auditable de `order_sets` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `organization_affiliations_history` | `OrganizationAffiliationsHistory` | 10 | `history_id` | — | organization_affiliations_history es el historial auditable de `organization_affiliations` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y despu… |
| `outbound_messages_history` | `OutboundMessagesHistory` | 10 | `history_id` | — | outbound_messages_history es el historial auditable de `outbound_messages` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato s… |
| `partnership_agreements_history` | `PartnershipAgreementsHistory` | 10 | `history_id` | ✅ | partnership_agreements_history es el historial auditable de `partnership_agreements` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de… |
| `partnerships_history` | `PartnershipsHistory` | 10 | `history_id` | ✅ | partnerships_history es el historial auditable de `partnerships` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `patient_content_access_log` | `PatientContentAccessLog` | 12 | `id` | — | patient_content_access_log es un ledger inmutable (append-only) del módulo 10 · audit (dominio Auditoría y Reporting): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `patient_identity_links_history` | `PatientIdentityLinksHistory` | 10 | `history_id` | — | patient_identity_links_history es el historial auditable de `patient_identity_links` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de… |
| `patient_profiles_history` | `PatientProfilesHistory` | 10 | `history_id` | — | patient_profiles_history es el historial auditable de `patient_profiles` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sen… |
| `payment_intents_history` | `PaymentIntentsHistory` | 10 | `history_id` | — | payment_intents_history es el historial auditable de `payment_intents` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensi… |
| `payment_mandates_history` | `PaymentMandatesHistory` | 10 | `history_id` | ✅ | payment_mandates_history es el historial auditable de `payment_mandates` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sen… |
| `payment_methods_history` | `PaymentMethodsHistory` | 10 | `history_id` | — | payment_methods_history es el historial auditable de `payment_methods` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensi… |
| `payment_transactions_history` | `PaymentTransactionsHistory` | 10 | `history_id` | — | payment_transactions_history es el historial auditable de `payment_transactions` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un … |
| `payouts_history` | `PayoutsHistory` | 10 | `history_id` | — | payouts_history es el historial auditable de `payouts` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `pharma_lab_staff_history` | `PharmaLabStaffHistory` | 10 | `history_id` | — | _sin descripción verificada en la bóveda_ |
| `pharma_labs_history` | `PharmaLabsHistory` | 10 | `history_id` | — | _sin descripción verificada en la bóveda_ |
| `pharma_products_history` | `PharmaProductsHistory` | 10 | `history_id` | — | _sin descripción verificada en la bóveda_ |
| `pharmacovigilance_reports_history` | `PharmacovigilanceReportsHistory` | 10 | `history_id` | — | _sin descripción verificada en la bóveda_ |
| `pharmacy_inventory_access_log` | `PharmacyInventoryAccessLog` | 10 | `id` | — | pharmacy_inventory_access_log es un ledger inmutable (append-only) del módulo 10 · audit (dominio Auditoría y Reporting): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `pharmacy_product_prices_history` | `PharmacyProductPricesHistory` | 10 | `history_id` | — | pharmacy_product_prices_history es el historial auditable de `pharmacy_product_prices` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' … |
| `positions_history` | `PositionsHistory` | 10 | `history_id` | — | positions_history es el historial auditable de `positions` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `practice_sites_history` | `PracticeSitesHistory` | 10 | `history_id` | — | practice_sites_history es el historial auditable de `practice_sites` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensibl… |
| `practices_history` | `PracticesHistory` | 10 | `history_id` | — | practices_history es el historial auditable de `practices` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `practitioner_role_assignments_history` | `PractitionerRoleAssignmentsHistory` | 10 | `history_id` | — | practitioner_role_assignments_history es el historial auditable de `practitioner_role_assignments` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes… |
| `product_catalogs_history` | `ProductCatalogsHistory` | 10 | `history_id` | ✅ | product_catalogs_history es el historial auditable de `product_catalogs` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sen… |
| `product_sets_history` | `ProductSetsHistory` | 10 | `history_id` | ✅ | product_sets_history es el historial auditable de `product_sets` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `professional_credentials_history` | `ProfessionalCredentialsHistory` | 10 | `history_id` | — | professional_credentials_history es el historial auditable de `professional_credentials` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después… |
| `promotions_history` | `PromotionsHistory` | 10 | `history_id` | ✅ | promotions_history es el historial auditable de `promotions` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `provider_channel_configs_history` | `ProviderChannelConfigsHistory` | 10 | `history_id` | — | provider_channel_configs_history es el historial auditable de `provider_channel_configs` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después… |
| `provider_connections_history` | `ProviderConnectionsHistory` | 10 | `history_id` | — | provider_connections_history es el historial auditable de `provider_connections` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un … |
| `provider_protocol_configs_history` | `ProviderProtocolConfigsHistory` | 10 | `history_id` | — | provider_protocol_configs_history es el historial auditable de `provider_protocol_configs` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y despu… |
| `provider_tenant_bindings_history` | `ProviderTenantBindingsHistory` | 10 | `history_id` | — | provider_tenant_bindings_history es el historial auditable de `provider_tenant_bindings` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después… |
| `public_profiles_history` | `PublicProfilesHistory` | 10 | `history_id` | — | public_profiles_history es el historial auditable de `public_profiles` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensi… |
| `record_automations_history` | `RecordAutomationsHistory` | 10 | `history_id` | ✅ | record_automations_history es el historial auditable de `record_automations` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato… |
| `referral_programs_history` | `ReferralProgramsHistory` | 10 | `history_id` | ✅ | referral_programs_history es el historial auditable de `referral_programs` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato s… |
| `referrals_history` | `ReferralsHistory` | 10 | `history_id` | — | referrals_history es el historial auditable de `referrals` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `regulatory_documents_history` | `RegulatoryDocumentsHistory` | 10 | `history_id` | — | _sin descripción verificada en la bóveda_ |
| `report_definitions_history` | `ReportDefinitionsHistory` | 10 | `history_id` | — | report_definitions_history es el historial auditable de `report_definitions` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato… |
| `report_schedules_history` | `ReportSchedulesHistory` | 10 | `history_id` | — | report_schedules_history es el historial auditable de `report_schedules` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sen… |
| `schedule_templates_history` | `ScheduleTemplatesHistory` | 10 | `history_id` | — | schedule_templates_history es el historial auditable de `schedule_templates` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato… |
| `segments_history` | `SegmentsHistory` | 10 | `history_id` | ✅ | segments_history es el historial auditable de `segments` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `service_reviews_history` | `ServiceReviewsHistory` | 10 | `history_id` | — | service_reviews_history es el historial auditable de `service_reviews` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensi… |
| `shipments_history` | `ShipmentsHistory` | 10 | `history_id` | — | shipments_history es el historial auditable de `shipments` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `social_posts_history` | `SocialPostsHistory` | 10 | `history_id` | — | social_posts_history es el historial auditable de `social_posts` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `subscription_plans_history` | `SubscriptionPlansHistory` | 10 | `history_id` | ✅ | subscription_plans_history es el historial auditable de `subscription_plans` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato… |
| `subscriptions_history` | `SubscriptionsHistory` | 10 | `history_id` | ✅ | subscriptions_history es el historial auditable de `subscriptions` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `tenants_history` | `TenantsHistory` | 10 | `history_id` | — | tenants_history es el historial auditable de `tenants` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `test_cases_history` | `TestCasesHistory` | 10 | `history_id` | — | test_cases_history es el historial auditable de `test_cases` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `test_suites_history` | `TestSuitesHistory` | 10 | `history_id` | — | test_suites_history es el historial auditable de `test_suites` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `topics_history` | `TopicsHistory` | 10 | `history_id` | ✅ | topics_history es el historial auditable de `topics` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `trackable_subjects_history` | `TrackableSubjectsHistory` | 10 | `history_id` | — | trackable_subjects_history es el historial auditable de `trackable_subjects` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato… |
| `users_history` | `UsersHistory` | 10 | `history_id` | — | users_history es el historial auditable de `users` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `verified_badges_history` | `VerifiedBadgesHistory` | 10 | `history_id` | ✅ | verified_badges_history es el historial auditable de `verified_badges` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensi… |
| `visit_requests_history` | `VisitRequestsHistory` | 10 | `history_id` | — | _sin descripción verificada en la bóveda_ |
| `wallets_history` | `WalletsHistory` | 10 | `history_id` | ✅ | wallets_history es el historial auditable de `wallets` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `workflows_history` | `WorkflowsHistory` | 10 | `history_id` | ✅ | workflows_history es el historial auditable de `workflows` dentro del módulo 10 · audit (dominio Auditoría y Reporting). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |

### `auth_providers` (9 entidades, módulo `auth_providers`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `account_link_requests` | `AccountLinkRequests` | 13 | `id` | ✅ | account_link_requests registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 40 · auth_providers (dominio Identidad y Seguridad): responde a '¿qué está pasando ahora mismo?'. |
| `federated_identities` | `FederatedIdentities` | 15 | `id` | ✅ | federated_identities es un registro central de negocio del módulo 40 · auth_providers (proveedores de autenticación federada y vinculación de identidad), dominio Identidad y Seguridad. |
| `federated_login_attempts` | `FederatedLoginAttempts` | 13 | `id` | — | federated_login_attempts es un ledger inmutable (append-only) del módulo 40 · auth_providers (dominio Identidad y Seguridad): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `identity_providers` | `IdentityProviders` | 15 | `id` | ✅ | identity_providers es un registro central de negocio del módulo 40 · auth_providers (proveedores de autenticación federada y vinculación de identidad), dominio Identidad y Seguridad. |
| `provider_attribute_mappings` | `ProviderAttributeMappings` | 12 | `id` | ✅ | provider_attribute_mappings es una tabla de asociación del módulo 40 · auth_providers (dominio Identidad y Seguridad): conecta entidades (`identity_providers`) para representar relaciones muchos-a-muchos. |
| `provider_protocol_configs` | `ProviderProtocolConfigs` | 23 | `id` | ✅ | provider_protocol_configs guarda reglas y configuración de gobierno del módulo 40 · auth_providers (dominio Identidad y Seguridad): parametriza el comportamiento del negocio sin tocar código. |
| `provider_signing_keys` | `ProviderSigningKeys` | 15 | `id` | ✅ | provider_signing_keys es un registro central de negocio del módulo 40 · auth_providers (proveedores de autenticación federada y vinculación de identidad), dominio Identidad y Seguridad. |
| `provider_tenant_bindings` | `ProviderTenantBindings` | 15 | `id` | ✅ | provider_tenant_bindings es un registro central de negocio del módulo 40 · auth_providers (proveedores de autenticación federada y vinculación de identidad), dominio Identidad y Seguridad. |
| `provisioning_rules` | `ProvisioningRules` | 14 | `id` | ✅ | provisioning_rules guarda reglas y configuración de gobierno del módulo 40 · auth_providers (dominio Identidad y Seguridad): parametriza el comportamiento del negocio sin tocar código. |

### `authz` (15 entidades, módulo `authz`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `access_policies` | `AccessPolicies` | 13 | `id` | ✅ | access_policies guarda reglas y configuración de gobierno del módulo 06 · authz (dominio Identidad y Seguridad): parametriza el comportamiento del negocio sin tocar código. |
| `break_glass_sessions` | `BreakGlassSessions` | 20 | `id` | ✅ | break_glass_sessions es un registro central de negocio del módulo 06 · authz (autorización, propósito de uso y enmascaramiento de campos), dominio Identidad y Seguridad. |
| `care_relationships` | `CareRelationships` | 15 | `id` | ✅ | care_relationships registra el vínculo asistencial vigente entre un profesional y un paciente. |
| `clinical_access_grants` | `ClinicalAccessGrants` | 17 | `id` | ✅ | clinical_access_grants es un registro central de negocio del módulo 06 · authz (autorización, propósito de uso y enmascaramiento de campos), dominio Identidad y Seguridad. |
| `field_permissions` | `FieldPermissions` | 13 | `id` | ✅ | field_permissions es un registro central de negocio del módulo 06 · authz (autorización, propósito de uso y enmascaramiento de campos), dominio Identidad y Seguridad. |
| `ip_access_rules` | `IpAccessRules` | 17 | `id` | ✅ | ip_access_rules guarda reglas y configuración de gobierno del módulo 06 · authz (dominio Identidad y Seguridad): parametriza el comportamiento del negocio sin tocar código. |
| `patient_legal_representations` | `PatientLegalRepresentations` | 14 | `id` | ✅ | patient_legal_representations registra quién puede actuar legalmente en nombre de un paciente. |
| `permission_categories` | `PermissionCategories` | 10 | `id` | ✅ | permission_categories es un registro central de negocio del módulo 06 · authz (autorización, propósito de uso y enmascaramiento de campos), dominio Identidad y Seguridad. |
| `permissions` | `Permissions` | 18 | `id` | ✅ | permissions es un registro central de negocio del módulo 06 · authz (autorización, propósito de uso y enmascaramiento de campos), dominio Identidad y Seguridad. |
| `resource_scope_grants` | `ResourceScopeGrants` | 15 | `id` | ✅ | resource_scope_grants es un registro central de negocio del módulo 06 · authz (autorización, propósito de uso y enmascaramiento de campos), dominio Identidad y Seguridad. |
| `role_permissions` | `RolePermissions` | 13 | `id` | ✅ | role_permissions es un registro central de negocio del módulo 06 · authz (autorización, propósito de uso y enmascaramiento de campos), dominio Identidad y Seguridad. |
| `roles` | `Roles` | 16 | `id` | ✅ | roles es un registro central de negocio del módulo 06 · authz (autorización, propósito de uso y enmascaramiento de campos), dominio Identidad y Seguridad. |
| `service_principals` | `ServicePrincipals` | 1 | `id` | — | service_principals es un registro central de negocio del módulo 06 · authz (autorización, propósito de uso y enmascaramiento de campos), dominio Identidad y Seguridad. |
| `user_permission_grants` | `UserPermissionGrants` | 16 | `id` | ✅ | user_permission_grants es un registro central de negocio del módulo 06 · authz (autorización, propósito de uso y enmascaramiento de campos), dominio Identidad y Seguridad. |
| `user_role_assignments` | `UserRoleAssignments` | 15 | `id` | ✅ | user_role_assignments es una tabla de asociación del módulo 06 · authz (dominio Identidad y Seguridad): conecta entidades (`roles`) para representar relaciones muchos-a-muchos. |

### `automation` (16 entidades, módulo `automation`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `agent_guardrails` | `AgentGuardrails` | 9 | `id` | ✅ | agent_guardrails es un registro central de negocio del módulo 48 · automation (automatización y orquestación multi-agente), dominio Operaciones de Plataforma. |
| `agent_memory` | `AgentMemory` | 15 | `id` | ✅ | agent_memory es un registro central de negocio del módulo 48 · automation (automatización y orquestación multi-agente), dominio Operaciones de Plataforma. |
| `agent_run_steps` | `AgentRunSteps` | 13 | `id` | — | agent_run_steps es un ledger inmutable (append-only) del módulo 48 · automation (dominio Operaciones de Plataforma): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `agent_runs` | `AgentRuns` | 19 | `id` | ✅ | agent_runs registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 48 · automation (dominio Operaciones de Plataforma): responde a '¿qué está pasando ahora mismo?'. |
| `agent_tool_bindings` | `AgentToolBindings` | 11 | `id` | ✅ | agent_tool_bindings es un registro central de negocio del módulo 48 · automation (automatización y orquestación multi-agente), dominio Operaciones de Plataforma. |
| `agent_tools` | `AgentTools` | 16 | `id` | ✅ | agent_tools es un registro central de negocio del módulo 48 · automation (automatización y orquestación multi-agente), dominio Operaciones de Plataforma. |
| `agent_versions` | `AgentVersions` | 16 | `id` | ✅ | agent_versions es un registro central de negocio del módulo 48 · automation (automatización y orquestación multi-agente), dominio Operaciones de Plataforma. |
| `agents` | `Agents` | 17 | `id` | ✅ | agents es un registro central de negocio del módulo 48 · automation (automatización y orquestación multi-agente), dominio Operaciones de Plataforma. |
| `automation_approvals` | `AutomationApprovals` | 16 | `id` | ✅ | automation_approvals es un registro central de negocio del módulo 48 · automation (automatización y orquestación multi-agente), dominio Operaciones de Plataforma. |
| `automation_triggers` | `AutomationTriggers` | 19 | `id` | ✅ | automation_triggers guarda reglas y configuración de gobierno del módulo 48 · automation (dominio Operaciones de Plataforma): parametriza el comportamiento del negocio sin tocar código. |
| `guardrail_policies` | `GuardrailPolicies` | 15 | `id` | ✅ | guardrail_policies guarda reglas y configuración de gobierno del módulo 48 · automation (dominio Operaciones de Plataforma): parametriza el comportamiento del negocio sin tocar código. |
| `knowledge_sources` | `KnowledgeSources` | 14 | `id` | ✅ | knowledge_sources es un registro central de negocio del módulo 48 · automation (automatización y orquestación multi-agente), dominio Operaciones de Plataforma. |
| `record_automations` | `RecordAutomations` | 17 | `id` | ✅ | record_automations es un registro central de negocio del módulo 48 · automation (automatización y orquestación multi-agente), dominio Operaciones de Plataforma. |
| `workflow_runs` | `WorkflowRuns` | 19 | `id` | ✅ | workflow_runs registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 48 · automation (dominio Operaciones de Plataforma): responde a '¿qué está pasando ahora mismo?'. |
| `workflow_steps` | `WorkflowSteps` | 15 | `id` | ✅ | workflow_steps es un registro central de negocio del módulo 48 · automation (automatización y orquestación multi-agente), dominio Operaciones de Plataforma. |
| `workflows` | `Workflows` | 14 | `id` | ✅ | workflows es un registro central de negocio del módulo 48 · automation (automatización y orquestación multi-agente), dominio Operaciones de Plataforma. |

### `billing` (22 entidades, módulo `billing`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `bill_lines` | `BillLines` | 18 | `id` | ✅ | bill_lines es un registro central de negocio del módulo 17 · billing (facturación, cuentas por cobrar/pagar y planificación financiera), dominio Financiero y ERP. |
| `billing_document_links` | `BillingDocumentLinks` | 12 | `id` | — | billing_document_links es una tabla de asociación del módulo 17 · billing (dominio Financiero y ERP): conecta entidades (otras entidades del módulo) para representar relaciones muchos-a-muchos. |
| `bills` | `Bills` | 23 | `id` | ✅ | bills es un registro central de negocio del módulo 17 · billing (facturación, cuentas por cobrar/pagar y planificación financiera), dominio Financiero y ERP. |
| `budget_lines` | `BudgetLines` | 11 | `id` | ✅ | budget_lines es un registro central de negocio del módulo 17 · billing (facturación, cuentas por cobrar/pagar y planificación financiera), dominio Financiero y ERP. |
| `budgets` | `Budgets` | 10 | `id` | ✅ | budgets es un registro central de negocio del módulo 17 · billing (facturación, cuentas por cobrar/pagar y planificación financiera), dominio Financiero y ERP. |
| `dunning_items` | `DunningItems` | 12 | `id` | — | dunning_items es un registro central de negocio del módulo 17 · billing (facturación, cuentas por cobrar/pagar y planificación financiera), dominio Financiero y ERP. |
| `dunning_runs` | `DunningRuns` | 9 | `id` | — | dunning_runs registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 17 · billing (dominio Financiero y ERP): responde a '¿qué está pasando ahora mismo?'. |
| `financial_kpi_snapshots` | `FinancialKpiSnapshots` | 9 | `id` | — | financial_kpi_snapshots es un ledger inmutable (append-only) del módulo 17 · billing (dominio Financiero y ERP): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `invoice_lines` | `InvoiceLines` | 19 | `id` | ✅ | invoice_lines es un registro central de negocio del módulo 17 · billing (facturación, cuentas por cobrar/pagar y planificación financiera), dominio Financiero y ERP. |
| `invoices` | `Invoices` | 25 | `id` | ✅ | invoices es un registro central de negocio del módulo 17 · billing (facturación, cuentas por cobrar/pagar y planificación financiera), dominio Financiero y ERP. |
| `patient_statements` | `PatientStatements` | 15 | `id` | ✅ | patient_statements es un registro central de negocio del módulo 17 · billing (facturación, cuentas por cobrar/pagar y planificación financiera), dominio Financiero y ERP. |
| `payable_payment_allocations` | `PayablePaymentAllocations` | 11 | `id` | — | payable_payment_allocations es un registro central de negocio del módulo 17 · billing (facturación, cuentas por cobrar/pagar y planificación financiera), dominio Financiero y ERP. |
| `payments_made` | `PaymentsMade` | 17 | `id` | ✅ | payments_made es un registro central de negocio del módulo 17 · billing (facturación, cuentas por cobrar/pagar y planificación financiera), dominio Financiero y ERP. |
| `payments_received` | `PaymentsReceived` | 18 | `id` | ✅ | payments_received es un registro central de negocio del módulo 17 · billing (facturación, cuentas por cobrar/pagar y planificación financiera), dominio Financiero y ERP. |
| `quotation_installments` | `QuotationInstallments` | 10 | `id` | ✅ | quotation_installments es cada cuota del plan de pagos de una cotización, congelada al momento de cotizar: número de cuota, vencimiento, capital, interés y total. |
| `quotations` | `Quotations` | 20 | `id` | ✅ | quotations es la cotización que un profesional le ofrece a un paciente antes de la atención: un servicio del catálogo, un precio ofrecido y un plan de pagos simulado (tasa, plazo, método FLAT/FRENCH), con una validez fij… |
| `receivable_payment_allocations` | `ReceivablePaymentAllocations` | 11 | `id` | — | receivable_payment_allocations es un registro central de negocio del módulo 17 · billing (facturación, cuentas por cobrar/pagar y planificación financiera), dominio Financiero y ERP. |
| `reimbursements` | `Reimbursements` | 11 | `id` | ✅ | reimbursements es un registro central de negocio del módulo 17 · billing (facturación, cuentas por cobrar/pagar y planificación financiera), dominio Financiero y ERP. |
| `service_catalog` | `ServiceCatalog` | 17 | `id` | ✅ | service_catalog es un registro central de negocio del módulo 17 · billing (facturación, cuentas por cobrar/pagar y planificación financiera), dominio Financiero y ERP. |
| `tax_codes` | `TaxCodes` | 14 | `id` | ✅ | tax_codes es un registro central de negocio del módulo 17 · billing (facturación, cuentas por cobrar/pagar y planificación financiera), dominio Financiero y ERP. |
| `tax_periods` | `TaxPeriods` | 13 | `id` | ✅ | tax_periods es un registro central de negocio del módulo 17 · billing (facturación, cuentas por cobrar/pagar y planificación financiera), dominio Financiero y ERP. |
| `vendors` | `Vendors` | 14 | `id` | ✅ | vendors es un registro central de negocio del módulo 17 · billing (facturación, cuentas por cobrar/pagar y planificación financiera), dominio Financiero y ERP. |

### `chart` (11 entidades, módulo `chart`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `care_plan_activities` | `CarePlanActivities` | 11 | `id` | ✅ | care_plan_activities es un registro central de negocio del módulo 15 · chart (historia clínica versionada, notas y documentos), dominio Clínico y Diagnóstico. |
| `care_plans` | `CarePlans` | 15 | `id` | ✅ | care_plans es un registro central de negocio del módulo 15 · chart (historia clínica versionada, notas y documentos), dominio Clínico y Diagnóstico. |
| `chart_template_assignments` | `ChartTemplateAssignments` | 11 | `id` | ✅ | chart_template_assignments es una tabla de asociación del módulo 15 · chart (dominio Clínico y Diagnóstico): conecta entidades (`specialty_chart_templates`) para representar relaciones muchos-a-muchos. |
| `clinical_note_headers` | `ClinicalNoteHeaders` | 14 | `id` | ✅ | clinical_note_headers es un registro central de negocio del módulo 15 · chart (historia clínica versionada, notas y documentos), dominio Clínico y Diagnóstico. |
| `clinical_note_signatures` | `ClinicalNoteSignatures` | 8 | `id` | — | clinical_note_signatures es un registro central de negocio del módulo 15 · chart (historia clínica versionada, notas y documentos), dominio Clínico y Diagnóstico. |
| `clinical_note_versions` | `ClinicalNoteVersions` | 19 | `id` | — | clinical_note_versions es un registro central de negocio del módulo 15 · chart (historia clínica versionada, notas y documentos), dominio Clínico y Diagnóstico. |
| `document_record_files` | `DocumentRecordFiles` | 7 | `id` | — | document_record_files es un registro central de negocio del módulo 15 · chart (historia clínica versionada, notas y documentos), dominio Clínico y Diagnóstico. |
| `document_records` | `DocumentRecords` | 18 | `id` | ✅ | document_records es un registro central de negocio del módulo 15 · chart (historia clínica versionada, notas y documentos), dominio Clínico y Diagnóstico. |
| `note_release_events` | `NoteReleaseEvents` | 9 | `id` | — | note_release_events es un ledger inmutable (append-only) del módulo 15 · chart (dominio Clínico y Diagnóstico): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `physical_exam_findings` | `PhysicalExamFindings` | 8 | `id` | — | physical_exam_findings es un registro central de negocio del módulo 15 · chart (historia clínica versionada, notas y documentos), dominio Clínico y Diagnóstico. |
| `specialty_chart_templates` | `SpecialtyChartTemplates` | 13 | `id` | ✅ | specialty_chart_templates guarda reglas y configuración de gobierno del módulo 15 · chart (dominio Clínico y Diagnóstico): parametriza el comportamiento del negocio sin tocar código. |

### `clinical` (22 entidades, módulo `clinical`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `allergy_intolerances` | `AllergyIntolerances` | 15 | `id` | ✅ | allergy_intolerances es un registro central de negocio del módulo 08 · clinical (registro clínico central, órdenes y logística de encuentros), dominio Clínico y Diagnóstico. |
| `allergy_reactions` | `AllergyReactions` | 10 | `id` | ✅ | allergy_reactions es un registro central de negocio del módulo 08 · clinical (registro clínico central, órdenes y logística de encuentros), dominio Clínico y Diagnóstico. |
| `appointments` | `Appointments` | 16 | `id` | ✅ | appointments es un registro central de negocio del módulo 08 · clinical (registro clínico central, órdenes y logística de encuentros), dominio Clínico y Diagnóstico. |
| `care_episodes` | `CareEpisodes` | 13 | `id` | ✅ | care_episodes es un registro central de negocio del módulo 08 · clinical (registro clínico central, órdenes y logística de encuentros), dominio Clínico y Diagnóstico. |
| `conditions` | `Conditions` | 21 | `id` | ✅ | conditions es un registro central de negocio del módulo 08 · clinical (registro clínico central, órdenes y logística de encuentros), dominio Clínico y Diagnóstico. |
| `diagnostic_reports` | `DiagnosticReports` | 16 | `id` | ✅ | diagnostic_reports es un registro central de negocio del módulo 08 · clinical (registro clínico central, órdenes y logística de encuentros), dominio Clínico y Diagnóstico. |
| `encounter_locations` | `EncounterLocations` | 13 | `id` | ✅ | encounter_locations es un registro central de negocio del módulo 08 · clinical (registro clínico central, órdenes y logística de encuentros), dominio Clínico y Diagnóstico. |
| `encounter_participants` | `EncounterParticipants` | 14 | `id` | ✅ | encounter_participants es una tabla de asociación del módulo 08 · clinical (dominio Clínico y Diagnóstico): conecta entidades (`encounters`) para representar relaciones muchos-a-muchos. |
| `encounters` | `Encounters` | 18 | `id` | ✅ | encounters es un registro central de negocio del módulo 08 · clinical (registro clínico central, órdenes y logística de encuentros), dominio Clínico y Diagnóstico. |
| `family_member_history` | `FamilyMemberHistory` | 15 | `id` | ✅ | family_member_history es el historial auditable de `family_member` dentro del módulo 08 · clinical (dominio Clínico y Diagnóstico). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensib… |
| `immunizations` | `Immunizations` | 15 | `id` | ✅ | immunizations es un registro central de negocio del módulo 08 · clinical (registro clínico central, órdenes y logística de encuentros), dominio Clínico y Diagnóstico. |
| `medication_records` | `MedicationRecords` | 16 | `id` | ✅ | medication_records es un registro central de negocio del módulo 08 · clinical (registro clínico central, órdenes y logística de encuentros), dominio Clínico y Diagnóstico. |
| `medication_requests` | `MedicationRequests` | 31 | `id` | ✅ | medication_requests registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 08 · clinical (dominio Clínico y Diagnóstico): responde a '¿qué está pasando ahora mismo?'. |
| `observation_components` | `ObservationComponents` | 23 | `id` | ✅ | observation_components es un registro central de negocio del módulo 08 · clinical (registro clínico central, órdenes y logística de encuentros), dominio Clínico y Diagnóstico. |
| `observation_notes` | `ObservationNotes` | 5 | `id` | — | observation_notes es un registro central de negocio del módulo 08 · clinical (registro clínico central, órdenes y logística de encuentros), dominio Clínico y Diagnóstico. |
| `observation_performers` | `ObservationPerformers` | 8 | `id` | — | observation_performers es un registro central de negocio del módulo 08 · clinical (registro clínico central, órdenes y logística de encuentros), dominio Clínico y Diagnóstico. |
| `observation_reference_ranges` | `ObservationReferenceRanges` | 13 | `id` | — | observation_reference_ranges es un registro central de negocio del módulo 08 · clinical (registro clínico central, órdenes y logística de encuentros), dominio Clínico y Diagnóstico. |
| `observations` | `Observations` | 44 | `id` | ✅ | observations es un registro central de negocio del módulo 08 · clinical (registro clínico central, órdenes y logística de encuentros), dominio Clínico y Diagnóstico. |
| `prescription_signature_policies` | `PrescriptionSignaturePolicies` | 13 | `id` | ✅ | prescription_signature_policies registra cuándo una receta exige firma, de forma configurable por tenant. |
| `procedures` | `Procedures` | 28 | `id` | ✅ | procedures es un registro central de negocio del módulo 08 · clinical (registro clínico central, órdenes y logística de encuentros), dominio Clínico y Diagnóstico. |
| `service_requests` | `ServiceRequests` | 16 | `id` | ✅ | service_requests registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 08 · clinical (dominio Clínico y Diagnóstico): responde a '¿qué está pasando ahora mismo?'. |
| `social_history` | `SocialHistory` | 16 | `id` | ✅ | social_history es el historial auditable de `social` dentro del módulo 08 · clinical (dominio Clínico y Diagnóstico). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |

### `clinical_ext` (13 entidades, módulo `clinical_ext`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `care_gaps` | `CareGaps` | 14 | `id` | ✅ | care_gaps es un registro central de negocio del módulo 18 · clinical_ext (coordinación de cuidado, alertas y soporte de decisión), dominio Clínico y Diagnóstico. |
| `care_team_members` | `CareTeamMembers` | 14 | `id` | ✅ | care_team_members es una tabla de asociación del módulo 18 · clinical_ext (dominio Clínico y Diagnóstico): conecta entidades (`care_teams`) para representar relaciones muchos-a-muchos. |
| `care_teams` | `CareTeams` | 14 | `id` | ✅ | care_teams es un registro central de negocio del módulo 18 · clinical_ext (coordinación de cuidado, alertas y soporte de decisión), dominio Clínico y Diagnóstico. |
| `cds_rules` | `CdsRules` | 16 | `id` | ✅ | cds_rules guarda reglas y configuración de gobierno del módulo 18 · clinical_ext (dominio Clínico y Diagnóstico): parametriza el comportamiento del negocio sin tocar código. |
| `clinical_alerts` | `ClinicalAlerts` | 20 | `id` | ✅ | clinical_alerts es un registro central de negocio del módulo 18 · clinical_ext (coordinación de cuidado, alertas y soporte de decisión), dominio Clínico y Diagnóstico. |
| `drug_interactions` | `DrugInteractions` | 14 | `id` | ✅ | drug_interactions es un registro central de negocio del módulo 18 · clinical_ext (coordinación de cuidado, alertas y soporte de decisión), dominio Clínico y Diagnóstico. |
| `immunization_schedules` | `ImmunizationSchedules` | 14 | `id` | ✅ | immunization_schedules es un registro central de negocio del módulo 18 · clinical_ext (coordinación de cuidado, alertas y soporte de decisión), dominio Clínico y Diagnóstico. |
| `order_set_items` | `OrderSetItems` | 14 | `id` | ✅ | order_set_items es un registro central de negocio del módulo 18 · clinical_ext (coordinación de cuidado, alertas y soporte de decisión), dominio Clínico y Diagnóstico. |
| `order_sets` | `OrderSets` | 14 | `id` | ✅ | order_sets es un registro central de negocio del módulo 18 · clinical_ext (coordinación de cuidado, alertas y soporte de decisión), dominio Clínico y Diagnóstico. |
| `prescription_favorites` | `PrescriptionFavorites` | 16 | `id` | ✅ | los favoritos de prescripción de un profesional: la indicación que repite todos los días —«Amoxicilina 500 mg cada 8 h por 7 días»— guardada con un rótulo propio para no volver a tipearla. Es una comodidad de captura, no… |
| `reference_ranges` | `ReferenceRanges` | 18 | `id` | ✅ | reference_ranges es un registro central de negocio del módulo 18 · clinical_ext (coordinación de cuidado, alertas y soporte de decisión), dominio Clínico y Diagnóstico. |
| `referrals` | `Referrals` | 19 | `id` | ✅ | referrals es un registro central de negocio del módulo 18 · clinical_ext (coordinación de cuidado, alertas y soporte de decisión), dominio Clínico y Diagnóstico. |
| `virtual_encounters` | `VirtualEncounters` | 14 | `id` | ✅ | virtual_encounters es un registro central de negocio del módulo 18 · clinical_ext (coordinación de cuidado, alertas y soporte de decisión), dominio Clínico y Diagnóstico. |

### `common` (7 entidades, módulo `common`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `addresses` | `Addresses` | 20 | `id` | ✅ | addresses es un registro central de negocio del módulo 02 · common (identificadores, contactos, direcciones y archivos compartidos), dominio Núcleo y Terminología. |
| `contact_points` | `ContactPoints` | 15 | `id` | ✅ | contact_points es un registro central de negocio del módulo 02 · common (identificadores, contactos, direcciones y archivos compartidos), dominio Núcleo y Terminología. |
| `file_derivatives` | `FileDerivatives` | 7 | `id` | — | file_derivatives es un registro central de negocio del módulo 02 · common (identificadores, contactos, direcciones y archivos compartidos), dominio Núcleo y Terminología. |
| `file_links` | `FileLinks` | 13 | `id` | ✅ | file_links es una tabla de asociación del módulo 02 · common (dominio Núcleo y Terminología): conecta entidades (`files`) para representar relaciones muchos-a-muchos. |
| `file_versions` | `FileVersions` | 22 | `id` | — | file_versions es un registro central de negocio del módulo 02 · common (identificadores, contactos, direcciones y archivos compartidos), dominio Núcleo y Terminología. |
| `files` | `Files` | 15 | `id` | ✅ | files es un registro central de negocio del módulo 02 · common (identificadores, contactos, direcciones y archivos compartidos), dominio Núcleo y Terminología. |
| `identifiers` | `Identifiers` | 19 | `id` | ✅ | identifiers es un registro central de negocio del módulo 02 · common (identificadores, contactos, direcciones y archivos compartidos), dominio Núcleo y Terminología. |

### `community` (40 entidades, módulo `community`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `bookmarks` | `Bookmarks` | 10 | `id` | ✅ | bookmarks es un registro central de negocio del módulo 19 · community (perfiles públicos, grafo social, mensajería y moderación), dominio Marketing y Crecimiento. |
| `chat_auto_replies` | `ChatAutoReplies` | 15 | `id` | ✅ | _sin descripción verificada en la bóveda_ |
| `comment_media` | `CommentMedia` | 8 | `id` | — | _sin descripción verificada en la bóveda_ |
| `comments` | `Comments` | 20 | `id` | ✅ | comments es un registro central de negocio del módulo 19 · community (perfiles públicos, grafo social, mensajería y moderación), dominio Marketing y Crecimiento. |
| `content_hashtags` | `ContentHashtags` | 9 | `id` | ✅ | content_hashtags es un registro central de negocio del módulo 19 · community (perfiles públicos, grafo social, mensajería y moderación), dominio Marketing y Crecimiento. |
| `content_reports` | `ContentReports` | 11 | `id` | — | content_reports es un registro central de negocio del módulo 19 · community (perfiles públicos, grafo social, mensajería y moderación), dominio Marketing y Crecimiento. |
| `conversation_participants` | `ConversationParticipants` | 17 | `id` | ✅ | conversation_participants es una tabla de asociación del módulo 19 · community (dominio Marketing y Crecimiento): conecta entidades (`conversations`) para representar relaciones muchos-a-muchos. |
| `conversations` | `Conversations` | 13 | `id` | ✅ | conversations es un registro central de negocio del módulo 19 · community (perfiles públicos, grafo social, mensajería y moderación), dominio Marketing y Crecimiento. |
| `direct_messages` | `DirectMessages` | 16 | `id` | ✅ | direct_messages es un registro central de negocio del módulo 19 · community (perfiles públicos, grafo social, mensajería y moderación), dominio Marketing y Crecimiento. |
| `feed_items` | `FeedItems` | 15 | `id` | ✅ | feed_items es un registro central de negocio del módulo 19 · community (perfiles públicos, grafo social, mensajería y moderación), dominio Marketing y Crecimiento. |
| `feedback_ticket_comments` | `FeedbackTicketComments` | 11 | `id` | ✅ | feedback_ticket_comments es un registro central de negocio del módulo 19 · community (perfiles públicos, grafo social, mensajería y moderación), dominio Marketing y Crecimiento. |
| `feedback_ticket_events` | `FeedbackTicketEvents` | 9 | `history_id` | — | feedback_ticket_events es el historial auditable de `feedback_tickets` dentro del módulo 19 · community (dominio Marketing y Crecimiento). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato… |
| `feedback_tickets` | `FeedbackTickets` | 23 | `id` | ✅ | feedback_tickets es un registro central de negocio del módulo 19 · community (perfiles públicos, grafo social, mensajería y moderación), dominio Marketing y Crecimiento. |
| `group_members` | `GroupMembers` | 12 | `id` | ✅ | group_members es una tabla de asociación del módulo 19 · community (dominio Marketing y Crecimiento): conecta entidades (`groups`) para representar relaciones muchos-a-muchos. |
| `groups` | `Groups` | 18 | `id` | ✅ | groups es un registro central de negocio del módulo 19 · community (perfiles públicos, grafo social, mensajería y moderación), dominio Marketing y Crecimiento. |
| `hashtags` | `Hashtags` | 11 | `id` | ✅ | hashtags es un registro central de negocio del módulo 19 · community (perfiles públicos, grafo social, mensajería y moderación), dominio Marketing y Crecimiento. |
| `mentions` | `Mentions` | 12 | `id` | ✅ | mentions es un registro central de negocio del módulo 19 · community (perfiles públicos, grafo social, mensajería y moderación), dominio Marketing y Crecimiento. |
| `message_receipts` | `MessageReceipts` | 7 | `id` | — | message_receipts es un ledger inmutable (append-only) del módulo 19 · community (dominio Marketing y Crecimiento): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `moderation_appeals` | `ModerationAppeals` | 13 | `id` | ✅ | moderation_appeals es un registro central de negocio del módulo 19 · community (perfiles públicos, grafo social, mensajería y moderación), dominio Marketing y Crecimiento. |
| `moderation_decisions` | `ModerationDecisions` | 13 | `id` | ✅ | moderation_decisions es un registro central de negocio del módulo 19 · community (perfiles públicos, grafo social, mensajería y moderación), dominio Marketing y Crecimiento. |
| `moderation_queue` | `ModerationQueue` | 16 | `id` | ✅ | moderation_queue es un registro central de negocio del módulo 19 · community (perfiles públicos, grafo social, mensajería y moderación), dominio Marketing y Crecimiento. |
| `moderation_strikes` | `ModerationStrikes` | 12 | `id` | ✅ | moderation_strikes es un registro central de negocio del módulo 19 · community (perfiles públicos, grafo social, mensajería y moderación), dominio Marketing y Crecimiento. |
| `poll_options` | `PollOptions` | 10 | `id` | ✅ | poll_options es un registro central de negocio del módulo 19 · community (perfiles públicos, grafo social, mensajería y moderación), dominio Marketing y Crecimiento. |
| `poll_votes` | `PollVotes` | 9 | `id` | ✅ | poll_votes es un registro central de negocio del módulo 19 · community (perfiles públicos, grafo social, mensajería y moderación), dominio Marketing y Crecimiento. |
| `polls` | `Polls` | 12 | `id` | ✅ | polls es un registro central de negocio del módulo 19 · community (perfiles públicos, grafo social, mensajería y moderación), dominio Marketing y Crecimiento. |
| `post_media` | `PostMedia` | 8 | `id` | — | post_media es un registro central de negocio del módulo 19 · community (perfiles públicos, grafo social, mensajería y moderación), dominio Marketing y Crecimiento. |
| `post_shares` | `PostShares` | 11 | `id` | ✅ | post_shares es un registro central de negocio del módulo 19 · community (perfiles públicos, grafo social, mensajería y moderación), dominio Marketing y Crecimiento. |
| `prestige_awards` | `PrestigeAwards` | 17 | `id` | — | prestige_awards es un ledger inmutable (append-only) del módulo 19 · community (dominio Marketing y Crecimiento): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `prestige_scores` | `PrestigeScores` | 16 | `id` | ✅ | prestige_scores es un registro central de negocio del módulo 19 · community (perfiles públicos, grafo social, mensajería y moderación), dominio Marketing y Crecimiento. |
| `public_profiles` | `PublicProfiles` | 20 | `id` | ✅ | public_profiles es un registro central de negocio del módulo 19 · community (perfiles públicos, grafo social, mensajería y moderación), dominio Marketing y Crecimiento. |
| `reactions` | `Reactions` | 10 | `id` | ✅ | reactions es un registro central de negocio del módulo 19 · community (perfiles públicos, grafo social, mensajería y moderación), dominio Marketing y Crecimiento. |
| `review_dimension_scores` | `ReviewDimensionScores` | 5 | `id` | — | review_dimension_scores es un registro central de negocio del módulo 19 · community (perfiles públicos, grafo social, mensajería y moderación), dominio Marketing y Crecimiento. |
| `review_responses` | `ReviewResponses` | 11 | `id` | ✅ | review_responses es un registro central de negocio del módulo 19 · community (perfiles públicos, grafo social, mensajería y moderación), dominio Marketing y Crecimiento. |
| `service_reviews` | `ServiceReviews` | 17 | `id` | ✅ | service_reviews es un registro central de negocio del módulo 19 · community (perfiles públicos, grafo social, mensajería y moderación), dominio Marketing y Crecimiento. |
| `social_follows` | `SocialFollows` | 11 | `id` | ✅ | social_follows es un registro central de negocio del módulo 19 · community (perfiles públicos, grafo social, mensajería y moderación), dominio Marketing y Crecimiento. |
| `social_notifications` | `SocialNotifications` | 16 | `id` | ✅ | social_notifications es un registro central de negocio del módulo 19 · community (perfiles públicos, grafo social, mensajería y moderación), dominio Marketing y Crecimiento. |
| `social_posts` | `SocialPosts` | 16 | `id` | ✅ | social_posts es un registro central de negocio del módulo 19 · community (perfiles públicos, grafo social, mensajería y moderación), dominio Marketing y Crecimiento. |
| `topics` | `Topics` | 12 | `id` | ✅ | topics es un registro central de negocio del módulo 19 · community (perfiles públicos, grafo social, mensajería y moderación), dominio Marketing y Crecimiento. |
| `user_blocks` | `UserBlocks` | 10 | `id` | ✅ | user_blocks es un registro central de negocio del módulo 19 · community (perfiles públicos, grafo social, mensajería y moderación), dominio Marketing y Crecimiento. |
| `verified_badges` | `VerifiedBadges` | 15 | `id` | ✅ | verified_badges es un registro central de negocio del módulo 19 · community (perfiles públicos, grafo social, mensajería y moderación), dominio Marketing y Crecimiento. |

### `consent` (10 entidades, módulo `consent`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `consent_events` | `ConsentEvents` | 10 | `id` | — | consent_events registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 07 · consent (dominio Identidad y Seguridad): responde a '¿qué está pasando ahora mismo?'. |
| `consent_evidence` | `ConsentEvidence` | 11 | `id` | — | consent_evidence es un registro central de negocio del módulo 07 · consent (directivas de privacidad, bases legales y evidencia de consentimiento), dominio Identidad y Seguridad. |
| `consent_provisions` | `ConsentProvisions` | 17 | `id` | ✅ | consent_provisions es un registro central de negocio del módulo 07 · consent (directivas de privacidad, bases legales y evidencia de consentimiento), dominio Identidad y Seguridad. |
| `consents` | `Consents` | 20 | `id` | ✅ | consents es un registro central de negocio del módulo 07 · consent (directivas de privacidad, bases legales y evidencia de consentimiento), dominio Identidad y Seguridad. |
| `hipaa_authorizations` | `HipaaAuthorizations` | 17 | `id` | ✅ | hipaa_authorizations es un registro central de negocio del módulo 07 · consent (directivas de privacidad, bases legales y evidencia de consentimiento), dominio Identidad y Seguridad. |
| `patient_objections` | `PatientObjections` | 15 | `id` | ✅ | patient_objections es un registro central de negocio del módulo 07 · consent (directivas de privacidad, bases legales y evidencia de consentimiento), dominio Identidad y Seguridad. |
| `privacy_restrictions` | `PrivacyRestrictions` | 16 | `id` | ✅ | privacy_restrictions es un registro central de negocio del módulo 07 · consent (directivas de privacidad, bases legales y evidencia de consentimiento), dominio Identidad y Seguridad. |
| `processing_legal_bases` | `ProcessingLegalBases` | 16 | `id` | ✅ | processing_legal_bases es un registro central de negocio del módulo 07 · consent (directivas de privacidad, bases legales y evidencia de consentimiento), dominio Identidad y Seguridad. |
| `processing_purposes` | `ProcessingPurposes` | 13 | `id` | ✅ | processing_purposes es un registro central de negocio del módulo 07 · consent (directivas de privacidad, bases legales y evidencia de consentimiento), dominio Identidad y Seguridad. |
| `treatment_informed_consents` | `TreatmentInformedConsents` | 17 | `id` | ✅ | treatment_informed_consents es un registro central de negocio del módulo 07 · consent (directivas de privacidad, bases legales y evidencia de consentimiento), dominio Identidad y Seguridad. |

### `crm` (32 entidades, módulo `crm`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `account_contact_relations` | `AccountContactRelations` | 13 | `id` | ✅ | account_contact_relations es una tabla de asociación del módulo 49 · crm (dominio Marketing y Crecimiento): conecta entidades (`crm_accounts`, `contacts`) para representar relaciones muchos-a-muchos. |
| `account_team_members` | `AccountTeamMembers` | 10 | `id` | — | account_team_members es una tabla de asociación del módulo 49 · crm (dominio Marketing y Crecimiento): conecta entidades (`crm_accounts`) para representar relaciones muchos-a-muchos. |
| `contact_channel_endpoints` | `ContactChannelEndpoints` | 24 | `id` | ✅ | contact_channel_endpoints es un registro central de negocio del módulo 49 · crm (gestión de relación con clientes y partners), dominio Marketing y Crecimiento. |
| `contact_channels` | `ContactChannels` | 12 | `id` | ✅ | contact_channels es una tabla de asociación del módulo 49 · crm (dominio Marketing y Crecimiento): conecta entidades (`contacts`) para representar relaciones muchos-a-muchos. |
| `contacts` | `Contacts` | 21 | `id` | ✅ | contacts es un registro central de negocio del módulo 49 · crm (gestión de relación con clientes y partners), dominio Marketing y Crecimiento. |
| `crm_accounts` | `CrmAccounts` | 21 | `id` | ✅ | crm_accounts es un registro central de negocio del módulo 49 · crm (gestión de relación con clientes y partners), dominio Marketing y Crecimiento. |
| `crm_activities` | `CrmActivities` | 20 | `id` | ✅ | crm_activities es un registro central de negocio del módulo 49 · crm (gestión de relación con clientes y partners), dominio Marketing y Crecimiento. |
| `crm_activity_assignments` | `CrmActivityAssignments` | 10 | `id` | — | crm_activity_assignments es una tabla de asociación del módulo 49 · crm (dominio Marketing y Crecimiento): conecta entidades (`crm_activities`) para representar relaciones muchos-a-muchos. |
| `crm_activity_relations` | `CrmActivityRelations` | 18 | `id` | — | crm_activity_relations es una tabla de asociación del módulo 49 · crm (dominio Marketing y Crecimiento): conecta entidades (`crm_activities`, `crm_accounts`, `contacts`) para representar relaciones muchos-a-muchos. |
| `crm_activity_reminders` | `CrmActivityReminders` | 9 | `id` | — | crm_activity_reminders es un registro central de negocio del módulo 49 · crm (gestión de relación con clientes y partners), dominio Marketing y Crecimiento. |
| `crm_call_logs` | `CrmCallLogs` | 13 | `id` | — | crm_call_logs es un registro central de negocio del módulo 49 · crm (gestión de relación con clientes y partners), dominio Marketing y Crecimiento. |
| `crm_case_comments` | `CrmCaseComments` | 7 | `id` | — | crm_case_comments es un registro central de negocio del módulo 49 · crm (gestión de relación con clientes y partners), dominio Marketing y Crecimiento. |
| `crm_case_contacts` | `CrmCaseContacts` | 7 | `id` | — | crm_case_contacts es un registro central de negocio del módulo 49 · crm (gestión de relación con clientes y partners), dominio Marketing y Crecimiento. |
| `crm_case_milestones` | `CrmCaseMilestones` | 13 | `id` | ✅ | crm_case_milestones es un registro central de negocio del módulo 49 · crm (gestión de relación con clientes y partners), dominio Marketing y Crecimiento. |
| `crm_case_status_history` | `CrmCaseStatusHistory` | 8 | `id` | — | crm_case_status_history es el historial auditable de `crm_cases` dentro del módulo 49 · crm (dominio Marketing y Crecimiento). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensible. |
| `crm_cases` | `CrmCases` | 23 | `id` | ✅ | crm_cases es un registro central de negocio del módulo 49 · crm (gestión de relación con clientes y partners), dominio Marketing y Crecimiento. |
| `crm_email_messages` | `CrmEmailMessages` | 14 | `id` | — | crm_email_messages es un registro central de negocio del módulo 49 · crm (gestión de relación con clientes y partners), dominio Marketing y Crecimiento. |
| `crm_email_recipients` | `CrmEmailRecipients` | 11 | `id` | — | crm_email_recipients es una tabla de asociación del módulo 49 · crm (dominio Marketing y Crecimiento): conecta entidades (`crm_email_messages`, `contacts`, `leads`) para representar relaciones muchos-a-muchos. |
| `crm_entitlements` | `CrmEntitlements` | 17 | `id` | ✅ | crm_entitlements es un registro central de negocio del módulo 49 · crm (gestión de relación con clientes y partners), dominio Marketing y Crecimiento. |
| `crm_events` | `CrmEvents` | 18 | `id` | ✅ | crm_events registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 49 · crm (dominio Marketing y Crecimiento): responde a '¿qué está pasando ahora mismo?'. |
| `crm_notes` | `CrmNotes` | 11 | `id` | ✅ | crm_notes es un registro central de negocio del módulo 49 · crm (gestión de relación con clientes y partners), dominio Marketing y Crecimiento. |
| `crm_recurrence_rules` | `CrmRecurrenceRules` | 12 | `id` | ✅ | crm_recurrence_rules guarda reglas y configuración de gobierno del módulo 49 · crm (dominio Marketing y Crecimiento): parametriza el comportamiento del negocio sin tocar código. |
| `crm_tasks` | `CrmTasks` | 16 | `id` | ✅ | crm_tasks es un registro central de negocio del módulo 49 · crm (gestión de relación con clientes y partners), dominio Marketing y Crecimiento. |
| `leads` | `Leads` | 21 | `id` | ✅ | leads es un registro central de negocio del módulo 49 · crm (gestión de relación con clientes y partners), dominio Marketing y Crecimiento. |
| `opportunities` | `Opportunities` | 22 | `id` | ✅ | opportunities es un registro central de negocio del módulo 49 · crm (gestión de relación con clientes y partners), dominio Marketing y Crecimiento. |
| `opportunity_contact_roles` | `OpportunityContactRoles` | 11 | `id` | ✅ | opportunity_contact_roles es un registro central de negocio del módulo 49 · crm (gestión de relación con clientes y partners), dominio Marketing y Crecimiento. |
| `opportunity_line_items` | `OpportunityLineItems` | 18 | `id` | ✅ | opportunity_line_items es un registro central de negocio del módulo 49 · crm (gestión de relación con clientes y partners), dominio Marketing y Crecimiento. |
| `opportunity_stage_history` | `OpportunityStageHistory` | 10 | `id` | — | opportunity_stage_history es el historial auditable de `opportunities` dentro del módulo 49 · crm (dominio Marketing y Crecimiento). Conserva cada versión pasada para poder demostrar el 'antes y después' de un dato sensi… |
| `partnership_agreements` | `PartnershipAgreements` | 16 | `id` | ✅ | partnership_agreements es un registro central de negocio del módulo 49 · crm (gestión de relación con clientes y partners), dominio Marketing y Crecimiento. |
| `partnerships` | `Partnerships` | 20 | `id` | ✅ | partnerships es un registro central de negocio del módulo 49 · crm (gestión de relación con clientes y partners), dominio Marketing y Crecimiento. |
| `pipeline_stages` | `PipelineStages` | 13 | `id` | ✅ | pipeline_stages es un registro central de negocio del módulo 49 · crm (gestión de relación con clientes y partners), dominio Marketing y Crecimiento. |
| `pipelines` | `Pipelines` | 11 | `id` | ✅ | pipelines es un registro central de negocio del módulo 49 · crm (gestión de relación con clientes y partners), dominio Marketing y Crecimiento. |

### `cross_store_consistency` (20 entidades, módulo `cross_store_consistency`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `archive_jobs` | `ArchiveJobs` | 10 | `id` | — | archive_jobs registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 62 · cross_store_consistency (dominio Datos y NoSQL): responde a '¿qué está pasando ahora mismo?'. |
| `cache_invalidation_jobs` | `CacheInvalidationJobs` | 9 | `id` | — | cache_invalidation_jobs registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 62 · cross_store_consistency (dominio Datos y NoSQL): responde a '¿qué está pasando ahora mismo?'. |
| `data_movement_jobs` | `DataMovementJobs` | 10 | `id` | — | data_movement_jobs registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 62 · cross_store_consistency (dominio Datos y NoSQL): responde a '¿qué está pasando ahora mismo?'. |
| `deletion_executions` | `DeletionExecutions` | 9 | `id` | — | deletion_executions es un registro central de negocio del módulo 62 · cross_store_consistency (proyección outbox, reconciliación y propagación de borrado), dominio Datos y NoSQL. |
| `deletion_requests` | `DeletionRequests` | 10 | `id` | — | deletion_requests registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 62 · cross_store_consistency (dominio Datos y NoSQL): responde a '¿qué está pasando ahora mismo?'. |
| `deletion_targets` | `DeletionTargets` | 8 | `id` | — | deletion_targets es un registro central de negocio del módulo 62 · cross_store_consistency (proyección outbox, reconciliación y propagación de borrado), dominio Datos y NoSQL. |
| `deletion_verifications` | `DeletionVerifications` | 7 | `id` | — | deletion_verifications es un registro central de negocio del módulo 62 · cross_store_consistency (proyección outbox, reconciliación y propagación de borrado), dominio Datos y NoSQL. |
| `projection_checkpoints` | `ProjectionCheckpoints` | 8 | `id` | — | projection_checkpoints es un registro central de negocio del módulo 62 · cross_store_consistency (proyección outbox, reconciliación y propagación de borrado), dominio Datos y NoSQL. |
| `projection_consumers` | `ProjectionConsumers` | 7 | `id` | — | projection_consumers es un registro central de negocio del módulo 62 · cross_store_consistency (proyección outbox, reconciliación y propagación de borrado), dominio Datos y NoSQL. |
| `projection_dead_letters` | `ProjectionDeadLetters` | 8 | `id` | — | projection_dead_letters es un registro central de negocio del módulo 62 · cross_store_consistency (proyección outbox, reconciliación y propagación de borrado), dominio Datos y NoSQL. |
| `projection_definitions` | `ProjectionDefinitions` | 9 | `id` | — | projection_definitions es un registro central de negocio del módulo 62 · cross_store_consistency (proyección outbox, reconciliación y propagación de borrado), dominio Datos y NoSQL. |
| `projection_delivery_attempts` | `ProjectionDeliveryAttempts` | 11 | `id` | — | projection_delivery_attempts registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 62 · cross_store_consistency (dominio Datos y NoSQL): responde a '¿qué está pasando ahora mismo?'. |
| `projection_drift_events` | `ProjectionDriftEvents` | 11 | `id` | — | projection_drift_events registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 62 · cross_store_consistency (dominio Datos y NoSQL): responde a '¿qué está pasando ahora mismo?'. |
| `projection_repair_jobs` | `ProjectionRepairJobs` | 8 | `id` | — | projection_repair_jobs registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 62 · cross_store_consistency (dominio Datos y NoSQL): responde a '¿qué está pasando ahora mismo?'. |
| `projection_subscriptions` | `ProjectionSubscriptions` | 9 | `id` | — | projection_subscriptions es un registro central de negocio del módulo 62 · cross_store_consistency (proyección outbox, reconciliación y propagación de borrado), dominio Datos y NoSQL. |
| `reconciliation_items` | `ReconciliationItems` | 10 | `id` | — | reconciliation_items es un registro central de negocio del módulo 62 · cross_store_consistency (proyección outbox, reconciliación y propagación de borrado), dominio Datos y NoSQL. |
| `reconciliation_runs` | `CrossStoreConsistencyReconciliationRuns` | 9 | `id` | — | reconciliation_runs registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 62 · cross_store_consistency (dominio Datos y NoSQL): responde a '¿qué está pasando ahora mismo?'. |
| `reindex_jobs` | `ReindexJobs` | 11 | `id` | — | reindex_jobs registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 62 · cross_store_consistency (dominio Datos y NoSQL): responde a '¿qué está pasando ahora mismo?'. |
| `schema_migration_jobs` | `SchemaMigrationJobs` | 11 | `id` | — | schema_migration_jobs registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 62 · cross_store_consistency (dominio Datos y NoSQL): responde a '¿qué está pasando ahora mismo?'. |
| `store_consistency_slos` | `StoreConsistencySlos` | 8 | `id` | — | store_consistency_slos es un registro central de negocio del módulo 62 · cross_store_consistency (proyección outbox, reconciliación y propagación de borrado), dominio Datos y NoSQL. |

### `delegated_access` (7 entidades, módulo `delegated_access`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `delegated_access_approval_requests` | `DelegatedAccessApprovalRequests` | 12 | `id` | — | delegated_access_approval_requests registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 29 · delegated_access (dominio Identidad y Seguridad): responde a '¿qué está pasando ahora m… |
| `delegated_access_grants` | `DelegatedAccessGrants` | 16 | `id` | ✅ | delegated_access_grants es un registro central de negocio del módulo 29 · delegated_access (acceso delegado y usuarios de infraestructura con alcance acotado), dominio Identidad y Seguridad. |
| `delegated_permission_set_items` | `DelegatedPermissionSetItems` | 6 | `id` | — | delegated_permission_set_items es un registro central de negocio del módulo 29 · delegated_access (acceso delegado y usuarios de infraestructura con alcance acotado), dominio Identidad y Seguridad. |
| `delegated_permission_sets` | `DelegatedPermissionSets` | 13 | `id` | ✅ | delegated_permission_sets es un registro central de negocio del módulo 29 · delegated_access (acceso delegado y usuarios de infraestructura con alcance acotado), dominio Identidad y Seguridad. |
| `delegation_events` | `DelegationEvents` | 10 | `id` | — | delegation_events registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 29 · delegated_access (dominio Identidad y Seguridad): responde a '¿qué está pasando ahora mismo?'. |
| `organization_user_assignments` | `OrganizationUserAssignments` | 19 | `id` | ✅ | organization_user_assignments es una tabla de asociación del módulo 29 · delegated_access (dominio Identidad y Seguridad): conecta entidades (`practitioner_delegate_assignments`) para representar relaciones muchos-a-much… |
| `practitioner_delegate_assignments` | `PractitionerDelegateAssignments` | 18 | `id` | ✅ | practitioner_delegate_assignments es una tabla de asociación del módulo 29 · delegated_access (dominio Identidad y Seguridad): conecta entidades (`delegated_access_grants`, `delegated_access_approval_requests`, `delegati… |

### `diagnostic_units` (10 entidades, módulo `diagnostic_units`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `diagnostic_equipment` | `DiagnosticEquipment` | 15 | `id` | ✅ | diagnostic_equipment es un registro central de negocio del módulo 23 · diagnostic_units (unidades diagnósticas, estudios, especialistas y precios), dominio Clínico y Diagnóstico. |
| `diagnostic_price_schedules` | `DiagnosticPriceSchedules` | 17 | `id` | ✅ | diagnostic_price_schedules es un registro central de negocio del módulo 23 · diagnostic_units (unidades diagnósticas, estudios, especialistas y precios), dominio Clínico y Diagnóstico. |
| `diagnostic_study_components` | `DiagnosticStudyComponents` | 8 | `id` | — | diagnostic_study_components es un registro central de negocio del módulo 23 · diagnostic_units (unidades diagnósticas, estudios, especialistas y precios), dominio Clínico y Diagnóstico. |
| `diagnostic_study_offerings` | `DiagnosticStudyOfferings` | 22 | `id` | ✅ | diagnostic_study_offerings es un registro central de negocio del módulo 23 · diagnostic_units (unidades diagnósticas, estudios, especialistas y precios), dominio Clínico y Diagnóstico. |
| `diagnostic_study_prices` | `DiagnosticStudyPrices` | 15 | `id` | — | diagnostic_study_prices es un registro central de negocio del módulo 23 · diagnostic_units (unidades diagnósticas, estudios, especialistas y precios), dominio Clínico y Diagnóstico. |
| `diagnostic_unit_accreditations` | `DiagnosticUnitAccreditations` | 15 | `id` | ✅ | diagnostic_unit_accreditations es un registro central de negocio del módulo 23 · diagnostic_units (unidades diagnósticas, estudios, especialistas y precios), dominio Clínico y Diagnóstico. |
| `diagnostic_unit_practitioner_assignments` | `DiagnosticUnitPractitionerAssignments` | 16 | `id` | ✅ | diagnostic_unit_practitioner_assignments es una tabla de asociación del módulo 23 · diagnostic_units (dominio Clínico y Diagnóstico): conecta entidades (`diagnostic_units`) para representar relaciones muchos-a-muchos. |
| `diagnostic_unit_sites` | `DiagnosticUnitSites` | 13 | `id` | ✅ | diagnostic_unit_sites es un registro central de negocio del módulo 23 · diagnostic_units (unidades diagnósticas, estudios, especialistas y precios), dominio Clínico y Diagnóstico. |
| `diagnostic_unit_specialties` | `DiagnosticUnitSpecialties` | 12 | `id` | ✅ | diagnostic_unit_specialties es un registro central de negocio del módulo 23 · diagnostic_units (unidades diagnósticas, estudios, especialistas y precios), dominio Clínico y Diagnóstico. |
| `diagnostic_units` | `DiagnosticUnits` | 19 | `id` | ✅ | diagnostic_units es un registro central de negocio del módulo 23 · diagnostic_units (unidades diagnósticas, estudios, especialistas y precios), dominio Clínico y Diagnóstico. |

### `diagnostics` (36 entidades, módulo `diagnostics`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `accession_specimens` | `AccessionSpecimens` | 6 | `id` | — | accession_specimens es un registro central de negocio del módulo 20 · diagnostics (laboratorio, imagenología médica y media clínica), dominio Clínico y Diagnóstico. |
| `analyzer_result_messages` | `AnalyzerResultMessages` | 12 | `id` | — | analyzer_result_messages es un ledger inmutable (append-only) del módulo 20 · diagnostics (dominio Clínico y Diagnóstico): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `analyzer_runs` | `AnalyzerRuns` | 13 | `id` | — | analyzer_runs es un ledger inmutable (append-only) del módulo 20 · diagnostics (dominio Clínico y Diagnóstico): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `clinical_media` | `ClinicalMedia` | 19 | `id` | ✅ | clinical_media es un registro central de negocio del módulo 20 · diagnostics (laboratorio, imagenología médica y media clínica), dominio Clínico y Diagnóstico. |
| `critical_result_notifications` | `CriticalResultNotifications` | 21 | `id` | ✅ | critical_result_notifications es un registro central de negocio del módulo 20 · diagnostics (laboratorio, imagenología médica y media clínica), dominio Clínico y Diagnóstico. |
| `diagnostic_data_quality_events` | `DiagnosticDataQualityEvents` | 13 | `id` | — | diagnostic_data_quality_events es un ledger inmutable (append-only) del módulo 20 · diagnostics (dominio Clínico y Diagnóstico): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `diagnostic_provenance_links` | `DiagnosticProvenanceLinks` | 12 | `id` | — | diagnostic_provenance_links es una tabla de asociación del módulo 20 · diagnostics (dominio Clínico y Diagnóstico): conecta entidades (otras entidades del módulo) para representar relaciones muchos-a-muchos. |
| `diagnostic_release_events` | `DiagnosticReleaseEvents` | 9 | `id` | — | diagnostic_release_events es un ledger inmutable (append-only) del módulo 20 · diagnostics (dominio Clínico y Diagnóstico): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `diagnostic_report_files` | `DiagnosticReportFiles` | 8 | `id` | — | diagnostic_report_files es un registro central de negocio del módulo 20 · diagnostics (laboratorio, imagenología médica y media clínica), dominio Clínico y Diagnóstico. |
| `diagnostic_report_results` | `DiagnosticReportResults` | 6 | `id` | — | diagnostic_report_results es un registro central de negocio del módulo 20 · diagnostics (laboratorio, imagenología médica y media clínica), dominio Clínico y Diagnóstico. |
| `diagnostic_report_versions` | `DiagnosticReportVersions` | 18 | `id` | — | diagnostic_report_versions es un registro central de negocio del módulo 20 · diagnostics (laboratorio, imagenología médica y media clínica), dominio Clínico y Diagnóstico. |
| `dicom_object_locations` | `DicomObjectLocations` | 18 | `id` | ✅ | dicom_object_locations es un registro central de negocio del módulo 20 · diagnostics (laboratorio, imagenología médica y media clínica), dominio Clínico y Diagnóstico. |
| `dicom_structured_reports` | `DicomStructuredReports` | 16 | `id` | ✅ | dicom_structured_reports es un registro central de negocio del módulo 20 · diagnostics (laboratorio, imagenología médica y media clínica), dominio Clínico y Diagnóstico. |
| `imaging_endpoints` | `ImagingEndpoints` | 13 | `id` | ✅ | imaging_endpoints es un registro central de negocio del módulo 20 · diagnostics (laboratorio, imagenología médica y media clínica), dominio Clínico y Diagnóstico. |
| `imaging_instances` | `ImagingInstances` | 9 | `id` | — | imaging_instances es un registro central de negocio del módulo 20 · diagnostics (laboratorio, imagenología médica y media clínica), dominio Clínico y Diagnóstico. |
| `imaging_procedure_steps` | `ImagingProcedureSteps` | 17 | `id` | ✅ | imaging_procedure_steps es un registro central de negocio del módulo 20 · diagnostics (laboratorio, imagenología médica y media clínica), dominio Clínico y Diagnóstico. |
| `imaging_selection_items` | `ImagingSelectionItems` | 8 | `id` | — | imaging_selection_items es un registro central de negocio del módulo 20 · diagnostics (laboratorio, imagenología médica y media clínica), dominio Clínico y Diagnóstico. |
| `imaging_selections` | `ImagingSelections` | 13 | `id` | ✅ | imaging_selections es un registro central de negocio del módulo 20 · diagnostics (laboratorio, imagenología médica y media clínica), dominio Clínico y Diagnóstico. |
| `imaging_series` | `ImagingSeries` | 11 | `id` | — | imaging_series es un registro central de negocio del módulo 20 · diagnostics (laboratorio, imagenología médica y media clínica), dominio Clínico y Diagnóstico. |
| `imaging_studies` | `ImagingStudies` | 22 | `id` | ✅ | imaging_studies es un registro central de negocio del módulo 20 · diagnostics (laboratorio, imagenología médica y media clínica), dominio Clínico y Diagnóstico. |
| `laboratory_accessions` | `LaboratoryAccessions` | 17 | `id` | ✅ | laboratory_accessions es un registro central de negocio del módulo 20 · diagnostics (laboratorio, imagenología médica y media clínica), dominio Clínico y Diagnóstico. |
| `laboratory_work_order_tests` | `LaboratoryWorkOrderTests` | 17 | `id` | ✅ | laboratory_work_order_tests es un registro central de negocio del módulo 20 · diagnostics (laboratorio, imagenología médica y media clínica), dominio Clínico y Diagnóstico. |
| `laboratory_work_orders` | `LaboratoryWorkOrders` | 16 | `id` | ✅ | laboratory_work_orders es un registro central de negocio del módulo 20 · diagnostics (laboratorio, imagenología médica y media clínica), dominio Clínico y Diagnóstico. |
| `media_annotations` | `MediaAnnotations` | 16 | `id` | ✅ | media_annotations es un registro central de negocio del módulo 20 · diagnostics (laboratorio, imagenología médica y media clínica), dominio Clínico y Diagnóstico. |
| `observation_specimens` | `ObservationSpecimens` | 5 | `id` | — | observation_specimens es un registro central de negocio del módulo 20 · diagnostics (laboratorio, imagenología médica y media clínica), dominio Clínico y Diagnóstico. |
| `radiation_dose_events` | `RadiationDoseEvents` | 14 | `id` | — | radiation_dose_events es un ledger inmutable (append-only) del módulo 20 · diagnostics (dominio Clínico y Diagnóstico): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `result_verifications` | `ResultVerifications` | 12 | `id` | — | result_verifications es un registro central de negocio del módulo 20 · diagnostics (laboratorio, imagenología médica y media clínica), dominio Clínico y Diagnóstico. |
| `specimen_chain_of_custody_events` | `SpecimenChainOfCustodyEvents` | 14 | `id` | — | specimen_chain_of_custody_events registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 20 · diagnostics (dominio Clínico y Diagnóstico): responde a '¿qué está pasando ahora mismo?'. |
| `specimen_collection_events` | `SpecimenCollectionEvents` | 12 | `id` | — | specimen_collection_events es un ledger inmutable (append-only) del módulo 20 · diagnostics (dominio Clínico y Diagnóstico): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `specimen_container_events` | `SpecimenContainerEvents` | 11 | `id` | — | specimen_container_events es un ledger inmutable (append-only) del módulo 20 · diagnostics (dominio Clínico y Diagnóstico): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `specimen_containers` | `SpecimenContainers` | 16 | `id` | ✅ | specimen_containers es un registro central de negocio del módulo 20 · diagnostics (laboratorio, imagenología médica y media clínica), dominio Clínico y Diagnóstico. |
| `specimen_identifiers` | `SpecimenIdentifiers` | 14 | `id` | ✅ | specimen_identifiers es un registro central de negocio del módulo 20 · diagnostics (laboratorio, imagenología médica y media clínica), dominio Clínico y Diagnóstico. |
| `specimen_parent_links` | `SpecimenParentLinks` | 7 | `id` | — | specimen_parent_links es una tabla de asociación del módulo 20 · diagnostics (dominio Clínico y Diagnóstico): conecta entidades (`specimens`) para representar relaciones muchos-a-muchos. |
| `specimen_processing_steps` | `SpecimenProcessingSteps` | 9 | `id` | — | specimen_processing_steps es un registro central de negocio del módulo 20 · diagnostics (laboratorio, imagenología médica y media clínica), dominio Clínico y Diagnóstico. |
| `specimen_rejection_events` | `SpecimenRejectionEvents` | 9 | `id` | — | specimen_rejection_events registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 20 · diagnostics (dominio Clínico y Diagnóstico): responde a '¿qué está pasando ahora mismo?'. |
| `specimens` | `Specimens` | 21 | `id` | ✅ | specimens es un registro central de negocio del módulo 20 · diagnostics (laboratorio, imagenología médica y media clínica), dominio Clínico y Diagnóstico. |

### `directory` (7 entidades, módulo `directory`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `branch_memberships` | `BranchMemberships` | 10 | `id` | ✅ | branch_memberships es una tabla de asociación del módulo 04 · directory (dominio Núcleo y Terminología): conecta entidades (`tenant_memberships`, `branches`) para representar relaciones muchos-a-muchos. |
| `branches` | `Branches` | 14 | `id` | ✅ | branches es un registro central de negocio del módulo 04 · directory (tenants, organizaciones, sedes y directorio), dominio Núcleo y Terminología. |
| `tenant_affiliation_documents` | `TenantAffiliationDocuments` | 23 | `id` | ✅ | tenant_affiliation_documents es un wrap gobernado sobre el archivo (`common.files`) del módulo 04 · directory (dominio Núcleo y Terminología): envuelve cada documento legal de afiliación de la empresa y le agrega tipo de… |
| `tenant_legal_representatives` | `TenantLegalRepresentatives` | 16 | `id` | ✅ | tenant_legal_representatives es un registro central de negocio del módulo 04 · directory (tenants, organizaciones, sedes y directorio), dominio Núcleo y Terminología. |
| `tenant_memberships` | `TenantMemberships` | 15 | `id` | ✅ | tenant_memberships es una tabla de asociación del módulo 04 · directory (dominio Núcleo y Terminología): conecta entidades (`branch_memberships`, `tenants`) para representar relaciones muchos-a-muchos. |
| `tenant_web_configs` | `TenantWebConfigs` | 18 | `id` | ✅ | tenant_web_configs guarda reglas y configuración de gobierno del módulo 04 · directory (dominio Núcleo y Terminología): parametriza el comportamiento del negocio sin tocar código. |
| `tenants` | `Tenants` | 19 | `id` | ✅ | tenants es un registro central de negocio del módulo 04 · directory (tenants, organizaciones, sedes y directorio), dominio Núcleo y Terminología. |

### `education` (15 entidades, módulo `education`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `assessment_attempts` | `AssessmentAttempts` | 16 | `id` | ✅ | assessment_attempts registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 47 · education (dominio Marketing y Crecimiento): responde a '¿qué está pasando ahora mismo?'. |
| `assessment_questions` | `AssessmentQuestions` | 13 | `id` | ✅ | assessment_questions es un registro central de negocio del módulo 47 · education (educación médica y desarrollo profesional continuo), dominio Marketing y Crecimiento. |
| `assessments` | `Assessments` | 15 | `id` | ✅ | assessments es un registro central de negocio del módulo 47 · education (educación médica y desarrollo profesional continuo), dominio Marketing y Crecimiento. |
| `certificates` | `Certificates` | 16 | `id` | ✅ | certificates es un registro central de negocio del módulo 47 · education (educación médica y desarrollo profesional continuo), dominio Marketing y Crecimiento. |
| `cme_credit_records` | `CmeCreditRecords` | 15 | `id` | ✅ | cme_credit_records es un registro central de negocio del módulo 47 · education (educación médica y desarrollo profesional continuo), dominio Marketing y Crecimiento. |
| `course_cohorts` | `CourseCohorts` | 14 | `id` | ✅ | course_cohorts es un registro central de negocio del módulo 47 · education (educación médica y desarrollo profesional continuo), dominio Marketing y Crecimiento. |
| `course_instructors` | `CourseInstructors` | 10 | `id` | ✅ | course_instructors es un registro central de negocio del módulo 47 · education (educación médica y desarrollo profesional continuo), dominio Marketing y Crecimiento. |
| `course_modules` | `CourseModules` | 11 | `id` | ✅ | course_modules es un registro central de negocio del módulo 47 · education (educación médica y desarrollo profesional continuo), dominio Marketing y Crecimiento. |
| `course_reviews` | `CourseReviews` | 11 | `id` | ✅ | course_reviews es un registro central de negocio del módulo 47 · education (educación médica y desarrollo profesional continuo), dominio Marketing y Crecimiento. |
| `course_versions` | `CourseVersions` | 11 | `id` | ✅ | course_versions es un registro central de negocio del módulo 47 · education (educación médica y desarrollo profesional continuo), dominio Marketing y Crecimiento. |
| `courses` | `Courses` | 23 | `id` | ✅ | courses es un registro central de negocio del módulo 47 · education (educación médica y desarrollo profesional continuo), dominio Marketing y Crecimiento. |
| `enrollments` | `Enrollments` | 17 | `id` | ✅ | enrollments es un registro central de negocio del módulo 47 · education (educación médica y desarrollo profesional continuo), dominio Marketing y Crecimiento. |
| `instructors` | `Instructors` | 14 | `id` | ✅ | instructors es un registro central de negocio del módulo 47 · education (educación médica y desarrollo profesional continuo), dominio Marketing y Crecimiento. |
| `lesson_progress` | `LessonProgress` | 10 | `id` | — | lesson_progress es un ledger inmutable (append-only) del módulo 47 · education (dominio Marketing y Crecimiento): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `lessons` | `Lessons` | 16 | `id` | ✅ | lessons es un registro central de negocio del módulo 47 · education (educación médica y desarrollo profesional continuo), dominio Marketing y Crecimiento. |

### `erp` (51 entidades, módulo `erp`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `business_partner_bank_accounts` | `BusinessPartnerBankAccounts` | 17 | `id` | ✅ | business_partner_bank_accounts es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `business_partner_relationships` | `BusinessPartnerRelationships` | 12 | `id` | ✅ | business_partner_relationships es una tabla de asociación del módulo 38 · erp (dominio Financiero y ERP): conecta entidades (`business_partners`) para representar relaciones muchos-a-muchos. |
| `business_partner_roles` | `BusinessPartnerRoles` | 12 | `id` | ✅ | business_partner_roles es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `business_partner_tax_registrations` | `BusinessPartnerTaxRegistrations` | 13 | `id` | ✅ | business_partner_tax_registrations es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `business_partners` | `BusinessPartners` | 16 | `id` | ✅ | business_partners es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `contract_accounting_terms` | `ContractAccountingTerms` | 20 | `id` | ✅ | contract_accounting_terms es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `contract_amendments` | `ContractAmendments` | 16 | `id` | ✅ | contract_amendments es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `contract_approval_requests` | `ContractApprovalRequests` | 11 | `id` | — | contract_approval_requests registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 38 · erp (dominio Financiero y ERP): responde a '¿qué está pasando ahora mismo?'. |
| `contract_approval_steps` | `ContractApprovalSteps` | 10 | `id` | — | contract_approval_steps es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `contract_clause_instances` | `ContractClauseInstances` | 15 | `id` | ✅ | contract_clause_instances es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `contract_clauses` | `ContractClauses` | 14 | `id` | ✅ | contract_clauses es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `contract_documents` | `ContractDocuments` | 11 | `id` | ✅ | contract_documents es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `contract_line_items` | `ContractLineItems` | 14 | `id` | ✅ | contract_line_items es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `contract_milestones` | `ContractMilestones` | 13 | `id` | ✅ | contract_milestones es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `contract_object_assignments` | `ContractObjectAssignments` | 24 | `id` | ✅ | contract_object_assignments es una tabla de asociación del módulo 38 · erp (dominio Financiero y ERP): conecta entidades (`contracts`, `contract_line_items`, `business_partners`) para representar relaciones muchos-a-much… |
| `contract_obligation_events` | `ContractObligationEvents` | 9 | `id` | — | contract_obligation_events registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 38 · erp (dominio Financiero y ERP): responde a '¿qué está pasando ahora mismo?'. |
| `contract_obligations` | `ContractObligations` | 20 | `id` | ✅ | contract_obligations es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `contract_parties` | `ContractParties` | 14 | `id` | ✅ | contract_parties es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `contract_payment_schedules` | `ContractPaymentSchedules` | 18 | `id` | ✅ | contract_payment_schedules es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `contract_renewals` | `ContractRenewals` | 17 | `id` | ✅ | contract_renewals es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `contract_team_members` | `ContractTeamMembers` | 10 | `id` | — | contract_team_members es una tabla de asociación del módulo 38 · erp (dominio Financiero y ERP): conecta entidades (`contracts`) para representar relaciones muchos-a-muchos. |
| `contract_terminations` | `ContractTerminations` | 17 | `id` | ✅ | contract_terminations es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `contract_versions` | `ContractVersions` | 14 | `id` | — | contract_versions es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `contracts` | `Contracts` | 33 | `id` | ✅ | contracts es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `departments` | `Departments` | 13 | `id` | ✅ | departments es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `employee_assignments` | `EmployeeAssignments` | 15 | `id` | ✅ | employee_assignments es una tabla de asociación del módulo 38 · erp (dominio Financiero y ERP): conecta entidades (`employment_records`) para representar relaciones muchos-a-muchos. |
| `employees` | `Employees` | 16 | `id` | ✅ | employees es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `employment_records` | `EmploymentRecords` | 19 | `id` | ✅ | employment_records es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `enterprise_document_flow` | `EnterpriseDocumentFlow` | 12 | `id` | — | enterprise_document_flow es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `goods_receipt_items` | `GoodsReceiptItems` | 15 | `id` | ✅ | goods_receipt_items es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `goods_receipts` | `GoodsReceipts` | 14 | `id` | ✅ | goods_receipts es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `invoice_match_items` | `InvoiceMatchItems` | 17 | `id` | — | invoice_match_items es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `invoice_match_runs` | `InvoiceMatchRuns` | 13 | `id` | — | invoice_match_runs registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 38 · erp (dominio Financiero y ERP): responde a '¿qué está pasando ahora mismo?'. |
| `lease_accounting_links` | `LeaseAccountingLinks` | 16 | `id` | ✅ | lease_accounting_links es una tabla de asociación del módulo 38 · erp (dominio Financiero y ERP): conecta entidades (`lease_contracts`, `lease_objects`, `assets`) para representar relaciones muchos-a-muchos. |
| `lease_cash_flows` | `LeaseCashFlows` | 15 | `id` | ✅ | lease_cash_flows es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `lease_contracts` | `LeaseContracts` | 16 | `id` | ✅ | lease_contracts es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `lease_objects` | `LeaseObjects` | 14 | `id` | ✅ | lease_objects es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `lease_valuations` | `LeaseValuations` | 13 | `id` | — | lease_valuations es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `performance_reviews` | `PerformanceReviews` | 14 | `id` | ✅ | performance_reviews es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `positions` | `Positions` | 15 | `id` | ✅ | positions es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `projects` | `Projects` | 19 | `id` | ✅ | projects es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `purchase_order_items` | `PurchaseOrderItems` | 27 | `id` | ✅ | purchase_order_items es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `purchase_orders` | `PurchaseOrders` | 20 | `id` | ✅ | purchase_orders es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `purchase_requisition_items` | `PurchaseRequisitionItems` | 22 | `id` | ✅ | purchase_requisition_items es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `purchase_requisitions` | `PurchaseRequisitions` | 15 | `id` | ✅ | purchase_requisitions es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `sales_order_items` | `SalesOrderItems` | 21 | `id` | ✅ | sales_order_items es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `sales_orders` | `SalesOrders` | 17 | `id` | ✅ | sales_orders es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `service_entry_items` | `ServiceEntryItems` | 16 | `id` | ✅ | service_entry_items es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `service_entry_sheets` | `ServiceEntrySheets` | 15 | `id` | ✅ | service_entry_sheets es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |
| `time_off_requests` | `TimeOffRequests` | 15 | `id` | ✅ | time_off_requests registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 38 · erp (dominio Financiero y ERP): responde a '¿qué está pasando ahora mismo?'. |
| `wbs_elements` | `WbsElements` | 17 | `id` | ✅ | wbs_elements es un registro central de negocio del módulo 38 · erp (ERP interno, contratos, RR.HH. y organización), dominio Financiero y ERP. |

### `forms` (16 entidades, módulo `forms`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `dynamic_field_definitions` | `DynamicFieldDefinitions` | 31 | `id` | ✅ | dynamic_field_definitions es un registro central de negocio del módulo 09 · forms (formularios dinámicos y gobierno de extensibilidad), dominio Clínico y Diagnóstico. |
| `dynamic_field_sections` | `DynamicFieldSections` | 11 | `id` | ✅ | dynamic_field_sections es un registro central de negocio del módulo 09 · forms (formularios dinámicos y gobierno de extensibilidad), dominio Clínico y Diagnóstico. |
| `extension_target_policies` | `ExtensionTargetPolicies` | 15 | `id` | ✅ | extension_target_policies guarda reglas y configuración de gobierno del módulo 09 · forms (dominio Clínico y Diagnóstico): parametriza el comportamiento del negocio sin tocar código. |
| `field_assignments` | `FieldAssignments` | 21 | `id` | ✅ | field_assignments es una tabla de asociación del módulo 09 · forms (dominio Clínico y Diagnóstico): conecta entidades (`field_values`, `dynamic_field_definitions`, `dynamic_field_sections`) para representar relaciones mu… |
| `field_definition_localizations` | `FieldDefinitionLocalizations` | 12 | `id` | ✅ | field_definition_localizations es un registro central de negocio del módulo 09 · forms (formularios dinámicos y gobierno de extensibilidad), dominio Clínico y Diagnóstico. |
| `field_definition_set_versions` | `FieldDefinitionSetVersions` | 11 | `id` | — | field_definition_set_versions es un registro central de negocio del módulo 09 · forms (formularios dinámicos y gobierno de extensibilidad), dominio Clínico y Diagnóstico. |
| `field_definition_sets` | `FieldDefinitionSets` | 13 | `id` | ✅ | field_definition_sets es un registro central de negocio del módulo 09 · forms (formularios dinámicos y gobierno de extensibilidad), dominio Clínico y Diagnóstico. |
| `field_dependencies` | `FieldDependencies` | 13 | `id` | ✅ | field_dependencies es un registro central de negocio del módulo 09 · forms (formularios dinámicos y gobierno de extensibilidad), dominio Clínico y Diagnóstico. |
| `field_schema_migrations` | `FieldSchemaMigrations` | 14 | `id` | ✅ | field_schema_migrations es un registro central de negocio del módulo 09 · forms (formularios dinámicos y gobierno de extensibilidad), dominio Clínico y Diagnóstico. |
| `field_set_members` | `FieldSetMembers` | 8 | `id` | — | field_set_members es una tabla de asociación del módulo 09 · forms (dominio Clínico y Diagnóstico): conecta entidades (`field_definition_set_versions`) para representar relaciones muchos-a-muchos. |
| `field_validation_rules` | `FieldValidationRules` | 14 | `id` | ✅ | field_validation_rules guarda reglas y configuración de gobierno del módulo 09 · forms (dominio Clínico y Diagnóstico): parametriza el comportamiento del negocio sin tocar código. |
| `field_value_access_rules` | `FieldValueAccessRules` | 15 | `id` | ✅ | field_value_access_rules guarda reglas y configuración de gobierno del módulo 09 · forms (dominio Clínico y Diagnóstico): parametriza el comportamiento del negocio sin tocar código. |
| `field_value_audit` | `FieldValueAudit` | 9 | `id` | — | field_value_audit es un ledger inmutable (append-only) del módulo 09 · forms (dominio Clínico y Diagnóstico): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `field_value_provenance` | `FieldValueProvenance` | 14 | `id` | — | field_value_provenance es un registro central de negocio del módulo 09 · forms (formularios dinámicos y gobierno de extensibilidad), dominio Clínico y Diagnóstico. |
| `field_values` | `FieldValues` | 34 | `id` | ✅ | field_values es un registro central de negocio del módulo 09 · forms (formularios dinámicos y gobierno de extensibilidad), dominio Clínico y Diagnóstico. |
| `form_instances` | `FormInstances` | 12 | `id` | ✅ | form_instances es un registro central de negocio del módulo 09 · forms (formularios dinámicos y gobierno de extensibilidad), dominio Clínico y Diagnóstico. |

### `geo` (6 entidades, módulo `geo`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `geofence_events` | `GeofenceEvents` | 8 | `id` | — | geofence_events es un ledger inmutable (append-only) del módulo 13 · geo (dominio Núcleo y Terminología): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `geofences` | `Geofences` | 14 | `id` | ✅ | geofences es un registro central de negocio del módulo 13 · geo (geolocalización y tracking móvil), dominio Núcleo y Terminología. |
| `location_pings` | `LocationPings` | 14 | `id` | — | location_pings es un ledger inmutable (append-only) del módulo 13 · geo (dominio Núcleo y Terminología): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `tracked_subjects` | `TrackedSubjects` | 11 | `id` | ✅ | tracked_subjects es un registro central de negocio del módulo 13 · geo (geolocalización y tracking móvil), dominio Núcleo y Terminología. |
| `tracking_sessions` | `TrackingSessions` | 13 | `id` | ✅ | tracking_sessions es un registro central de negocio del módulo 13 · geo (geolocalización y tracking móvil), dominio Núcleo y Terminología. |
| `trips` | `Trips` | 14 | `id` | ✅ | trips es un registro central de negocio del módulo 13 · geo (geolocalización y tracking móvil), dominio Núcleo y Terminología. |

### `graph_intelligence` (13 entidades, módulo `graph_intelligence`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `graph_access_scopes` | `GraphAccessScopes` | 9 | `id` | — | graph_access_scopes es un registro central de negocio del módulo 61 · graph_intelligence (proyecciones de grafo para relaciones, referidos y riesgo), dominio Datos y NoSQL. |
| `graph_communities` | `GraphCommunities` | 7 | `id` | — | graph_communities es un registro central de negocio del módulo 61 · graph_intelligence (proyecciones de grafo para relaciones, referidos y riesgo), dominio Datos y NoSQL. |
| `graph_deletion_jobs` | `GraphDeletionJobs` | 9 | `id` | — | graph_deletion_jobs registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 61 · graph_intelligence (dominio Datos y NoSQL): responde a '¿qué está pasando ahora mismo?'. |
| `graph_edge_evidence` | `GraphEdgeEvidence` | 7 | `id` | — | graph_edge_evidence es un registro central de negocio del módulo 61 · graph_intelligence (proyecciones de grafo para relaciones, referidos y riesgo), dominio Datos y NoSQL. |
| `graph_edges` | `GraphEdges` | 13 | `edge_id` | — | graph_edges es un registro central de negocio del módulo 61 · graph_intelligence (proyecciones de grafo para relaciones, referidos y riesgo), dominio Datos y NoSQL. |
| `graph_node_identifiers` | `GraphNodeIdentifiers` | 6 | `id` | — | graph_node_identifiers es un registro central de negocio del módulo 61 · graph_intelligence (proyecciones de grafo para relaciones, referidos y riesgo), dominio Datos y NoSQL. |
| `graph_nodes` | `GraphNodes` | 11 | `node_id` | — | graph_nodes es un registro central de negocio del módulo 61 · graph_intelligence (proyecciones de grafo para relaciones, referidos y riesgo), dominio Datos y NoSQL. |
| `graph_path_cache` | `GraphPathCache` | 10 | `id` | — | graph_path_cache es un registro central de negocio del módulo 61 · graph_intelligence (proyecciones de grafo para relaciones, referidos y riesgo), dominio Datos y NoSQL. |
| `graph_projection_definitions` | `GraphProjectionDefinitions` | 8 | `id` | — | graph_projection_definitions es un registro central de negocio del módulo 61 · graph_intelligence (proyecciones de grafo para relaciones, referidos y riesgo), dominio Datos y NoSQL. |
| `graph_projection_runs` | `GraphProjectionRuns` | 9 | `id` | — | graph_projection_runs registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 61 · graph_intelligence (dominio Datos y NoSQL): responde a '¿qué está pasando ahora mismo?'. |
| `graph_risk_scores` | `GraphRiskScores` | 9 | `id` | — | graph_risk_scores es un registro central de negocio del módulo 61 · graph_intelligence (proyecciones de grafo para relaciones, referidos y riesgo), dominio Datos y NoSQL. |
| `graph_rule_definitions` | `GraphRuleDefinitions` | 8 | `id` | — | graph_rule_definitions es un registro central de negocio del módulo 61 · graph_intelligence (proyecciones de grafo para relaciones, referidos y riesgo), dominio Datos y NoSQL. |
| `graph_rule_hits` | `GraphRuleHits` | 9 | `id` | — | graph_rule_hits es un registro central de negocio del módulo 61 · graph_intelligence (proyecciones de grafo para relaciones, referidos y riesgo), dominio Datos y NoSQL. |

### `health_context` (10 entidades, módulo `health_context`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `context_agents` | `ContextAgents` | 14 | `id` | ✅ | context_agents es un registro central de negocio del módulo 44 · health_context (contexto de entorno de salud por país), dominio Núcleo y Terminología. |
| `context_collection_runs` | `ContextCollectionRuns` | 17 | `id` | — | context_collection_runs es un ledger inmutable (append-only) del módulo 44 · health_context (dominio Núcleo y Terminología): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `context_fact_evidence` | `ContextFactEvidence` | 8 | `id` | — | context_fact_evidence es un registro central de negocio del módulo 44 · health_context (contexto de entorno de salud por país), dominio Núcleo y Terminología. |
| `context_quality_reviews` | `ContextQualityReviews` | 9 | `id` | — | context_quality_reviews es un ledger inmutable (append-only) del módulo 44 · health_context (dominio Núcleo y Terminología): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `context_source_observations` | `ContextSourceObservations` | 14 | `id` | — | context_source_observations es un registro central de negocio del módulo 44 · health_context (contexto de entorno de salud por país), dominio Núcleo y Terminología. |
| `country_context_schedules` | `CountryContextSchedules` | 15 | `id` | ✅ | country_context_schedules es un registro central de negocio del módulo 44 · health_context (contexto de entorno de salud por país), dominio Núcleo y Terminología. |
| `country_health_context_versions` | `CountryHealthContextVersions` | 16 | `id` | — | country_health_context_versions es un registro central de negocio del módulo 44 · health_context (contexto de entorno de salud por país), dominio Núcleo y Terminología. |
| `country_health_contexts` | `CountryHealthContexts` | 13 | `id` | ✅ | country_health_contexts es un registro central de negocio del módulo 44 · health_context (contexto de entorno de salud por país), dominio Núcleo y Terminología. |
| `health_context_facts` | `HealthContextFacts` | 13 | `id` | — | health_context_facts es un registro central de negocio del módulo 44 · health_context (contexto de entorno de salud por país), dominio Núcleo y Terminología. |
| `health_context_sources` | `HealthContextSources` | 15 | `id` | ✅ | health_context_sources es un registro central de negocio del módulo 44 · health_context (contexto de entorno de salud por país), dominio Núcleo y Terminología. |

### `health_data` (34 entidades, módulo `health_data`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `canonical_health_resource_versions` | `CanonicalHealthResourceVersions` | 15 | `id` | — | canonical_health_resource_versions es un registro central de negocio del módulo 52 · health_data_platform (plataforma internacional de datos de salud, interoperabilidad y registro longitudinal), dominio Datos y NoSQL. |
| `canonical_health_resources` | `CanonicalHealthResources` | 15 | `id` | ✅ | canonical_health_resources es un registro central de negocio del módulo 52 · health_data_platform (plataforma internacional de datos de salud, interoperabilidad y registro longitudinal), dominio Datos y NoSQL. |
| `canonical_resource_bindings` | `CanonicalResourceBindings` | 9 | `id` | — | canonical_resource_bindings es un registro central de negocio del módulo 52 · health_data_platform (plataforma internacional de datos de salud, interoperabilidad y registro longitudinal), dominio Datos y NoSQL. |
| `canonical_resource_identifiers` | `CanonicalResourceIdentifiers` | 10 | `id` | — | canonical_resource_identifiers es un registro central de negocio del módulo 52 · health_data_platform (plataforma internacional de datos de salud, interoperabilidad y registro longitudinal), dominio Datos y NoSQL. |
| `canonical_resource_relationships` | `CanonicalResourceRelationships` | 9 | `id` | — | canonical_resource_relationships es una tabla de asociación del módulo 52 · health_data_platform (dominio Datos y NoSQL): conecta entidades (`canonical_health_resources`) para representar relaciones muchos-a-muchos. |
| `fhir_profile_definitions` | `FhirProfileDefinitions` | 12 | `id` | ✅ | fhir_profile_definitions es un registro central de negocio del módulo 52 · health_data_platform (plataforma internacional de datos de salud, interoperabilidad y registro longitudinal), dominio Datos y NoSQL. |
| `fhir_profile_versions` | `FhirProfileVersions` | 16 | `id` | ✅ | fhir_profile_versions es un registro central de negocio del módulo 52 · health_data_platform (plataforma internacional de datos de salud, interoperabilidad y registro longitudinal), dominio Datos y NoSQL. |
| `fhir_validation_issues` | `FhirValidationIssues` | 8 | `id` | — | fhir_validation_issues es un ledger inmutable (append-only) del módulo 52 · health_data_platform (dominio Datos y NoSQL): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `fhir_validation_runs` | `FhirValidationRuns` | 11 | `id` | — | fhir_validation_runs es un ledger inmutable (append-only) del módulo 52 · health_data_platform (dominio Datos y NoSQL): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `health_data_quality_issues` | `HealthDataQualityIssues` | 12 | `id` | — | health_data_quality_issues es un ledger inmutable (append-only) del módulo 52 · health_data_platform (dominio Datos y NoSQL): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `health_data_quality_rule_sets` | `HealthDataQualityRuleSets` | 13 | `id` | ✅ | health_data_quality_rule_sets es un registro central de negocio del módulo 52 · health_data_platform (plataforma internacional de datos de salud, interoperabilidad y registro longitudinal), dominio Datos y NoSQL. |
| `health_data_quality_rules` | `HealthDataQualityRules` | 15 | `id` | ✅ | health_data_quality_rules guarda reglas y configuración de gobierno del módulo 52 · health_data_platform (dominio Datos y NoSQL): parametriza el comportamiento del negocio sin tocar código. |
| `health_data_quality_runs` | `HealthDataQualityRuns` | 12 | `id` | — | health_data_quality_runs es un ledger inmutable (append-only) del módulo 52 · health_data_platform (dominio Datos y NoSQL): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `health_deidentification_profiles` | `HealthDeidentificationProfiles` | 17 | `id` | ✅ | health_deidentification_profiles es un registro central de negocio del módulo 52 · health_data_platform (plataforma internacional de datos de salud, interoperabilidad y registro longitudinal), dominio Datos y NoSQL. |
| `health_deidentification_runs` | `HealthDeidentificationRuns` | 14 | `id` | — | health_deidentification_runs es un ledger inmutable (append-only) del módulo 52 · health_data_platform (dominio Datos y NoSQL): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `health_export_jobs` | `HealthExportJobs` | 15 | `id` | — | health_export_jobs es un ledger inmutable (append-only) del módulo 52 · health_data_platform (dominio Datos y NoSQL): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `health_export_manifests` | `HealthExportManifests` | 10 | `id` | — | health_export_manifests es un registro central de negocio del módulo 52 · health_data_platform (plataforma internacional de datos de salud, interoperabilidad y registro longitudinal), dominio Datos y NoSQL. |
| `health_ingestion_batches` | `HealthIngestionBatches` | 16 | `id` | — | health_ingestion_batches es un ledger inmutable (append-only) del módulo 52 · health_data_platform (dominio Datos y NoSQL): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `health_ingestion_records` | `HealthIngestionRecords` | 13 | `id` | — | health_ingestion_records es un ledger inmutable (append-only) del módulo 52 · health_data_platform (dominio Datos y NoSQL): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `health_lineage_edges` | `HealthLineageEdges` | 12 | `id` | — | health_lineage_edges es un registro central de negocio del módulo 52 · health_data_platform (plataforma internacional de datos de salud, interoperabilidad y registro longitudinal), dominio Datos y NoSQL. |
| `health_provenance_records` | `HealthProvenanceRecords` | 14 | `id` | — | health_provenance_records es un registro central de negocio del módulo 52 · health_data_platform (plataforma internacional de datos de salud, interoperabilidad y registro longitudinal), dominio Datos y NoSQL. |
| `health_provenance_targets` | `HealthProvenanceTargets` | 6 | `id` | — | health_provenance_targets es un registro central de negocio del módulo 52 · health_data_platform (plataforma internacional de datos de salud, interoperabilidad y registro longitudinal), dominio Datos y NoSQL. |
| `health_source_connections` | `HealthSourceConnections` | 16 | `id` | ✅ | health_source_connections es un registro central de negocio del módulo 52 · health_data_platform (plataforma internacional de datos de salud, interoperabilidad y registro longitudinal), dominio Datos y NoSQL. |
| `health_source_systems` | `HealthSourceSystems` | 17 | `id` | ✅ | health_source_systems es un registro central de negocio del módulo 52 · health_data_platform (plataforma internacional de datos de salud, interoperabilidad y registro longitudinal), dominio Datos y NoSQL. |
| `health_terminology_mapping_rules` | `HealthTerminologyMappingRules` | 14 | `id` | ✅ | health_terminology_mapping_rules guarda reglas y configuración de gobierno del módulo 52 · health_data_platform (dominio Datos y NoSQL): parametriza el comportamiento del negocio sin tocar código. |
| `health_terminology_mapping_sets` | `HealthTerminologyMappingSets` | 13 | `id` | ✅ | health_terminology_mapping_sets es un registro central de negocio del módulo 52 · health_data_platform (plataforma internacional de datos de salud, interoperabilidad y registro longitudinal), dominio Datos y NoSQL. |
| `omop_mapping_rules` | `OmopMappingRules` | 14 | `id` | ✅ | omop_mapping_rules guarda reglas y configuración de gobierno del módulo 52 · health_data_platform (dominio Datos y NoSQL): parametriza el comportamiento del negocio sin tocar código. |
| `omop_mapping_sets` | `OmopMappingSets` | 12 | `id` | ✅ | omop_mapping_sets es un registro central de negocio del módulo 52 · health_data_platform (plataforma internacional de datos de salud, interoperabilidad y registro longitudinal), dominio Datos y NoSQL. |
| `omop_transformation_runs` | `OmopTransformationRuns` | 13 | `id` | — | omop_transformation_runs es un ledger inmutable (append-only) del módulo 52 · health_data_platform (dominio Datos y NoSQL): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `patient_identity_clusters` | `PatientIdentityClusters` | 12 | `id` | ✅ | patient_identity_clusters es un registro central de negocio del módulo 52 · health_data_platform (plataforma internacional de datos de salud, interoperabilidad y registro longitudinal), dominio Datos y NoSQL. |
| `patient_identity_members` | `PatientIdentityMembers` | 11 | `id` | — | patient_identity_members es una tabla de asociación del módulo 52 · health_data_platform (dominio Datos y NoSQL): conecta entidades (`patient_identity_clusters`) para representar relaciones muchos-a-muchos. |
| `patient_match_candidates` | `PatientMatchCandidates` | 11 | `id` | — | patient_match_candidates es un ledger inmutable (append-only) del módulo 52 · health_data_platform (dominio Datos y NoSQL): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `patient_match_decisions` | `PatientMatchDecisions` | 9 | `id` | — | patient_match_decisions es un registro central de negocio del módulo 52 · health_data_platform (plataforma internacional de datos de salud, interoperabilidad y registro longitudinal), dominio Datos y NoSQL. |
| `patient_timeline_entries` | `PatientTimelineEntries` | 15 | `id` | — | patient_timeline_entries es un ledger inmutable (append-only) del módulo 52 · health_data_platform (dominio Datos y NoSQL): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |

### `iam` (14 entidades, módulo `iam`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `account_activations` | `AccountActivations` | 14 | `id` | ✅ | account_activations registra el token de un solo uso con que un paciente activa la cuenta que le crearon. |
| `account_lockouts` | `AccountLockouts` | 16 | `id` | ✅ | account_lockouts es un registro central de negocio del módulo 01 · iam (identidad y acceso — cuentas de usuario y seguridad), dominio Identidad y Seguridad. |
| `api_key_scopes` | `ApiKeyScopes` | 7 | `id` | ✅ | api_key_scopes es un registro central de negocio del módulo 01 · iam (identidad y acceso — cuentas de usuario y seguridad), dominio Identidad y Seguridad. |
| `api_keys` | `ApiKeys` | 21 | `id` | ✅ | api_keys es un registro central de negocio del módulo 01 · iam (identidad y acceso — cuentas de usuario y seguridad), dominio Identidad y Seguridad. |
| `authentication_credentials` | `AuthenticationCredentials` | 16 | `id` | ✅ | authentication_credentials es un registro central de negocio del módulo 01 · iam (identidad y acceso — cuentas de usuario y seguridad), dominio Identidad y Seguridad. |
| `devices` | `Devices` | 13 | `id` | ✅ | devices es un registro central de negocio del módulo 01 · iam (identidad y acceso — cuentas de usuario y seguridad), dominio Identidad y Seguridad. |
| `email_verifications` | `EmailVerifications` | 12 | `id` | ✅ | email_verifications registra el token de un solo uso con que alguien prueba que el correo que declaró es suyo. |
| `mfa_factors` | `MfaFactors` | 12 | `id` | ✅ | mfa_factors es un registro central de negocio del módulo 01 · iam (identidad y acceso — cuentas de usuario y seguridad), dominio Identidad y Seguridad. |
| `password_resets` | `PasswordResets` | 13 | `id` | ✅ | password_resets registra el token de un solo uso con que alguien que olvidó su contraseña fija una nueva. |
| `refresh_tokens` | `RefreshTokens` | 11 | `id` | ✅ | refresh_tokens es un registro central de negocio del módulo 01 · iam (identidad y acceso — cuentas de usuario y seguridad), dominio Identidad y Seguridad. |
| `security_events` | `SecurityEvents` | 8 | `id` | — | security_events es un ledger inmutable (append-only) del módulo 01 · iam (dominio Identidad y Seguridad): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `sessions` | `Sessions` | 13 | `id` | ✅ | sessions es un registro central de negocio del módulo 01 · iam (identidad y acceso — cuentas de usuario y seguridad), dominio Identidad y Seguridad. |
| `user_global_roles` | `UserGlobalRoles` | 9 | `id` | ✅ | user_global_roles es un registro central de negocio del módulo 01 · iam (identidad y acceso — cuentas de usuario y seguridad), dominio Identidad y Seguridad. |
| `users` | `Users` | 21 | `id` | ✅ | users es la entidad ancla de cuenta del módulo 01 · iam (dominio Identidad y Seguridad) — deliberadamente distinta de la persona que representa (cuenta ≠ persona). |

### `identity_assurance` (11 entidades, módulo `identity_assurance`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `identity_assertions` | `IdentityAssertions` | 14 | `id` | — | identity_assertions es un registro central de negocio del módulo 27 · identity_assurance (verificación de identidad, aserciones y controles de fraude), dominio Identidad y Seguridad. |
| `identity_authorities` | `IdentityAuthorities` | 14 | `id` | ✅ | identity_authorities es un registro central de negocio del módulo 27 · identity_assurance (verificación de identidad, aserciones y controles de fraude), dominio Identidad y Seguridad. |
| `identity_authority_endpoints` | `IdentityAuthorityEndpoints` | 13 | `id` | ✅ | identity_authority_endpoints es un registro central de negocio del módulo 27 · identity_assurance (verificación de identidad, aserciones y controles de fraude), dominio Identidad y Seguridad. |
| `identity_check_results` | `IdentityCheckResults` | 11 | `id` | — | identity_check_results es un registro central de negocio del módulo 27 · identity_assurance (verificación de identidad, aserciones y controles de fraude), dominio Identidad y Seguridad. |
| `identity_checks` | `IdentityChecks` | 12 | `id` | ✅ | identity_checks es un registro central de negocio del módulo 27 · identity_assurance (verificación de identidad, aserciones y controles de fraude), dominio Identidad y Seguridad. |
| `identity_evidence_records` | `IdentityEvidenceRecords` | 14 | `id` | — | identity_evidence_records es un registro central de negocio del módulo 27 · identity_assurance (verificación de identidad, aserciones y controles de fraude), dominio Identidad y Seguridad. |
| `identity_fraud_signals` | `IdentityFraudSignals` | 11 | `id` | — | identity_fraud_signals es un ledger inmutable (append-only) del módulo 27 · identity_assurance (dominio Identidad y Seguridad): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `identity_manual_review_cases` | `IdentityManualReviewCases` | 14 | `id` | ✅ | identity_manual_review_cases es un registro central de negocio del módulo 27 · identity_assurance (verificación de identidad, aserciones y controles de fraude), dominio Identidad y Seguridad. |
| `identity_verification_attempts` | `IdentityVerificationAttempts` | 13 | `id` | — | identity_verification_attempts registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 27 · identity_assurance (dominio Identidad y Seguridad): responde a '¿qué está pasando ahora mis… |
| `identity_verification_cases` | `IdentityVerificationCases` | 16 | `id` | ✅ | identity_verification_cases es un registro central de negocio del módulo 27 · identity_assurance (verificación de identidad, aserciones y controles de fraude), dominio Identidad y Seguridad. |
| `identity_verification_policies` | `IdentityVerificationPolicies` | 15 | `id` | — | identity_verification_policies guarda reglas y configuración de gobierno del módulo 27 · identity_assurance (dominio Identidad y Seguridad): parametriza el comportamiento del negocio sin tocar código. |

### `insurance` (29 entidades, módulo `insurance`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `broker_carrier_agreements` | `BrokerCarrierAgreements` | 14 | `id` | ✅ | broker_carrier_agreements es un registro central de negocio del módulo 26 · insurance (redes de seguros, operaciones, apelaciones y conciliación), dominio Financiero y ERP. |
| `broker_clients` | `BrokerClients` | 14 | `id` | ✅ | broker_clients es un registro central de negocio del módulo 26 · insurance (redes de seguros, operaciones, apelaciones y conciliación), dominio Financiero y ERP. |
| `broker_commission_statements` | `BrokerCommissionStatements` | 14 | `id` | ✅ | broker_commission_statements es un registro central de negocio del módulo 26 · insurance (redes de seguros, operaciones, apelaciones y conciliación), dominio Financiero y ERP. |
| `claim_adjudication_versions` | `ClaimAdjudicationVersions` | 11 | `id` | — | claim_adjudication_versions es un registro central de negocio del módulo 26 · insurance (redes de seguros, operaciones, apelaciones y conciliación), dominio Financiero y ERP. |
| `claim_appeal_decisions` | `ClaimAppealDecisions` | 12 | `id` | — | claim_appeal_decisions es un registro central de negocio del módulo 26 · insurance (redes de seguros, operaciones, apelaciones y conciliación), dominio Financiero y ERP. |
| `claim_disputes` | `ClaimDisputes` | 16 | `id` | ✅ | claim_disputes es un registro central de negocio del módulo 26 · insurance (redes de seguros, operaciones, apelaciones y conciliación), dominio Financiero y ERP. |
| `claim_line_adjudications` | `ClaimLineAdjudications` | 11 | `id` | — | claim_line_adjudications es un registro central de negocio del módulo 26 · insurance (redes de seguros, operaciones, apelaciones y conciliación), dominio Financiero y ERP. |
| `claim_reversals` | `ClaimReversals` | 11 | `id` | — | claim_reversals es un registro central de negocio del módulo 26 · insurance (redes de seguros, operaciones, apelaciones y conciliación), dominio Financiero y ERP. |
| `coordination_of_benefits` | `CoordinationOfBenefits` | 13 | `id` | — | coordination_of_benefits es un registro central de negocio del módulo 26 · insurance (redes de seguros, operaciones, apelaciones y conciliación), dominio Financiero y ERP. |
| `coverage_dependents` | `CoverageDependents` | 12 | `id` | ✅ | coverage_dependents es un registro central de negocio del módulo 26 · insurance (redes de seguros, operaciones, apelaciones y conciliación), dominio Financiero y ERP. |
| `coverage_eligibility_requests` | `CoverageEligibilityRequests` | 11 | `id` | — | coverage_eligibility_requests registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 26 · insurance (dominio Financiero y ERP): responde a '¿qué está pasando ahora mismo?'. |
| `coverage_eligibility_responses` | `CoverageEligibilityResponses` | 10 | `id` | — | coverage_eligibility_responses es un registro central de negocio del módulo 26 · insurance (redes de seguros, operaciones, apelaciones y conciliación), dominio Financiero y ERP. |
| `employer_groups` | `EmployerGroups` | 11 | `id` | ✅ | employer_groups es un registro central de negocio del módulo 26 · insurance (redes de seguros, operaciones, apelaciones y conciliación), dominio Financiero y ERP. |
| `insurance_brokers` | `InsuranceBrokers` | 14 | `id` | ✅ | insurance_brokers es un registro central de negocio del módulo 26 · insurance (redes de seguros, operaciones, apelaciones y conciliación), dominio Financiero y ERP. |
| `insurance_carriers` | `InsuranceCarriers` | 19 | `id` | ✅ | insurance_carriers es un registro central de negocio del módulo 26 · insurance (redes de seguros, operaciones, apelaciones y conciliación), dominio Financiero y ERP. |
| `insurance_claim_lines` | `InsuranceClaimLines` | 12 | `id` | — | insurance_claim_lines es un registro central de negocio del módulo 26 · insurance (redes de seguros, operaciones, apelaciones y conciliación), dominio Financiero y ERP. |
| `insurance_claims` | `InsuranceClaims` | 20 | `id` | ✅ | insurance_claims es un registro central de negocio del módulo 26 · insurance (redes de seguros, operaciones, apelaciones y conciliación), dominio Financiero y ERP. |
| `insurance_plan_benefits` | `InsurancePlanBenefits` | 18 | `id` | ✅ | insurance_plan_benefits es un registro central de negocio del módulo 26 · insurance (redes de seguros, operaciones, apelaciones y conciliación), dominio Financiero y ERP. |
| `insurance_plans` | `InsurancePlans` | 16 | `id` | ✅ | insurance_plans es un registro central de negocio del módulo 26 · insurance (redes de seguros, operaciones, apelaciones y conciliación), dominio Financiero y ERP. |
| `insurance_products` | `InsuranceProducts` | 13 | `id` | ✅ | insurance_products es un registro central de negocio del módulo 26 · insurance (redes de seguros, operaciones, apelaciones y conciliación), dominio Financiero y ERP. |
| `insurance_reconciliation_batches` | `InsuranceReconciliationBatches` | 16 | `id` | ✅ | insurance_reconciliation_batches es un registro central de negocio del módulo 26 · insurance (redes de seguros, operaciones, apelaciones y conciliación), dominio Financiero y ERP. |
| `insurance_reconciliation_items` | `InsuranceReconciliationItems` | 14 | `id` | ✅ | insurance_reconciliation_items es un registro central de negocio del módulo 26 · insurance (redes de seguros, operaciones, apelaciones y conciliación), dominio Financiero y ERP. |
| `network_provider_memberships` | `NetworkProviderMemberships` | 20 | `id` | ✅ | network_provider_memberships es una tabla de asociación del módulo 26 · insurance (dominio Financiero y ERP): conecta entidades (`provider_networks`) para representar relaciones muchos-a-muchos. |
| `patient_coverages` | `PatientCoverages` | 18 | `id` | ✅ | patient_coverages es un registro central de negocio del módulo 26 · insurance (redes de seguros, operaciones, apelaciones y conciliación), dominio Financiero y ERP. |
| `patient_explanations_of_benefit` | `PatientExplanationsOfBenefit` | 9 | `id` | — | patient_explanations_of_benefit es un registro central de negocio del módulo 26 · insurance (redes de seguros, operaciones, apelaciones y conciliación), dominio Financiero y ERP. |
| `prior_authorization_determinations` | `PriorAuthorizationDeterminations` | 13 | `id` | — | prior_authorization_determinations guarda reglas y configuración de gobierno del módulo 26 · insurance (dominio Financiero y ERP): parametriza el comportamiento del negocio sin tocar código. |
| `prior_authorization_items` | `PriorAuthorizationItems` | 10 | `id` | — | prior_authorization_items es un registro central de negocio del módulo 26 · insurance (redes de seguros, operaciones, apelaciones y conciliación), dominio Financiero y ERP. |
| `prior_authorization_requests` | `PriorAuthorizationRequests` | 16 | `id` | ✅ | prior_authorization_requests registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 26 · insurance (dominio Financiero y ERP): responde a '¿qué está pasando ahora mismo?'. |
| `provider_networks` | `ProviderNetworks` | 13 | `id` | ✅ | provider_networks es un registro central de negocio del módulo 26 · insurance (redes de seguros, operaciones, apelaciones y conciliación), dominio Financiero y ERP. |

### `integration_contracts` (9 entidades, módulo `integration_contracts`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `contract_webhook_subscriptions` | `ContractWebhookSubscriptions` | 14 | `id` | ✅ | contract_webhook_subscriptions es un registro central de negocio del módulo 31 · integration_contracts (contratos gobernados backend-a-backend), dominio Integraciones y Contratos. |
| `integration_auth_profiles` | `IntegrationAuthProfiles` | 17 | `id` | ✅ | integration_auth_profiles es un registro central de negocio del módulo 31 · integration_contracts (contratos gobernados backend-a-backend), dominio Integraciones y Contratos. |
| `integration_contract_versions` | `IntegrationContractVersions` | 13 | `id` | — | integration_contract_versions es un registro central de negocio del módulo 31 · integration_contracts (contratos gobernados backend-a-backend), dominio Integraciones y Contratos. |
| `integration_contracts` | `IntegrationContracts` | 14 | `id` | ✅ | integration_contracts es un registro central de negocio del módulo 31 · integration_contracts (contratos gobernados backend-a-backend), dominio Integraciones y Contratos. |
| `integration_exchange_attempts` | `IntegrationExchangeAttempts` | 13 | `id` | — | integration_exchange_attempts es un ledger inmutable (append-only) del módulo 31 · integration_contracts (dominio Integraciones y Contratos): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `integration_exchange_records` | `IntegrationExchangeRecords` | 16 | `id` | — | integration_exchange_records es un registro central de negocio del módulo 31 · integration_contracts (contratos gobernados backend-a-backend), dominio Integraciones y Contratos. |
| `integration_idempotency_records` | `IntegrationIdempotencyRecords` | 10 | `id` | — | integration_idempotency_records es un registro central de negocio del módulo 31 · integration_contracts (contratos gobernados backend-a-backend), dominio Integraciones y Contratos. |
| `integration_sync_cursors` | `IntegrationSyncCursors` | 10 | `id` | ✅ | integration_sync_cursors es un registro central de negocio del módulo 31 · integration_contracts (contratos gobernados backend-a-backend), dominio Integraciones y Contratos. |
| `webhook_delivery_evidence` | `WebhookDeliveryEvidence` | 9 | `id` | — | webhook_delivery_evidence es un ledger inmutable (append-only) del módulo 31 · integration_contracts (dominio Integraciones y Contratos): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |

### `integrations` (10 entidades, módulo `integrations`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `external_providers` | `ExternalProviders` | 13 | `id` | ✅ | external_providers es un registro central de negocio del módulo 12 · integrations (conectividad externa y mensajería), dominio Integraciones y Contratos. |
| `inbound_messages` | `InboundMessages` | 14 | `id` | ✅ | inbound_messages es un registro central de negocio del módulo 12 · integrations (conectividad externa y mensajería), dominio Integraciones y Contratos. |
| `integration_endpoints` | `IntegrationEndpoints` | 16 | `id` | ✅ | integration_endpoints es un registro central de negocio del módulo 12 · integrations (conectividad externa y mensajería), dominio Integraciones y Contratos. |
| `integration_field_mappings` | `IntegrationFieldMappings` | 12 | `id` | ✅ | integration_field_mappings es una tabla de asociación del módulo 12 · integrations (dominio Integraciones y Contratos): conecta entidades (`integration_endpoints`) para representar relaciones muchos-a-muchos. |
| `message_responses` | `MessageResponses` | 12 | `id` | ✅ | message_responses es un registro central de negocio del módulo 12 · integrations (conectividad externa y mensajería), dominio Integraciones y Contratos. |
| `message_retries` | `MessageRetries` | 14 | `id` | ✅ | message_retries es un registro central de negocio del módulo 12 · integrations (conectividad externa y mensajería), dominio Integraciones y Contratos. |
| `outbound_messages` | `OutboundMessages` | 18 | `id` | ✅ | outbound_messages es un registro central de negocio del módulo 12 · integrations (conectividad externa y mensajería), dominio Integraciones y Contratos. |
| `provider_connections` | `ProviderConnections` | 14 | `id` | ✅ | provider_connections es un registro central de negocio del módulo 12 · integrations (conectividad externa y mensajería), dominio Integraciones y Contratos. |
| `provider_credentials` | `ProviderCredentials` | 13 | `id` | ✅ | provider_credentials es un registro central de negocio del módulo 12 · integrations (conectividad externa y mensajería), dominio Integraciones y Contratos. |
| `webhook_subscriptions` | `WebhookSubscriptions` | 12 | `id` | ✅ | webhook_subscriptions es un registro central de negocio del módulo 12 · integrations (conectividad externa y mensajería), dominio Integraciones y Contratos. |

### `lakehouse` (18 entidades, módulo `lakehouse`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `cohort_definitions` | `CohortDefinitions` | 8 | `id` | — | cohort_definitions es un registro central de negocio del módulo 63 · lakehouse (lakehouse, data products analíticos y research releases), dominio Datos y NoSQL. |
| `data_lake_zones` | `DataLakeZones` | 8 | `id` | — | data_lake_zones es un registro central de negocio del módulo 63 · lakehouse (lakehouse, data products analíticos y research releases), dominio Datos y NoSQL. |
| `data_product_versions` | `DataProductVersions` | 8 | `id` | — | data_product_versions es un registro central de negocio del módulo 63 · lakehouse (lakehouse, data products analíticos y research releases), dominio Datos y NoSQL. |
| `data_products` | `DataProducts` | 9 | `id` | — | data_products es un registro central de negocio del módulo 63 · lakehouse (lakehouse, data products analíticos y research releases), dominio Datos y NoSQL. |
| `dataset_release_manifests` | `DatasetReleaseManifests` | 9 | `id` | — | dataset_release_manifests es un registro central de negocio del módulo 63 · lakehouse (lakehouse, data products analíticos y research releases), dominio Datos y NoSQL. |
| `dataset_release_requests` | `DatasetReleaseRequests` | 9 | `id` | — | dataset_release_requests registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 63 · lakehouse (dominio Datos y NoSQL): responde a '¿qué está pasando ahora mismo?'. |
| `lakehouse_catalogs` | `LakehouseCatalogs` | 7 | `id` | — | lakehouse_catalogs es un registro central de negocio del módulo 63 · lakehouse (lakehouse, data products analíticos y research releases), dominio Datos y NoSQL. |
| `lakehouse_datasets` | `LakehouseDatasets` | 11 | `id` | — | lakehouse_datasets es un registro central de negocio del módulo 63 · lakehouse (lakehouse, data products analíticos y research releases), dominio Datos y NoSQL. |
| `lakehouse_files` | `LakehouseFiles` | 9 | `id` | — | lakehouse_files es un registro central de negocio del módulo 63 · lakehouse (lakehouse, data products analíticos y research releases), dominio Datos y NoSQL. |
| `lakehouse_lineage_edges` | `LakehouseLineageEdges` | 8 | `id` | — | lakehouse_lineage_edges es un registro central de negocio del módulo 63 · lakehouse (lakehouse, data products analíticos y research releases), dominio Datos y NoSQL. |
| `lakehouse_partitions` | `LakehousePartitions` | 9 | `id` | — | lakehouse_partitions es un registro central de negocio del módulo 63 · lakehouse (lakehouse, data products analíticos y research releases), dominio Datos y NoSQL. |
| `lakehouse_quality_issues` | `LakehouseQualityIssues` | 8 | `id` | — | lakehouse_quality_issues es un registro central de negocio del módulo 63 · lakehouse (lakehouse, data products analíticos y research releases), dominio Datos y NoSQL. |
| `lakehouse_quality_rules` | `LakehouseQualityRules` | 8 | `id` | — | lakehouse_quality_rules guarda reglas y configuración de gobierno del módulo 63 · lakehouse (dominio Datos y NoSQL): parametriza el comportamiento del negocio sin tocar código. |
| `lakehouse_quality_runs` | `LakehouseQualityRuns` | 9 | `id` | — | lakehouse_quality_runs registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 63 · lakehouse (dominio Datos y NoSQL): responde a '¿qué está pasando ahora mismo?'. |
| `lakehouse_schema_versions` | `LakehouseSchemaVersions` | 7 | `id` | — | lakehouse_schema_versions es un registro central de negocio del módulo 63 · lakehouse (lakehouse, data products analíticos y research releases), dominio Datos y NoSQL. |
| `research_projects` | `ResearchProjects` | 10 | `id` | — | research_projects es un registro central de negocio del módulo 63 · lakehouse (lakehouse, data products analíticos y research releases), dominio Datos y NoSQL. |
| `transformation_definitions` | `TransformationDefinitions` | 9 | `id` | — | transformation_definitions es un registro central de negocio del módulo 63 · lakehouse (lakehouse, data products analíticos y research releases), dominio Datos y NoSQL. |
| `transformation_runs` | `TransformationRuns` | 10 | `id` | — | transformation_runs registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 63 · lakehouse (dominio Datos y NoSQL): responde a '¿qué está pasando ahora mismo?'. |

### `marketing` (14 entidades, módulo `marketing`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `attribution_touches` | `AttributionTouches` | 14 | `id` | ✅ | attribution_touches es un registro central de negocio del módulo 50 · marketing (automatización de marketing, journeys y atribución), dominio Marketing y Crecimiento. |
| `campaign_dispatch_recipients` | `CampaignDispatchRecipients` | 26 | `id` | ✅ | campaign_dispatch_recipients registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 50 · marketing (dominio Marketing y Crecimiento): responde a '¿qué está pasando ahora mismo?'. |
| `campaign_dispatches` | `CampaignDispatches` | 37 | `id` | ✅ | campaign_dispatches registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 50 · marketing (dominio Marketing y Crecimiento): responde a '¿qué está pasando ahora mismo?'. |
| `campaign_members` | `CampaignMembers` | 16 | `id` | ✅ | campaign_members es una tabla de asociación del módulo 50 · marketing (dominio Marketing y Crecimiento): conecta entidades (`marketing_campaigns`) para representar relaciones muchos-a-muchos. |
| `campaign_schedules` | `CampaignSchedules` | 31 | `id` | ✅ | campaign_schedules es un registro central de negocio del módulo 50 · marketing (automatización de marketing, journeys y atribución), dominio Marketing y Crecimiento. |
| `content_templates` | `ContentTemplates` | 17 | `id` | ✅ | content_templates guarda reglas y configuración de gobierno del módulo 50 · marketing (dominio Marketing y Crecimiento): parametriza el comportamiento del negocio sin tocar código. |
| `journey_enrollments` | `JourneyEnrollments` | 14 | `id` | ✅ | journey_enrollments es un registro central de negocio del módulo 50 · marketing (automatización de marketing, journeys y atribución), dominio Marketing y Crecimiento. |
| `journey_steps` | `JourneySteps` | 16 | `id` | ✅ | journey_steps es un registro central de negocio del módulo 50 · marketing (automatización de marketing, journeys y atribución), dominio Marketing y Crecimiento. |
| `journeys` | `Journeys` | 14 | `id` | ✅ | journeys es un registro central de negocio del módulo 50 · marketing (automatización de marketing, journeys y atribución), dominio Marketing y Crecimiento. |
| `marketing_campaigns` | `MarketingCampaigns` | 31 | `id` | ✅ | marketing_campaigns es un registro central de negocio del módulo 50 · marketing (automatización de marketing, journeys y atribución), dominio Marketing y Crecimiento. |
| `marketing_touchpoints` | `MarketingTouchpoints` | 18 | `id` | — | marketing_touchpoints es un ledger inmutable (append-only) del módulo 50 · marketing (dominio Marketing y Crecimiento): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `segment_members` | `SegmentMembers` | 12 | `id` | ✅ | segment_members es una tabla de asociación del módulo 50 · marketing (dominio Marketing y Crecimiento): conecta entidades (`segments`) para representar relaciones muchos-a-muchos. |
| `segments` | `MarketingSegments` | 15 | `id` | ✅ | segments es un registro central de negocio del módulo 50 · marketing (automatización de marketing, journeys y atribución), dominio Marketing y Crecimiento. |
| `tracked_links` | `TrackedLinks` | 15 | `id` | ✅ | tracked_links es una tabla de asociación del módulo 50 · marketing (dominio Marketing y Crecimiento): conecta entidades (`marketing_touchpoints`, `marketing_campaigns`) para representar relaciones muchos-a-muchos. |

### `medical_groups` (2 entidades, módulo `medical_groups`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `group_members` | `MedicalGroupMembers` | 15 | `id` | ✅ | _sin descripción verificada en la bóveda_ |
| `groups` | `MedicalGroups` | 22 | `id` | ✅ | _sin descripción verificada en la bóveda_ |

### `messaging` (22 entidades, módulo `messaging`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `adapter_event_mappings` | `AdapterEventMappings` | 19 | `id` | ✅ | adapter_event_mappings es una tabla de asociación del módulo 35 · messaging (dominio Integraciones y Contratos): conecta entidades (otras entidades del módulo) para representar relaciones muchos-a-muchos. |
| `adapter_inbound_events` | `AdapterInboundEvents` | 23 | `id` | — | adapter_inbound_events registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 35 · messaging (dominio Integraciones y Contratos): responde a '¿qué está pasando ahora mismo?'. |
| `adapter_tracking_capabilities` | `AdapterTrackingCapabilities` | 13 | `id` | ✅ | adapter_tracking_capabilities es un registro central de negocio del módulo 35 · messaging (eventos de dominio, outbox, colas y entrega de notificaciones), dominio Integraciones y Contratos. |
| `dead_letter_jobs` | `DeadLetterJobs` | 9 | `id` | — | dead_letter_jobs es un ledger inmutable (append-only) del módulo 35 · messaging (dominio Integraciones y Contratos): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `delivery_receipts` | `DeliveryReceipts` | 8 | `id` | — | delivery_receipts es un ledger inmutable (append-only) del módulo 35 · messaging (dominio Integraciones y Contratos): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `delivery_reconciliation_runs` | `DeliveryReconciliationRuns` | 13 | `id` | — | delivery_reconciliation_runs registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 35 · messaging (dominio Integraciones y Contratos): responde a '¿qué está pasando ahora mismo?'. |
| `delivery_status_transitions` | `DeliveryStatusTransitions` | 9 | `id` | — | delivery_status_transitions registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 35 · messaging (dominio Integraciones y Contratos): responde a '¿qué está pasando ahora mismo?'. |
| `delivery_tracking_events` | `DeliveryTrackingEvents` | 24 | `id` | — | delivery_tracking_events registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 35 · messaging (dominio Integraciones y Contratos): responde a '¿qué está pasando ahora mismo?'. |
| `domain_events` | `DomainEvents` | 13 | `id` | — | domain_events es un ledger inmutable (append-only) del módulo 35 · messaging (dominio Integraciones y Contratos): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `event_deliveries` | `EventDeliveries` | 9 | `id` | — | event_deliveries es un ledger inmutable (append-only) del módulo 35 · messaging (dominio Integraciones y Contratos): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `event_subscriptions` | `EventSubscriptions` | 15 | `id` | ✅ | event_subscriptions es un registro central de negocio del módulo 35 · messaging (eventos de dominio, outbox, colas y entrega de notificaciones), dominio Integraciones y Contratos. |
| `in_app_notifications` | `InAppNotifications` | 31 | `id` | ✅ | in_app_notifications es un registro central de negocio del módulo 35 · messaging (eventos de dominio, outbox, colas y entrega de notificaciones), dominio Integraciones y Contratos. |
| `message_channels` | `MessageChannels` | 11 | `id` | ✅ | message_channels es una tabla de asociación del módulo 35 · messaging (dominio Integraciones y Contratos): conecta entidades (`provider_channel_configs`, `message_templates`, `notification_requests`) para representar rel… |
| `message_queues` | `MessageQueues` | 13 | `id` | ✅ | message_queues es un registro central de negocio del módulo 35 · messaging (eventos de dominio, outbox, colas y entrega de notificaciones), dominio Integraciones y Contratos. |
| `message_templates` | `MessageTemplates` | 16 | `id` | ✅ | message_templates guarda reglas y configuración de gobierno del módulo 35 · messaging (dominio Integraciones y Contratos): parametriza el comportamiento del negocio sin tocar código. |
| `messaging_providers` | `MessagingProviders` | 22 | `id` | ✅ | messaging_providers es un registro central de negocio del módulo 35 · messaging (eventos de dominio, outbox, colas y entrega de notificaciones), dominio Integraciones y Contratos. |
| `notification_deliveries` | `NotificationDeliveries` | 36 | `id` | ✅ | notification_deliveries registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 35 · messaging (dominio Integraciones y Contratos): responde a '¿qué está pasando ahora mismo?'. |
| `notification_requests` | `NotificationRequests` | 35 | `id` | ✅ | notification_requests registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 35 · messaging (dominio Integraciones y Contratos): responde a '¿qué está pasando ahora mismo?'. |
| `outbox_messages` | `OutboxMessages` | 20 | `id` | ✅ | outbox_messages es un registro central de negocio del módulo 35 · messaging (eventos de dominio, outbox, colas y entrega de notificaciones), dominio Integraciones y Contratos. |
| `provider_channel_configs` | `ProviderChannelConfigs` | 26 | `id` | ✅ | provider_channel_configs guarda reglas y configuración de gobierno del módulo 35 · messaging (dominio Integraciones y Contratos): parametriza el comportamiento del negocio sin tocar código. |
| `queued_jobs` | `QueuedJobs` | 22 | `id` | ✅ | queued_jobs registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 35 · messaging (dominio Integraciones y Contratos): responde a '¿qué está pasando ahora mismo?'. |
| `recipient_preferences` | `RecipientPreferences` | 13 | `id` | ✅ | recipient_preferences es un registro central de negocio del módulo 35 · messaging (eventos de dominio, outbox, colas y entrega de notificaciones), dominio Integraciones y Contratos. |

### `object_storage` (17 entidades, módulo `object_storage`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `archive_manifests` | `ArchiveManifests` | 9 | `id` | — | archive_manifests es un registro central de negocio del módulo 60 · object_storage (almacenamiento de objetos, media médica y catálogo PACS), dominio Datos y NoSQL. |
| `dicom_instance_manifests` | `DicomInstanceManifests` | 9 | `id` | — | dicom_instance_manifests es un registro central de negocio del módulo 60 · object_storage (almacenamiento de objetos, media médica y catálogo PACS), dominio Datos y NoSQL. |
| `dicom_series_manifests` | `DicomSeriesManifests` | 8 | `id` | — | dicom_series_manifests es un registro central de negocio del módulo 60 · object_storage (almacenamiento de objetos, media médica y catálogo PACS), dominio Datos y NoSQL. |
| `dicom_study_manifests` | `DicomStudyManifests` | 11 | `id` | — | dicom_study_manifests es un registro central de negocio del módulo 60 · object_storage (almacenamiento de objetos, media médica y catálogo PACS), dominio Datos y NoSQL. |
| `dicomweb_access_logs` | `DicomwebAccessLogs` | 10 | `id` | — | dicomweb_access_logs es un registro central de negocio del módulo 60 · object_storage (almacenamiento de objetos, media médica y catálogo PACS), dominio Datos y NoSQL. |
| `large_payload_manifests` | `LargePayloadManifests` | 9 | `id` | — | large_payload_manifests es un registro central de negocio del módulo 60 · object_storage (almacenamiento de objetos, media médica y catálogo PACS), dominio Datos y NoSQL. |
| `multipart_uploads` | `MultipartUploads` | 10 | `id` | — | multipart_uploads es un registro central de negocio del módulo 60 · object_storage (almacenamiento de objetos, media médica y catálogo PACS), dominio Datos y NoSQL. |
| `object_checksums` | `ObjectChecksums` | 7 | `id` | — | object_checksums es un registro central de negocio del módulo 60 · object_storage (almacenamiento de objetos, media médica y catálogo PACS), dominio Datos y NoSQL. |
| `object_deletion_markers` | `ObjectDeletionMarkers` | 7 | `id` | — | object_deletion_markers es un registro central de negocio del módulo 60 · object_storage (almacenamiento de objetos, media médica y catálogo PACS), dominio Datos y NoSQL. |
| `object_encryption_envelopes` | `ObjectEncryptionEnvelopes` | 8 | `id` | — | object_encryption_envelopes es un registro central de negocio del módulo 60 · object_storage (almacenamiento de objetos, media médica y catálogo PACS), dominio Datos y NoSQL. |
| `object_integrity_checks` | `ObjectIntegrityChecks` | 8 | `id` | — | object_integrity_checks es un registro central de negocio del módulo 60 · object_storage (almacenamiento de objetos, media médica y catálogo PACS), dominio Datos y NoSQL. |
| `object_legal_holds` | `ObjectLegalHolds` | 7 | `id` | — | object_legal_holds registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 60 · object_storage (dominio Datos y NoSQL): responde a '¿qué está pasando ahora mismo?'. |
| `object_locations` | `ObjectLocations` | 8 | `id` | — | object_locations es un registro central de negocio del módulo 60 · object_storage (almacenamiento de objetos, media médica y catálogo PACS), dominio Datos y NoSQL. |
| `object_manifests` | `ObjectManifests` | 11 | `id` | — | object_manifests es un registro central de negocio del módulo 60 · object_storage (almacenamiento de objetos, media médica y catálogo PACS), dominio Datos y NoSQL. |
| `object_namespaces` | `ObjectNamespaces` | 10 | `id` | — | object_namespaces es un registro central de negocio del módulo 60 · object_storage (almacenamiento de objetos, media médica y catálogo PACS), dominio Datos y NoSQL. |
| `object_retention_locks` | `ObjectRetentionLocks` | 7 | `id` | — | object_retention_locks es un registro central de negocio del módulo 60 · object_storage (almacenamiento de objetos, media médica y catálogo PACS), dominio Datos y NoSQL. |
| `object_versions` | `ObjectVersions` | 12 | `id` | — | object_versions es un registro central de negocio del módulo 60 · object_storage (almacenamiento de objetos, media médica y catálogo PACS), dominio Datos y NoSQL. |

### `organization_extensions` (6 entidades, módulo `organization_extensions`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `data_use_agreements` | `DataUseAgreements` | 13 | `id` | ✅ | data_use_agreements es el acuerdo de uso de datos (DUA) que gobierna qué datos puede compartir e intercambiar una organización con una contraparte, con propósito y vigencia, en el módulo 22 · organization_extensions (dom… |
| `facility_licenses` | `FacilityLicenses` | 18 | `id` | ✅ | facility_licenses es un registro central de negocio del módulo 22 · organization_extensions (especializaciones de organizaciones de salud), dominio Práctica y Agenda. |
| `hospital_service_lines` | `HospitalServiceLines` | 14 | `id` | ✅ | hospital_service_lines es un registro central de negocio del módulo 22 · organization_extensions (especializaciones de organizaciones de salud), dominio Práctica y Agenda. |
| `hospitals` | `Hospitals` | 18 | `id` | ✅ | hospitals es un registro central de negocio del módulo 22 · organization_extensions (especializaciones de organizaciones de salud), dominio Práctica y Agenda. |
| `organization_affiliations` | `OrganizationAffiliations` | 16 | `id` | ✅ | organization_affiliations es un registro central de negocio del módulo 22 · organization_extensions (especializaciones de organizaciones de salud), dominio Práctica y Agenda. |
| `organization_data_boundaries` | `OrganizationDataBoundaries` | 18 | `id` | ✅ | organization_data_boundaries es un registro central de negocio del módulo 22 · organization_extensions (especializaciones de organizaciones de salud), dominio Práctica y Agenda. |

### `payments` (53 entidades, módulo `payments`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `callback_verification_runs` | `CallbackVerificationRuns` | 11 | `id` | — | callback_verification_runs es un ledger inmutable (append-only) del módulo 42 · payments (dominio Financiero y ERP): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `cash_registers` | `CashRegisters` | 14 | `id` | ✅ | cash_registers es el terminal físico de cobro (caja registradora/POS) donde el cajero abre turno y registra pagos en efectivo, en el módulo 42 · payments (dominio Financiero y ERP). |
| `cashier_payment_contexts` | `CashierPaymentContexts` | 10 | `id` | — | cashier_payment_contexts es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `connected_accounts` | `ConnectedAccounts` | 18 | `id` | ✅ | connected_accounts es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `fee_schedules` | `FeeSchedules` | 20 | `id` | ✅ | fee_schedules es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `fx_rate_locks` | `FxRateLocks` | 14 | `id` | ✅ | fx_rate_locks es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `gateway_connections` | `GatewayConnections` | 15 | `id` | ✅ | gateway_connections es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `gateway_payment_channel_mappings` | `GatewayPaymentChannelMappings` | 11 | `id` | ✅ | gateway_payment_channel_mappings es una tabla de asociación del módulo 42 · payments (dominio Financiero y ERP): conecta entidades (`payment_channel_catalog`, `gateway_connections`) para representar relaciones muchos-a-m… |
| `gateway_settlements` | `GatewaySettlements` | 15 | `id` | ✅ | gateway_settlements es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `installment_plans` | `InstallmentPlans` | 12 | `id` | ✅ | installment_plans es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `installment_schedules` | `InstallmentSchedules` | 13 | `id` | ✅ | installment_schedules es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `invoice_regeneration_requests` | `InvoiceRegenerationRequests` | 19 | `id` | ✅ | invoice_regeneration_requests registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 42 · payments (dominio Financiero y ERP): responde a '¿qué está pasando ahora mismo?'. |
| `kyc_verifications` | `KycVerifications` | 14 | `id` | ✅ | kyc_verifications es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `payment_cancellation_requests` | `PaymentCancellationRequests` | 20 | `id` | ✅ | payment_cancellation_requests registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 42 · payments (dominio Financiero y ERP): responde a '¿qué está pasando ahora mismo?'. |
| `payment_channel_catalog` | `PaymentChannelCatalog` | 16 | `id` | ✅ | payment_channel_catalog es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `payment_checkout_sessions` | `PaymentCheckoutSessions` | 20 | `id` | ✅ | payment_checkout_sessions es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `payment_debt_invoice_requests` | `PaymentDebtInvoiceRequests` | 13 | `id` | — | payment_debt_invoice_requests es un ledger inmutable (append-only) del módulo 42 · payments (dominio Financiero y ERP): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `payment_debt_lines` | `PaymentDebtLines` | 17 | `id` | ✅ | payment_debt_lines es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `payment_debts` | `PaymentDebts` | 22 | `id` | ✅ | payment_debts es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `payment_disputes` | `PaymentDisputes` | 16 | `id` | ✅ | payment_disputes es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `payment_gateways` | `PaymentGateways` | 13 | `id` | ✅ | payment_gateways es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `payment_intents` | `PaymentIntents` | 22 | `id` | ✅ | payment_intents es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `payment_mandates` | `PaymentMandates` | 16 | `id` | ✅ | payment_mandates es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `payment_methods` | `PaymentMethods` | 20 | `id` | ✅ | payment_methods es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `payment_receipts` | `PaymentReceipts` | 18 | `id` | ✅ | payment_receipts es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `payment_splits` | `PaymentSplits` | 15 | `id` | ✅ | payment_splits es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `payment_status_inquiries` | `PaymentStatusInquiries` | 15 | `id` | — | payment_status_inquiries es un ledger inmutable (append-only) del módulo 42 · payments (dominio Financiero y ERP): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `payment_transactions` | `PaymentTransactions` | 24 | `id` | ✅ | payment_transactions es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `payment_webhook_events` | `PaymentWebhookEvents` | 13 | `id` | — | payment_webhook_events es un ledger inmutable (append-only) del módulo 42 · payments (dominio Financiero y ERP): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `payout_items` | `PayoutItems` | 12 | `id` | ✅ | payout_items es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `payouts` | `Payouts` | 21 | `id` | ✅ | payouts es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `plan_eligibility_rules` | `PlanEligibilityRules` | 11 | `id` | ✅ | plan_eligibility_rules guarda reglas y configuración de gobierno del módulo 42 · payments (dominio Financiero y ERP): parametriza el comportamiento del negocio sin tocar código. |
| `plan_features` | `PlanFeatures` | 12 | `id` | ✅ | plan_features es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `plan_prices` | `PlanPrices` | 16 | `id` | ✅ | plan_prices es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `plan_quotas` | `PlanQuotas` | 13 | `id` | ✅ | plan_quotas es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `provider_api_attempts` | `ProviderApiAttempts` | 17 | `id` | — | provider_api_attempts es un ledger inmutable (append-only) del módulo 42 · payments (dominio Financiero y ERP): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `provider_api_operations` | `ProviderApiOperations` | 16 | `id` | ✅ | provider_api_operations es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `provider_callback_endpoints` | `ProviderCallbackEndpoints` | 14 | `id` | ✅ | provider_callback_endpoints es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `provider_callback_events` | `ProviderCallbackEvents` | 15 | `id` | — | provider_callback_events es un ledger inmutable (append-only) del módulo 42 · payments (dominio Financiero y ERP): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `provider_invoice_artifacts` | `ProviderInvoiceArtifacts` | 18 | `id` | ✅ | provider_invoice_artifacts es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `provider_reconciliation_records` | `ProviderReconciliationRecords` | 17 | `id` | — | provider_reconciliation_records es un ledger inmutable (append-only) del módulo 42 · payments (dominio Financiero y ERP): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `reconciliation_exceptions` | `ReconciliationExceptions` | 15 | `id` | ✅ | reconciliation_exceptions es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `reconciliation_runs` | `PaymentsReconciliationRuns` | 18 | `id` | ✅ | reconciliation_runs registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 42 · payments (dominio Financiero y ERP): responde a '¿qué está pasando ahora mismo?'. |
| `refunds` | `Refunds` | 14 | `id` | ✅ | refunds es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `risk_assessments` | `RiskAssessments` | 15 | `id` | ✅ | risk_assessments es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `settlement_lines` | `SettlementLines` | 11 | `id` | ✅ | settlement_lines es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `subscription_plans` | `SubscriptionPlans` | 21 | `id` | ✅ | subscription_plans es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `subscription_usage_counters` | `SubscriptionUsageCounters` | 14 | `id` | ✅ | subscription_usage_counters es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `subscriptions` | `Subscriptions` | 18 | `id` | ✅ | subscriptions es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `tips` | `Tips` | 13 | `id` | ✅ | tips es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `transaction_fees` | `TransactionFees` | 12 | `id` | ✅ | transaction_fees es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |
| `wallet_ledger_entries` | `WalletLedgerEntries` | 15 | `id` | — | wallet_ledger_entries es un ledger inmutable (append-only) del módulo 42 · payments (dominio Financiero y ERP): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `wallets` | `Wallets` | 16 | `id` | ✅ | wallets es un registro central de negocio del módulo 42 · payments (pasarelas de pago, transacciones, reembolsos y payouts), dominio Financiero y ERP. |

### `pharma_lab` (31 entidades, módulo `pharma_lab`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `doctor_visit_blocks` | `DoctorVisitBlocks` | 12 | `id` | ✅ | _sin descripción verificada en la bóveda_ |
| `doctor_visit_policies` | `DoctorVisitPolicies` | 17 | `id` | ✅ | _sin descripción verificada en la bóveda_ |
| `doctor_visit_windows` | `DoctorVisitWindows` | 14 | `id` | ✅ | _sin descripción verificada en la bóveda_ |
| `informational_materials` | `InformationalMaterials` | 21 | `id` | ✅ | _sin descripción verificada en la bóveda_ |
| `material_approvals` | `MaterialApprovals` | 9 | `id` | — | _sin descripción verificada en la bóveda_ |
| `material_assets` | `MaterialAssets` | 9 | `id` | — | _sin descripción verificada en la bóveda_ |
| `medical_visitor_products` | `MedicalVisitorProducts` | 7 | `id` | — | _sin descripción verificada en la bóveda_ |
| `medical_visitor_specialties` | `MedicalVisitorSpecialties` | 5 | `id` | — | _sin descripción verificada en la bóveda_ |
| `medical_visitors` | `MedicalVisitors` | 27 | `id` | ✅ | _sin descripción verificada en la bóveda_ |
| `pharma_cost_allocations` | `PharmaCostAllocations` | 18 | `id` | ✅ | _sin descripción verificada en la bóveda_ |
| `pharma_lab_link_events` | `PharmaLabLinkEvents` | 13 | `id` | — | _sin descripción verificada en la bóveda_ |
| `pharma_lab_notices` | `PharmaLabNotices` | 15 | `id` | ✅ | _sin descripción verificada en la bóveda_ |
| `pharma_lab_staff` | `PharmaLabStaff` | 19 | `id` | ✅ | _sin descripción verificada en la bóveda_ |
| `pharma_labs` | `PharmaLabs` | 16 | `id` | ✅ | _sin descripción verificada en la bóveda_ |
| `pharma_products` | `PharmaProducts` | 23 | `id` | ✅ | _sin descripción verificada en la bóveda_ |
| `pharmacovigilance_actions` | `PharmacovigilanceActions` | 12 | `id` | — | _sin descripción verificada en la bóveda_ |
| `pharmacovigilance_reports` | `PharmacovigilanceReports` | 23 | `id` | ✅ | _sin descripción verificada en la bóveda_ |
| `regulatory_document_access_log` | `RegulatoryDocumentAccessLog` | 7 | `id` | — | _sin descripción verificada en la bóveda_ |
| `regulatory_document_versions` | `RegulatoryDocumentVersions` | 15 | `id` | ✅ | _sin descripción verificada en la bóveda_ |
| `regulatory_documents` | `RegulatoryDocuments` | 20 | `id` | ✅ | _sin descripción verificada en la bóveda_ |
| `visit_ratings` | `VisitRatings` | 17 | `id` | ✅ | _sin descripción verificada en la bóveda_ |
| `visit_record_materials` | `VisitRecordMaterials` | 7 | `id` | — | _sin descripción verificada en la bóveda_ |
| `visit_records` | `VisitRecords` | 22 | `id` | ✅ | _sin descripción verificada en la bóveda_ |
| `visit_request_events` | `VisitRequestEvents` | 11 | `id` | — | _sin descripción verificada en la bóveda_ |
| `visit_request_topics` | `VisitRequestTopics` | 6 | `id` | — | _sin descripción verificada en la bóveda_ |
| `visit_requests` | `VisitRequests` | 23 | `id` | ✅ | _sin descripción verificada en la bóveda_ |
| `visit_survey_answers` | `VisitSurveyAnswers` | 8 | `id` | — | _sin descripción verificada en la bóveda_ |
| `visit_survey_questions` | `VisitSurveyQuestions` | 9 | `id` | — | _sin descripción verificada en la bóveda_ |
| `visit_survey_responses` | `VisitSurveyResponses` | 12 | `id` | ✅ | _sin descripción verificada en la bóveda_ |
| `visit_surveys` | `VisitSurveys` | 17 | `id` | ✅ | _sin descripción verificada en la bóveda_ |
| `visitor_post_submissions` | `VisitorPostSubmissions` | 15 | `id` | ✅ | _sin descripción verificada en la bóveda_ |

### `pharmacy` (9 entidades, módulo `pharmacy`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `pharmacies` | `Pharmacies` | 16 | `id` | ✅ | pharmacies es un registro central de negocio del módulo 24 · pharmacy (identidad de farmacia, sedes, catálogo y precios), dominio Farmacia. |
| `pharmacy_external_product_mappings` | `PharmacyExternalProductMappings` | 12 | `id` | ✅ | pharmacy_external_product_mappings es una tabla de asociación del módulo 24 · pharmacy (dominio Farmacia): conecta entidades (`pharmacy_integration_connections`, `pharmacy_products`) para representar relaciones muchos-a-… |
| `pharmacy_integration_connections` | `PharmacyIntegrationConnections` | 17 | `id` | ✅ | pharmacy_integration_connections es un registro central de negocio del módulo 24 · pharmacy (identidad de farmacia, sedes, catálogo y precios), dominio Farmacia. |
| `pharmacy_licenses` | `PharmacyLicenses` | 16 | `id` | ✅ | pharmacy_licenses es un registro central de negocio del módulo 24 · pharmacy (identidad de farmacia, sedes, catálogo y precios), dominio Farmacia. |
| `pharmacy_price_lists` | `PharmacyPriceLists` | 16 | `id` | ✅ | pharmacy_price_lists es un registro central de negocio del módulo 24 · pharmacy (identidad de farmacia, sedes, catálogo y precios), dominio Farmacia. |
| `pharmacy_product_identifiers` | `PharmacyProductIdentifiers` | 10 | `id` | — | pharmacy_product_identifiers es un registro central de negocio del módulo 24 · pharmacy (identidad de farmacia, sedes, catálogo y precios), dominio Farmacia. |
| `pharmacy_product_prices` | `PharmacyProductPrices` | 14 | `id` | — | pharmacy_product_prices es un registro central de negocio del módulo 24 · pharmacy (identidad de farmacia, sedes, catálogo y precios), dominio Farmacia. |
| `pharmacy_products` | `PharmacyProducts` | 19 | `id` | ✅ | pharmacy_products es un registro central de negocio del módulo 24 · pharmacy (identidad de farmacia, sedes, catálogo y precios), dominio Farmacia. |
| `pharmacy_sites` | `PharmacySites` | 16 | `id` | ✅ | pharmacy_sites es un registro central de negocio del módulo 24 · pharmacy (identidad de farmacia, sedes, catálogo y precios), dominio Farmacia. |

### `pharmacy_inventory` (21 entidades, módulo `pharmacy_inventory`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `inventory_count_lines` | `InventoryCountLines` | 11 | `id` | — | inventory_count_lines es un registro central de negocio del módulo 25 · pharmacy_inventory (inventario de farmacia, abastecimiento y dispensación), dominio Farmacia. |
| `inventory_count_sessions` | `InventoryCountSessions` | 15 | `id` | ✅ | inventory_count_sessions es un registro central de negocio del módulo 25 · pharmacy_inventory (inventario de farmacia, abastecimiento y dispensación), dominio Farmacia. |
| `inventory_ledger_entries` | `InventoryLedgerEntries` | 23 | `id` | — | inventory_ledger_entries es un registro central de negocio del módulo 25 · pharmacy_inventory (inventario de farmacia, abastecimiento y dispensación), dominio Farmacia. |
| `inventory_locations` | `InventoryLocations` | 14 | `id` | ✅ | inventory_locations es un registro central de negocio del módulo 25 · pharmacy_inventory (inventario de farmacia, abastecimiento y dispensación), dominio Farmacia. |
| `inventory_lots` | `InventoryLots` | 15 | `id` | ✅ | inventory_lots es un registro central de negocio del módulo 25 · pharmacy_inventory (inventario de farmacia, abastecimiento y dispensación), dominio Farmacia. |
| `inventory_recall_holds` | `InventoryRecallHolds` | 14 | `id` | ✅ | inventory_recall_holds registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 25 · pharmacy_inventory (dominio Farmacia): responde a '¿qué está pasando ahora mismo?'. |
| `inventory_reservation_lines` | `InventoryReservationLines` | 16 | `id` | ✅ | inventory_reservation_lines es un registro central de negocio del módulo 25 · pharmacy_inventory (inventario de farmacia, abastecimiento y dispensación), dominio Farmacia. |
| `inventory_reservations` | `InventoryReservations` | 22 | `id` | ✅ | inventory_reservations es un registro central de negocio del módulo 25 · pharmacy_inventory (inventario de farmacia, abastecimiento y dispensación), dominio Farmacia. |
| `inventory_serials` | `InventorySerials` | 11 | `id` | ✅ | inventory_serials es un registro central de negocio del módulo 25 · pharmacy_inventory (inventario de farmacia, abastecimiento y dispensación), dominio Farmacia. |
| `inventory_stock_positions` | `InventoryStockPositions` | 11 | `id` | ✅ | inventory_stock_positions es un registro central de negocio del módulo 25 · pharmacy_inventory (inventario de farmacia, abastecimiento y dispensación), dominio Farmacia. |
| `medication_dispensation_lines` | `MedicationDispensationLines` | 12 | `id` | — | medication_dispensation_lines es un registro central de negocio del módulo 25 · pharmacy_inventory (inventario de farmacia, abastecimiento y dispensación), dominio Farmacia. |
| `medication_dispensations` | `MedicationDispensations` | 17 | `id` | ✅ | medication_dispensations es un registro central de negocio del módulo 25 · pharmacy_inventory (inventario de farmacia, abastecimiento y dispensación), dominio Farmacia. |
| `pharmacy_goods_receipt_lines` | `PharmacyGoodsReceiptLines` | 14 | `id` | — | pharmacy_goods_receipt_lines es un registro central de negocio del módulo 25 · pharmacy_inventory (inventario de farmacia, abastecimiento y dispensación), dominio Farmacia. |
| `pharmacy_goods_receipts` | `PharmacyGoodsReceipts` | 15 | `id` | ✅ | pharmacy_goods_receipts es un registro central de negocio del módulo 25 · pharmacy_inventory (inventario de farmacia, abastecimiento y dispensación), dominio Farmacia. |
| `pharmacy_inventory_sync_batches` | `PharmacyInventorySyncBatches` | 15 | `id` | ✅ | pharmacy_inventory_sync_batches es un registro central de negocio del módulo 25 · pharmacy_inventory (inventario de farmacia, abastecimiento y dispensación), dominio Farmacia. |
| `pharmacy_inventory_sync_items` | `PharmacyInventorySyncItems` | 13 | `id` | — | pharmacy_inventory_sync_items es un registro central de negocio del módulo 25 · pharmacy_inventory (inventario de farmacia, abastecimiento y dispensación), dominio Farmacia. |
| `pharmacy_order_substitutions` | `PharmacyOrderSubstitutions` | 15 | `id` | ✅ | las propuestas de sustitución de un pedido de farmacia, renglón por renglón. «Te proponen genérico X (Bs 25) en lugar de marca Y (Bs 60)»: la farmacia lo ofrece al revisar el pedido y la decisión es siempre del paciente … |
| `pharmacy_purchase_order_lines` | `PharmacyPurchaseOrderLines` | 13 | `id` | ✅ | pharmacy_purchase_order_lines es un registro central de negocio del módulo 25 · pharmacy_inventory (inventario de farmacia, abastecimiento y dispensación), dominio Farmacia. |
| `pharmacy_purchase_orders` | `PharmacyPurchaseOrders` | 16 | `id` | ✅ | pharmacy_purchase_orders es un registro central de negocio del módulo 25 · pharmacy_inventory (inventario de farmacia, abastecimiento y dispensación), dominio Farmacia. |
| `pharmacy_suppliers` | `PharmacySuppliers` | 12 | `id` | ✅ | pharmacy_suppliers es un registro central de negocio del módulo 25 · pharmacy_inventory (inventario de farmacia, abastecimiento y dispensación), dominio Farmacia. |
| `purchase_quotations` | `PurchaseQuotations` | 14 | `id` | ✅ | purchase_quotations es la cotización de compra que un proveedor emite antes de una orden, con precios y vigencia, para abastecer inventario de farmacia, en el módulo 25 · pharmacy_inventory (dominio Farmacia). |

### `platform_ops` (38 entidades, módulo `platform_ops`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `artifacts` | `Artifacts` | 23 | `id` | ✅ | artifacts es un registro central de negocio del módulo 46 · platform_ops (operaciones de plataforma, observabilidad y releases), dominio Operaciones de Plataforma. |
| `capacity_measurements` | `CapacityMeasurements` | 9 | `id` | — | capacity_measurements es un ledger inmutable (append-only) del módulo 46 · platform_ops (dominio Operaciones de Plataforma): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `capacity_plans` | `CapacityPlans` | 14 | `id` | ✅ | capacity_plans es un registro central de negocio del módulo 46 · platform_ops (operaciones de plataforma, observabilidad y releases), dominio Operaciones de Plataforma. |
| `change_approvals` | `ChangeApprovals` | 8 | `id` | — | change_approvals es un registro central de negocio del módulo 46 · platform_ops (operaciones de plataforma, observabilidad y releases), dominio Operaciones de Plataforma. |
| `change_requests` | `ChangeRequests` | 23 | `id` | ✅ | change_requests registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 46 · platform_ops (dominio Operaciones de Plataforma): responde a '¿qué está pasando ahora mismo?'. |
| `component_tools` | `ComponentTools` | 12 | `id` | ✅ | component_tools es un registro central de negocio del módulo 46 · platform_ops (operaciones de plataforma, observabilidad y releases), dominio Operaciones de Plataforma. |
| `deployments` | `Deployments` | 19 | `id` | ✅ | deployments es un registro central de negocio del módulo 46 · platform_ops (operaciones de plataforma, observabilidad y releases), dominio Operaciones de Plataforma. |
| `error_budget_burn_events` | `ErrorBudgetBurnEvents` | 10 | `id` | — | error_budget_burn_events es un ledger inmutable (append-only) del módulo 46 · platform_ops (dominio Operaciones de Plataforma): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `error_budget_policies` | `ErrorBudgetPolicies` | 14 | `id` | ✅ | error_budget_policies guarda reglas y configuración de gobierno del módulo 46 · platform_ops (dominio Operaciones de Plataforma): parametriza el comportamiento del negocio sin tocar código. |
| `escalation_policies` | `EscalationPolicies` | 11 | `id` | ✅ | escalation_policies guarda reglas y configuración de gobierno del módulo 46 · platform_ops (dominio Operaciones de Plataforma): parametriza el comportamiento del negocio sin tocar código. |
| `escalation_policy_steps` | `EscalationPolicySteps` | 14 | `id` | ✅ | escalation_policy_steps es un registro central de negocio del módulo 46 · platform_ops (operaciones de plataforma, observabilidad y releases), dominio Operaciones de Plataforma. |
| `health_check_runs` | `HealthCheckRuns` | 14 | `id` | — | health_check_runs es un ledger inmutable (append-only) del módulo 46 · platform_ops (dominio Operaciones de Plataforma): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `health_checks` | `HealthChecks` | 21 | `id` | ✅ | health_checks es un registro central de negocio del módulo 46 · platform_ops (operaciones de plataforma, observabilidad y releases), dominio Operaciones de Plataforma. |
| `health_incidents` | `HealthIncidents` | 19 | `id` | ✅ | health_incidents es un registro central de negocio del módulo 46 · platform_ops (operaciones de plataforma, observabilidad y releases), dominio Operaciones de Plataforma. |
| `incident_communications` | `IncidentCommunications` | 9 | `id` | — | incident_communications es un ledger inmutable (append-only) del módulo 46 · platform_ops (dominio Operaciones de Plataforma): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `incident_responders` | `IncidentResponders` | 8 | `id` | — | incident_responders es un registro central de negocio del módulo 46 · platform_ops (operaciones de plataforma, observabilidad y releases), dominio Operaciones de Plataforma. |
| `incident_timeline_events` | `IncidentTimelineEvents` | 9 | `id` | — | incident_timeline_events es un ledger inmutable (append-only) del módulo 46 · platform_ops (dominio Operaciones de Plataforma): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `maintenance_windows` | `MaintenanceWindows` | 14 | `id` | ✅ | maintenance_windows es un registro central de negocio del módulo 46 · platform_ops (operaciones de plataforma, observabilidad y releases), dominio Operaciones de Plataforma. |
| `on_call_schedules` | `OnCallSchedules` | 12 | `id` | ✅ | on_call_schedules es un registro central de negocio del módulo 46 · platform_ops (operaciones de plataforma, observabilidad y releases), dominio Operaciones de Plataforma. |
| `on_call_shifts` | `OnCallShifts` | 12 | `id` | ✅ | on_call_shifts es un registro central de negocio del módulo 46 · platform_ops (operaciones de plataforma, observabilidad y releases), dominio Operaciones de Plataforma. |
| `operational_improvement_items` | `OperationalImprovementItems` | 19 | `id` | ✅ | operational_improvement_items es un registro central de negocio del módulo 46 · platform_ops (operaciones de plataforma, observabilidad y releases), dominio Operaciones de Plataforma. |
| `operational_readiness_reviews` | `OperationalReadinessReviews` | 15 | `id` | ✅ | operational_readiness_reviews es un registro central de negocio del módulo 46 · platform_ops (operaciones de plataforma, observabilidad y releases), dominio Operaciones de Plataforma. |
| `operational_teams` | `OperationalTeams` | 14 | `id` | ✅ | operational_teams es un registro central de negocio del módulo 46 · platform_ops (operaciones de plataforma, observabilidad y releases), dominio Operaciones de Plataforma. |
| `postmortem_action_items` | `PostmortemActionItems` | 15 | `id` | ✅ | postmortem_action_items es un registro central de negocio del módulo 46 · platform_ops (operaciones de plataforma, observabilidad y releases), dominio Operaciones de Plataforma. |
| `postmortems` | `Postmortems` | 18 | `id` | ✅ | postmortems es un registro central de negocio del módulo 46 · platform_ops (operaciones de plataforma, observabilidad y releases), dominio Operaciones de Plataforma. |
| `readiness_review_findings` | `ReadinessReviewFindings` | 16 | `id` | ✅ | readiness_review_findings es un registro central de negocio del módulo 46 · platform_ops (operaciones de plataforma, observabilidad y releases), dominio Operaciones de Plataforma. |
| `recovery_objectives` | `RecoveryObjectives` | 15 | `id` | ✅ | recovery_objectives es un registro central de negocio del módulo 46 · platform_ops (operaciones de plataforma, observabilidad y releases), dominio Operaciones de Plataforma. |
| `resilience_exercises` | `ResilienceExercises` | 19 | `id` | ✅ | resilience_exercises es un registro central de negocio del módulo 46 · platform_ops (operaciones de plataforma, observabilidad y releases), dominio Operaciones de Plataforma. |
| `runbook_executions` | `RunbookExecutions` | 12 | `id` | — | runbook_executions es un ledger inmutable (append-only) del módulo 46 · platform_ops (dominio Operaciones de Plataforma): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `runbook_versions` | `RunbookVersions` | 9 | `id` | — | runbook_versions es un registro central de negocio del módulo 46 · platform_ops (operaciones de plataforma, observabilidad y releases), dominio Operaciones de Plataforma. |
| `runbooks` | `Runbooks` | 14 | `id` | ✅ | runbooks es un registro central de negocio del módulo 46 · platform_ops (operaciones de plataforma, observabilidad y releases), dominio Operaciones de Plataforma. |
| `service_components` | `ServiceComponents` | 15 | `id` | ✅ | service_components es un registro central de negocio del módulo 46 · platform_ops (operaciones de plataforma, observabilidad y releases), dominio Operaciones de Plataforma. |
| `service_dependencies` | `ServiceDependencies` | 14 | `id` | ✅ | service_dependencies es un registro central de negocio del módulo 46 · platform_ops (operaciones de plataforma, observabilidad y releases), dominio Operaciones de Plataforma. |
| `service_level_indicators` | `ServiceLevelIndicators` | 15 | `id` | ✅ | service_level_indicators es un registro central de negocio del módulo 46 · platform_ops (operaciones de plataforma, observabilidad y releases), dominio Operaciones de Plataforma. |
| `service_level_objectives` | `ServiceLevelObjectives` | 14 | `id` | ✅ | service_level_objectives es un registro central de negocio del módulo 46 · platform_ops (operaciones de plataforma, observabilidad y releases), dominio Operaciones de Plataforma. |
| `service_ownerships` | `ServiceOwnerships` | 13 | `id` | ✅ | service_ownerships es un registro central de negocio del módulo 46 · platform_ops (operaciones de plataforma, observabilidad y releases), dominio Operaciones de Plataforma. |
| `slo_measurements` | `SloMeasurements` | 11 | `id` | — | slo_measurements es un ledger inmutable (append-only) del módulo 46 · platform_ops (dominio Operaciones de Plataforma): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `tool_registry` | `ToolRegistry` | 17 | `id` | ✅ | tool_registry es un registro central de negocio del módulo 46 · platform_ops (operaciones de plataforma, observabilidad y releases), dominio Operaciones de Plataforma. |

### `polyglot_storage` (20 entidades, módulo `polyglot_storage`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `collection_definitions` | `CollectionDefinitions` | 12 | `id` | — | collection_definitions es un registro central de negocio del módulo 54 · polyglot_storage (gobierno de almacenamiento políglota y ubicación de datos), dominio Datos y NoSQL. |
| `collection_schema_versions` | `CollectionSchemaVersions` | 10 | `id` | — | collection_schema_versions es un registro central de negocio del módulo 54 · polyglot_storage (gobierno de almacenamiento políglota y ubicación de datos), dominio Datos y NoSQL. |
| `consistency_policies` | `ConsistencyPolicies` | 8 | `id` | — | consistency_policies guarda reglas y configuración de gobierno del módulo 54 · polyglot_storage (dominio Datos y NoSQL): parametriza el comportamiento del negocio sin tocar código. |
| `data_access_policies` | `DataAccessPolicies` | 9 | `id` | — | data_access_policies guarda reglas y configuración de gobierno del módulo 54 · polyglot_storage (dominio Datos y NoSQL): parametriza el comportamiento del negocio sin tocar código. |
| `data_classifications` | `PolyglotStorageDataClassifications` | 10 | `id` | — | data_classifications es un registro central de negocio del módulo 54 · polyglot_storage (gobierno de almacenamiento políglota y ubicación de datos), dominio Datos y NoSQL. |
| `dataset_definitions` | `DatasetDefinitions` | 11 | `id` | ✅ | dataset_definitions es un registro central de negocio del módulo 54 · polyglot_storage (gobierno de almacenamiento políglota y ubicación de datos), dominio Datos y NoSQL. |
| `dataset_placements` | `DatasetPlacements` | 11 | `id` | — | dataset_placements es un registro central de negocio del módulo 54 · polyglot_storage (gobierno de almacenamiento políglota y ubicación de datos), dominio Datos y NoSQL. |
| `dataset_versions` | `DatasetVersions` | 10 | `id` | — | dataset_versions es un registro central de negocio del módulo 54 · polyglot_storage (gobierno de almacenamiento políglota y ubicación de datos), dominio Datos y NoSQL. |
| `encryption_profiles` | `EncryptionProfiles` | 11 | `id` | — | encryption_profiles es un registro central de negocio del módulo 54 · polyglot_storage (gobierno de almacenamiento políglota y ubicación de datos), dominio Datos y NoSQL. |
| `key_rotation_policies` | `KeyRotationPolicies` | 7 | `id` | — | key_rotation_policies guarda reglas y configuración de gobierno del módulo 54 · polyglot_storage (dominio Datos y NoSQL): parametriza el comportamiento del negocio sin tocar código. |
| `replication_policies` | `ReplicationPolicies` | 8 | `id` | — | replication_policies guarda reglas y configuración de gobierno del módulo 54 · polyglot_storage (dominio Datos y NoSQL): parametriza el comportamiento del negocio sin tocar código. |
| `residency_policies` | `ResidencyPolicies` | 8 | `id` | — | residency_policies guarda reglas y configuración de gobierno del módulo 54 · polyglot_storage (dominio Datos y NoSQL): parametriza el comportamiento del negocio sin tocar código. |
| `retention_policies` | `PolyglotStorageRetentionPolicies` | 8 | `id` | — | retention_policies guarda reglas y configuración de gobierno del módulo 54 · polyglot_storage (dominio Datos y NoSQL): parametriza el comportamiento del negocio sin tocar código. |
| `storage_backend_regions` | `StorageBackendRegions` | 9 | `id` | — | storage_backend_regions es un registro central de negocio del módulo 54 · polyglot_storage (gobierno de almacenamiento políglota y ubicación de datos), dominio Datos y NoSQL. |
| `storage_backends` | `StorageBackends` | 17 | `id` | ✅ | storage_backends es un registro central de negocio del módulo 54 · polyglot_storage (gobierno de almacenamiento políglota y ubicación de datos), dominio Datos y NoSQL. |
| `storage_capabilities` | `StorageCapabilities` | 7 | `id` | — | storage_capabilities es un registro central de negocio del módulo 54 · polyglot_storage (gobierno de almacenamiento políglota y ubicación de datos), dominio Datos y NoSQL. |
| `storage_cost_snapshots` | `StorageCostSnapshots` | 13 | `id` | — | storage_cost_snapshots es un registro central de negocio del módulo 54 · polyglot_storage (gobierno de almacenamiento políglota y ubicación de datos), dominio Datos y NoSQL. |
| `storage_integrity_policies` | `StorageIntegrityPolicies` | 8 | `id` | — | storage_integrity_policies guarda reglas y configuración de gobierno del módulo 54 · polyglot_storage (dominio Datos y NoSQL): parametriza el comportamiento del negocio sin tocar código. |
| `store_health_checks` | `StoreHealthChecks` | 7 | `id` | — | store_health_checks es un registro central de negocio del módulo 54 · polyglot_storage (gobierno de almacenamiento políglota y ubicación de datos), dominio Datos y NoSQL. |
| `tenant_storage_bindings` | `TenantStorageBindings` | 10 | `id` | — | tenant_storage_bindings es un registro central de negocio del módulo 54 · polyglot_storage (gobierno de almacenamiento políglota y ubicación de datos), dominio Datos y NoSQL. |

### `practice` (11 entidades, módulo `practice`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `care_spaces` | `CareSpaces` | 15 | `id` | ✅ | care_spaces es un registro central de negocio del módulo 14 · practice (organizaciones de cuidado, sedes, unidades, espacios y fuerza laboral), dominio Práctica y Agenda. |
| `clinical_units` | `ClinicalUnits` | 14 | `id` | ✅ | clinical_units es un registro central de negocio del módulo 14 · practice (organizaciones de cuidado, sedes, unidades, espacios y fuerza laboral), dominio Práctica y Agenda. |
| `healthcare_services` | `HealthcareServices` | 15 | `id` | ✅ | healthcare_services es un registro central de negocio del módulo 14 · practice (organizaciones de cuidado, sedes, unidades, espacios y fuerza laboral), dominio Práctica y Agenda. |
| `inventory_items` | `InventoryItems` | 15 | `id` | ✅ | inventory_items es un registro central de negocio del módulo 14 · practice (organizaciones de cuidado, sedes, unidades, espacios y fuerza laboral), dominio Práctica y Agenda. |
| `inventory_movements` | `InventoryMovements` | 9 | `id` | — | inventory_movements es un ledger inmutable (append-only) del módulo 14 · practice (dominio Práctica y Agenda): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `practice_accreditations` | `PracticeAccreditations` | 16 | `id` | ✅ | practice_accreditations es un registro central de negocio del módulo 14 · practice (organizaciones de cuidado, sedes, unidades, espacios y fuerza laboral), dominio Práctica y Agenda. |
| `practice_settings` | `PracticeSettings` | 10 | `id` | ✅ | practice_settings guarda reglas y configuración de gobierno del módulo 14 · practice (dominio Práctica y Agenda): parametriza el comportamiento del negocio sin tocar código. |
| `practice_sites` | `PracticeSites` | 17 | `id` | ✅ | practice_sites es un registro central de negocio del módulo 14 · practice (organizaciones de cuidado, sedes, unidades, espacios y fuerza laboral), dominio Práctica y Agenda. |
| `practices` | `Practices` | 15 | `id` | ✅ | practices es un registro central de negocio del módulo 14 · practice (organizaciones de cuidado, sedes, unidades, espacios y fuerza laboral), dominio Práctica y Agenda. |
| `practitioner_role_assignments` | `PractitionerRoleAssignments` | 19 | `id` | ✅ | practitioner_role_assignments es una tabla de asociación del módulo 14 · practice (dominio Práctica y Agenda): conecta entidades (`practitioner_support_assignments`, `practices`, `healthcare_services`) para representar r… |
| `practitioner_support_assignments` | `PractitionerSupportAssignments` | 13 | `id` | ✅ | practitioner_support_assignments es una tabla de asociación del módulo 14 · practice (dominio Práctica y Agenda): conecta entidades (`practitioner_role_assignments`) para representar relaciones muchos-a-muchos. |

### `procedures_perioperative` (37 entidades, módulo `procedures_perioperative`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `anesthesia_airway_assessments` | `AnesthesiaAirwayAssessments` | 12 | `id` | — | anesthesia_airway_assessments es un registro central de negocio del módulo 53 · procedures_perioperative (intervenciones médicas, cirugía y cuidado perioperatorio), dominio Clínico y Diagnóstico. |
| `anesthesia_events` | `AnesthesiaEvents` | 12 | `id` | — | anesthesia_events es un ledger inmutable (append-only) del módulo 53 · procedures_perioperative (dominio Clínico y Diagnóstico): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `anesthesia_plans` | `AnesthesiaPlans` | 18 | `id` | ✅ | anesthesia_plans es un registro central de negocio del módulo 53 · procedures_perioperative (intervenciones médicas, cirugía y cuidado perioperatorio), dominio Clínico y Diagnóstico. |
| `implant_identifiers` | `ImplantIdentifiers` | 9 | `id` | — | implant_identifiers es un registro central de negocio del módulo 53 · procedures_perioperative (intervenciones médicas, cirugía y cuidado perioperatorio), dominio Clínico y Diagnóstico. |
| `instrument_sets` | `InstrumentSets` | 12 | `id` | ✅ | instrument_sets es el set/bandeja de instrumental quirúrgico esterilizado que se verifica y despliega para una cirugía, en el módulo 53 · procedures_perioperative (dominio Clínico y Diagnóstico). |
| `operating_room_utilization_events` | `OperatingRoomUtilizationEvents` | 11 | `id` | — | operating_room_utilization_events es un ledger inmutable (append-only) del módulo 53 · procedures_perioperative (dominio Clínico y Diagnóstico): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `operative_findings` | `OperativeFindings` | 12 | `id` | — | operative_findings es un registro central de negocio del módulo 53 · procedures_perioperative (intervenciones médicas, cirugía y cuidado perioperatorio), dominio Clínico y Diagnóstico. |
| `operative_reports` | `OperativeReports` | 19 | `id` | — | operative_reports es un registro central de negocio del módulo 53 · procedures_perioperative (intervenciones médicas, cirugía y cuidado perioperatorio), dominio Clínico y Diagnóstico. |
| `operative_steps` | `OperativeSteps` | 18 | `id` | ✅ | operative_steps es un registro central de negocio del módulo 53 · procedures_perioperative (intervenciones médicas, cirugía y cuidado perioperatorio), dominio Clínico y Diagnóstico. |
| `pacu_assessments` | `PacuAssessments` | 12 | `id` | — | pacu_assessments es un ledger inmutable (append-only) del módulo 53 · procedures_perioperative (dominio Clínico y Diagnóstico): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `pacu_stays` | `PacuStays` | 16 | `id` | ✅ | pacu_stays es un registro central de negocio del módulo 53 · procedures_perioperative (intervenciones médicas, cirugía y cuidado perioperatorio), dominio Clínico y Diagnóstico. |
| `postoperative_followups` | `PostoperativeFollowups` | 18 | `id` | ✅ | postoperative_followups es un registro central de negocio del módulo 53 · procedures_perioperative (intervenciones médicas, cirugía y cuidado perioperatorio), dominio Clínico y Diagnóstico. |
| `postoperative_orders` | `PostoperativeOrders` | 10 | `id` | — | postoperative_orders es un registro central de negocio del módulo 53 · procedures_perioperative (intervenciones médicas, cirugía y cuidado perioperatorio), dominio Clínico y Diagnóstico. |
| `preoperative_assessments` | `PreoperativeAssessments` | 23 | `id` | ✅ | preoperative_assessments es un registro central de negocio del módulo 53 · procedures_perioperative (intervenciones médicas, cirugía y cuidado perioperatorio), dominio Clínico y Diagnóstico. |
| `preoperative_orders` | `PreoperativeOrders` | 9 | `id` | — | preoperative_orders es un registro central de negocio del módulo 53 · procedures_perioperative (intervenciones médicas, cirugía y cuidado perioperatorio), dominio Clínico y Diagnóstico. |
| `preoperative_risk_scores` | `PreoperativeRiskScores` | 10 | `id` | — | preoperative_risk_scores es un registro central de negocio del módulo 53 · procedures_perioperative (intervenciones médicas, cirugía y cuidado perioperatorio), dominio Clínico y Diagnóstico. |
| `procedure_body_sites` | `ProcedureBodySites` | 7 | `id` | — | procedure_body_sites es un registro central de negocio del módulo 53 · procedures_perioperative (intervenciones médicas, cirugía y cuidado perioperatorio), dominio Clínico y Diagnóstico. |
| `procedure_cancellations` | `ProcedureCancellations` | 11 | `id` | — | procedure_cancellations es un registro central de negocio del módulo 53 · procedures_perioperative (intervenciones médicas, cirugía y cuidado perioperatorio), dominio Clínico y Diagnóstico. |
| `procedure_case_diagnoses` | `ProcedureCaseDiagnoses` | 7 | `id` | — | procedure_case_diagnoses es un registro central de negocio del módulo 53 · procedures_perioperative (intervenciones médicas, cirugía y cuidado perioperatorio), dominio Clínico y Diagnóstico. |
| `procedure_case_locations` | `ProcedureCaseLocations` | 8 | `id` | — | procedure_case_locations es un ledger inmutable (append-only) del módulo 53 · procedures_perioperative (dominio Clínico y Diagnóstico): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `procedure_case_milestones` | `ProcedureCaseMilestones` | 9 | `id` | — | procedure_case_milestones es un ledger inmutable (append-only) del módulo 53 · procedures_perioperative (dominio Clínico y Diagnóstico): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `procedure_case_status_history` | `ProcedureCaseStatusHistory` | 10 | `id` | — | procedure_case_status_history es el historial auditable de `procedure_cases` dentro del módulo 53 · procedures_perioperative (dominio Clínico y Diagnóstico). Conserva cada versión pasada para poder demostrar el 'antes y … |
| `procedure_case_team_members` | `ProcedureCaseTeamMembers` | 14 | `id` | ✅ | procedure_case_team_members es una tabla de asociación del módulo 53 · procedures_perioperative (dominio Clínico y Diagnóstico): conecta entidades (`procedure_cases`) para representar relaciones muchos-a-muchos. |
| `procedure_cases` | `ProcedureCases` | 27 | `id` | ✅ | procedure_cases es un registro central de negocio del módulo 53 · procedures_perioperative (intervenciones médicas, cirugía y cuidado perioperatorio), dominio Clínico y Diagnóstico. |
| `procedure_charge_items` | `ProcedureChargeItems` | 16 | `id` | ✅ | procedure_charge_items es un registro central de negocio del módulo 53 · procedures_perioperative (intervenciones médicas, cirugía y cuidado perioperatorio), dominio Clínico y Diagnóstico. |
| `procedure_complications` | `ProcedureComplications` | 13 | `id` | — | procedure_complications es un registro central de negocio del módulo 53 · procedures_perioperative (intervenciones médicas, cirugía y cuidado perioperatorio), dominio Clínico y Diagnóstico. |
| `procedure_devices` | `ProcedureDevices` | 11 | `id` | — | procedure_devices es un registro central de negocio del módulo 53 · procedures_perioperative (intervenciones médicas, cirugía y cuidado perioperatorio), dominio Clínico y Diagnóstico. |
| `procedure_implants` | `ProcedureImplants` | 16 | `id` | ✅ | procedure_implants es un registro central de negocio del módulo 53 · procedures_perioperative (intervenciones médicas, cirugía y cuidado perioperatorio), dominio Clínico y Diagnóstico. |
| `procedure_medication_uses` | `ProcedureMedicationUses` | 7 | `id` | — | procedure_medication_uses es un registro central de negocio del módulo 53 · procedures_perioperative (intervenciones médicas, cirugía y cuidado perioperatorio), dominio Clínico y Diagnóstico. |
| `procedure_outcomes` | `ProcedureOutcomes` | 12 | `id` | — | procedure_outcomes es un registro central de negocio del módulo 53 · procedures_perioperative (intervenciones médicas, cirugía y cuidado perioperatorio), dominio Clínico y Diagnóstico. |
| `procedure_performers` | `ProcedurePerformers` | 9 | `id` | — | procedure_performers es un registro central de negocio del módulo 53 · procedures_perioperative (intervenciones médicas, cirugía y cuidado perioperatorio), dominio Clínico y Diagnóstico. |
| `procedure_specimens` | `ProcedureSpecimens` | 10 | `id` | — | procedure_specimens es un registro central de negocio del módulo 53 · procedures_perioperative (intervenciones médicas, cirugía y cuidado perioperatorio), dominio Clínico y Diagnóstico. |
| `sterility_verification_checks` | `SterilityVerificationChecks` | 12 | `id` | — | sterility_verification_checks es un registro central de negocio del módulo 53 · procedures_perioperative (intervenciones médicas, cirugía y cuidado perioperatorio), dominio Clínico y Diagnóstico. |
| `sterilization_loads` | `SterilizationLoads` | 13 | `id` | ✅ | sterilization_loads es la carga/ciclo de un esterilizador (autoclave): agrupa los sets procesados juntos con su método y resultado, para trazabilidad de esterilidad, en el módulo 53 · procedures_perioperative (dominio Cl… |
| `surgical_safety_checklists` | `SurgicalSafetyChecklists` | 12 | `id` | ✅ | surgical_safety_checklists es un registro central de negocio del módulo 53 · procedures_perioperative (intervenciones médicas, cirugía y cuidado perioperatorio), dominio Clínico y Diagnóstico. |
| `surgical_safety_items` | `SurgicalSafetyItems` | 15 | `id` | ✅ | surgical_safety_items es un registro central de negocio del módulo 53 · procedures_perioperative (intervenciones médicas, cirugía y cuidado perioperatorio), dominio Clínico y Diagnóstico. |
| `surgical_safety_responses` | `SurgicalSafetyResponses` | 11 | `id` | — | surgical_safety_responses es un registro central de negocio del módulo 53 · procedures_perioperative (intervenciones médicas, cirugía y cuidado perioperatorio), dominio Clínico y Diagnóstico. |

### `profiles` (19 entidades, módulo `profiles`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `administrator_profiles` | `AdministratorProfiles` | 8 | `profile_id` | ✅ | administrator_profiles es un registro central de negocio del módulo 05 · profiles (personas, pacientes y fuerza laboral de salud), dominio Núcleo y Terminología. |
| `emergency_staff_profiles` | `EmergencyStaffProfiles` | 8 | `profile_id` | ✅ | emergency_staff_profiles es un registro central de negocio del módulo 05 · profiles (personas, pacientes y fuerza laboral de salud), dominio Núcleo y Terminología. |
| `health_practitioner_profiles` | `HealthPractitionerProfiles` | 15 | `profile_id` | ✅ | health_practitioner_profiles es un registro central de negocio del módulo 05 · profiles (personas, pacientes y fuerza laboral de salud), dominio Núcleo y Terminología. |
| `insurance_representative_profiles` | `InsuranceRepresentativeProfiles` | 8 | `profile_id` | ✅ | insurance_representative_profiles es un registro central de negocio del módulo 05 · profiles (personas, pacientes y fuerza laboral de salud), dominio Núcleo y Terminología. |
| `jurisdiction_authorizations` | `JurisdictionAuthorizations` | 15 | `id` | ✅ | jurisdiction_authorizations es un registro central de negocio del módulo 05 · profiles (personas, pacientes y fuerza laboral de salud), dominio Núcleo y Terminología. |
| `patient_identity_links` | `PatientIdentityLinks` | 15 | `id` | ✅ | patient_identity_links es una tabla de asociación del módulo 05 · profiles (dominio Núcleo y Terminología): conecta entidades (`patient_profiles`) para representar relaciones muchos-a-muchos. |
| `patient_merge_events` | `PatientMergeEvents` | 9 | `id` | — | patient_merge_events registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 05 · profiles (dominio Núcleo y Terminología): responde a '¿qué está pasando ahora mismo?'. |
| `patient_portal_proxies` | `PatientPortalProxies` | 14 | `id` | ✅ | patient_portal_proxies es un registro central de negocio del módulo 05 · profiles (personas, pacientes y fuerza laboral de salud), dominio Núcleo y Terminología. |
| `patient_profiles` | `PatientProfiles` | 13 | `profile_id` | ✅ | patient_profiles es un registro central de negocio del módulo 05 · profiles (personas, pacientes y fuerza laboral de salud), dominio Núcleo y Terminología. |
| `person_account_links` | `PersonAccountLinks` | 13 | `id` | ✅ | person_account_links es una tabla de asociación del módulo 05 · profiles (dominio Núcleo y Terminología): conecta entidades (`persons`) para representar relaciones muchos-a-muchos. |
| `person_profiles` | `PersonProfiles` | 9 | `id` | ✅ | person_profiles es un registro central de negocio del módulo 05 · profiles (personas, pacientes y fuerza laboral de salud), dominio Núcleo y Terminología. |
| `persons` | `Persons` | 27 | `id` | ✅ | persons es un registro central de negocio del módulo 05 · profiles (personas, pacientes y fuerza laboral de salud), dominio Núcleo y Terminología. |
| `practitioner_affiliations` | `PractitionerAffiliations` | 17 | `id` | ✅ | practitioner_affiliations es el historial laboral del profesional dentro del módulo 05 · profiles (personas, pacientes y fuerza laboral de salud), dominio Núcleo y Terminología. Guarda dónde ejerció: la institución, el c… |
| `practitioner_languages` | `PractitionerLanguages` | 10 | `id` | ✅ | practitioner_languages es un registro central de negocio del módulo 05 · profiles (personas, pacientes y fuerza laboral de salud), dominio Núcleo y Terminología. |
| `practitioner_specialties` | `PractitionerSpecialties` | 16 | `id` | ✅ | practitioner_specialties es un registro central de negocio del módulo 05 · profiles (personas, pacientes y fuerza laboral de salud), dominio Núcleo y Terminología. |
| `professional_credentials` | `ProfessionalCredentials` | 19 | `id` | ✅ | professional_credentials es un registro central de negocio del módulo 05 · profiles (personas, pacientes y fuerza laboral de salud), dominio Núcleo y Terminología. |
| `provider_operator_profiles` | `ProviderOperatorProfiles` | 8 | `profile_id` | ✅ | provider_operator_profiles es un registro central de negocio del módulo 05 · profiles (personas, pacientes y fuerza laboral de salud), dominio Núcleo y Terminología. |
| `related_persons` | `RelatedPersons` | 12 | `id` | ✅ | related_persons es un registro central de negocio del módulo 05 · profiles (personas, pacientes y fuerza laboral de salud), dominio Núcleo y Terminología. |
| `secretary_profiles` | `SecretaryProfiles` | 7 | `profile_id` | ✅ | secretary_profiles es un registro central de negocio del módulo 05 · profiles (personas, pacientes y fuerza laboral de salud), dominio Núcleo y Terminología. |

### `promotions` (11 entidades, módulo `promotions`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `coupons` | `Coupons` | 16 | `id` | ✅ | coupons es un registro central de negocio del módulo 51 · promotions (fidelización, descuentos, cupones y referidos), dominio Marketing y Crecimiento. |
| `discount_rules` | `DiscountRules` | 17 | `id` | ✅ | discount_rules guarda reglas y configuración de gobierno del módulo 51 · promotions (dominio Marketing y Crecimiento): parametriza el comportamiento del negocio sin tocar código. |
| `earning_rules` | `EarningRules` | 20 | `id` | ✅ | earning_rules guarda reglas y configuración de gobierno del módulo 51 · promotions (dominio Marketing y Crecimiento): parametriza el comportamiento del negocio sin tocar código. |
| `loyalty_memberships` | `LoyaltyMemberships` | 14 | `id` | ✅ | loyalty_memberships es una tabla de asociación del módulo 51 · promotions (dominio Marketing y Crecimiento): conecta entidades (`points_ledger_entries`, `loyalty_programs`, `loyalty_tiers`) para representar relaciones mu… |
| `loyalty_programs` | `LoyaltyPrograms` | 16 | `id` | ✅ | loyalty_programs es un registro central de negocio del módulo 51 · promotions (fidelización, descuentos, cupones y referidos), dominio Marketing y Crecimiento. |
| `loyalty_tiers` | `LoyaltyTiers` | 13 | `id` | ✅ | loyalty_tiers es un registro central de negocio del módulo 51 · promotions (fidelización, descuentos, cupones y referidos), dominio Marketing y Crecimiento. |
| `member_referrals` | `MemberReferrals` | 15 | `id` | ✅ | member_referrals es un registro central de negocio del módulo 51 · promotions (fidelización, descuentos, cupones y referidos), dominio Marketing y Crecimiento. |
| `points_ledger_entries` | `PointsLedgerEntries` | 14 | `id` | — | points_ledger_entries es un ledger inmutable (append-only) del módulo 51 · promotions (dominio Marketing y Crecimiento): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `promotions` | `Promotions` | 21 | `id` | ✅ | promotions es un registro central de negocio del módulo 51 · promotions (fidelización, descuentos, cupones y referidos), dominio Marketing y Crecimiento. |
| `redemptions` | `Redemptions` | 18 | `id` | ✅ | redemptions es un registro central de negocio del módulo 51 · promotions (fidelización, descuentos, cupones y referidos), dominio Marketing y Crecimiento. |
| `referral_programs` | `ReferralPrograms` | 19 | `id` | ✅ | referral_programs es un registro central de negocio del módulo 51 · promotions (fidelización, descuentos, cupones y referidos), dominio Marketing y Crecimiento. |

### `qa_lab` (13 entidades, módulo `qa_lab`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `assertion_results` | `AssertionResults` | 8 | `id` | — | assertion_results es un ledger inmutable (append-only) del módulo 36 · qa_lab (dominio Clínico y Diagnóstico): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `request_payloads` | `RequestPayloads` | 13 | `id` | — | request_payloads es un ledger inmutable (append-only) del módulo 36 · qa_lab (dominio Clínico y Diagnóstico): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `response_payloads` | `ResponsePayloads` | 12 | `id` | — | response_payloads es un ledger inmutable (append-only) del módulo 36 · qa_lab (dominio Clínico y Diagnóstico): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `run_artifacts` | `RunArtifacts` | 11 | `id` | ✅ | run_artifacts es un registro central de negocio del módulo 36 · qa_lab (aseguramiento de calidad de laboratorio y evidencia de pruebas), dominio Clínico y Diagnóstico. |
| `test_assertions` | `TestAssertions` | 13 | `id` | ✅ | test_assertions es un registro central de negocio del módulo 36 · qa_lab (aseguramiento de calidad de laboratorio y evidencia de pruebas), dominio Clínico y Diagnóstico. |
| `test_case_results` | `TestCaseResults` | 18 | `id` | ✅ | test_case_results es un registro central de negocio del módulo 36 · qa_lab (aseguramiento de calidad de laboratorio y evidencia de pruebas), dominio Clínico y Diagnóstico. |
| `test_cases` | `TestCases` | 19 | `id` | ✅ | test_cases es un registro central de negocio del módulo 36 · qa_lab (aseguramiento de calidad de laboratorio y evidencia de pruebas), dominio Clínico y Diagnóstico. |
| `test_defects` | `TestDefects` | 23 | `id` | ✅ | test_defects es un registro central de negocio del módulo 36 · qa_lab (aseguramiento de calidad de laboratorio y evidencia de pruebas), dominio Clínico y Diagnóstico. |
| `test_environments` | `TestEnvironments` | 14 | `id` | ✅ | test_environments es un registro central de negocio del módulo 36 · qa_lab (aseguramiento de calidad de laboratorio y evidencia de pruebas), dominio Clínico y Diagnóstico. |
| `test_fixtures` | `TestFixtures` | 13 | `id` | ✅ | test_fixtures es un registro central de negocio del módulo 36 · qa_lab (aseguramiento de calidad de laboratorio y evidencia de pruebas), dominio Clínico y Diagnóstico. |
| `test_runs` | `TestRuns` | 21 | `id` | ✅ | test_runs registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 36 · qa_lab (dominio Clínico y Diagnóstico): responde a '¿qué está pasando ahora mismo?'. |
| `test_schedules` | `TestSchedules` | 21 | `id` | ✅ | test_schedules es un registro central de negocio del módulo 36 · qa_lab (aseguramiento de calidad de laboratorio y evidencia de pruebas), dominio Clínico y Diagnóstico. |
| `test_suites` | `TestSuites` | 15 | `id` | ✅ | test_suites es un registro central de negocio del módulo 36 · qa_lab (aseguramiento de calidad de laboratorio y evidencia de pruebas), dominio Clínico y Diagnóstico. |

### `read_models` (13 entidades, módulo `read_models`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `frontend_page_views` | `FrontendPageViews` | 20 | `id` | ✅ | frontend_page_views es un read model / vista de reporting proyectado desde el módulo 30 · read_models (dominio Auditoría y Reporting): no es la fuente de verdad, es la respuesta pre-calculada que consume un tablero o pan… |
| `frontend_routes` | `FrontendRoutes` | 20 | `id` | ✅ | frontend_routes es un read model / vista de reporting proyectado desde el módulo 30 · read_models (dominio Auditoría y Reporting): no es la fuente de verdad, es la respuesta pre-calculada que consume un tablero o pantall… |
| `frontend_view_actions` | `FrontendViewActions` | 19 | `id` | ✅ | frontend_view_actions es un read model / vista de reporting proyectado desde el módulo 30 · read_models (dominio Auditoría y Reporting): no es la fuente de verdad, es la respuesta pre-calculada que consume un tablero o p… |
| `frontend_view_fields` | `FrontendViewFields` | 23 | `id` | ✅ | frontend_view_fields es un read model / vista de reporting proyectado desde el módulo 30 · read_models (dominio Auditoría y Reporting): no es la fuente de verdad, es la respuesta pre-calculada que consume un tablero o pa… |
| `frontend_view_filters` | `FrontendViewFilters` | 19 | `id` | ✅ | frontend_view_filters es un read model / vista de reporting proyectado desde el módulo 30 · read_models (dominio Auditoría y Reporting): no es la fuente de verdad, es la respuesta pre-calculada que consume un tablero o p… |
| `frontend_view_kpis` | `FrontendViewKpis` | 17 | `id` | ✅ | frontend_view_kpis es un read model / vista de reporting proyectado desde el módulo 30 · read_models (dominio Auditoría y Reporting): no es la fuente de verdad, es la respuesta pre-calculada que consume un tablero o pant… |
| `frontend_view_sort_options` | `FrontendViewSortOptions` | 15 | `id` | ✅ | frontend_view_sort_options es un read model / vista de reporting proyectado desde el módulo 30 · read_models (dominio Auditoría y Reporting): no es la fuente de verdad, es la respuesta pre-calculada que consume un tabler… |
| `frontend_view_states` | `FrontendViewStates` | 15 | `id` | ✅ | frontend_view_states es un read model / vista de reporting proyectado desde el módulo 30 · read_models (dominio Auditoría y Reporting): no es la fuente de verdad, es la respuesta pre-calculada que consume un tablero o pa… |
| `portal_surfaces` | `PortalSurfaces` | 15 | `id` | ✅ | portal_surfaces es un read model / vista de reporting proyectado desde el módulo 30 · read_models (dominio Auditoría y Reporting): no es la fuente de verdad, es la respuesta pre-calculada que consume un tablero o pantall… |
| `read_model_definitions` | `ReadModelDefinitions` | 23 | `id` | ✅ | read_model_definitions es un read model / vista de reporting proyectado desde el módulo 30 · read_models (dominio Auditoría y Reporting): no es la fuente de verdad, es la respuesta pre-calculada que consume un tablero o … |
| `read_model_dependencies` | `ReadModelDependencies` | 8 | `id` | — | read_model_dependencies es un read model / vista de reporting proyectado desde el módulo 30 · read_models (dominio Auditoría y Reporting): no es la fuente de verdad, es la respuesta pre-calculada que consume un tablero o… |
| `read_model_refresh_runs` | `ReadModelRefreshRuns` | 11 | `id` | — | read_model_refresh_runs es un ledger inmutable (append-only) del módulo 30 · read_models (dominio Auditoría y Reporting): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `user_view_preferences` | `UserViewPreferences` | 16 | `id` | ✅ | user_view_preferences es un read model / vista de reporting proyectado desde el módulo 30 · read_models (dominio Auditoría y Reporting): no es la fuente de verdad, es la respuesta pre-calculada que consume un tablero o p… |

### `reporting` (12 entidades, módulo `reporting`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `dashboard_widgets` | `DashboardWidgets` | 14 | `id` | ✅ | dashboard_widgets es un registro central de negocio del módulo 39 · reporting (reporting, dashboards y distribución programada), dominio Auditoría y Reporting. |
| `dashboards` | `Dashboards` | 13 | `id` | ✅ | dashboards es un registro central de negocio del módulo 39 · reporting (reporting, dashboards y distribución programada), dominio Auditoría y Reporting. |
| `report_columns` | `ReportColumns` | 15 | `id` | ✅ | report_columns es un registro central de negocio del módulo 39 · reporting (reporting, dashboards y distribución programada), dominio Auditoría y Reporting. |
| `report_data_sources` | `ReportDataSources` | 15 | `id` | ✅ | report_data_sources es un registro central de negocio del módulo 39 · reporting (reporting, dashboards y distribución programada), dominio Auditoría y Reporting. |
| `report_definitions` | `ReportDefinitions` | 18 | `id` | ✅ | report_definitions es un registro central de negocio del módulo 39 · reporting (reporting, dashboards y distribución programada), dominio Auditoría y Reporting. |
| `report_distributions` | `ReportDistributions` | 14 | `id` | ✅ | report_distributions es un registro central de negocio del módulo 39 · reporting (reporting, dashboards y distribución programada), dominio Auditoría y Reporting. |
| `report_executions` | `ReportExecutions` | 20 | `id` | ✅ | report_executions es un registro central de negocio del módulo 39 · reporting (reporting, dashboards y distribución programada), dominio Auditoría y Reporting. |
| `report_parameters` | `ReportParameters` | 14 | `id` | ✅ | report_parameters es un registro central de negocio del módulo 39 · reporting (reporting, dashboards y distribución programada), dominio Auditoría y Reporting. |
| `report_schedules` | `ReportSchedules` | 17 | `id` | ✅ | report_schedules es un registro central de negocio del módulo 39 · reporting (reporting, dashboards y distribución programada), dominio Auditoría y Reporting. |
| `report_snapshots` | `ReportSnapshots` | 12 | `id` | ✅ | report_snapshots es un registro central de negocio del módulo 39 · reporting (reporting, dashboards y distribución programada), dominio Auditoría y Reporting. |
| `report_subscriptions` | `ReportSubscriptions` | 10 | `id` | ✅ | report_subscriptions es un registro central de negocio del módulo 39 · reporting (reporting, dashboards y distribución programada), dominio Auditoría y Reporting. |
| `report_versions` | `ReportVersions` | 12 | `id` | ✅ | report_versions es un registro central de negocio del módulo 39 · reporting (reporting, dashboards y distribución programada), dominio Auditoría y Reporting. |

### `scheduling` (17 entidades, módulo `scheduling`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `appointment_bookings` | `AppointmentBookings` | 20 | `id` | ✅ | appointment_bookings registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 41 · scheduling (dominio Práctica y Agenda): responde a '¿qué está pasando ahora mismo?'. |
| `appointment_payment_states` | `AppointmentPaymentStates` | 12 | `id` | ✅ | _sin descripción verificada en la bóveda_ |
| `appointment_reminders` | `AppointmentReminders` | 13 | `id` | ✅ | appointment_reminders es un registro central de negocio del módulo 41 · scheduling (citas, disponibilidad, holds y listas de espera), dominio Práctica y Agenda. |
| `availability_exceptions` | `AvailabilityExceptions` | 12 | `id` | ✅ | availability_exceptions es un registro central de negocio del módulo 41 · scheduling (citas, disponibilidad, holds y listas de espera), dominio Práctica y Agenda. |
| `availability_slots` | `AvailabilitySlots` | 13 | `id` | ✅ | availability_slots es un registro central de negocio del módulo 41 · scheduling (citas, disponibilidad, holds y listas de espera), dominio Práctica y Agenda. |
| `bookable_slots` | `BookableSlots` | 14 | `id` | ✅ | bookable_slots es un registro central de negocio del módulo 41 · scheduling (citas, disponibilidad, holds y listas de espera), dominio Práctica y Agenda. |
| `booking_cancellations` | `BookingCancellations` | 15 | `id` | ✅ | booking_cancellations es un registro central de negocio del módulo 41 · scheduling (citas, disponibilidad, holds y listas de espera), dominio Práctica y Agenda. |
| `booking_confirmation_rules` | `BookingConfirmationRules` | 16 | `id` | ✅ | booking_confirmation_rules registra las reglas que deciden si una reserva se confirma sola. |
| `booking_policies` | `BookingPolicies` | 19 | `id` | ✅ | booking_policies guarda reglas y configuración de gobierno del módulo 41 · scheduling (dominio Práctica y Agenda): parametriza el comportamiento del negocio sin tocar código. |
| `booking_reschedules` | `BookingReschedules` | 9 | `id` | — | booking_reschedules es un ledger inmutable (append-only) del módulo 41 · scheduling (dominio Práctica y Agenda): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `calendar_absences` | `CalendarAbsences` | 24 | `id` | ✅ | calendar_absences es un registro central de negocio del módulo 41 · scheduling (citas, disponibilidad, holds y listas de espera), dominio Práctica y Agenda. |
| `practitioner_schedules` | `PractitionerSchedules` | 16 | `id` | ✅ | practitioner_schedules es un registro central de negocio del módulo 41 · scheduling (citas, disponibilidad, holds y listas de espera), dominio Práctica y Agenda. |
| `schedulable_resources` | `SchedulableResources` | 15 | `id` | ✅ | schedulable_resources es un registro central de negocio del módulo 41 · scheduling (citas, disponibilidad, holds y listas de espera), dominio Práctica y Agenda. |
| `schedule_rules` | `ScheduleRules` | 15 | `id` | ✅ | schedule_rules guarda reglas y configuración de gobierno del módulo 41 · scheduling (dominio Práctica y Agenda): parametriza el comportamiento del negocio sin tocar código. |
| `schedule_templates` | `ScheduleTemplates` | 15 | `id` | ✅ | schedule_templates guarda reglas y configuración de gobierno del módulo 41 · scheduling (dominio Práctica y Agenda): parametriza el comportamiento del negocio sin tocar código. |
| `slot_holds` | `SlotHolds` | 13 | `id` | ✅ | slot_holds registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 41 · scheduling (dominio Práctica y Agenda): responde a '¿qué está pasando ahora mismo?'. |
| `waitlist_entries` | `WaitlistEntries` | 15 | `id` | ✅ | waitlist_entries es un registro central de negocio del módulo 41 · scheduling (citas, disponibilidad, holds y listas de espera), dominio Práctica y Agenda. |

### `surveys` (7 entidades, módulo `surveys`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `survey_answers` | `SurveyAnswers` | 12 | `id` | ✅ | _sin descripción verificada en la bóveda_ |
| `survey_assignments` | `SurveyAssignments` | 11 | `id` | ✅ | _sin descripción verificada en la bóveda_ |
| `survey_invitations` | `SurveyInvitations` | 15 | `id` | ✅ | _sin descripción verificada en la bóveda_ |
| `survey_questions` | `SurveyQuestions` | 14 | `id` | ✅ | _sin descripción verificada en la bóveda_ |
| `survey_responses` | `SurveyResponses` | 11 | `id` | ✅ | _sin descripción verificada en la bóveda_ |
| `survey_templates` | `SurveyTemplates` | 11 | `id` | ✅ | _sin descripción verificada en la bóveda_ |
| `survey_versions` | `SurveyVersions` | 13 | `id` | ✅ | _sin descripción verificada en la bóveda_ |

### `system_context` (9 entidades, módulo `system_context`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `dynamic_enum_bindings` | `DynamicEnumBindings` | 15 | `id` | ✅ | dynamic_enum_bindings es un registro central de negocio del módulo 45 · system_context (contexto de sistema y enumeraciones dinámicas), dominio Núcleo y Terminología. |
| `dynamic_enum_definitions` | `DynamicEnumDefinitions` | 17 | `id` | ✅ | dynamic_enum_definitions es un registro central de negocio del módulo 45 · system_context (contexto de sistema y enumeraciones dinámicas), dominio Núcleo y Terminología. |
| `dynamic_enum_options` | `DynamicEnumOptions` | 11 | `id` | — | dynamic_enum_options es un registro central de negocio del módulo 45 · system_context (contexto de sistema y enumeraciones dinámicas), dominio Núcleo y Terminología. |
| `dynamic_enum_versions` | `DynamicEnumVersions` | 11 | `id` | — | dynamic_enum_versions es un registro central de negocio del módulo 45 · system_context (contexto de sistema y enumeraciones dinámicas), dominio Núcleo y Terminología. |
| `system_context_bindings` | `SystemContextBindings` | 16 | `id` | ✅ | system_context_bindings es un registro central de negocio del módulo 45 · system_context (contexto de sistema y enumeraciones dinámicas), dominio Núcleo y Terminología. |
| `system_context_inputs` | `SystemContextInputs` | 13 | `id` | — | system_context_inputs es un registro central de negocio del módulo 45 · system_context (contexto de sistema y enumeraciones dinámicas), dominio Núcleo y Terminología. |
| `system_context_refresh_runs` | `SystemContextRefreshRuns` | 12 | `id` | — | system_context_refresh_runs es un ledger inmutable (append-only) del módulo 45 · system_context (dominio Núcleo y Terminología): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `system_context_versions` | `SystemContextVersions` | 14 | `id` | — | system_context_versions es un registro central de negocio del módulo 45 · system_context (contexto de sistema y enumeraciones dinámicas), dominio Núcleo y Terminología. |
| `system_contexts` | `SystemContexts` | 17 | `id` | ✅ | system_contexts es un registro central de negocio del módulo 45 · system_context (contexto de sistema y enumeraciones dinámicas), dominio Núcleo y Terminología. |

### `system_ops` (30 entidades, módulo `system_ops`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `accepted_risks` | `AcceptedRisks` | 14 | `id` | ✅ | accepted_risks es el registro de aceptación formal de un riesgo residual dentro de una evaluación de controles (GRC): qué riesgo se acepta, por quién y hasta cuándo revisar, en el módulo 11 · system_ops (dominio Operacio… |
| `anonymization_rules` | `AnonymizationRules` | 10 | `id` | ✅ | anonymization_rules guarda reglas y configuración de gobierno del módulo 11 · system_ops (dominio Operaciones de Plataforma): parametriza el comportamiento del negocio sin tocar código. |
| `assessment_control_results` | `AssessmentControlResults` | 16 | `id` | ✅ | assessment_control_results es un registro central de negocio del módulo 11 · system_ops (gobierno de datos y operaciones de sistema), dominio Operaciones de Plataforma. |
| `assessment_findings` | `AssessmentFindings` | 17 | `id` | ✅ | assessment_findings es un registro central de negocio del módulo 11 · system_ops (gobierno de datos y operaciones de sistema), dominio Operaciones de Plataforma. |
| `backup_policies` | `BackupPolicies` | 16 | `id` | ✅ | backup_policies guarda reglas y configuración de gobierno del módulo 11 · system_ops (dominio Operaciones de Plataforma): parametriza el comportamiento del negocio sin tocar código. |
| `breach_notifications` | `BreachNotifications` | 17 | `id` | ✅ | breach_notifications es un registro central de negocio del módulo 11 · system_ops (gobierno de datos y operaciones de sistema), dominio Operaciones de Plataforma. |
| `cross_border_transfer_events` | `CrossBorderTransferEvents` | 10 | `id` | — | cross_border_transfer_events es un ledger inmutable (append-only) del módulo 11 · system_ops (dominio Operaciones de Plataforma): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `data_classifications` | `SystemOpsDataClassifications` | 13 | `id` | ✅ | data_classifications es un registro central de negocio del módulo 11 · system_ops (gobierno de datos y operaciones de sistema), dominio Operaciones de Plataforma. |
| `data_domains` | `DataDomains` | 10 | `id` | ✅ | data_domains es un registro central de negocio del módulo 11 · system_ops (gobierno de datos y operaciones de sistema), dominio Operaciones de Plataforma. |
| `data_residency_policies` | `DataResidencyPolicies` | 17 | `id` | ✅ | data_residency_policies guarda reglas y configuración de gobierno del módulo 11 · system_ops (dominio Operaciones de Plataforma): parametriza el comportamiento del negocio sin tocar código. |
| `draft_records` | `DraftRecords` | 17 | `id` | ✅ | draft_records es un registro central de negocio del módulo 11 · system_ops (gobierno de datos y operaciones de sistema), dominio Operaciones de Plataforma. |
| `encryption_keys` | `EncryptionKeys` | 18 | `id` | ✅ | encryption_keys es un registro central de negocio del módulo 11 · system_ops (gobierno de datos y operaciones de sistema), dominio Operaciones de Plataforma. |
| `entity_registry` | `EntityRegistry` | 21 | `id` | ✅ | entity_registry es un registro central de negocio del módulo 11 · system_ops (gobierno de datos y operaciones de sistema), dominio Operaciones de Plataforma. |
| `field_registry` | `FieldRegistry` | 14 | `id` | ✅ | field_registry es un registro central de negocio del módulo 11 · system_ops (gobierno de datos y operaciones de sistema), dominio Operaciones de Plataforma. |
| `governance_change_log` | `GovernanceChangeLog` | 10 | `id` | — | governance_change_log es un ledger inmutable (append-only) del módulo 11 · system_ops (dominio Operaciones de Plataforma): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `key_rotation_events` | `KeyRotationEvents` | 9 | `id` | — | key_rotation_events es un ledger inmutable (append-only) del módulo 11 · system_ops (dominio Operaciones de Plataforma): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `legal_holds` | `LegalHolds` | 14 | `id` | ✅ | legal_holds registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 11 · system_ops (dominio Operaciones de Plataforma): responde a '¿qué está pasando ahora mismo?'. |
| `operational_framework_controls` | `OperationalFrameworkControls` | 15 | `id` | ✅ | operational_framework_controls es un registro central de negocio del módulo 11 · system_ops (gobierno de datos y operaciones de sistema), dominio Operaciones de Plataforma. |
| `operational_frameworks` | `OperationalFrameworks` | 13 | `id` | ✅ | operational_frameworks es un registro central de negocio del módulo 11 · system_ops (gobierno de datos y operaciones de sistema), dominio Operaciones de Plataforma. |
| `partition_specs` | `PartitionSpecs` | 22 | `id` | ✅ | partition_specs es una entidad de gobernanza de datos a escala del módulo 11 · system_ops (dominio Operaciones de Plataforma): declara cómo se particiona físicamente cada tabla de alto volumen (estrategia, clave, interva… |
| `record_revisions` | `RecordRevisions` | 11 | `id` | ✅ | record_revisions es un ledger inmutable (append-only) del módulo 11 · system_ops (dominio Operaciones de Plataforma): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `remediation_actions` | `RemediationActions` | 18 | `id` | ✅ | remediation_actions es un registro central de negocio del módulo 11 · system_ops (gobierno de datos y operaciones de sistema), dominio Operaciones de Plataforma. |
| `remediation_plans` | `RemediationPlans` | 16 | `id` | ✅ | remediation_plans es un registro central de negocio del módulo 11 · system_ops (gobierno de datos y operaciones de sistema), dominio Operaciones de Plataforma. |
| `restore_test_runs` | `RestoreTestRuns` | 11 | `id` | — | restore_test_runs es un ledger inmutable (append-only) del módulo 11 · system_ops (dominio Operaciones de Plataforma): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `retention_executions` | `RetentionExecutions` | 13 | `id` | — | retention_executions es un ledger inmutable (append-only) del módulo 11 · system_ops (dominio Operaciones de Plataforma): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `retention_policies` | `SystemOpsRetentionPolicies` | 13 | `id` | ✅ | retention_policies guarda reglas y configuración de gobierno del módulo 11 · system_ops (dominio Operaciones de Plataforma): parametriza el comportamiento del negocio sin tocar código. |
| `security_incidents` | `SecurityIncidents` | 20 | `id` | ✅ | security_incidents es un registro central de negocio del módulo 11 · system_ops (gobierno de datos y operaciones de sistema), dominio Operaciones de Plataforma. |
| `tenant_residency_bindings` | `TenantResidencyBindings` | 13 | `id` | ✅ | tenant_residency_bindings es un registro central de negocio del módulo 11 · system_ops (gobierno de datos y operaciones de sistema), dominio Operaciones de Plataforma. |
| `workload_assessments` | `WorkloadAssessments` | 19 | `id` | ✅ | workload_assessments es un registro central de negocio del módulo 11 · system_ops (gobierno de datos y operaciones de sistema), dominio Operaciones de Plataforma. |
| `write_policies` | `WritePolicies` | 16 | `id` | ✅ | write_policies guarda reglas y configuración de gobierno del módulo 11 · system_ops (dominio Operaciones de Plataforma): parametriza el comportamiento del negocio sin tocar código. |

### `telemetry` (14 entidades, módulo `telemetry`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `activity_event_schema_definitions` | `ActivityEventSchemaDefinitions` | 14 | `id` | — | activity_event_schema_definitions es un registro central de negocio del módulo 28 · telemetry (actividad de usuario, tracking consciente de consentimiento y analítica), dominio Operaciones de Plataforma. |
| `analytics_subjects` | `AnalyticsSubjects` | 9 | `id` | — | analytics_subjects es un registro central de negocio del módulo 28 · telemetry (actividad de usuario, tracking consciente de consentimiento y analítica), dominio Operaciones de Plataforma. |
| `client_contexts` | `ClientContexts` | 20 | `id` | — | client_contexts es un registro central de negocio del módulo 28 · telemetry (actividad de usuario, tracking consciente de consentimiento y analítica), dominio Operaciones de Plataforma. |
| `conversion_events` | `ConversionEvents` | 8 | `id` | — | conversion_events registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 28 · telemetry (dominio Operaciones de Plataforma): responde a '¿qué está pasando ahora mismo?'. |
| `funnel_definitions` | `FunnelDefinitions` | 12 | `id` | ✅ | funnel_definitions es un registro central de negocio del módulo 28 · telemetry (actividad de usuario, tracking consciente de consentimiento y analítica), dominio Operaciones de Plataforma. |
| `funnel_steps` | `FunnelSteps` | 6 | `id` | — | funnel_steps es un registro central de negocio del módulo 28 · telemetry (actividad de usuario, tracking consciente de consentimiento y analítica), dominio Operaciones de Plataforma. |
| `session_journeys` | `SessionJourneys` | 13 | `id` | ✅ | session_journeys es un registro central de negocio del módulo 28 · telemetry (actividad de usuario, tracking consciente de consentimiento y analítica), dominio Operaciones de Plataforma. |
| `tracking_consents` | `TrackingConsents` | 11 | `id` | — | tracking_consents es un registro central de negocio del módulo 28 · telemetry (actividad de usuario, tracking consciente de consentimiento y analítica), dominio Operaciones de Plataforma. |
| `tracking_disclosure_acceptances` | `TrackingDisclosureAcceptances` | 9 | `id` | — | tracking_disclosure_acceptances es un registro central de negocio del módulo 28 · telemetry (actividad de usuario, tracking consciente de consentimiento y analítica), dominio Operaciones de Plataforma. |
| `tracking_disclosure_versions` | `TrackingDisclosureVersions` | 11 | `id` | — | tracking_disclosure_versions es un registro central de negocio del módulo 28 · telemetry (actividad de usuario, tracking consciente de consentimiento y analítica), dominio Operaciones de Plataforma. |
| `tracking_purpose_definitions` | `TrackingPurposeDefinitions` | 15 | `id` | — | tracking_purpose_definitions es un registro central de negocio del módulo 28 · telemetry (actividad de usuario, tracking consciente de consentimiento y analítica), dominio Operaciones de Plataforma. |
| `user_activity_event_properties` | `UserActivityEventProperties` | 12 | `id` | — | user_activity_event_properties es un registro central de negocio del módulo 28 · telemetry (actividad de usuario, tracking consciente de consentimiento y analítica), dominio Operaciones de Plataforma. |
| `user_activity_events` | `UserActivityEvents` | 19 | `id` | — | user_activity_events registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 28 · telemetry (dominio Operaciones de Plataforma): responde a '¿qué está pasando ahora mismo?'. |
| `web_vitals` | `WebVitals` | 13 | `id` | — | web_vitals es un registro central de negocio del módulo 28 · telemetry (actividad de usuario, tracking consciente de consentimiento y analítica), dominio Operaciones de Plataforma. |

### `terminology` (15 entidades, módulo `terminology`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `catalog_concepts` | `CatalogConcepts` | 16 | `id` | ✅ | catalog_concepts forma parte del motor de terminología del módulo 03 · terminology: convierte valores de negocio en referencias a un catálogo versionado en vez de enums fijos, para adaptarse a distintos países y estándar… |
| `catalog_import_batches` | `CatalogImportBatches` | 13 | `id` | — | catalog_import_batches es un ledger inmutable (append-only) del módulo 03 · terminology (dominio Núcleo y Terminología): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `code_system_versions` | `CodeSystemVersions` | 14 | `id` | ✅ | code_system_versions forma parte del motor de terminología del módulo 03 · terminology: convierte valores de negocio en referencias a un catálogo versionado en vez de enums fijos, para adaptarse a distintos países y está… |
| `code_systems` | `CodeSystems` | 15 | `id` | ✅ | code_systems forma parte del motor de terminología del módulo 03 · terminology: convierte valores de negocio en referencias a un catálogo versionado en vez de enums fijos, para adaptarse a distintos países y estándares (… |
| `concept_designations` | `ConceptDesignations` | 11 | `id` | ✅ | concept_designations forma parte del motor de terminología del módulo 03 · terminology: convierte valores de negocio en referencias a un catálogo versionado en vez de enums fijos, para adaptarse a distintos países y está… |
| `concept_maps` | `ConceptMaps` | 12 | `id` | ✅ | concept_maps forma parte del motor de terminología del módulo 03 · terminology: convierte valores de negocio en referencias a un catálogo versionado en vez de enums fijos, para adaptarse a distintos países y estándares (… |
| `concept_properties` | `ConceptProperties` | 10 | `id` | ✅ | concept_properties forma parte del motor de terminología del módulo 03 · terminology: convierte valores de negocio en referencias a un catálogo versionado en vez de enums fijos, para adaptarse a distintos países y estánd… |
| `concept_relationships` | `ConceptRelationships` | 10 | `id` | ✅ | concept_relationships forma parte del motor de terminología del módulo 03 · terminology: convierte valores de negocio en referencias a un catálogo versionado en vez de enums fijos, para adaptarse a distintos países y est… |
| `tenant_catalog_policies` | `TenantCatalogPolicies` | 14 | `id` | ✅ | tenant_catalog_policies forma parte del motor de terminología del módulo 03 · terminology: convierte valores de negocio en referencias a un catálogo versionado en vez de enums fijos, para adaptarse a distintos países y e… |
| `tenant_concept_config` | `TenantConceptConfig` | 12 | `id` | ✅ | tenant_concept_config forma parte del motor de terminología del módulo 03 · terminology: convierte valores de negocio en referencias a un catálogo versionado en vez de enums fijos, para adaptarse a distintos países y est… |
| `terminology_sources` | `TerminologySources` | 14 | `id` | ✅ | terminology_sources forma parte del motor de terminología del módulo 03 · terminology: convierte valores de negocio en referencias a un catálogo versionado en vez de enums fijos, para adaptarse a distintos países y están… |
| `value_set_members` | `ValueSetMembers` | 10 | `id` | ✅ | value_set_members forma parte del motor de terminología del módulo 03 · terminology: convierte valores de negocio en referencias a un catálogo versionado en vez de enums fijos, para adaptarse a distintos países y estánda… |
| `value_set_rules` | `ValueSetRules` | 12 | `id` | ✅ | value_set_rules forma parte del motor de terminología del módulo 03 · terminology: convierte valores de negocio en referencias a un catálogo versionado en vez de enums fijos, para adaptarse a distintos países y estándare… |
| `value_set_versions` | `ValueSetVersions` | 12 | `id` | ✅ | value_set_versions forma parte del motor de terminología del módulo 03 · terminology: convierte valores de negocio en referencias a un catálogo versionado en vez de enums fijos, para adaptarse a distintos países y estánd… |
| `value_sets` | `ValueSets` | 12 | `id` | ✅ | value_sets forma parte del motor de terminología del módulo 03 · terminology: convierte valores de negocio en referencias a un catálogo versionado en vez de enums fijos, para adaptarse a distintos países y estándares (LO… |

### `time_series` (12 entidades, módulo `time_series`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `ads_delivery_event_series` | `AdsDeliveryEventSeries` | 15 | `time` | — | ads_delivery_event_series registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 58 · time_series (dominio Datos y NoSQL): responde a '¿qué está pasando ahora mismo?'. |
| `ai_runtime_metric_series` | `AiRuntimeMetricSeries` | 13 | `time` | — | ai_runtime_metric_series es un registro central de negocio del módulo 58 · time_series (series de tiempo de alto volumen y analítica de eventos), dominio Datos y NoSQL. |
| `application_tracking_series` | `ApplicationTrackingSeries` | 12 | `time` | — | application_tracking_series es un registro central de negocio del módulo 58 · time_series (series de tiempo de alto volumen y analítica de eventos), dominio Datos y NoSQL. |
| `audit_access_metric_series` | `AuditAccessMetricSeries` | 13 | `time` | — | audit_access_metric_series es un registro central de negocio del módulo 58 · time_series (series de tiempo de alto volumen y analítica de eventos), dominio Datos y NoSQL. |
| `device_raw_reading_series` | `DeviceRawReadingSeries` | 15 | `time` | — | device_raw_reading_series es un registro central de negocio del módulo 58 · time_series (series de tiempo de alto volumen y analítica de eventos), dominio Datos y NoSQL. |
| `ingestion_pipeline_metric_series` | `IngestionPipelineMetricSeries` | 12 | `time` | — | ingestion_pipeline_metric_series es un registro central de negocio del módulo 58 · time_series (series de tiempo de alto volumen y analítica de eventos), dominio Datos y NoSQL. |
| `lab_analyzer_event_series` | `LabAnalyzerEventSeries` | 13 | `time` | — | lab_analyzer_event_series es un registro central de negocio del módulo 58 · time_series (series de tiempo de alto volumen y analítica de eventos), dominio Datos y NoSQL. |
| `location_ping_series` | `LocationPingSeries` | 14 | `time` | — | location_ping_series es un registro central de negocio del módulo 58 · time_series (series de tiempo de alto volumen y analítica de eventos), dominio Datos y NoSQL. |
| `normalized_vital_series` | `NormalizedVitalSeries` | 14 | `time` | — | normalized_vital_series es un registro central de negocio del módulo 58 · time_series (series de tiempo de alto volumen y analítica de eventos), dominio Datos y NoSQL. |
| `payment_gateway_metric_series` | `PaymentGatewayMetricSeries` | 12 | `time` | — | payment_gateway_metric_series es un registro central de negocio del módulo 58 · time_series (series de tiempo de alto volumen y analítica de eventos), dominio Datos y NoSQL. |
| `service_sli_series` | `ServiceSliSeries` | 13 | `time` | — | service_sli_series es un registro central de negocio del módulo 58 · time_series (series de tiempo de alto volumen y analítica de eventos), dominio Datos y NoSQL. |
| `telemetry_event_series` | `TelemetryEventSeries` | 12 | `time` | — | telemetry_event_series es un registro central de negocio del módulo 58 · time_series (series de tiempo de alto volumen y analítica de eventos), dominio Datos y NoSQL. |

### `tracking` (8 entidades, módulo `tracking`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `delivery_proofs` | `DeliveryProofs` | 15 | `id` | ✅ | delivery_proofs registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 37 · tracking (dominio Integraciones y Contratos): responde a '¿qué está pasando ahora mismo?'. |
| `eta_estimates` | `EtaEstimates` | 9 | `id` | — | eta_estimates es un ledger inmutable (append-only) del módulo 37 · tracking (dominio Integraciones y Contratos): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `milestone_definitions` | `MilestoneDefinitions` | 15 | `id` | ✅ | milestone_definitions es un registro central de negocio del módulo 37 · tracking (envíos, hitos y líneas de tiempo de estado), dominio Integraciones y Contratos. |
| `shipment_handoffs` | `ShipmentHandoffs` | 11 | `id` | — | shipment_handoffs es un ledger inmutable (append-only) del módulo 37 · tracking (dominio Integraciones y Contratos): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |
| `shipments` | `Shipments` | 20 | `id` | ✅ | shipments es un registro central de negocio del módulo 37 · tracking (envíos, hitos y líneas de tiempo de estado), dominio Integraciones y Contratos. |
| `trackable_subjects` | `TrackableSubjects` | 17 | `id` | ✅ | trackable_subjects es un registro central de negocio del módulo 37 · tracking (envíos, hitos y líneas de tiempo de estado), dominio Integraciones y Contratos. |
| `tracking_carriers` | `TrackingCarriers` | 13 | `id` | ✅ | tracking_carriers es un registro central de negocio del módulo 37 · tracking (envíos, hitos y líneas de tiempo de estado), dominio Integraciones y Contratos. |
| `tracking_events` | `TrackingEvents` | 14 | `id` | — | tracking_events es un ledger inmutable (append-only) del módulo 37 · tracking (dominio Integraciones y Contratos): anexa eventos en orden cronológico sin sobrescribir nunca lo anterior. |

### `vector_rag` (14 entidades, módulo `vector_rag`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `embedding_jobs` | `EmbeddingJobs` | 12 | `id` | — | embedding_jobs registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 59 · vector_rag (dominio Datos y NoSQL): responde a '¿qué está pasando ahora mismo?'. |
| `embedding_model_versions` | `EmbeddingModelVersions` | 10 | `id` | — | embedding_model_versions es un registro central de negocio del módulo 59 · vector_rag (búsqueda vectorial, evidencia RAG y gobierno de embeddings), dominio Datos y NoSQL. |
| `rag_access_policies` | `RagAccessPolicies` | 10 | `id` | — | rag_access_policies guarda reglas y configuración de gobierno del módulo 59 · vector_rag (dominio Datos y NoSQL): parametriza el comportamiento del negocio sin tocar código. |
| `retrieval_candidates` | `RetrievalCandidates` | 9 | `id` | — | retrieval_candidates es un registro central de negocio del módulo 59 · vector_rag (búsqueda vectorial, evidencia RAG y gobierno de embeddings), dominio Datos y NoSQL. |
| `retrieval_evidence` | `RetrievalEvidence` | 8 | `id` | — | retrieval_evidence es un registro central de negocio del módulo 59 · vector_rag (búsqueda vectorial, evidencia RAG y gobierno de embeddings), dominio Datos y NoSQL. |
| `retrieval_feedback_events` | `RetrievalFeedbackEvents` | 8 | `id` | — | retrieval_feedback_events registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 59 · vector_rag (dominio Datos y NoSQL): responde a '¿qué está pasando ahora mismo?'. |
| `retrieval_sessions` | `RetrievalSessions` | 12 | `id` | — | retrieval_sessions es un registro central de negocio del módulo 59 · vector_rag (búsqueda vectorial, evidencia RAG y gobierno de embeddings), dominio Datos y NoSQL. |
| `vector_chunks` | `VectorChunks` | 9 | `id` | — | vector_chunks es un registro central de negocio del módulo 59 · vector_rag (búsqueda vectorial, evidencia RAG y gobierno de embeddings), dominio Datos y NoSQL. |
| `vector_collections` | `VectorCollections` | 11 | `id` | — | vector_collections es un registro central de negocio del módulo 59 · vector_rag (búsqueda vectorial, evidencia RAG y gobierno de embeddings), dominio Datos y NoSQL. |
| `vector_deletion_jobs` | `VectorDeletionJobs` | 8 | `id` | — | vector_deletion_jobs registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 59 · vector_rag (dominio Datos y NoSQL): responde a '¿qué está pasando ahora mismo?'. |
| `vector_documents` | `VectorDocuments` | 14 | `id` | — | vector_documents es un registro central de negocio del módulo 59 · vector_rag (búsqueda vectorial, evidencia RAG y gobierno de embeddings), dominio Datos y NoSQL. |
| `vector_embeddings` | `VectorEmbeddings` | 7 | `id` | — | vector_embeddings es un registro central de negocio del módulo 59 · vector_rag (búsqueda vectorial, evidencia RAG y gobierno de embeddings), dominio Datos y NoSQL. |
| `vector_reconciliation_runs` | `VectorReconciliationRuns` | 11 | `id` | — | vector_reconciliation_runs registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 59 · vector_rag (dominio Datos y NoSQL): responde a '¿qué está pasando ahora mismo?'. |
| `vector_tenant_bindings` | `VectorTenantBindings` | 6 | `id` | — | vector_tenant_bindings es un registro central de negocio del módulo 59 · vector_rag (búsqueda vectorial, evidencia RAG y gobierno de embeddings), dominio Datos y NoSQL. |

### `workflow` (8 entidades, módulo `workflow`)

| Tabla | Clase | Campos | PK | Bloqueo optimista | Propósito de negocio |
|---|---|---:|---|:---:|---|
| `state_definitions` | `StateDefinitions` | 14 | `id` | ✅ | state_definitions es un registro central de negocio del módulo 32 · workflow (máquinas de estado y workflows cross-dominio), dominio Operaciones de Plataforma. |
| `state_machine_definitions` | `StateMachineDefinitions` | 15 | `id` | ✅ | state_machine_definitions es un registro central de negocio del módulo 32 · workflow (máquinas de estado y workflows cross-dominio), dominio Operaciones de Plataforma. |
| `state_transition_definitions` | `StateTransitionDefinitions` | 18 | `id` | ✅ | state_transition_definitions es un registro central de negocio del módulo 32 · workflow (máquinas de estado y workflows cross-dominio), dominio Operaciones de Plataforma. |
| `state_transition_events` | `StateTransitionEvents` | 16 | `id` | — | state_transition_events registra un proceso operativo en curso (una solicitud, intento, evento o entrega) del módulo 32 · workflow (dominio Operaciones de Plataforma): responde a '¿qué está pasando ahora mismo?'. |
| `transition_guards` | `TransitionGuards` | 14 | `id` | ✅ | transition_guards es un registro central de negocio del módulo 32 · workflow (máquinas de estado y workflows cross-dominio), dominio Operaciones de Plataforma. |
| `transition_side_effects` | `TransitionSideEffects` | 15 | `id` | ✅ | transition_side_effects es un registro central de negocio del módulo 32 · workflow (máquinas de estado y workflows cross-dominio), dominio Operaciones de Plataforma. |
| `workflow_instances` | `WorkflowInstances` | 15 | `id` | ✅ | workflow_instances es un registro central de negocio del módulo 32 · workflow (máquinas de estado y workflows cross-dominio), dominio Operaciones de Plataforma. |
| `workflow_tasks` | `WorkflowTasks` | 14 | `id` | ✅ | workflow_tasks es un registro central de negocio del módulo 32 · workflow (máquinas de estado y workflows cross-dominio), dominio Operaciones de Plataforma. |

## Entidades diseñadas, no implementadas

148 entidades existen en la bóveda de diseño pero no tienen entidad MikroORM real en `src/modules/**/entities` al momento de esta generación. No se documentan como catálogo activo — es trabajo de modelo pendiente de materializar, no una entidad utilizable hoy.

<details><summary>Ver lista completa</summary>

- `auth_providers.iam_users`
- `authz.policies`
- `automation.agent_definitions`
- `billing.insurance_claims`
- `billing.receivables_aging_view`
- `chart.patient_timeline_view`
- `clinical_ext.vital_signs_view`
- `community.rating_aggregates`
- `consent.consent_directives`
- `crm.ad_partners`
- `crm.contracts`
- `diagnostics.medical_devices`
- `directory.organizations`
- `document_store.ai_execution_documents`
- `document_store.cms_content_documents`
- `document_store.context_documents`
- `document_store.document_envelopes`
- `document_store.document_quarantine_documents`
- `document_store.document_schema_registry`
- `document_store.document_version_documents`
- `document_store.dynamic_form_snapshot_documents`
- `document_store.external_payload_documents`
- `document_store.fhir_bundle_documents`
- `document_store.fhir_resource_documents`
- `document_store.webhook_payload_documents`
- `document_store.workflow_definition_documents`
- `erp.vendors`
- `forms.resource_fields_view`
- `messaging.outbox_events`
- `payments.invoices`
- `payments.journal_transactions`
- `payments.subscription_invoices`
- `payments.subscription_ledger_bridge`
- `payments.subscription_seats`
- `platform_ops.services`
- `read_models.adapter_health_summary`
- `read_models.ads_campaign_delivery_dashboard_v`
- `read_models.ads_conversion_quality_mv`
- `read_models.ads_lead_inbox_v`
- `read_models.ads_policy_review_queue_v`
- `read_models.broker_commission_statement_v`
- `read_models.broker_portfolio_v`
- `read_models.campaign_dispatch_summary`
- `read_models.crm_account_360_v`
- `read_models.crm_activity_timeline_mv`
- `read_models.crm_calendar_v`
- `read_models.crm_case_queue_v`
- `read_models.crm_opportunity_forecast_v`
- `read_models.crm_pipeline_board_v`
- `read_models.crm_task_queue_v`
- `read_models.diagnostic_result_release_queue_v`
- `read_models.diagnostic_unit_public_catalog_v`
- `read_models.diagnostic_worklist_v`
- `read_models.doctor_daily_workspace_v`
- `read_models.doctor_note_history_v`
- `read_models.doctor_patient_summary_v`
- `read_models.doctor_result_inbox_v`
- `read_models.education_learner_dashboard_v`
- `read_models.erp_accounts_payable_queue_v`
- `read_models.erp_accounts_receivable_queue_v`
- `read_models.erp_asset_rollforward_mv`
- `read_models.erp_business_partner_360_v`
- `read_models.erp_contract_lifecycle_queue_v`
- `read_models.erp_contract_obligation_queue_v`
- `read_models.erp_financial_summary_v`
- `read_models.erp_general_ledger_balance_v`
- `read_models.erp_inventory_valuation_v`
- `read_models.erp_journal_line_trace_v`
- `read_models.erp_liability_maturity_v`
- `read_models.erp_procure_to_pay_match_queue_v`
- `read_models.health_data_ingestion_quality_v`
- `read_models.hospital_bed_board_v`
- `read_models.imaging_study_viewer_manifest_v`
- `read_models.infrastructure_operations_dashboard_v`
- `read_models.insurer_authorization_queue_v`
- `read_models.insurer_claim_reconciliation_v`
- `read_models.insurer_network_performance_v`
- `read_models.lab_specimen_trace_v`
- `read_models.marketing_campaign_performance_v`
- `read_models.operating_room_schedule_v`
- `read_models.ops_change_calendar_v`
- `read_models.ops_incident_command_center_v`
- `read_models.ops_service_health_overview_v`
- `read_models.ops_slo_error_budget_mv`
- `read_models.patient_appointments_v`
- `read_models.patient_billing_wallet_v`
- `read_models.patient_consent_center_v`
- `read_models.patient_diagnostic_timeline_v`
- `read_models.patient_health_timeline_v`
- `read_models.patient_home_dashboard_v`
- `read_models.patient_longitudinal_record_v`
- `read_models.patient_medication_summary_v`
- `read_models.patient_orders_results_v`
- `read_models.patient_provider_search_v`
- `read_models.payments_debt_checkout_v`
- `read_models.payments_gateway_operations_v`
- `read_models.payments_reconciliation_queue_v`
- `read_models.pharmacy_dispensing_queue_v`
- `read_models.pharmacy_inventory_dashboard_v`
- `read_models.pharmacy_public_stock_offer_v`
- `read_models.postoperative_followup_queue_v`
- `read_models.procedure_case_command_center_v`
- `read_models.public_feed_v`
- `read_models.public_profile_detail_v`
- `read_models.public_provider_directory_v`
- `read_models.recipient_delivery_timeline`
- `read_models.system_admin_dashboard_v`
- `read_models.system_admin_integration_health_v`
- `read_models.system_admin_tenant_list_v`
- `read_models.system_admin_verification_queue_v`
- `read_models.workforce_shift_board_v`
- `redis_runtime.authorization_cache_entries`
- `redis_runtime.availability_cache_entries`
- `redis_runtime.cache_invalidation_stream`
- `redis_runtime.distributed_lock_entries`
- `redis_runtime.idempotency_entries`
- `redis_runtime.job_progress_entries`
- `redis_runtime.mfa_challenge_entries`
- `redis_runtime.notification_debounce_entries`
- `redis_runtime.outbox_delivery_dedup_entries`
- `redis_runtime.password_reset_entries`
- `redis_runtime.rate_limit_buckets`
- `redis_runtime.realtime_presence_entries`
- `redis_runtime.refresh_family_cache_entries`
- `redis_runtime.session_cache_entries`
- `scheduling.appointments`
- `search_platform.ads_insight_search_docs`
- `search_platform.audit_event_search_docs`
- `search_platform.authorized_patient_record_search_docs`
- `search_platform.community_content_search_docs`
- `search_platform.contract_search_docs`
- `search_platform.crm_activity_search_docs`
- `search_platform.education_content_search_docs`
- `search_platform.medication_catalog_search_docs`
- `search_platform.organization_directory_search_docs`
- `search_platform.provider_directory_search_docs`
- `search_platform.search_index_templates`
- `search_platform.technical_log_search_docs`
- `search_platform.terminology_search_docs`
- `workflow.appointment_machine`
- `workflow.automation_run_machine`
- `workflow.consent_machine`
- `workflow.diagnostic_report_machine`
- `workflow.encounter_machine`
- `workflow.identity_verification_machine`
- `workflow.insurance_claim_machine`
- `workflow.payment_intent_machine`
- `workflow.service_request_machine`

</details>
