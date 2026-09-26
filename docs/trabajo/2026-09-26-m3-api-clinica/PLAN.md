# Plan — M3 · Dell Inspiron 1 · API clínica sin base (receta, alergia, aspectos médicos, notas, formularios y encuestas)

- Fecha: 2026-09-26 · Repos afectados: `mantra-core-health-api` (rama `justin/test-m3-api-clinica-2026-09-26` desde `origin/test` @ `016caaa1`) · `AlovidaPromptManager` (daily de M3) · Predecesor: reparto `repartos/2026-09-26/PromptMaquinas/M3-DellInspiron1/Preproduccion.ApiClinica/RecetaNotasFormulariosYEncuestas.md`
- Resultado observable: registrar una alergia desde la consulta ya no da 400; la receta toma al prescriptor de la sesión y guarda el motivo escrito; el paciente lee y guarda sus aspectos médicos en `GET|PUT /clinical/me/medical-aspects`; el autor de una nota o plan sale de la sesión; la lectura del resumen clínico deja fila en `audit.data_access_log`; el generador de formularios y el editor de encuestas pueden editar, quitar y reordenar contra la API.
- Kill-test: mandar `POST /clinical/allergy-intolerances` con `encounterId`, tal como lo arma `allergy-block.ts:243-258` del front. Si el DTO lo rechaza (400 por `forbidNonWhitelisted`), no está hecho. Sin base, el kill-test se ejercita con `class-validator` sobre el DTO real (spec dirigido) y queda **`TESTED`**, nunca `VERIFIED`.
- Techo honesto de este carril: **`TESTED`** (unitarias con `EntityManager` mockeado). Lo que le falta correr a M1 se lista en el REPORTE §«No cubierto».

## Alcance
- IN: `src/modules/clinical/**` (DTO, entidades, servicios, controladores, módulo, specs), `src/modules/chart/services/chart-notes.service.ts`, `chart-care-plans.service.ts` y sus specs, `chart/dto/notes.dto.ts`, `chart/dto/care-plans.dto.ts`, `src/modules/forms/**`, `src/modules/surveys/**`, `docs/progress/DECISIONS.md`, `docs/trabajo/2026-09-26-m3-api-clinica/**`, `docs/progress/evidence/lane-m3-api-clinica/REPORT.md`.
- IN por necesidad declarada (desvío mínimo, fuera de la lista literal del encargo): `src/modules/common/dto/enums.ts` (tres valores de `OwnerType`), `src/common/constants/concepts.ts` (tres conceptos `OWNER_*`) y `src/modules/common/services/files.service.ts` (el listado genérico rechaza los tres tipos clínicos nuevos para no ampliar el IDOR de BR-11 §1.C). Sin esto los adjuntos de receta, alergia y encuentro no pueden existir: `FilesService.createLink` resuelve `CONCEPTS['OWNER_' + ownerType]` y rompe en runtime con un valor sin concepto.
- OUT: `authz` y todo `@Roles` de endpoints existentes (M2) · `scheduling`, `pharmacy`, `billing` (M4) · DDL en el repo de la API (`database/SQL/**`, nunca `yarn db:vendor`) · el modelo (`mantra-core-health-model`, lo regenera M1 con los pedidos de §«Pedidos a M1» del reporte) · el front y su simulador (M5) · el IDOR preexistente del listado genérico para `CONDITION`/`PROCEDURE` (se anota, no se corrige) · cofirma sin UPDATE y `GET :noteId/versions` de BR-13 (fuera de las 13 microtareas; se anotan como pendientes).
- Ambigüedades registradas (se registran, no se resuelven por conveniencia; ver `docs/progress/DECISIONS.md`):
  - Q-01 · D-B: dónde viven los «aspectos médicos» — se **propone** la opción A (tabla propia `clinical.patient_reported_health_statements`, una fila por titular) y se construye contra esa forma; confirma el propietario.
  - Q-02 · D-D: opciones de los campos de elección — se **propone** (a) value set local por campo, coherente con `*_concept_id`; se registra, no se implementa nada del modelo.
  - Q-03 · CL-33: barrera WORM en `clinical_note_versions` — se **propone** DELETE prohibido + UPDATE condicionado a `OLD.status = DRAFT` (capacidad nueva de `gen_integrity.py`), y UPDATE/DELETE prohibidos en `clinical_note_signatures` y `note_release_events`; confirma el propietario y lo regenera M1.
  - Q-04 · N-09: la declaración del paciente no lleva `custodian_tenant_id` (no la custodia ningún tenant); la RLS por ese GUC no la cubre y se declara como excepción; confirma el propietario / M1.

