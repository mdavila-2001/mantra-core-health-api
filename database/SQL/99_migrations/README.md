# database / SQL / 99 migrations

Agrupa los componentes relacionados con **99 migrations** y mantiene cohesionada esta responsabilidad del sistema.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `2026-07-28_accounting_states.sql` | Implementación o recurso de soporte de esta carpeta. |
| `2026-07-28_assisted_registration.sql` | Implementación o recurso de soporte de esta carpeta. |
| `2026-07-28_booking_auto_confirmation.sql` | Implementación o recurso de soporte de esta carpeta. |
| `2026-07-28_care_relationships.sql` | Implementación o recurso de soporte de esta carpeta. |
| `2026-07-28_prescription_signature_policy.sql` | Implementación o recurso de soporte de esta carpeta. |
| `2026-07-28_redesa_correction_columns.sql` | Implementación o recurso de soporte de esta carpeta. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
