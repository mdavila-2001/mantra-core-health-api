# src / modules / practice / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `care_spaces.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `clinical_units.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `healthcare_services.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `inventory_items.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `inventory_movements.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `practice_accreditations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `practice_settings.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `practice_sites.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `practices.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `practitioner_role_assignments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `practitioner_support_assignments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