## H1 — La receta y la alergia dejan de rebotar con 400
**CA:** Dado el registro de una alergia desde la consulta, cuando se envía con `encounterId`, entonces la API la acepta en vez de devolver 400.
**DoD:** Las microtareas de H1 en `HECHO`, con DTO, servicio y unitarias en verde (`corepack yarn test --testPathPatterns="allergy|medications.service|encounters.service|files.service"` → todos PASS, salida en `evidencia/`).
**Estado:** HECHO

### H1.S1 — Alergia desde la consulta y sus adjuntos
**CA:** Dado el DTO de alergia, cuando declara `encounterId`, entonces la petición completa del front pasa la validación; y dados receta, alergia y encuentro existentes, cuando se hace `POST …/:id/attachments`, entonces responde 201 con el vínculo.
**DoD:** Las cuatro microtareas en `HECHO` con la salida de las unitarias pegada.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Declarar `encounterId?` en `CreateAllergyIntoleranceDto`, mapearlo en la entidad (`encounter_id`, nullable) y validar en el servicio que el encuentro sea del mismo paciente (422 si no) | el cuerpo de `allergy-block.ts` con `encounterId` valida sin `property encounterId should not exist`; encuentro ajeno → 422 | `corepack yarn test --testPathPatterns="allergy"` → PASS (spec de DTO con `validate()` + spec de servicio) | HECHO |
| H1.S1.M2 | Pedir a M1 los cinco bindings de catálogo de alergia (`substance`, `type`, `category`, `criticality`, `manifestation`) y la columna `encounter_id` | el pedido queda escrito con su forma exacta (`.puml`, índice, relación, fuente clínica pendiente) | sección «Pedidos a M1» del REPORTE.md | HECHO |
| H1.S1.M3 | Aceptar adjuntos: `OwnerType.MEDICATION_REQUEST/ALLERGY_INTOLERANCE/ENCOUNTER` + `CONCEPTS.OWNER_*`, DTO `AttachFileTo*Dto`, `attachFile()` en `MedicationsService`, `AllergyIntolerancesService` y `EncountersService` calcado de `ProceduresService.attachFile`, rutas `POST medication-requests/:id/attachments`, `allergy-intolerances/:id/attachments`, `encounters/:id/attachments` | 404 si el recurso no existe, `assertPuedeEscribirHistoria` con el paciente de la fila, `createLink` con el `OwnerType` correcto | `corepack yarn test --testPathPatterns="allergy-intolerances.service|medications.service|encounters.service"` → PASS | HECHO |
| H1.S1.M4 | El listado genérico `GET /common/files/links` rechaza los tres tipos clínicos nuevos (403, «use la ruta clínica»), para no ampliar el IDOR de BR-11 §1.C | `listLinkedFiles({ownerType: MEDICATION_REQUEST})` → `ForbiddenException`; `CONDITION` sigue igual que hoy | `corepack yarn test --testPathPatterns="files.service"` → PASS | HECHO |
| H1.S1.M5 | (descubierta al cerrar H1.S1.M4) La ruta clínica de lectura que reemplaza al genérico: `GET medication-requests/:id/attachments`, `allergy-intolerances/:id/attachments`, `encounters/:id/attachments` (`PATIENT` incluido en el handler) → 404 antes de autorizar, `assertPuedeLeerHistoria` con el paciente de la fila, y `FilesService.listLinkedFilesOf` (la mitad sin guarda del listado) | las tres rutas responden; sin acceso → 403 sin listar; inexistente → 404 | `corepack yarn test --testPathPatterns="allergy-intolerances.service|medications.service|encounters.service|files.service"` → PASS | HECHO |

