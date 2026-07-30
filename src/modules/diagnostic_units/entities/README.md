# src / modules / diagnostic units / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `diagnostic_equipment.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `diagnostic_price_schedules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `diagnostic_study_components.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `diagnostic_study_offerings.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `diagnostic_study_prices.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `diagnostic_unit_accreditations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `diagnostic_unit_practitioner_assignments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `diagnostic_unit_sites.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `diagnostic_unit_specialties.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `diagnostic_units.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
