# Módulo 53 — Procedimientos y Perioperatorio

Ciclo completo del caso quirúrgico: programación con reserva de quirófano, valoración y clearance
preoperatorio, checklist de seguridad de la OMS, anestesia, intervención con trazabilidad de
implantes e insumos, reporte operatorio firmado, recuperación, cancelación y cargos.

## Casos de uso cubiertos (14)

| UC | Endpoint | Descripción |
| --- | --- | --- |
| UC-53-01 | `POST /procedure-cases` | Programar caso y reservar quirófano |
| UC-53-02 | `POST /procedure-cases/:id/diagnoses` · `.../team-members` | Diagnósticos y equipo |
| UC-53-03 | `POST /procedure-cases/:id/preoperative-assessments` | Valoración y riesgo |
| UC-53-04 | `POST /procedure-cases/:id/preoperative-orders/verify` | Clearance de órdenes |
| UC-53-05 | `POST /procedure-cases/:id/safety-checklists/:cid/responses` | Checklist por fases |
| UC-53-06 | `POST /procedure-cases/:id/anesthesia-plans` · `.../:planId/approve` | Plan de anestesia |
| UC-53-07 | `POST /procedure-cases/:id/anesthesia-events` | Eventos intraoperatorios |
| UC-53-08 | `POST /procedure-cases/:id/operative-steps` · `.../findings` | Pasos y hallazgos |
| UC-53-09 | `POST /procedure-cases/:id/implants` | Implantes con UDI, lote y serie |
| UC-53-10 | `POST /procedure-cases/:id/medication-uses` · `.../specimens` | Insumos y muestras |
| UC-53-11 | `POST /procedure-cases/:id/operative-reports` · `.../:rid/sign` | Reporte operatorio |
| UC-53-12 | `POST /procedure-cases/:id/pacu-stays` · `/pacu-stays/:id/assessments` · `.../discharge` | Recuperación |
| UC-53-13 | `POST /procedure-cases/:id/cancel` | Cancelar y liberar quirófano |
| UC-53-14 | `POST /procedure-cases/:id/charge-items/post` | Cargos y utilización |

## Entidades

Se escriben 26 tablas de `procedures_perioperative.*`: `procedure_cases`,
`procedure_case_status_history`, `procedure_case_milestones`, `procedure_case_diagnoses`,
`procedure_case_team_members`, `procedure_case_locations`, `operating_room_utilization_events`,
`procedure_cancellations`, `procedure_charge_items`, `preoperative_assessments`,
`preoperative_risk_scores`, `preoperative_orders`, `surgical_safety_checklists`,
`surgical_safety_responses`, `anesthesia_plans`, `anesthesia_airway_assessments`,
`anesthesia_events`, `operative_steps`, `operative_findings`, `procedure_body_sites`,
`procedure_implants`, `implant_identifiers`, `procedure_devices`, `procedure_medication_uses`,
`procedure_specimens`, `operative_reports`, `procedure_complications`, `pacu_stays`,
`pacu_assessments`, `postoperative_orders`, `postoperative_followups`.

`surgical_safety_items` se lee (catálogo de ítems del checklist). `instrument_sets`,
`sterilization_loads`, `sterility_verification_checks`, `procedure_outcomes` y
`procedure_performers` no se tocan (ver *Pendiente*).

## Flujo general

```
caso (scheduled) ── quirófano reservado + cirujano en el equipo + hito programado
   │
   ├─ diagnósticos (un solo principal) + equipo
   ├─ valoración preoperatoria ──> apto ⇒ hito PreopCleared; no apto ⇒ warn, sin hito
   ├─ órdenes verificadas ── ninguna pendiente ⇒ ready-for-surgery
   ├─ checklist WHO: sign-in → time-out (⇒ hito) → sign-out ⇒ completed
   └─ plan de anestesia (draft) ── approve ──> approved + anestesiólogo en el caso
            │
            └─ inducción ──> caso in-progress, actual_start_at, evento OR CaseStart
                 │
                 ├─ pasos + hallazgos (⇒ sitio anatómico al procedimiento)
                 ├─ implantes + identificadores UDI/lote/serie + uso de dispositivo
                 ├─ medicación y muestras
                 └─ reporte vN (draft) ── sign ──> signed ⇒ caso completed + hito CaseEnd
                          │
                          └─ PACU (in-recovery) ── valoraciones ── alta (Aldrete ≥ 9)
                                        └─> órdenes y seguimientos postoperatorios

cancelar (desde scheduled | ready | in-progress) ──> cancelled + quirófano liberado
facturar (sólo completed) ──> cargos + duración real y desviación frente a lo programado
```

## Reglas de negocio

- **Un quirófano, un caso**: el solape se comprueba dentro de la transacción antes de reservar.
- **Saltarse la programación electiva exige justificarlo**: un caso urgente o de emergencia sin
  motivo declarado no se puede auditar después.
