# src / orm / catalog / indexes

Groups **indexes**-related components and keeps this system responsibility cohesive.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `accounting.1.idx.ts` | Support implementation or resource for this folder. |
| `accounting.2.idx.ts` | Support implementation or resource for this folder. |
| `ads.1.idx.ts` | Support implementation or resource for this folder. |
| `ads.2.idx.ts` | Support implementation or resource for this folder. |
| `ads.3.idx.ts` | Support implementation or resource for this folder. |
| `audit.1.idx.ts` | Support implementation or resource for this folder. |
| `audit.2.idx.ts` | Support implementation or resource for this folder. |
| `audit.3.idx.ts` | Support implementation or resource for this folder. |
| `auth_providers.idx.ts` | Support implementation or resource for this folder. |
| `authz.idx.ts` | Support implementation or resource for this folder. |
| `automation.idx.ts` | Support implementation or resource for this folder. |
| `billing.idx.ts` | Support implementation or resource for this folder. |
| `chart.idx.ts` | Support implementation or resource for this folder. |
| `clinical_ext.idx.ts` | Support implementation or resource for this folder. |
| `clinical.1.idx.ts` | Support implementation or resource for this folder. |
| `clinical.2.idx.ts` | Support implementation or resource for this folder. |
| `common.idx.ts` | Support implementation or resource for this folder. |
| `community.1.idx.ts` | Support implementation or resource for this folder. |
| `community.2.idx.ts` | Support implementation or resource for this folder. |
| `consent.idx.ts` | Support implementation or resource for this folder. |
| `crm.1.idx.ts` | Support implementation or resource for this folder. |
| `crm.2.idx.ts` | Support implementation or resource for this folder. |
| `cross_store_consistency.idx.ts` | Support implementation or resource for this folder. |
| `delegated_access.idx.ts` | Support implementation or resource for this folder. |
| `diagnostic_units.idx.ts` | Support implementation or resource for this folder. |
| `diagnostics.1.idx.ts` | Support implementation or resource for this folder. |
| `diagnostics.2.idx.ts` | Support implementation or resource for this folder. |
| `directory.idx.ts` | Support implementation or resource for this folder. |
| `education.idx.ts` | Support implementation or resource for this folder. |
| `erp.1.idx.ts` | Support implementation or resource for this folder. |
| `erp.2.idx.ts` | Support implementation or resource for this folder. |
| `erp.3.idx.ts` | Support implementation or resource for this folder. |
| `forms.idx.ts` | Support implementation or resource for this folder. |
| `geo.idx.ts` | Support implementation or resource for this folder. |
| `health_context.idx.ts` | Support implementation or resource for this folder. |
| `health_data.1.idx.ts` | Support implementation or resource for this folder. |
| `health_data.2.idx.ts` | Support implementation or resource for this folder. |
| `iam.idx.ts` | Support implementation or resource for this folder. |
| `identity_assurance.idx.ts` | Support implementation or resource for this folder. |
| `index.ts` | Public export barrel for this folder. |
| `insurance.1.idx.ts` | Support implementation or resource for this folder. |
| `insurance.2.idx.ts` | Support implementation or resource for this folder. |
| `integration_contracts.idx.ts` | Support implementation or resource for this folder. |
| `integrations.idx.ts` | Support implementation or resource for this folder. |
| `lakehouse.idx.ts` | Support implementation or resource for this folder. |
| `marketing.idx.ts` | Support implementation or resource for this folder. |
| `messaging.idx.ts` | Support implementation or resource for this folder. |
| `object_storage.idx.ts` | Support implementation or resource for this folder. |
| `organization_extensions.idx.ts` | Support implementation or resource for this folder. |
| `payments.1.idx.ts` | Support implementation or resource for this folder. |
| `payments.2.idx.ts` | Support implementation or resource for this folder. |
| `payments.3.idx.ts` | Support implementation or resource for this folder. |
| `pharmacy_inventory.idx.ts` | Support implementation or resource for this folder. |
| `pharmacy.idx.ts` | Support implementation or resource for this folder. |
| `platform_ops.1.idx.ts` | Support implementation or resource for this folder. |
| `platform_ops.2.idx.ts` | Support implementation or resource for this folder. |
| `polyglot_storage.idx.ts` | Support implementation or resource for this folder. |
| `practice.idx.ts` | Support implementation or resource for this folder. |
| `procedures_perioperative.1.idx.ts` | Support implementation or resource for this folder. |
| `procedures_perioperative.2.idx.ts` | Support implementation or resource for this folder. |
| `profiles.idx.ts` | Support implementation or resource for this folder. |
| `promotions.idx.ts` | Support implementation or resource for this folder. |
| `qa_lab.idx.ts` | Support implementation or resource for this folder. |
| `read_models.idx.ts` | Support implementation or resource for this folder. |
| `reporting.idx.ts` | Support implementation or resource for this folder. |
| `scheduling.idx.ts` | Support implementation or resource for this folder. |
| `system_context.idx.ts` | Support implementation or resource for this folder. |
| `system_ops.idx.ts` | Support implementation or resource for this folder. |
| `telemetry.idx.ts` | Support implementation or resource for this folder. |
| `terminology.idx.ts` | Support implementation or resource for this folder. |
| `tracking.idx.ts` | Support implementation or resource for this folder. |
| `vector_rag.idx.ts` | Support implementation or resource for this folder. |
| `workflow.idx.ts` | Support implementation or resource for this folder. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
