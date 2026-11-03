# test / smoke / modules

Groups **modules**-related components and keeps this system responsibility cohesive.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `accounting.smoke.ts` | Support implementation or resource for this folder. |
| `audit.smoke.ts` | Support implementation or resource for this folder. |
| `authz.smoke.ts` | Support implementation or resource for this folder. |
| `billing.smoke.ts` | Support implementation or resource for this folder. |
| `chart.smoke.ts` | Support implementation or resource for this folder. |
| `clinical_ext.smoke.ts` | Support implementation or resource for this folder. |
| `clinical.smoke.ts` | Support implementation or resource for this folder. |
| `community.smoke.ts` | Support implementation or resource for this folder. |
| `consent.smoke.ts` | Support implementation or resource for this folder. |
| `delegated_access.smoke.ts` | Support implementation or resource for this folder. |
| `diagnostic_units.smoke.ts` | Support implementation or resource for this folder. |
| `diagnostics.smoke.ts` | Support implementation or resource for this folder. |
| `directory.smoke.ts` | Support implementation or resource for this folder. |
| `forms.smoke.ts` | Support implementation or resource for this folder. |
| `geo.smoke.ts` | Support implementation or resource for this folder. |
| `identity_assurance.smoke.ts` | Support implementation or resource for this folder. |
| `integration_contracts.smoke.ts` | Support implementation or resource for this folder. |
| `integrations.smoke.ts` | Support implementation or resource for this folder. |
| `organization_extensions.smoke.ts` | Support implementation or resource for this folder. |
| `pharmacy.smoke.ts` | Support implementation or resource for this folder. |
| `practice.smoke.ts` | Support implementation or resource for this folder. |
| `profiles.smoke.ts` | Support implementation or resource for this folder. |
| `read_models.smoke.ts` | Support implementation or resource for this folder. |
| `system_ops.smoke.ts` | Support implementation or resource for this folder. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