### H1.S2 — La receta completa
**CA:** Dada una receta sin diagnóstico previo, cuando el médico escribe el motivo, entonces se guarda en `indication_text` y se lee en el resumen; y dado un cuerpo con otro prescriptor, cuando se prescribe, entonces la API responde 403 y no crea la fila.
**DoD:** Las dos microtareas en `HECHO` con las unitarias en verde.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S2.M1 | Tomar el prescriptor de la sesión en `prescribe()` y `editDraft()`: default `actor.practitionerProfileId`; sin perfil → 403; distinto del actor → 403 (`SUPERADMIN` pasa, como `assertFirmaElPrescriptor`) | un cuerpo con otro prescriptor no lo pisa: 403 y sin `create` | `corepack yarn test --testPathPatterns="medications.service"` → PASS | HECHO |
| H1.S2.M2 | Aceptar `indicationText?` (`@MaxLength(200)`) en alta y edición; entidad `indication_text`; excluyente con `indicationConditionId` (gana el concepto); proyectado en `MedicationRequestItemDto` y en el snapshot | se persiste (`create` recibe `indicationText`) y se lee (`getPatientSummary` lo devuelve); con condición y texto juntos se guarda sólo la condición; 201 caracteres → 400 | `corepack yarn test --testPathPatterns="medications.service|clinical-read.service|medication.dto"` → PASS | HECHO |

## H2 — El paciente puede declarar y leer sus aspectos médicos
**CA:** Dado `GET|PUT /clinical/me/medical-aspects`, cuando el paciente los consulta y los guarda, entonces la API responde 200 en vez de 404.
**DoD:** Las microtareas de H2 en `HECHO`, con D-B registrada y las unitarias en verde.
**Estado:** HECHO

### H2.S1 — Elegir dónde vive el dato, y registrarlo
**CA:** Dada la decisión D-B, cuando se toma, entonces queda escrita en `docs/progress/DECISIONS.md` con sus cuatro opciones, pros, contras y la propuesta; y dadas las dos rutas, cuando el titular llama sin id, entonces responden 200 (primera vez `{}`), ausente = no tocar, `''` = borrar, sin perfil de paciente → 403, clave desconocida → 400.
**DoD:** Las dos microtareas en `HECHO` con la decisión registrada y el spec del servicio en verde.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Proponer y registrar D-B (opción A, tabla `clinical.patient_reported_health_statements`) y N-09 (sin `custodian_tenant_id`) en `DECISIONS.md` | queda en `DECISIONS.md` con enlace | `grep -n "D-B" docs/progress/DECISIONS.md` | HECHO |
| H2.S1.M2 | Entidad + repositorio + DTO (`UpdateOwnMedicalAspectsDto`, `MedicalAspectsResponseDto`) + `MedicalAspectsService.getOwn/updateOwn` + `ClinicalMedicalAspectsController` (`clinical/me/medical-aspects`, sin `@Roles`, titular por vínculo de cuenta) + registro en `ClinicalModule` + `clinical.module.spec.ts` | `getOwn` sin declaración → `{}`; `updateOwn({habitsText})` no toca los demás; `''` → null; sin perfil → 403; el módulo publica el controlador | `corepack yarn test --testPathPatterns="medical-aspects|clinical.module"` → PASS | HECHO |

