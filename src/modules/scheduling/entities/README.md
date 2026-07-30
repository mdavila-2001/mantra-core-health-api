# src / modules / scheduling / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `appointment_bookings.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `appointment_reminders.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `availability_exceptions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `availability_slots.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `bookable_slots.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `booking_cancellations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `booking_confirmation_rules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `booking_policies.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `booking_reschedules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `calendar_absences.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `practitioner_schedules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `schedulable_resources.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `schedule_rules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `schedule_templates.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `slot_holds.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `waitlist_entries.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
