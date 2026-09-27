# Plan — B10 · La agenda deja de permitir lo que no debe (M4 · H1)

- Fecha: 2026-09-26 · Máquina: **M4 · Dell Inspiron 2** · Repo: `mantra-core-health-api`
- Rama: `justin/test-b10-agenda-solapamiento-retiro`, desde `origin/test` @ `016caaa1`, PR contra `test`
- Encargo: `AlovidaPromptManager/repartos/2026-09-26/PromptMaquinas/M4-DellInspiron2/Preproduccion.ApiAgendaDirectoriosYDinero/AgendaFarmaciaCotizacionesYContabilidad.md` (§5, H1)
- Prompt de brechas de origen: `mantra-core-health/docs/brechas-front-back-2026-09-24/prompts/BR-21-agenda-reglas-y-mostrador.md`
- Resultado observable: una cita confirmada no se puede mover encima de otra cita comprometida del mismo
  profesional; un horario con citas vivas se retira conservando esos cupos en vez de responder 409; el
  paciente reprograma su propio turno; cerrar o correr un cupo sembrado (id uuid5) no da 400.
- Kill-test: crear dos citas cuyos rangos se pisan en cupos distintos. Si la API las acepta, no está hecho.
- Techo honesto sin base de datos: **`TESTED`**. La verificación de runtime la corre M1 cuando entra el PR.

## Alcance

- **IN:** `src/modules/scheduling/**` (servicios, repositorios, controlador, DTO y sus specs) y esta carpeta
  de evidencia.
- **OUT:** `clinical` (M3), `authz` y todo `@Roles` existente (M2), DDL y `database/SQL/**` (M1 vía el
  modelo), `yarn db:vendor`, pasarela de pago, delivery, el alta directa del médico
  (`POST /scheduling/appointments/direct`, completa: no se reescribe).
- **Ambigüedades registradas:** D-A (horario flexible) y D-G (mostrador del médico), en
  [`DECISIONS.md`](./DECISIONS.md). Ninguna se resuelve acá.

## Hechos medidos que ordenan el plan (peldaño `DISCOVERED`)

| Hecho | Dónde |
|---|---|
| El guardia del profesional es `assertRangoLibre`: toma `pg_advisory_xact_lock` por profesional y busca citas CONFIRMED/CHECKED_IN/IN_PROGRESS cuyo **rango** se pisa, en **cualquier** cupo | `services/scheduling-professional-time.service.ts:214-264`, `repositories/scheduling-bookings.repository.ts:777-842` |
| Lo llaman confirmar/solicitar (`materializarReserva`), aceptar, cita directa y walk-in | `services/scheduling-bookings.service.ts:812-822`, `:1053-1060`, `:1795-1812` |
| **`reschedule` no lo llama**: mueve la cita a cualquier cupo con capacidad sin mirar el rango del profesional ni el del paciente, y deja `booking.resourceId` apuntando al recurso viejo | `services/scheduling-bookings.service.ts:1235-1355` |
| La consulta del guardia une el recurso por `b.resource_id` (nulable), no por el cupo: una cita con `resource_id` nulo o reprogramada a otro recurso queda **invisible** o mal atribuida | `repositories/scheduling-bookings.repository.ts:815` |
| `retireTemplate` lanza 409 con **cualquier** cita viva, aunque el repositorio ya conserva los cupos con cita (`keptSlots`) | `services/scheduling-catalog.service.ts:963-1038`, `repositories/scheduling-catalog.repository.ts:870-917` |
| `ShiftSlotsDto.slotIds` y `CloseSlotsDto.slotIds` exigen UUID **v4**; los cupos sembrados son uuid5 | `dto/scheduling-catalog.dto.ts:1017-1021`, `:1078-1082` |
| Reprogramar ya admite `PATIENT` y comprueba titularidad; ningún spec cubre al paciente reprogramando **su** turno con éxito | `controllers/scheduling-bookings.controller.ts:311-324`, `services/scheduling-bookings.service.ts:1264-1268` |