- **El cirujano principal entra en el equipo con el caso**: un caso sin cirujano no tiene
  responsable.
- **Un solo diagnóstico principal**: con dos, la codificación y la facturación quedan sin criterio.
- **La valoración exige revisar alergias y medicación**: es lo que más veces está detrás de un
  incidente en quirófano. Las puntuaciones de riesgo son **inmutables**, con su modelo y versión,
  para que años después se sepa con qué se decidió.
- **Sólo un paciente apto alcanza el hito de clearance**; declarar despejado a uno que no lo está
  sería lo contrario de lo que el hito significa.
- **El caso pasa a listo cuando no queda ninguna orden pendiente**: operar con una pendiente es el
  riesgo que este paso cierra.
- **Las respuestas del checklist son inmutables** y una excepción exige justificación. El time-out
  deja hito: es lo que autoriza empezar.
- **Anticipar vía aérea difícil obliga a declarar el plan de rescate**, y queda registrado con
  `warn`.
- **La inducción exige plan aprobado** y es la que abre el caso: fija `actual_start_at`, lo pasa a
  en curso y registra el inicio de uso del quirófano.
- **Nada intraoperatorio se registra sobre un caso que no está en curso**: pasos, hallazgos,
  implantes e insumos en un caso que no empezó producirían una historia clínica que no ocurrió.
- **Un implante exige al menos un identificador**: sin UDI, lote ni serie no se podría rastrear si
  el fabricante lo retira del mercado. El uso del dispositivo se registra aparte, porque la
  trazabilidad regulatoria pregunta por el dispositivo, no por el acto.
- **Cada versión del reporte es inmutable**: corregir es escribir una nueva. Firmarlo cierra el caso.
- **El alta de recuperación exige una valoración que cumpla el criterio** (Aldrete ≥ 9): sacar al
  paciente sin ella es lo que la escala existe para impedir. La valoración informa, pero no da el
  alta: eso es un acto aparte.
- **Cancelar libera el quirófano** en la misma transacción, y registra si era evitable — que es lo
  que mide la calidad del proceso.
- **Sólo se factura un caso completado**, y una sola vez. La consolidación calcula duración real y
  desviación frente a lo programado.

## Permisos

`PERIOP_ADMIN` cubre el módulo. `SURGERY_SCHEDULER` programa, asigna equipo y cancela. `SURGEON`
registra diagnósticos, pasos, hallazgos, implantes, muestras y firma el reporte.
`ANESTHESIOLOGIST` valora, planifica y aprueba la anestesia, registra sus eventos y da el alta de
recuperación. `PERIOP_NURSE` responde el checklist, registra implantes e insumos y admite en PACU.
`BILLING` genera cargos.

Es deliberado que sólo el anestesiólogo dé el alta de recuperación y sólo el cirujano firme el
reporte: son los actos que comprometen responsabilidad clínica.

## Concurrencia

`FOR UPDATE` sobre el caso en **toda** operación que lo toque —es el agregado que gobierna el
flujo—, y además sobre checklist, plan de anestesia, reporte, estancia de recuperación y cargos. Las
órdenes preoperatorias se leen bloqueadas **como colección**: verificar una y decidir si el caso
queda listo tiene que ver el conjunto sin cambios en medio. `row_version` aporta bloqueo optimista.

## Logs

`operation: 'periop.<área>.<acción>'`. Nivel `warn` al declarar un paciente no apto, al anticipar
vía aérea difícil, ante un evento de anestesia grave o crítico, al registrar una complicación y al
cancelar un caso. Nunca se loguean datos clínicos del paciente más allá del identificador del caso.

## Pruebas

`yarn test --testPathPatterns=procedures_perioperative` — 79 pruebas de servicio + delegación del
controlador.

## Pendiente

- **Esterilización**: `instrument_sets`, `sterilization_loads` y `sterility_verification_checks`
  pertenecen al circuito de central de esterilización, que el caso de uso no cubre en este módulo.
- **Resultados a largo plazo**: `procedure_outcomes` se poblará desde el seguimiento clínico, no
  desde el acto quirúrgico.
- **`procedure_performers`**: el modelo distingue el equipo del **caso** (que sí se registra) del
  ejecutante del **procedimiento** codificado; lo segundo se poblará al consolidar el procedimiento
  en la historia clínica.
- **Conciliación de cargos**: `billing_claim_line_id` e `invoice_line_id` quedan sin poblar; los
  fija facturación al consolidar, igual que el `journal_transaction_id` de ERP.
- **Cronómetro del quirófano**: los eventos de utilización se registran, pero el cálculo agregado de
  ocupación y recambio por sala vive en reportes.
- **Outbox**: `CaseScheduled`, `TimeOutCompleted`, `ImplantRecorded`, `OperativeReportSigned`,
  `CaseCancelled` se emitirán cuando exista el módulo 35.
