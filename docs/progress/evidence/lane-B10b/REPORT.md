# Reporte — B10b · El retiro de un horario no se rompe por una reprogramación (M4)

> **AVANCE: 2 / 2 — 100,0 %.** **Peldaño: `VERIFIED`**: la unitaria pasó de roja a verde y el retiro que fallaba en
> runtime se volvió a ejecutar contra una base real con el build de esta rama.

- Fecha: 2026-09-26 · Máquina: **M4** · Rama: `justin/test-b10-retiro-con-reprogramaciones`, desde `origin/test` @ `435cd290`
- Origen: defecto que encontró la verificación de runtime de M4 ([`../m4-runtime/REPORT.md`](../m4-runtime/REPORT.md))

## Plan (en 3 capas)

**H1 — Retirar un horario no se rompe porque alguna vez se reprogramó una cita**
- **CA:** Dado un horario con un cupo del que se reprogramó una cita, cuando se lo retira, entonces responde
  200 y ese cupo se conserva.
- **DoD:** unitaria roja → verde · `typecheck`/`lint` 0 · `scheduling` en verde · retiro en runtime en 200.
- **Estado:** HECHO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Prueba que reproduce el borrado de un cupo referenciado por `booking_reschedules` | la prueba falla | [`evidencia/rojo.txt`](./evidencia/rojo.txt): 3 FAIL | HECHO |
| H1.S1.M2 | `retireTemplate` conserva los cupos que son origen o destino de una reprogramación | la prueba pasa; el retiro en runtime da 200 | [`evidencia/verde.txt`](./evidencia/verde.txt): 4/4 · [`../m4-runtime/salida-retiro-con-arreglo.txt`](../m4-runtime/salida-retiro-con-arreglo.txt) | HECHO |

## Completado

| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | Rojo reproducido | `yarn test --testPathPatterns=scheduling-catalog.repository` | 1 PASS, 3 FAIL |
| H1.S1.M2 | Arreglo | el mismo comando, más `node m4-verify-retiro.mjs` | 4/4 · runtime `200 {releasedSlots: 68, keptSlots: 12, liveBookings: 6}` |

Compuertas: `yarn typecheck` exit 0 · `yarn lint` exit 0 · `yarn test --testPathPatterns=scheduling`
**511/511** (25 suites). La salida está en [`evidencia/`](./evidencia/).

## A medias

Ninguna.

## Pendiente

Ninguno.

## No cubierto

- Otras tablas que referencien `bookable_slots` en el futuro. Hoy son `slot_holds` (se borran antes),
  `appointment_bookings` y `booking_reschedules` (se conservan), medido en `41_scheduling/03_fk_intra.sql`.

## Desvíos del plan

- Ninguno. Es trabajo nuevo que descubrió la verificación, y va con su plan propio.

## Riesgos residuales

- Si aparece otra tabla con FK a `bookable_slots`, el retiro vuelve a necesitar este mismo cuidado.

## Decisiones y ambigüedades

- Ninguna nueva. Tratar la reprogramación como historia (el cupo se conserva) sigue el mismo criterio que
  ya aplicaba el retiro con las citas.
