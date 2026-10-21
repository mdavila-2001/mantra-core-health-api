<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Inventario de flujos

**68 procesos** (2 críticos curados en `docs/business/critical-workflows.md` y 66 de módulo), **10 máquinas de estado** y **1254 árboles de decisión**.

- Operaciones con decisiones propias: 1134 · sin ellas: 120
- Operaciones sin proceso asignado: 0
- Procesos por agrupación: AGRUPACION_POR_CONTROLADOR 22 · CASO_DE_USO_README 21 · MIXTO 23 · CURADO_EN_DOCUMENTO 2

Método y límites: [README del inventario](../README.md). Los procesos de módulo se construyen del README de cada módulo (tabla UC → ruta); lo que el README no asigna a un caso de uso se agrupa por controlador y se marca `AGRUPACION_POR_CONTROLADOR`.

| Módulo | Procesos | Operaciones | Máquinas | Documento |
|---|---|---|---|---|
| `accounting` | 1 | 27 | 1 | [accounting.md](accounting.md) |
| `ads` | 1 | 18 | 0 | [ads.md](ads.md) |
| `app` | 1 | 6 | 0 | [app.md](app.md) |
| `audio_assets` | 1 | 10 | 0 | [audio_assets.md](audio_assets.md) |
| `audit` | 1 | 11 | 0 | [audit.md](audit.md) |
| `auth_providers` | 1 | 12 | 0 | [auth_providers.md](auth_providers.md) |
| `authz` | 2 | 21 | 0 | [authz.md](authz.md) |
| `automation` | 1 | 17 | 0 | [automation.md](automation.md) |
| `billing` | 1 | 15 | 0 | [billing.md](billing.md) |
| `chart` | 1 | 16 | 0 | [chart.md](chart.md) |
| `clinical` | 1 | 28 | 1 | [clinical.md](clinical.md) |
| `clinical_ext` | 1 | 26 | 0 | [clinical_ext.md](clinical_ext.md) |
| `common` | 1 | 15 | 0 | [common.md](common.md) |
| `community` | 1 | 81 | 0 | [community.md](community.md) |
| `consent` | 2 | 12 | 0 | [consent.md](consent.md) |
| `content_packs` | 1 | 2 | 0 | [content_packs.md](content_packs.md) |
| `crm` | 1 | 16 | 0 | [crm.md](crm.md) |
| `cross_store_consistency` | 1 | 16 | 0 | [cross_store_consistency.md](cross_store_consistency.md) |
| `data_catalog` | 1 | 31 | 0 | [data_catalog.md](data_catalog.md) |
| `delegated_access` | 1 | 11 | 0 | [delegated_access.md](delegated_access.md) |
| `diagnostic_units` | 1 | 21 | 0 | [diagnostic_units.md](diagnostic_units.md) |
| `diagnostics` | 1 | 27 | 0 | [diagnostics.md](diagnostics.md) |
| `directory` | 1 | 19 | 0 | [directory.md](directory.md) |
| `document_store` | 1 | 5 | 0 | [document_store.md](document_store.md) |
| `education` | 1 | 14 | 0 | [education.md](education.md) |
| `erp` | 1 | 17 | 0 | [erp.md](erp.md) |
| `forms` | 1 | 21 | 0 | [forms.md](forms.md) |
| `geo` | 1 | 10 | 0 | [geo.md](geo.md) |
| `graph_intelligence` | 1 | 15 | 1 | [graph_intelligence.md](graph_intelligence.md) |
| `health_context` | 1 | 13 | 0 | [health_context.md](health_context.md) |
| `health_data` | 1 | 16 | 0 | [health_data.md](health_data.md) |
| `iam` | 1 | 31 | 0 | [iam.md](iam.md) |
| `identity_assurance` | 1 | 24 | 0 | [identity_assurance.md](identity_assurance.md) |
| `insurance` | 1 | 29 | 0 | [insurance.md](insurance.md) |
| `integration_contracts` | 1 | 12 | 0 | [integration_contracts.md](integration_contracts.md) |
| `integrations` | 1 | 15 | 0 | [integrations.md](integrations.md) |
| `lakehouse` | 1 | 13 | 0 | [lakehouse.md](lakehouse.md) |
| `marketing` | 1 | 14 | 0 | [marketing.md](marketing.md) |
| `messaging` | 1 | 17 | 0 | [messaging.md](messaging.md) |
| `object_storage` | 1 | 13 | 0 | [object_storage.md](object_storage.md) |
| `organization_extensions` | 1 | 9 | 0 | [organization_extensions.md](organization_extensions.md) |
| `payments` | 1 | 14 | 0 | [payments.md](payments.md) |
| `pharma_lab` | 1 | 76 | 3 | [pharma_lab.md](pharma_lab.md) |
| `pharmacy` | 1 | 17 | 0 | [pharmacy.md](pharmacy.md) |
| `pharmacy_inventory` | 1 | 29 | 1 | [pharmacy_inventory.md](pharmacy_inventory.md) |
| `platform_ops` | 1 | 15 | 0 | [platform_ops.md](platform_ops.md) |
| `polyglot_storage` | 1 | 15 | 0 | [polyglot_storage.md](polyglot_storage.md) |
| `practice` | 1 | 24 | 1 | [practice.md](practice.md) |
| `procedures_perioperative` | 1 | 32 | 0 | [procedures_perioperative.md](procedures_perioperative.md) |
| `profiles` | 1 | 36 | 0 | [profiles.md](profiles.md) |
| `promotions` | 1 | 15 | 0 | [promotions.md](promotions.md) |
| `qa_lab` | 1 | 13 | 1 | [qa_lab.md](qa_lab.md) |
| `read_models` | 1 | 15 | 0 | [read_models.md](read_models.md) |
| `redis_runtime` | 1 | 6 | 0 | [redis_runtime.md](redis_runtime.md) |
| `reporting` | 1 | 12 | 0 | [reporting.md](reporting.md) |
| `scheduling` | 2 | 50 | 1 | [scheduling.md](scheduling.md) |
| `search_platform` | 1 | 4 | 0 | [search_platform.md](search_platform.md) |
| `surveys` | 1 | 12 | 0 | [surveys.md](surveys.md) |
| `system_context` | 1 | 13 | 0 | [system_context.md](system_context.md) |
| `system_ops` | 1 | 24 | 0 | [system_ops.md](system_ops.md) |
| `telemetry` | 1 | 13 | 0 | [telemetry.md](telemetry.md) |
| `terminology` | 1 | 21 | 0 | [terminology.md](terminology.md) |
| `time_series` | 1 | 14 | 0 | [time_series.md](time_series.md) |
| `tracking` | 1 | 11 | 0 | [tracking.md](tracking.md) |
| `vector_rag` | 1 | 16 | 0 | [vector_rag.md](vector_rag.md) |
| `workflow` | 1 | 11 | 0 | [workflow.md](workflow.md) |