## H3 — Las notas clínicas se firman, se enmiendan y se liberan
**CA:** Dada una nota firmada, cuando se intenta modificar su versión, entonces el sistema lo impide sin romper `signVersion`; y dado un cuerpo con otro autor, cuando se crea, versiona o enmienda una nota o se crea un plan, entonces la API responde 403.
**DoD:** Las microtareas de H3 en `HECHO`, con las unitarias en verde.
**Estado:** HECHO

### H3.S1 — Firma, enmienda y autor por sesión
**CA:** Dada una nota, cuando se crea/versiona/enmienda, entonces el autor sale de la sesión (403 si el cuerpo trae otro); y dada una lectura del resumen clínico, cuando se sirve, entonces queda una fila en `audit.data_access_log`.
**DoD:** Las tres microtareas en `HECHO` con las unitarias pegadas.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H3.S1.M1 | `authorProfileId` opcional en `CreateNoteDto`/`AddVersionDto`/`AmendNoteDto`; `ChartNotesService` y `ChartCarePlansService` resuelven el autor con la misma regla que `assertFirmaConPerfilPropio` | un cuerpo con otro autor no lo pisa (403, sin `createVersion`); sin cuerpo → autor = perfil de la sesión | `corepack yarn test --testPathPatterns="chart-notes.service|chart-care-plans.service"` → PASS | HECHO |
| H3.S1.M2 | Plantear y registrar la barrera WORM de CL-33 (`clinical_note_versions`: DELETE prohibido + UPDATE sólo desde DRAFT; `clinical_note_signatures` y `note_release_events`: UPDATE/DELETE prohibidos) | queda en `DECISIONS.md` con enlace | `grep -n "CL-33" docs/progress/DECISIONS.md` | HECHO |
| H3.S1.M3 | `ClinicalReadService.getPatientSummary` recibe al actor y escribe `audit.data_access_log` (`AUD.ACTION_READ`, `resourceType = 'PATIENT_CLINICAL_SUMMARY'`, `purpose = 'TREATMENT'`) en el mismo `em` de la lectura, con `DataAccessLogRepository` provisto en `ClinicalModule` | la lectura escribe su registro (`record` llamado con el actor y el paciente; `flush` posterior) | `corepack yarn test --testPathPatterns="clinical-read.service"` → PASS | HECHO |

### H3.S2 — Formularios y encuestas editables
**CA:** Dado un formulario o una encuesta, cuando se edita, se reordena o se quita un campo/pregunta, entonces la operación ocurre en una transacción, sólo sobre lo propio/borrador, y responde con la forma que el cliente del front ya usa.
**DoD:** Las tres microtareas en `HECHO` con las unitarias pegadas.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H3.S2.M1 | Registrar D-D en `DECISIONS.md` (tres opciones, propuesta (a) value set local por campo) y dejar constancia de que «`options` se ignora» es falso: da 400 | queda en `DECISIONS.md` con enlace | `grep -n "D-D" docs/progress/DECISIONS.md` | HECHO |
| H3.S2.M2 | `forms`: `PATCH /forms/assignments/:id {required?, visible?, editable?}`, `DELETE /forms/assignments/:id` (baja lógica: `valid_to = now`, estado `ASSIGNMENT_RETIRED`), `PUT /forms/assignments/order {targetResourceConceptId, assignmentIds[]}` (lista parcial → las no nombradas al final), `PATCH /forms/field-definitions/:id {name?, dataType?}` (409 si cambia el tipo con valores capturados); sólo sobre lo del tenant del actor (estándar → 403; `SECURITY_ADMIN`/`SUPERADMIN` sin techo); todo en una transacción | las cuatro rutas responden `{ ok: true }`; estándar → 403; id ajeno al target → 422 | `corepack yarn test --testPathPatterns="forms-assignments.service|forms-fields.service|forms-controllers"` → PASS | HECHO |
| H3.S2.M3 | `surveys`: `PATCH :id` (título, consigna, plazo del borrador), `PATCH :id/questions/:questionId` (opciones y escala enteras; al cambiar de tipo se descarta lo que no usa), `DELETE :id/questions/:questionId` (renumera 1..n), `PUT :id/questions/order {questionIds}` (parcial → las no nombradas al final; id ajeno → 422); todas 422 sobre versión publicada, 200 `{ ok: true }`, `loadOwnedTemplate` en todas | las cuatro rutas responden; publicada → 422; borrar renumera; parcial conserva | `corepack yarn test --testPathPatterns="surveys-templates.service"` → PASS | HECHO |

