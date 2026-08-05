# src / modules / clinical / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `allergy_intolerances.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `allergy_reactions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `appointments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `care_episodes.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `conditions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `diagnostic_reports.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `encounter_locations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `encounter_participants.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `encounters.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `family_member_history.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `immunizations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `medication_records.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `medication_requests.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `observation_components.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `observation_notes.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `observation_performers.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `observation_reference_ranges.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `observations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `prescription_signature_policies.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `procedures.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `service_requests.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `social_history.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
