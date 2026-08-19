# Módulo 41 — Scheduling

Agenda: recursos agendables, políticas de reserva, plantillas horarias, generación de slots,
reservas con anti-double-booking, lista de espera y recordatorios.

## Casos de uso cubiertos (14)

| UC       | Endpoint                                                           | Descripción                            |
| -------- | ------------------------------------------------------------------ | -------------------------------------- |
| UC-41-01 | `POST /scheduling/resources` · `POST /scheduling/booking-policies` | Definir recurso y política             |
| UC-41-02 | `POST /scheduling/resources/:id/templates`                         | Publicar plantilla con franjas         |
| UC-41-03 | `POST /scheduling/templates/:id/generate-slots`                    | Materializar slots                     |
| UC-41-04 | `POST /scheduling/resources/:id/exceptions`                        | Excepción de disponibilidad            |
| UC-41-05 | `POST /scheduling/slots/:id/holds`                                 | Reserva temporal (anti-double-booking) |
| UC-41-06 | `POST /scheduling/holds/:holdToken/confirm`                        | Confirmar cita                         |
| UC-41-07 | `POST /scheduling/internal/expire-holds`                           | Worker: liberar holds vencidos         |
| UC-41-08 | `POST /scheduling/bookings/:id/reschedule`                         | Reprogramar                            |
| UC-41-09 | `POST /scheduling/bookings/:id/cancel`                             | Cancelar (con cargo por no-show)       |
| UC-41-10 | `POST /scheduling/bookings/:id/check-in`                           | Check-in                               |
| UC-41-11 | `POST /scheduling/waitlist`                                        | Inscribir en lista de espera           |
| UC-41-12 | `POST /scheduling/internal/promote-waitlist/:slotId`               | Worker: promover lista de espera       |
| UC-41-13 | `POST /scheduling/bookings/:id/reminders`                          | Programar recordatorios                |
| UC-41-14 | `POST /scheduling/internal/dispatch-reminders`                     | Worker: despachar recordatorios        |

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

### `generateSlots` respeta la zona horaria del recurso

`schedulable_resources.time_zone` se usa para materializar cupos: las reglas de una plantilla
declaran **hora de pared de la sede** («los lunes de 08:00 a 12:00» son las ocho de la mañana
allí), y `scheduling-time.ts` las convierte al instante UTC que se guarda.

Hasta el 2026-08-15 la hora se resolvía con `setUTCHours`, así que se interpretaba en UTC sea cual
fuera la sede: una agenda de La Paz (UTC−4) que publicaba «08:00 a 12:00» materializaba sus cupos a
las **04:00–08:00 hora local** y el portal ofrecía turnos de madrugada.

Tres cosas que el arreglo tuvo que resolver, y que conviene no deshacer:

- **El día de la semana también es local.** Una regla de lunes se evalúa en el calendario de la
  sede; si no, para zonas cuyo desfase cruza la medianoche puede caer en domingo local. Por eso
  `diasLocalesQueCoinciden` recorre el calendario de la zona y no los días UTC.
- **El horario de verano se mide, no se supone.** La conversión usa `Intl` —Node trae la base IANA
  completa— en vez de sumar un desplazamiento fijo, que se rompería dos veces al año en las zonas
  del alcance que sí lo tienen. La segunda pasada de `horaLocalAUtc` existe para los dos días del
  año en que el desplazamiento del instante supuesto no coincide con el del corregido.
- **Sin zona declarada se cae a UTC**, que es exactamente lo que hacía antes. Así una agenda sin
  `time_zone` no cambia de comportamiento y los cupos ya publicados no se mueven.

Como el barrido de días locales se ensancha un día por lado, los cupos se recortan a la ventana
pedida: sin ese recorte, una zona al oeste de UTC materializaría cupos del día anterior.

**Pendiente relacionado:** `tools/redesa/seed-dev-data.mjs` declara sus franjas ya convertidas con
`horaUtcDeLocal`, una compensación deliberada de cuando el generador era incorrecto. Ahora que
`generateSlots` lee `time_zone`, esa función sobra y las franjas deberían volver a declararse en
hora local — vive en `salud-db`/`tools`, fuera del alcance de este cambio.
