# Reporte — B10 · La agenda deja de permitir lo que no debe (M4 · H1)

> **AVANCE: 8 / 8 — 100,0 %** de las microtareas del carril (6 del encargo + 2 descubiertas y agregadas al
> plan). **Peldaño alcanzado: `TESTED`**, que es el techo honesto sin base de datos que fija el encargo. **No
> es `VERIFIED`:** nada de esto se ejercitó contra Postgres ni contra la API levantada; eso lo corre M1 (§«Lo
> que le falta correr a M1»).

- Fecha: 2026-09-26 · Máquina: **M4 · Dell Inspiron 2** · Plan: [PLAN.md](./PLAN.md) · Decisiones: [DECISIONS.md](./DECISIONS.md)
- Rama: `justin/test-b10-agenda-solapamiento-retiro`, desde `origin/test` @ `016caaa1`, PR contra `test`
- Compuertas del carril: `yarn typecheck` exit 0 · `yarn lint` exit 0 · `yarn test --testPathPatterns=scheduling`
  **507/507** (24 suites) — salidas en [`evidencia/`](./evidencia/)

## Completado

| ID | Qué se logró (observable en la prueba) | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | Prueba que reproduce el solapamiento: mover una cita confirmada a **otro cupo** cuyo rango se pisa con otra cita comprometida de la misma médica **era aceptado** | `yarn test --testPathPatterns=scheduling-bookings.service -t M4` | **ROJO** antes del cambio: `Received promise resolved instead of rejected` — [`H1.S1.M1-rojo.txt`](./evidencia/H1.S1.M1-rojo.txt) |
| H1.S1.M2 | `reschedule` corre la regla madre (`assertRangoLibre`, sin compararse consigo misma) y el choque del paciente sobre el cupo destino, **antes** de tocar ningún cupo; y deja la cita en el recurso de su cupo nuevo | `yarn test --testPathPatterns=scheduling-bookings.service` | PASS 160/160 — [`H1.S1.M2-verde.txt`](./evidencia/H1.S1.M2-verde.txt), [`H1.S1.M2-verde-dirigido.txt`](./evidencia/H1.S1.M2-verde-dirigido.txt) |
| H1.S1.M3 | Pedido a M1 de la exclusión en el modelo, con su forma | — | escrito abajo, §«Pedidos» |
| H1.S1.M4 | *(descubierta)* La consulta de la regla madre atribuye cada cita al recurso **de su cupo** (`s.resource_id`, NOT NULL) y no a `b.resource_id` (NULLable, y desactualizado por la reprogramación) | `yarn test --testPathPatterns=scheduling-bookings.repository` | ROJO antes ([`H1.S1.M4-rojo.txt`](./evidencia/H1.S1.M4-rojo.txt)) → PASS 3/3 ([`H1.S1.M4-verde.txt`](./evidencia/H1.S1.M4-verde.txt)) |
| H1.S2.M1 | D-A y D-G registradas con su forma propuesta, sin resolverlas | — | [DECISIONS.md → Q-01, Q-02](./DECISIONS.md) |
| H1.S2.M2 | Retirar un horario con citas vivas **ya no da 409**: conserva los cupos con cita (ninguna cita se toca) y responde `liveBookings`, `liveBookingIds` (ids, nunca nombres) y `truncated` | `yarn test --testPathPatterns=scheduling-catalog.service -t retireTemplate` | ROJO antes (`ConflictException … resolvelas antes de retirarlo`, [`H1.S2.M2-rojo.txt`](./evidencia/H1.S2.M2-rojo.txt)) → PASS 7/7 ([`H1.S2.M2-verde.txt`](./evidencia/H1.S2.M2-verde.txt)) |
| H1.S2.M3 | El paciente titular reprograma **su** turno (la ruta ya lo admitía y comprobaba titularidad; ahora hay spec del caso feliz del paciente, que no existía). El ajeno sigue en 403 (spec previo `un paciente no puede reprogramar la cita de otro`, en verde) | `yarn test --testPathPatterns=scheduling-bookings.service` | PASS — `el paciente titular reprograma su propio turno` |
| H1.S2.M4 | *(descubierta, AG-08 de BR-21)* `slotIds` de cerrar y correr cupos acepta un id **uuid5** (los cupos sembrados); un texto no-UUID y la lista vacía siguen dando 400 | `yarn test --testPathPatterns=scheduling-catalog.dto` | ROJO antes (`each value in slotIds must be a UUID`, [`H1.S2.M4-rojo.txt`](./evidencia/H1.S2.M4-rojo.txt)) → PASS 5/5 ([`H1.S2.M4-verde.txt`](./evidencia/H1.S2.M4-verde.txt)) |

