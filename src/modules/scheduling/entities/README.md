# src / modules / scheduling / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

| Archivo                                | Responsabilidad                                    |
| -------------------------------------- | -------------------------------------------------- |
| `appointment_bookings.entity.ts`       | Mapeo de una entidad persistente y sus relaciones. |
| `appointment_reminders.entity.ts`      | Mapeo de una entidad persistente y sus relaciones. |
| `availability_exceptions.entity.ts`    | Mapeo de una entidad persistente y sus relaciones. |
| `availability_slots.entity.ts`         | Mapeo de una entidad persistente y sus relaciones. |
| `bookable_slots.entity.ts`             | Mapeo de una entidad persistente y sus relaciones. |
| `booking_cancellations.entity.ts`      | Mapeo de una entidad persistente y sus relaciones. |
| `booking_confirmation_rules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `booking_policies.entity.ts`           | Mapeo de una entidad persistente y sus relaciones. |
| `booking_reschedules.entity.ts`        | Mapeo de una entidad persistente y sus relaciones. |
| `calendar_absences.entity.ts`          | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts`                             | Public export barrel for this folder.        |
| `practitioner_schedules.entity.ts`     | Mapeo de una entidad persistente y sus relaciones. |
| `schedulable_resources.entity.ts`      | Mapeo de una entidad persistente y sus relaciones. |
| `schedule_rules.entity.ts`             | Mapeo de una entidad persistente y sus relaciones. |
| `schedule_templates.entity.ts`         | Mapeo de una entidad persistente y sus relaciones. |
| `slot_holds.entity.ts`                 | Mapeo de una entidad persistente y sus relaciones. |
| `waitlist_entries.entity.ts`           | Mapeo de una entidad persistente y sus relaciones. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