## H1 — La agenda deja de permitir lo que no debe

**CA:** Dadas dos citas cuyos rangos se pisan en cupos distintos, cuando se intenta crear la segunda,
entonces el sistema la rechaza.
**DoD:** microtareas de H1 en `HECHO` con las unitarias del solapamiento y del retiro en verde; `yarn
typecheck` y `yarn lint` exit 0; `yarn test --testPathPatterns=scheduling` en verde.
**Estado:** HECHO — peldaño `TESTED` (ver REPORT.md)

### H1.S1 — Cerrar el solapamiento que hoy pasa

**CA:** Dado un rango que se pisa con otro en distinto cupo, cuando se reserva (o se mueve una reserva ahí),
entonces falla con 422 y la cita no se mueve.
**DoD:** las microtareas en `HECHO` con la unitaria pegada, roja antes y verde después.
**Estado:** HECHO — peldaño `TESTED` (ver REPORT.md)

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Escribir la prueba que hoy falla: reprogramar una cita confirmada a un cupo **distinto** cuyo rango se pisa con otra cita comprometida del mismo profesional | la prueba reproduce el solapamiento | `yarn test --testPathPatterns=scheduling-bookings.service` → **rojo** pegado | HECHO |
| H1.S1.M2 | Cubrirlo en el servicio: `reschedule` corre `assertRangoLibre` (excluyendo la propia cita) y el choque del paciente sobre el cupo destino, y alinea `resourceId` con el del cupo | la prueba de M1 pasa y nada más se rompe | mismo comando → verde pegado | HECHO |
| H1.S1.M3 | Pedir a M1 la exclusión en el modelo | el pedido queda escrito con su forma | pedido en el `REPORT.md` | HECHO |
| H1.S1.M4 | *(descubierta)* El guardia atribuye la cita al recurso **de su cupo** (`s.resource_id`, NOT NULL), no a `b.resource_id` (nulable) | la consulta une por el cupo | `yarn test --testPathPatterns=scheduling-bookings.repository` → verde pegado | HECHO |

### H1.S2 — Horario flexible, retiro y mostrador

**CA:** Dado un horario con citas vivas, cuando se lo retira, entonces la operación conserva los cupos con
cita en vez de fallar con 409.
**DoD:** las microtareas en `HECHO` con las unitarias pegadas.
**Estado:** HECHO — peldaño `TESTED` (ver REPORT.md)

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S2.M1 | Registrar D-A y D-G con su forma propuesta | quedan en `DECISIONS.md` | enlace pegado | HECHO |
| H1.S2.M2 | Permitir retirar un horario con citas vivas | conserva los cupos con cita, informa cuáles, no responde 409 | `yarn test --testPathPatterns=scheduling-catalog.service` → verde pegado | HECHO |
| H1.S2.M3 | Dejar que el paciente reprograme | la ruta responde al paciente titular y rechaza al ajeno | `yarn test --testPathPatterns=scheduling-bookings.service` → verde pegado | HECHO |
| H1.S2.M4 | *(descubierta, AG-08 de BR-21)* `slotIds` de correr/cerrar cupos acepta cualquier versión de UUID | un id uuid5 pasa el `ValidationPipe` global; un texto no-UUID sigue dando 400 | `yarn test --testPathPatterns=scheduling-catalog.dto` → verde pegado | HECHO |

## Riesgos y bloqueos previstos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Sin base, la consulta SQL del guardia no se ejercita | el cambio de `JOIN` queda en `TESTED` | se pide a M1 el recorrido de runtime en el reporte |
| Cambiar el 409 del retiro rompe un spec que lo fija | el spec cambia de contrato | el cambio de requisito sale del CA del encargo y queda en `DECISIONS.md`; no se debilita: se reescribe la aserción al nuevo contrato |
| La reprogramación no mueve los horarios de `clinical.appointments` | la exclusión de la base sobre `clinical.appointments` no ve el movimiento | fuera de alcance (`clinical` es de M3); se registra como riesgo residual |
