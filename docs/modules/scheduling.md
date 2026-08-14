<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/scheduling/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `scheduling`

**Fuente:** [`src/modules/scheduling/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/scheduling/README.md)
· 5 controllers · 5 services · 5 repositories · 16 entidades · 5 DTO

---

# Módulo 41 — Scheduling

Agenda: recursos agendables, políticas de reserva, plantillas horarias, generación de slots,
reservas con anti-double-booking, lista de espera y recordatorios.

## Casos de uso cubiertos (14)

| UC | Endpoint | Descripción |
| --- | --- | --- |
| UC-41-01 | `POST /scheduling/resources` · `POST /scheduling/booking-policies` | Definir recurso y política |
| UC-41-02 | `POST /scheduling/resources/:id/templates` | Publicar plantilla con franjas |
| UC-41-03 | `POST /scheduling/templates/:id/generate-slots` | Materializar slots |
| UC-41-04 | `POST /scheduling/resources/:id/exceptions` | Excepción de disponibilidad |
| UC-41-05 | `POST /scheduling/slots/:id/holds` | Reserva temporal (anti-double-booking) |
| UC-41-06 | `POST /scheduling/holds/:holdToken/confirm` | Confirmar cita |
| UC-41-07 | `POST /scheduling/internal/expire-holds` | Worker: liberar holds vencidos |
| UC-41-08 | `POST /scheduling/bookings/:id/reschedule` | Reprogramar |
| UC-41-09 | `POST /scheduling/bookings/:id/cancel` | Cancelar (con cargo por no-show) |
| UC-41-10 | `POST /scheduling/bookings/:id/check-in` | Check-in |
| UC-41-11 | `POST /scheduling/waitlist` | Inscribir en lista de espera |
| UC-41-12 | `POST /scheduling/internal/promote-waitlist/:slotId` | Worker: promover lista de espera |
| UC-41-13 | `POST /scheduling/bookings/:id/reminders` | Programar recordatorios |
| UC-41-14 | `POST /scheduling/internal/dispatch-reminders` | Worker: despachar recordatorios |

## Entidades

`schedulable_resources`, `booking_policies`, `schedule_templates`, `schedule_rules`,
`bookable_slots`, `availability_exceptions`, `slot_holds`, `appointment_bookings`,
`booking_reschedules`, `booking_cancellations`, `waitlist_entries`, `appointment_reminders`.

## Flujo general

```
recurso + política
  └─ plantilla (franjas semanales)
       └─ generate-slots  -> bookable_slots (open, capacity/remaining)
            └─ hold  (FOR UPDATE, remaining--)   ── expira ──> worker devuelve el cupo
                 └─ confirm -> appointment_bookings (confirmed) + recordatorios
                      ├─ reschedule -> libera cupo origen, toma destino
                      ├─ cancel     -> libera cupo (+ cargo si no-show)
                      └─ check-in   -> checked_in
excepción de disponibilidad -> bloquea slots libres solapados
lista de espera -> worker promueve candidatos cuando hay cupo
```

## Reglas de negocio

- **Anti-double-booking**: el slot se toma con `SELECT ... FOR UPDATE` antes de decrementar
  `remaining_capacity`; nunca baja de cero. Al llegar a cero el slot pasa a `held`/`booked`.
- **Hold con TTL**: la vigencia sale de `booking_policies.hold_ttl_seconds` (300 s por defecto).
  Un hold vencido **no se puede confirmar** aunque el worker aún no lo haya reciclado.
- **Límite por paciente**: `max_active_per_patient` de la política se comprueba al tomar el hold.
- **Excepciones no cancelan citas**: bloquean solo los slots libres e intactos que se solapan.
  Cancelar citas confirmadas es una decisión clínica, no un efecto colateral.
- **Cargo por inasistencia**: solo si la política define `no_show_fee_amount` **y** la cancelación
  se marca como no-show. Una cancelación avisada no se cobra.
- **Generación idempotente**: los slots ya existentes se cuentan como `skipped`; hay un tope de
  2000 slots por ejecución para no generar lotes inmanejables (se avisa por log).
- **Promoción de lista de espera**: marca candidatos, **no reserva por ellos**. La cita la confirma
  el paciente por el flujo normal.

## Permisos

`SCHEDULING_ADMIN` en configuración; `SCHEDULING_AGENT` y `PATIENT` en holds, confirmación,
reprogramación, cancelación y lista de espera; `PRACTITIONER` puede registrar sus excepciones;
`SYSTEM_WORKER` en los endpoints internos.

## Concurrencia

`FOR UPDATE` sobre slot, hold y cita antes de mutarlos. El worker de expiración usa
`FOR UPDATE SKIP LOCKED` para repartirse el lote entre instancias sin bloquearse. `row_version` da
bloqueo optimista automático.

## Logs

`operation: 'scheduling.<área>.<acción>'`. Se registran ids y contadores, nunca el `holdToken`
(se entrega una sola vez al cliente) ni datos personales del paciente.

## Pruebas

`yarn test --testPathPatterns=scheduling` — 35 pruebas de servicio + delegación de controladores.

## Pendiente

La proyección vía `messaging.outbox_events` (disponibilidad en read models, notificación real de
recordatorios) depende del módulo 35, aún no implementado. `dispatchReminders` mueve el estado a
`sent` pero **no envía**: el envío real será responsabilidad de messaging.

### Defecto conocido · `generateSlots` ignora la zona horaria del recurso

`schedulable_resources.time_zone` se declara en el modelo, se guarda, se expone en
`GET /scheduling/resources` y se congela en el `cancellation_policy_snapshot` de cada reserva —
pero **no se usa para materializar cupos**. `SchedulingCatalogService.atTime()` resuelve el
`startTime` de la franja con `setUTCHours`, así que la hora de una regla se interpreta en UTC sea
cual sea la sede.

**Consecuencia, medida el 2026-08-11 contra la base viva:** una agenda de La Paz (UTC−4) que
publica «mañanas de 08:00 a 12:00» materializa sus cupos a las **04:00–08:00 hora local**, y el
portal del paciente le ofrece turnos de madrugada.

```sql
-- los 907 cupos futuros del seeder, en hora de la sede
select distinct to_char(start_at at time zone 'America/La_Paz','HH24:MI')
  from scheduling.bookable_slots where start_at > now() order by 1;
--  04:00 04:30 05:00 05:30 06:00 06:30 07:00 07:30
```

**Por qué no se arregló acá.** No es una línea. Además de la hora hay que evaluar el
**día de la semana** en la zona de la sede —si no, una regla de lunes puede materializarse en
domingo local para zonas cuyo desfase cruza la medianoche—, contemplar el horario de verano
(Bolivia no lo tiene, otras zonas del alcance sí) y actualizar los specs de
`scheduling-catalog.service.spec.ts`, que hoy fijan el comportamiento UTC. Cambiar la semántica de
generación de cupos exige además regenerar los cupos ya materializados en cada entorno.

**Mientras tanto**, `tools/redesa/seed-dev-data.mjs` declara sus franjas ya convertidas
(`horaUtcDeLocal`) para que los datos de desarrollo se vean como se verían si el generador fuera
correcto. Es una compensación deliberada y documentada en el propio seeder: cuando `generateSlots`
lea `time_zone`, esa función se borra y las franjas vuelven a declararse en hora local.


