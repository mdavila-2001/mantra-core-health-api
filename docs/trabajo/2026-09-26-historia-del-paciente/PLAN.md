# Plan — BR-15: Historia del paciente, lo liberado visible y PDF oficial

- Fecha: 2026-09-26 · Repos afectados: `mch-legion-api` (este; front en `mch-legion-front`
  aparte) · Predecesor: ninguno
- Resultado observable: el paciente lee sus evoluciones liberadas y documentos visibles en
  `GET /charts/me/*`, descarga el PDF oficial de una atención propia (sólo lo liberado/visible), y
  cada lectura/descarga deja fila en `audit.data_access_log`.
- Kill-test: pedir `GET /charts/me/notes` con el token de un paciente que tiene una nota en
  borrador y una liberada → si el borrador aparece, CL-30 no está.

## Alcance
- IN: `chart/controllers/chart-me.controller.ts` (nuevo), `chart/services/chart-me-read.service.ts`
  (nuevo), `chart/dto/chart-me.dto.ts` (nuevo), `chart/services/encounter-pdf.service.ts`
  (refactor aditivo: `componer()` privado compartido + `renderForPatient()` nuevo, `render()` sin
  cambios de comportamiento), `chart.module.ts` (registrar/exportar lo nuevo).
- OUT: `chart-notes.repository.ts`/`chart-notes.service.ts` (dueño M3) — se **llaman** sus métodos
  de lectura existentes (`findHeadersByPatient`, `findVersionsByIds`), nunca se modifican.
- OUT (decisión CV-06, ver DECISIONS.md D-BR15-01): el PDF de la **historia completa**
  (`GET /clinical/me/record/pdf`) queda **fuera de este alcance por tiempo**, no por indecisión: la
  decisión de producto se toma y se registra (opción a), pero construir el endpoint —agregación de
  todo el historial con su propio `content_hash`— es un carril aparte. Se declara `A MEDIAS`.
- Ambigüedades registradas:
  - El titular sale de `actor.patientProfileId` (claim `pid`), no de una resolución contra la base
    como hace `assertOwnRecord`. Es el patrón que BR-15 pide explícitamente ("patrón
    `forms-me.controller.ts`: el titular sale del claim") y el que ya usa `forms/me` y (se infiere)
    `surveys/me`. Vale la misma advertencia que ya deja `ClinicalReadService`: `pid` no es una
    credencial: si algún día se decide resolverlo contra la base para `charts/me` también, es un
    cambio a los cuatro endpoints nuevos de este archivo, no a los existentes.

## H1 — Lecturas del titular (CL-30)
**CA:** Dada una nota liberada y una en borrador, cuando el paciente pide `GET /charts/me/notes`,
entonces sólo ve la liberada. Dado un documento visible y uno sólo para el profesional, cuando pide
`GET /charts/me/documents`, entonces sólo ve el visible.
**Estado:** HECHO

| ID | Microtarea | DoD | Estado |
|---|---|---|---|
| H1.M1 | `ChartMeReadService.listMyNotes` | `yarn test -- chart-me-read.service` en verde (9/9) | HECHO |
| H1.M2 | `ChartMeReadService.listMyDocuments` | ídem | HECHO |
| H1.M3 | `ChartMeReadService.getMyDocumentFileContent` (mismo 404 para todo) | ídem | HECHO |
| H1.M4 | `ChartMeController` (`GET notes`, `GET documents`, `GET .../content`) | `yarn test -- chart-me.controller` en verde (4/4) | HECHO |

## H2 — PDF oficial de la atención para el titular (CL-31)
**CA:** Dado un encuentro cerrado con una nota en borrador y otra liberada, cuando el paciente lo
descarga, entonces el PDF incluye sólo la liberada. Dado un encuentro de otro paciente, 404.
**Estado:** HECHO

| ID | Microtarea | DoD | Estado |
|---|---|---|---|
| H2.M1 | `EncounterPdfService.componer()` (extracción, sin cambiar `render()`) | `yarn test -- encounter-pdf.service` sigue en verde (13 tests previos intactos) | HECHO |
| H2.M2 | `EncounterPdfService.renderForPatient()` | 5 tests nuevos en verde | HECHO |
| H2.M3 | `ChartMeController.getMyEncounterPdf` | cubierto por el spec del controlador | HECHO |

## H3 — Auditoría de lectura (regla 90.2.7)
**CA:** Toda lectura/descarga de `charts/me/*` deja una fila en `audit.data_access_log`.
**Estado:** HECHO (notas, documentos, contenido de archivo) — **el PDF de la atención no deja
auditoría propia todavía** (usa la misma pregunta de autorización que `render()`, que no auditaba;
sumarla es una línea, se registra como pendiente honesto, no se inventó silenciosamente).

| ID | Microtarea | DoD | Estado |
|---|---|---|---|
| H3.M1 | `listMyNotes`/`listMyDocuments`/`getMyDocumentFileContent` llaman `DataAccessLogRepository.record` | test dedicado en verde | HECHO |
| H3.M2 | `renderForPatient` audita la descarga | — | **A MEDIAS**: no implementado por tiempo; `render()` (médico) tampoco auditaba antes de este carril, así que no es una regresión, pero BR-15 sí lo pide para el titular |

## H4 — Historia completa descargable (CV-06)
**Estado:** BLOQUEADO por tiempo (ver DECISIONS.md D-BR15-01). Decisión tomada (opción a); endpoint
no construido.

## Verificación en runtime
- `node dist/src/main.js` contra Postgres efímero (`legion-h3-pg`, esquema real vía
  `apply_all.sql`+`apply_deferred.sql`+patches) arranca limpio; `RoutesResolver` mapea las 4 rutas
  de `ChartMeController` (ver `docs/progress/evidence/lane-M7-h3/br15-api-boot.log`).
- `GET /charts/me/notes` sin token → 401 (evidencia en el mismo log de arranque, curl pegado).
- No se llegó a una prueba de integración HTTP completa con usuario real (mismo bloqueo de entorno
  que BR-14: `test:integration` exige Node ≥24 y este equipo tiene Node 22; el contenedor
  `node:24-bookworm` no tiene el binario nativo `@swc/core-linux-x64-gnu` instalado y reinstalarlo
  sobre el `node_modules` montado del host es un riesgo que no se tomó). Los specs unitarios (18 de
  `encounter-pdf.service` + 9 de `chart-me-read.service` + 4 de `chart-me.controller`) son la
  evidencia dirigida de este hito.