**Kill-test del encargo** («crear dos citas cuyos rangos se pisan en cupos distintos: si las acepta, no está
hecho»): medido sobre el código, los caminos que **crean** una cita (confirmar y solicitar vía
`materializarReserva`, aceptar, cita directa, walk-in) **ya** corrían la regla madre, que compara rangos
en cualquier cupo del profesional. El camino que ocupaba un rango nuevo sin preguntar era **reprogramar**,
y es el que se cerró; más la consulta de la regla madre, que dejaba invisible una cita con `resource_id`
nulo o desactualizado. Ver §«No cubierto» para lo que la regla madre sigue sin mirar.

## A medias

ninguna.

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
| — (D-A) | `BLOQUEADO` por decisión de negocio | el propietario elige A (bloque con capacidad) o B (pedido que el médico confirma); después empieza en el modelo con M1. Mientras tanto `flexibleHours` sigue dando 400 a propósito |
| — (D-G) | `BLOQUEADO` por decisión de negocio | el propietario / M2 eligen vía hold o `appointments/direct` para el mostrador del médico; M4 recomienda `appointments/direct` (Q-02) |

## Lo que le falta correr a M1 (de `TESTED` a `VERIFIED`)

Con la API de esta rama levantada contra la base del VPS (o local con seeds):

1. **Reprogramar encima de otra cita de la misma médica en otro recurso** → `POST
   /scheduling/bookings/:id/reschedule` con `toSlotId` de un cupo que se pisa → **422** y
   `SELECT bookable_slot_id, resource_id FROM scheduling.appointment_bookings WHERE id = :id` sin cambios.
2. **Reprogramar a un cupo libre** → 200, y el mismo `SELECT` muestra `resource_id` = el del cupo nuevo;
   fila en `scheduling.booking_reschedules` (`from_slot_id` → `to_slot_id`).
3. **Regla madre con `resource_id` nulo:** una cita confirmada cuya `appointment_bookings.resource_id` sea
   NULL tiene que frenar una cita directa que la pise (`POST /scheduling/appointments/direct` → 422).
4. **Retiro con citas vivas** → `DELETE /scheduling/templates/:id` → **200** con `keptSlots ≥ 1`,
   `liveBookings ≥ 1`, `liveBookingIds` con los ids; las citas siguen `CONFIRMED` en su cupo.
5. **Cerrar un cupo sembrado** (id uuid5) → `POST /scheduling/resources/:id/close-slots` → 200, no 400.
6. **Paciente** (`paciente@…`, clave de seed) reprograma su turno desde «Mis turnos» → 200; y el de otro → 403.

## Pedidos

- **A M1 (modelo) — H1.S1.M3, la exclusión que la base todavía no tiene.** La garantía de hoy es sólo de
  servicio (advisory lock por profesional + `assertRangoLibre`). La forma pedida, por las 4 capas
  (`diagram_41_scheduling.puml` → `gen_ddl.py` → `SQL/` → patch):
  - Opción recomendada, sobre la tabla que **sí** tiene profesional y horario: completar la que ya existe
    en `clinical.appointments` (`ex_appointments_practitioner_time`, patch
    `database/SQL/patches/2026-09-02_v423_appointments_exclude_doble_reserva.sql`), que hoy **no se creó en
    la base de dev** porque el patch la saltea si hay 94 filas que ya se pisan. Hace falta: (a) sanear esas
    filas, (b) crearla, y (c) que la reprogramación y el corrimiento de cupos **actualicen** `start_at` /
    `end_at` de `clinical.appointments` (hoy `sincronizarCitaClinica` sólo copia el estado) — (c) toca
    `clinical`, que es de M3, así que es un pedido cruzado M1 + M3.
  - Alternativa sobre `scheduling`: `EXCLUDE USING gist (resource_ref_id WITH =, tstzrange(start_at, end_at,
    '[)') WITH &&) WHERE (status in vivos)` necesita desnormalizar el profesional y el rango en
    `appointment_bookings` (hoy no tiene horario: lo lee del cupo por `JOIN`). Más invasiva.
