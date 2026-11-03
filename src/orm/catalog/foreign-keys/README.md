# src / orm / catalog / foreign keys

Groups **foreign keys**-related components and keeps this system responsibility cohesive.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `accounting.1.fk.ts` | Support implementation or resource for this folder. |
| `accounting.2.fk.ts` | Support implementation or resource for this folder. |
| `ads.1.fk.ts` | Support implementation or resource for this folder. |
| `ads.2.fk.ts` | Support implementation or resource for this folder. |
| `ads.3.fk.ts` | Support implementation or resource for this folder. |
| `audit.1.fk.ts` | Support implementation or resource for this folder. |
| `audit.2.fk.ts` | Support implementation or resource for this folder. |
| `audit.3.fk.ts` | Support implementation or resource for this folder. |
| `auth_providers.fk.ts` | Support implementation or resource for this folder. |
| `authz.fk.ts` | Support implementation or resource for this folder. |
| `automation.fk.ts` | Support implementation or resource for this folder. |
| `billing.fk.ts` | Support implementation or resource for this folder. |
| `chart.fk.ts` | Support implementation or resource for this folder. |
| `clinical_ext.fk.ts` | Support implementation or resource for this folder. |
| `clinical.1.fk.ts` | Support implementation or resource for this folder. |
| `clinical.2.fk.ts` | Support implementation or resource for this folder. |
| `common.fk.ts` | Support implementation or resource for this folder. |
| `community.1.fk.ts` | Support implementation or resource for this folder. |
| `community.2.fk.ts` | Support implementation or resource for this folder. |
| `consent.fk.ts` | Support implementation or resource for this folder. |
| `crm.1.fk.ts` | Support implementation or resource for this folder. |
| `crm.2.fk.ts` | Support implementation or resource for this folder. |
| `delegated_access.fk.ts` | Support implementation or resource for this folder. |
| `diagnostic_units.fk.ts` | Support implementation or resource for this folder. |
| `diagnostics.1.fk.ts` | Support implementation or resource for this folder. |
| `diagnostics.2.fk.ts` | Support implementation or resource for this folder. |
| `directory.fk.ts` | Support implementation or resource for this folder. |
| `education.fk.ts` | Support implementation or resource for this folder. |
| `erp.1.fk.ts` | Support implementation or resource for this folder. |
| `erp.2.fk.ts` | Support implementation or resource for this folder. |
| `erp.3.fk.ts` | Support implementation or resource for this folder. |
| `forms.fk.ts` | Support implementation or resource for this folder. |
| `geo.fk.ts` | Support implementation or resource for this folder. |
| `health_context.fk.ts` | Support implementation or resource for this folder. |
| `health_data.fk.ts` | Support implementation or resource for this folder. |
| `iam.fk.ts` | Support implementation or resource for this folder. |
| `identity_assurance.fk.ts` | Support implementation or resource for this folder. |
| `index.ts` | Public export barrel for this folder. |
| `insurance.1.fk.ts` | Support implementation or resource for this folder. |
| `insurance.2.fk.ts` | Support implementation or resource for this folder. |
| `integration_contracts.fk.ts` | Support implementation or resource for this folder. |
| `integrations.fk.ts` | Support implementation or resource for this folder. |
| `marketing.fk.ts` | Support implementation or resource for this folder. |
| `messaging.fk.ts` | Support implementation or resource for this folder. |
| `organization_extensions.fk.ts` | Support implementation or resource for this folder. |
| `payments.1.fk.ts` | Support implementation or resource for this folder. |
| `payments.2.fk.ts` | Support implementation or resource for this folder. |
| `pharmacy_inventory.fk.ts` | Support implementation or resource for this folder. |
| `pharmacy.fk.ts` | Support implementation or resource for this folder. |
| `platform_ops.1.fk.ts` | Support implementation or resource for this folder. |
| `platform_ops.2.fk.ts` | Support implementation or resource for this folder. |
| `polyglot_storage.fk.ts` | Support implementation or resource for this folder. |
| `practice.fk.ts` | Support implementation or resource for this folder. |
| `procedures_perioperative.1.fk.ts` | Support implementation or resource for this folder. |
| `procedures_perioperative.2.fk.ts` | Support implementation or resource for this folder. |
| `profiles.fk.ts` | Support implementation or resource for this folder. |
| `promotions.fk.ts` | Support implementation or resource for this folder. |
| `qa_lab.fk.ts` | Support implementation or resource for this folder. |
| `read_models.fk.ts` | Support implementation or resource for this folder. |
| `reporting.fk.ts` | Support implementation or resource for this folder. |
| `scheduling.fk.ts` | Support implementation or resource for this folder. |
| `system_context.fk.ts` | Support implementation or resource for this folder. |
| `system_ops.fk.ts` | Support implementation or resource for this folder. |
| `telemetry.fk.ts` | Support implementation or resource for this folder. |
| `terminology.fk.ts` | Support implementation or resource for this folder. |
| `tracking.fk.ts` | Support implementation or resource for this folder. |
| `workflow.fk.ts` | Support implementation or resource for this folder. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
