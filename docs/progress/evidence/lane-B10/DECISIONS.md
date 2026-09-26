# Decisiones y ambigüedades — carril B10 (M4 · agenda)

> Se **registran**, no se resuelven por conveniencia (regla 1.2). Cada una dice quién la resuelve, qué
> bloquea y qué supuesto tomó este carril mientras tanto. Vive en la carpeta del carril y no en un
> `docs/progress/DECISIONS.md` común para que dos máquinas no editen el mismo archivo (regla anti-bloqueo 3).

## Q-01 · D-A — «Horario flexible»

- **Pregunta:** ¿«horario flexible» es un **bloque con capacidad** (orden de llegada) o un **pedido de hora
  que el médico confirma**?
- **Quién resuelve:** el propietario. **Qué bloquea:** que la API acepte `flexibleHours` (hoy el campo da
  400 por `forbidNonWhitelisted` en `CreateTemplateDto`, `dto/scheduling-catalog.dto.ts:342`).
- **Hecho medido:** `scheduling.schedule_templates` no tiene columna de modo; el simulador del front
  inventa `Math.max(1, floor(dur/15))` como capacidad, una regla que no existe en ningún lado.
- **Forma propuesta, para cuando se decida:**
  - *A — bloque con capacidad:* `schedule_templates.booking_mode_concept_id` (value set `BOOKING_MODE`:
    `FIXED_SLOTS` | `CAPACITY_BLOCK`) + `block_capacity integer NULL`. `generateSlots` emite **un** cupo por
    bloque con `capacity = block_capacity`. Reusa hold y `remaining_capacity`; el paciente no elige hora.
  - *B — pedido que el médico confirma:* mismo concepto con `REQUESTED_TIME`; la reserva nace
    `PENDING_CONFIRMATION` por `requestBooking` y el médico acepta o propone (`propose-schedule`, que ya
    existe). Más superficie: cambia el contrato de disponibilidad.
  - Las dos empiezan en el modelo (`diagram_41_scheduling.puml` → `gen_ddl.py` → `SQL/`), nunca con DDL en
    la API.
- **Supuesto de este carril:** ninguno. No se toca `CreateTemplateDto`: aceptar el campo y descartarlo
  sería mentirle al médico. El front debe no ofrecer «Sí» con `mockBackend=false` (M5).

## Q-02 · D-G — Mostrador del médico

- **Pregunta:** ¿el mostrador reserva por la vía **hold** sumando `PRACTITIONER` a los `@Roles` de
  `slots/:id/holds`, `holds/:token/confirm` y `bookings/:id/check-in`, o por **`appointments/direct`**?
- **Quién resuelve:** el propietario / **M2** (dueña exclusiva de `@Roles`). **Qué bloquea:** el 403 del
  médico en el mostrador.
- **Hecho medido:** `POST /scheduling/appointments/direct` ya admite `PRACTITIONER`, crea paciente,
  modalidad y cita, corre `assertRangoLibre` y el choque del paciente, retrae los cupos que pisa, y tiene
  E2E propio. La vía hold **no** tiene el guardia del profesional al retener (`placeHold` sólo mira la
  capacidad del cupo).
- **Recomendación de M4 (no decisión):** `appointments/direct`. No agrega roles, reusa un camino completo
  y probado, y no abre la vía hold a un actor que no la necesita.
- **Pedido a M2 si eligen la vía hold:** `PRACTITIONER` en `scheduling.controller.ts:590-619` (holds y
  confirm) y en `scheduling-bookings.controller.ts:345` (check-in), acotado en el servicio a recursos
  propios con `assertRecursoDelActor`.

## Q-06 · El retiro de un horario con citas vivas (contrato del 409)

- **Conflicto de fuentes:** BR-21 (24/09) proponía limitar el 409 a citas vivas desde `from`. El encargo de
  M4 (26/09, más nuevo y del propietario) fija el CA: «la operación **conserva los cupos con cita en vez de
  fallar con 409**».
- **Qué se tomó:** el CA del encargo. El retiro ya conservaba los cupos con cita (`keptSlots`) y aun así se
  negaba a correr; ahora corre, los conserva, y la respuesta **dice cuáles** (`liveBookings`,
  `liveBookingIds`, `truncated`) para que la pantalla avise al médico. Sigue sin tocar ninguna cita.
- **A quién confirmar:** propietario. Si prefiere el 409 acotado por `from`, es un cambio de una condición
  en `retireTemplate` y del spec que lo fija.
