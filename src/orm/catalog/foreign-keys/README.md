# src / orm / catalog / foreign keys

Agrupa los componentes relacionados con **foreign keys** y mantiene cohesionada esta responsabilidad del sistema.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `accounting.1.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `accounting.2.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `ads.1.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `ads.2.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `ads.3.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `audit.1.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `audit.2.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `audit.3.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `auth_providers.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `authz.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `automation.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `billing.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `chart.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `clinical_ext.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `clinical.1.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `clinical.2.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `common.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `community.1.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `community.2.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `consent.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `crm.1.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `crm.2.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `delegated_access.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `diagnostic_units.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `diagnostics.1.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `diagnostics.2.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `directory.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `education.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `erp.1.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `erp.2.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `erp.3.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `forms.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `geo.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `health_context.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `health_data.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `iam.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `identity_assurance.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `insurance.1.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `insurance.2.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `integration_contracts.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `integrations.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `marketing.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `messaging.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `organization_extensions.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `payments.1.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `payments.2.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `pharmacy_inventory.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `pharmacy.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `platform_ops.1.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `platform_ops.2.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `polyglot_storage.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `practice.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `procedures_perioperative.1.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `procedures_perioperative.2.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `profiles.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `promotions.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `qa_lab.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `read_models.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `reporting.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `scheduling.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `system_context.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `system_ops.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `telemetry.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `terminology.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `tracking.fk.ts` | Implementación o recurso de soporte de esta carpeta. |
| `workflow.fk.ts` | Implementación o recurso de soporte de esta carpeta. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