- **A M2 (roles):** ninguno nuevo desde este carril. D-G (Q-02) es la única dependencia de roles, y es
  decisión.
- **A M5 (front):** el retiro ya no responde 409 con citas vivas: la pantalla puede dejar de pedirle al
  médico que las resuelva antes, y mostrar `liveBookings` / `liveBookingIds`. «Horario flexible: Sí» no
  debe ofrecerse con `mockBackend=false` hasta D-A.

## Evidencia

Todas en [`evidencia/`](./evidencia/), con el comando en la primera línea y la salida literal:

```text
$ corepack yarn typecheck                                    → exit=0   (gate-typecheck.txt)
$ corepack yarn lint                                         → exit=0   (gate-lint.txt)
$ corepack yarn test --testPathPatterns="scheduling"         → Suites: 24 passed · Tests: 507 passed, 0 failed · exit=0
                                                                         (gate-regresion-scheduling.txt)
```

Rojo → verde de cada microtarea: `H1.S1.M1-rojo.txt`, `H1.S1.M2-verde*.txt`, `H1.S1.M4-{rojo,verde}.txt`,
`H1.S2.M2-{rojo,verde}.txt`, `H1.S2.M4-{rojo,verde}.txt`, `dirigidas-final.txt`.

## No cubierto

- **Nada se ejercitó contra Postgres.** El cambio de `JOIN` de la regla madre está probado sobre el SQL que
  sale (qué une y con qué parámetros), no sobre filas reales.
- **La regla madre sigue sin mirar** (medido, no tocado): recursos que no son de un profesional (una sala o
  un equipo no tienen guardia de rango propio), reservas en `REQUESTED` / `PENDING_CONFIRMATION` (a
  propósito: el choque se resuelve al aceptar), `propose-schedule` y `shift-slots` (corren horarios sin
  llamar al guardia; este último cita una exclusión de `clinical.appointments` que nunca ve el cambio).
- **La reprogramación no mira** si el cupo destino está bloqueado o ya pasó, ni si es del mismo recurso: se
  registró, no se amplió el alcance.
- **Concurrencia:** las lecturas del guardia corren en otra conexión del pool (`em.getConnection().execute`
  sin contexto de transacción), serializadas por el advisory lock; dentro de una misma transacción no ven
  filas propias sin confirmar. No cambió con este carril.

## Desvíos del plan

- H1.S1.M4 y H1.S2.M4 no estaban en el encargo: aparecieron al medir y se **agregaron al plan** con CA y DoD
  antes de ejecutarlas (regla 20 §6.6). Las dos están dentro del alcance declarado (`scheduling/**`).
- El contrato del retiro cambió de «409 con citas vivas» a «retira y las informa»: lo fija el CA del
  encargo y contradice a BR-21; queda en [DECISIONS.md → Q-06](./DECISIONS.md). Los dos specs que fijaban
  el 409 se **reescribieron al contrato nuevo** sin aflojar lo que protegían (que no se filtren nombres y
  que ningún cupo con cita se toque); un título de spec que decía «sólo las citas vivas frenan» se ajustó
  porque ya no era cierto.

## Riesgos residuales

- Si el propietario prefiere el 409 acotado por `from` (opción de BR-21), el cambio es una condición en
  `retireTemplate` y los dos specs del retiro.
- La base de dev tiene 94 citas clínicas que ya se pisan (encabezado del patch v4.2.3): el servicio ahora
  frena las nuevas, pero las viejas siguen ahí hasta que M1 las sanee.

## Decisiones y ambigüedades

Ver [DECISIONS.md](./DECISIONS.md): Q-01 (D-A), Q-02 (D-G), Q-06 (contrato del retiro). Ninguna se resolvió
por conveniencia.
