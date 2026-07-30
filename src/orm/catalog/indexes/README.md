# src / orm / catalog / indexes

Agrupa los componentes relacionados con **indexes** y mantiene cohesionada esta responsabilidad del sistema.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `accounting.1.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `accounting.2.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `ads.1.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `ads.2.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `ads.3.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `audit.1.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `audit.2.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `audit.3.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `auth_providers.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `authz.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `automation.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `billing.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `chart.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `clinical_ext.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `clinical.1.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `clinical.2.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `common.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `community.1.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `community.2.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `consent.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `crm.1.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `crm.2.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `cross_store_consistency.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `delegated_access.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `diagnostic_units.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `diagnostics.1.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `diagnostics.2.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `directory.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `education.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `erp.1.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `erp.2.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `erp.3.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `forms.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `geo.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `health_context.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `health_data.1.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `health_data.2.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `iam.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `identity_assurance.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `insurance.1.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `insurance.2.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `integration_contracts.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `integrations.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `lakehouse.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `marketing.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `messaging.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `object_storage.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `organization_extensions.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `payments.1.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `payments.2.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `payments.3.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `pharmacy_inventory.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `pharmacy.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `platform_ops.1.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `platform_ops.2.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `polyglot_storage.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `practice.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `procedures_perioperative.1.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `procedures_perioperative.2.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `profiles.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `promotions.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `qa_lab.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `read_models.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `reporting.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `scheduling.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `system_context.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `system_ops.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `telemetry.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `terminology.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `tracking.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `vector_rag.idx.ts` | Implementación o recurso de soporte de esta carpeta. |
| `workflow.idx.ts` | Implementación o recurso de soporte de esta carpeta. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
