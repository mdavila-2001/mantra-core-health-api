# src / modules / clinical ext / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `care_gaps.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `care_team_members.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `care_teams.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `cds_rules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `clinical_alerts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `drug_interactions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `immunization_schedules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `order_set_items.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `order_sets.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `reference_ranges.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `referrals.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `virtual_encounters.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
