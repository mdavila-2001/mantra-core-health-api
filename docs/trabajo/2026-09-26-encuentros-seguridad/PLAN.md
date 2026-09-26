# Plan — BR-14: Encuentros, sello del cierre, CDS y lecturas del resumen

- Fecha: 2026-09-26 · Repos afectados: `mch-legion-api` (este) · Predecesor: ninguno
- Resultado observable: escribir sobre un encuentro sellado da 422; CDS exige rol clínico y
  acceso al paciente y el chequeo previo no deja alertas huérfanas; el motivo del cambio de
  estado de una condición se guarda y no se loguea; el resumen trae `encounterId` de receta,
  reacciones de alergia, lateralidad y `rowVersion` del encuentro.
- Kill-test: cerrar un encuentro, registrar una condición con ese `encounterId` → si responde
  201 en vez de 422, CL-07 no está.

## Alcance
- IN: `clinical/services/conditions.service.ts`, `clinical/services/observations.service.ts`,
  `clinical/dto/condition.dto.ts`, `clinical/dto/clinical-read.dto.ts`,
  `clinical/services/clinical-read.service.ts`, `clinical/clinical.module.ts` (registrar/exportar
  el guard nuevo), archivo **nuevo** `clinical/services/encounter-seal-guard.service.ts`, archivo
  **nuevo** `clinical/repositories/allergy-reactions-read.repository.ts`,
  `chart/services/chart-care-plans.service.ts`, `chart/services/chart-documents.service.ts`,
  `clinical_ext/controllers/cds.controller.ts`, `clinical_ext/services/cds.service.ts`,
  `clinical_ext/clinical_ext.module.ts`.
- OUT (por regla del reparto, dueño M3): `medications.service.ts`, `allergy-intolerances.service.ts`
  (ni su repositorio), `medical-aspects.service.ts`, `chart-notes.service.ts`, formularios y
  encuestas. La guarda del sello **no se cablea ahí**: queda pedido a M3 en el reporte.
- OUT (sin DDL en la API): CL-10 se resuelve con la opción **(b)** — motivo dentro del registro de
  historia (`audit.conditions_history.data_snapshot`), sin columna nueva en `clinical.conditions`.
- OUT: `@Roles` de endpoints existentes (M2), `role-mapping`, agenda/farmacia/facturación (M4).
- Ambigüedades registradas:
  - CL-07: se elige la opción **(a)** del prompt — 422 al escribir sobre un encuentro
    FINISHED/sellado — por ser la más simple y no exigir tabla de addendum nueva (que además
    violaría "sin DDL"). Registrado en DECISIONS.md D-BR14-01.
  - CL-08: `care-episodes`/`check-in` sin `ClinicalRecordAccessGuard` es una decisión **ya tomada
    y documentada** en el propio controlador (`BOOTSTRAP_ACCESS_RESIDUAL`) y bloqueada por un spec
    de montaje (`clinical-record-access.mounting.spec.ts`) que exige su ausencia. No se reabre.
    Lo que el prompt pedía además —tenant del actor— **ya está cerrado** por
    `TenantContextInterceptor`/`resolveOrdinaryTenantId` (MCH-001), confirmado leyendo el código:
    rechaza 403 si el tenant del header/cuerpo no es membresía del actor. Registrado D-BR14-02.
  - CL-09: se protege `cds/evaluate` y `cds/check-interactions` con `@Roles('CLINICIAN',
    'PRACTITIONER')` + `ClinicalRecordAccessGuard` (que aplica `assertPuedeEscribirHistoria` por
    ser POST con paciente en el cuerpo). El chequeo previo (`checkInteractions`) deja de persistir
    alertas — opción "calcula y no persiste" del prompt, la más simple y la que pide el Gherkin.
    D-BR14-03.

## H1 — El sello del encuentro se respeta (CL-07)
**CA:** Dado un encuentro FINISHED con `sealedAt`, cuando se registra una condición o una
observación con ese `encounterId`, entonces la API responde 422 y el `content_hash` original no
cambia.
**DoD:** spec dirigido en verde + prueba de integración manual contra Postgres efímero.
**Estado:** TODO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H1.M1 | Crear `EncounterSealGuardService.assertEncounterWritable` | dado un encuentro sellado, lanza 422; dado uno en curso, no lanza | spec unitario nuevo en verde | TODO |
| H1.M2 | Cablear en `conditions.service.ts` (`assertEncounterBelongsToPatient`) | condición sobre encuentro sellado → 422 | `yarn test -- conditions.service` en verde | TODO |
| H1.M3 | Cablear en `observations.service.ts` (`assertReferencesBelongToPatient`) | observación sobre encuentro sellado → 422 | `yarn test -- observations.service` en verde | TODO |
| H1.M4 | Cablear en `chart-care-plans.service.ts` y `chart-documents.service.ts` | plan/documento sobre encuentro sellado → 422 | `yarn test -- chart-care-plans.service chart-documents.service` en verde | TODO |

## H2 — CDS exige rol clínico, acceso al paciente y no deja basura (CL-09)
**CA:** Dado un `PATIENT`, cuando llama a `cds/evaluate` o `cds/check-interactions`, entonces 403.
Dado un par sin interacción, cuando se chequea, entonces no se crea ninguna fila en
`clinical_ext.clinical_alerts`.
**DoD:** specs dirigidos + integración viva.
**Estado:** TODO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H2.M1 | `@Roles` + guard en `cds.controller.ts` | rol/acceso exigidos | `yarn test -- cds.controller` en verde | TODO |
| H2.M2 | `checkInteractions` no persiste | count 0 tras chequeo sin interacción | `yarn test -- cds.service` en verde | TODO |
| H2.M3 | `ClinicalExtModule` importa `ClinicalModule` | arranque sin `UnknownDependenciesException` | `node dist/src/main.js` arranca | TODO |

## H3 — Motivo del cambio de estado (CL-10)
**CA:** Dado un cambio de estado con motivo, entonces es recuperable en la historia de la
condición y no aparece en el log; `reasonText` vacío responde 400.
**DoD:** spec dirigido + `grep` del log.
**Estado:** TODO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H3.M1 | `@IsNotEmpty() @MaxLength(500)` en `reasonText` | vacío → 400 | `yarn test -- conditions.service` | TODO |
| H3.M2 | Motivo en `data_snapshot` de `audit.conditions_history`, fuera del log | log sin `reason` | `grep -i reason` sobre stdout de la prueba de integración, vacío | TODO |

## H4 — Lecturas completas del resumen (CL-11, CL-16 parcial)
**CA:** La receta trae `encounterId`, la alergia trae sus reacciones, la condición trae
lateralidad, el encuentro trae `rowVersion`.
**DoD:** spec dirigido de `clinical-read.service`.
**Estado:** TODO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H4.M1 | `encounterId` en `MedicationRequestItemDto` | presente en la respuesta | `yarn test -- clinical-read.service` | TODO |
| H4.M2 | `reactions[]` en `AllergyItemDto` (repo nuevo de sólo lectura) | trae las reacciones de esa alergia | ídem | TODO |
| H4.M3 | `lateralityConceptId` en `ConditionItemDto` | presente | ídem | TODO |
| H4.M4 | `rowVersion` en `EncounterItemDto` | presente | ídem | TODO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| CL-07 sobre receta/alergia/notas queda sin cerrar (dueño M3) | El sello se puede violar todavía en esos tres flujos | Guarda queda lista y exportada; se pide a M3 en el reporte que la invoque desde sus 3 servicios |
| No hay repo de modelo disponible | N/A para BR-14 (no toca modelo) | — |
