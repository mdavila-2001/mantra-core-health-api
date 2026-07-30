# test / smoke / modules

Agrupa los componentes relacionados con **modules** y mantiene cohesionada esta responsabilidad del sistema.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `accounting.smoke.ts` | Implementación o recurso de soporte de esta carpeta. |
| `audit.smoke.ts` | Implementación o recurso de soporte de esta carpeta. |
| `authz.smoke.ts` | Implementación o recurso de soporte de esta carpeta. |
| `billing.smoke.ts` | Implementación o recurso de soporte de esta carpeta. |
| `chart.smoke.ts` | Implementación o recurso de soporte de esta carpeta. |
| `clinical_ext.smoke.ts` | Implementación o recurso de soporte de esta carpeta. |
| `clinical.smoke.ts` | Implementación o recurso de soporte de esta carpeta. |
| `community.smoke.ts` | Implementación o recurso de soporte de esta carpeta. |
| `consent.smoke.ts` | Implementación o recurso de soporte de esta carpeta. |
| `delegated_access.smoke.ts` | Implementación o recurso de soporte de esta carpeta. |
| `diagnostic_units.smoke.ts` | Implementación o recurso de soporte de esta carpeta. |
| `diagnostics.smoke.ts` | Implementación o recurso de soporte de esta carpeta. |
| `directory.smoke.ts` | Implementación o recurso de soporte de esta carpeta. |
| `forms.smoke.ts` | Implementación o recurso de soporte de esta carpeta. |
| `geo.smoke.ts` | Implementación o recurso de soporte de esta carpeta. |
| `identity_assurance.smoke.ts` | Implementación o recurso de soporte de esta carpeta. |
| `integration_contracts.smoke.ts` | Implementación o recurso de soporte de esta carpeta. |
| `integrations.smoke.ts` | Implementación o recurso de soporte de esta carpeta. |
| `organization_extensions.smoke.ts` | Implementación o recurso de soporte de esta carpeta. |
| `pharmacy.smoke.ts` | Implementación o recurso de soporte de esta carpeta. |
| `practice.smoke.ts` | Implementación o recurso de soporte de esta carpeta. |
| `profiles.smoke.ts` | Implementación o recurso de soporte de esta carpeta. |
| `read_models.smoke.ts` | Implementación o recurso de soporte de esta carpeta. |
| `system_ops.smoke.ts` | Implementación o recurso de soporte de esta carpeta. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