## Cierre — compuertas y entrega
| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| C.1 | `corepack yarn typecheck` en 0 | exit 0 | salida en `evidencia/typecheck.txt` | TODO |
| C.2 | `corepack yarn lint` en 0 | exit 0 | salida en `evidencia/lint.txt` | TODO |
| C.3 | Specs dirigidos de los módulos tocados en verde | 0 fallos | `corepack yarn test --testPathPatterns="clinical|chart|forms|surveys|files.service"` → salida en `evidencia/test-dirigido.txt` | TODO |
| C.4 | `REPORTE.md` con avance calculado, `No cubierto`, pedidos a M1 y M2, peldaño `TESTED` | las tres secciones obligatorias presentes | `python .claude/hooks/plan_status.py` | TODO |
| C.5 | PR contra `test` abierto y mergeable | `mergeable=MERGEABLE`, `isDraft=false` | `gh pr view 473 --json isDraft,mergeable,mergeStateStatus` → `evidencia/pr-mergeable.txt` | HECHO |
| C.6 | Daily de M3 y Daily de máquinas actualizados en `AlovidaPromptManager` por PR | tabla de cierre con carriles, peldaño y PR | `gh pr view` en el PM | A MEDIAS |

**C.5:** el propietario abrió el PR con el comando de `evidencia/pr-body.md` (el clasificador del modo automático había denegado `gh pr create` desde la sesión): **PR #473**, `isDraft=false`, `mergeable=MERGEABLE`, `mergeStateStatus=CLEAN`, sin checks reportados (runners propios apagados; la compuerta es la verificación local). Salida literal en `evidencia/pr-mergeable.txt`. **Mergeado en `test`** por `Jsaldias39` (merge `f5c8c11c`, 2026-09-26 07:05 UTC). ⚠️ `test` tiene el código y no el DDL de M1: no desplegar antes del patch.

**C.6 — qué anda, qué no anda, qué falta, dónde quedó:** el daily de M3 y la fila de M3 en el daily de máquinas están actualizados en la rama `justin/m3-daily-2026-09-26` de `AlovidaPromptManager`, pusheada. Lo que no anda: el PR contra `main` del PM sigue sin abrir (misma denegación). Lo que falta: `gh pr create --base main --head justin/m3-daily-2026-09-26` en el PM, por el propietario.

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Las tres columnas/tabla nuevas (`allergy_intolerances.encounter_id`, `medication_requests.indication_text`, `clinical.patient_reported_health_statements`) no existen en el DDL hasta que M1 regenere el modelo | desplegar este PR antes del patch de M1 rompe el `INSERT` de alergia/receta (500) y el arranque con `ORM_SCHEMA_SYNC=dry-run` reporta `columna-ausente` | el PR lo declara en su cuerpo; M1 lo mergea junto con el patch; la fidelidad al arranque lo caza antes de servir tráfico |
| Los conceptos `OWNER_*` nuevos se siembran al arrancar | sin reseed, `createLink` no resuelve el concepto | son `def()` en `CONCEPT_DEFS`, que el seed de arranque recorre entero; M1 verifica en runtime |
| La suite completa de la API no es compuerta hoy (§0 del reparto) | un rojo ajeno confunde | sólo specs dirigidos; baseline medido antes de tocar (`evidencia/baseline-*.txt`) |
| El listado genérico de adjuntos sigue sin control para `CONDITION`/`PROCEDURE` | IDOR preexistente | se anota como OBSERVACIÓN fuera de alcance con su ruta |
