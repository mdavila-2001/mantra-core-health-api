# Repositorios de scheduling

Acceso a `scheduling.*` con MikroORM. Sin reglas de negocio.

## Fuente de datos

PostgreSQL, schema `scheduling`. Entidades generadas por introspección. Las altas usan
`em.create(..., { partial: true })` **sin flush**: lo cierra la transacción del servicio.

## Repositorios

| Repositorio                    | Tablas                                                                                                                                              | Métodos destacados                                                                                                                                                                                                                                                   |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SchedulingCatalogRepository`  | `schedulable_resources`, `booking_policies`, `schedule_templates`, `schedule_rules`, `availability_exceptions`, `bookable_slots`                    | `createResource`, `createPolicy`, `findPolicyByCode`, `createTemplate`, `createRule`, `findRulesByTemplate`, `createException`, `createSlot`, `findSlotsByTemplateInRange`, `findOpenSlotsInWindow`                                                                  |
| `SchedulingBookingsRepository` | `bookable_slots`, `slot_holds`, `appointment_bookings`, `booking_reschedules`, `booking_cancellations`, `waitlist_entries`, `appointment_reminders` | `findSlotForUpdate`, `createHold`, `findHoldByTokenForUpdate`, `findExpiredHolds`, `createBooking`, `countActiveBookingsForPatient`, `recordReschedule`, `createCancellation`, `createWaitlistEntry`, `findWaitlistCandidates`, `createReminder`, `findDueReminders` |

## Lecturas con bloqueo

- `findSlotForUpdate`, `findHoldByTokenForUpdate`, `findBookingByIdForUpdate`:
  `LockMode.PESSIMISTIC_WRITE` (`FOR UPDATE`). Es la base del anti-double-booking.
- `findExpiredHolds`: `LockMode.PESSIMISTIC_PARTIAL_WRITE` (`FOR UPDATE SKIP LOCKED`) para que dos
  workers se repartan el lote en vez de competir por las mismas filas.

## Filtros y orden

- `findSlotsByTemplateInRange`: ventana semiabierta, base de la generación idempotente.
- `findOpenSlotsInWindow`: solape real (inicio antes del fin ajeno y fin después del inicio ajeno),
  no igualdad de extremos.
- `findWaitlistCandidates`: `priority DESC, createdAt ASC` — a igual prioridad, primero quien
  esperaba hace más tiempo. Acotado por el cupo libre del slot.
- `findDueReminders`: pendientes cuya hora ya pasó, con `limit`.

## Rendimiento

Consultas por PK, FK o clave natural indexada. Sin N+1: los servicios piden la colección una vez y
agregan en memoria. Los recorridos por lotes siempre llevan `limit`.

## Pruebas

Se ejercitan desde los specs de servicio, donde van mockeados. La cobertura real de las consultas
—y del comportamiento de los bloqueos— llega con las pruebas de integración sobre testcontainers.
