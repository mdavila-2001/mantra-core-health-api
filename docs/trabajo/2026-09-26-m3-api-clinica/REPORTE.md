# Reporte — M3 · Dell Inspiron 1 · API clínica sin base (receta, alergia, aspectos médicos, notas, formularios y encuestas)

> **AVANCE: 15 / 15 — 100,0 %.** (13 microtareas del encargo + 2 descubiertas y agregadas al plan: H1.S1.M4 y H1.S1.M5). Las seis microtareas de cierre (C.1–C.6) se declaran aparte, abajo.

- Fecha: 2026-09-26 · Plan: [PLAN.md](./PLAN.md) · Rama: `justin/test-m3-api-clinica-2026-09-26` desde `origin/test` @ `016caaa1` · PR contra `test`: **#473** (`MERGEABLE` · `CLEAN`), ver §«Entrega»
- Peldaño de evidencia alcanzado: **`TESTED`** — unitarias dirigidas con `EntityManager` mockeado y validación de DTO con `class-validator`, todo en verde. **No es `VERIFIED`**: nada se ejercitó contra la API viva ni contra Postgres. Lo que le falta correr a M1 está en §«No cubierto».
- Encargo: `AlovidaPromptManager/repartos/2026-09-26/PromptMaquinas/M3-DellInspiron1/Preproduccion.ApiClinica/RecetaNotasFormulariosYEncuestas.md`
- Instalación del estándar (§1 del encargo), salida literal en el worktree:

```text
$ ls .claude/skills | wc -l
179
$ ls .claude/rules/[0-9]*.md | wc -l
15
$ python .claude/hooks/plan_gate.py --self-test
plan_gate self-test: 11 PASS, 0 FAIL
```

## Completado

Sólo lo que tiene CA cumplido y DoD demostrado con salida literal (en `evidencia/`).

| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | `CreateAllergyIntoleranceDto` declara `encounterId`; la entidad lo mapea (`encounter_id`); el servicio exige que el encuentro sea del mismo paciente (422) y lo proyecta en alta y resumen. **Kill-test:** el cuerpo literal de `allergy-block.ts:243-258` valida sin `forbidNonWhitelisted` | `corepack yarn test --testPathPatterns="allergy"` | PASS · `evidencia/h1-test-dirigido.txt` |
| H1.S1.M2 | Pedido a M1 escrito con su forma exacta (columna, índice, relación, cinco catálogos) | — | §«Pedidos a M1» de este reporte |
| H1.S1.M3 | `OwnerType.MEDICATION_REQUEST/ALLERGY_INTOLERANCE/ENCOUNTER` + `CONCEPTS.OWNER_*`; `attachFile()` en `MedicationsService`, `AllergyIntolerancesService` y `EncountersService` calcado de `ProceduresService`; `POST medication-requests/:id/attachments`, `allergy-intolerances/:id/attachments`, `encounters/:id/attachments` | `corepack yarn test --testPathPatterns="allergy-intolerances.service\|medications.service\|encounters.service"` | PASS · `evidencia/h1-test-dirigido.txt` |
| H1.S1.M4 | `GET /common/files/links` rechaza (403) los tres tipos clínicos nuevos antes de leer nada, para no ampliar el IDOR (BR-11 §1.C); `CONDITION`/`PROCEDURE` siguen igual | `corepack yarn test --testPathPatterns="files.service"` | PASS · `evidencia/h1-test-dirigido.txt` |
| H1.S1.M5 | `GET medication-requests/:id/attachments`, `allergy-intolerances/:id/attachments`, `encounters/:id/attachments` (`PATIENT` en el handler): 404 antes de autorizar, `assertPuedeLeerHistoria` con el paciente de la fila, `FilesService.listLinkedFilesOf` | `corepack yarn test --testPathPatterns="clinical\|chart\|forms\|surveys\|files.service"` | PASS · `evidencia/test-dirigido.txt` |
| H1.S2.M1 | El prescriptor sale de la sesión en `prescribe()` y `editDraft()`: otro perfil → 403 sin fila; sin perfil profesional → 403; `SUPERADMIN` pasa | `corepack yarn test --testPathPatterns="medications.service"` | PASS · `evidencia/h1-test-dirigido.txt` |
| H1.S2.M2 | `indicationText` (≤ 200; 201 → 400) en alta y edición, excluyente con `indicationConditionId` (gana el concepto), en entidad, snapshot, `replace`, `renew` y `MedicationRequestItemDto` | `corepack yarn test --testPathPatterns="medications.service\|clinical-read.service\|medication.dto"` | PASS · `evidencia/h1-test-dirigido.txt` |
| H2.S1.M1 | D-B (opción A, `clinical.patient_reported_health_statements`) y N-09 (sin `custodian_tenant_id`) registradas como PROPUESTA | `grep -n "D-B" docs/progress/DECISIONS.md` | [`DECISIONS.md`](../../progress/DECISIONS.md) |
| H2.S1.M2 | Entidad, repositorio, DTO, `MedicalAspectsService` (titular por vínculo de cuenta; UPSERT parcial; `''` borra; sin perfil → 403; sin PHI en logs) y `ClinicalMedicalAspectsController` (`GET|PUT /clinical/me/medical-aspects`, sin `@Roles`), publicado en `ClinicalModule` y exigido por `clinical.module.spec.ts` | `corepack yarn test --testPathPatterns="medical-aspects\|clinical.module"` | PASS · `evidencia/h2-test-dirigido.txt` |
| H3.S1.M1 | `authorProfileId` opcional en `CreateNoteDto`/`AddVersionDto`/`AmendNoteDto`; `ChartNotesService` y `ChartCarePlansService` resuelven el autor por sesión (otro → 403 sin crear; sin perfil → 403; `SUPERADMIN` pasa) | `corepack yarn test --testPathPatterns="chart-notes.service\|chart-care-plans.service"` | PASS · `evidencia/h3s1-test-dirigido.txt` |
| H3.S1.M2 | CL-33 registrada como PROPUESTA (DELETE prohibido + UPDATE sólo desde DRAFT en `clinical_note_versions`; UPDATE/DELETE prohibidos en firmas y eventos de liberación; consecuencia sobre `cosignVersion`) | `grep -n "CL-33" docs/progress/DECISIONS.md` | [`DECISIONS.md`](../../progress/DECISIONS.md) |
| H3.S1.M3 | `getPatientSummary` recibe al actor y asienta la lectura en `audit.data_access_log` (`ACTION_READ`, `PATIENT_CLINICAL_SUMMARY`, `TREATMENT`) en el mismo `EntityManager`, antes de devolver, fail-closed, sólo identificadores; `DataAccessLogRepository` provisto en `ClinicalModule` | `corepack yarn test --testPathPatterns="clinical-read.service"` | PASS · `evidencia/h3s1-test-dirigido.txt` |
| H3.S2.M1 | D-D registrada como PROPUESTA (a: value set local por campo), con la corrección «`options` no se ignora: da 400» | `grep -n "D-D" docs/progress/DECISIONS.md` | [`DECISIONS.md`](../../progress/DECISIONS.md) |
| H3.S2.M2 | `forms`: `PATCH /forms/assignments/:id`, `DELETE /forms/assignments/:id` (baja lógica, concepto `FORMS_ASSIGNMENT_RETIRED`), `PUT /forms/assignments/order`, `PATCH /forms/field-definitions/:id` (name/dataType; tipo con valores → 409); sólo lo propio del tenant (estándar → 403); gobierno sin techo; una transacción por caso | `corepack yarn test --testPathPatterns="forms"` | PASS · `evidencia/h3s2-test-dirigido.txt` |
| H3.S2.M3 | `surveys`: `PATCH :id`, `PATCH :id/questions/:questionId`, `DELETE :id/questions/:questionId` (renumera), `PUT :id/questions/order` (parcial conserva; ajeno → 422); todas 200 `{ok:true}`, `loadOwnedTemplate`, 422 sobre publicada (`loadDraftVersion` compartida con `addQuestion`) | `corepack yarn test --testPathPatterns="surveys"` | PASS · `evidencia/h3s2-test-dirigido.txt` |

### Cierre (C.1–C.6)

| ID | Estado | Evidencia |
|---|---|---|
| C.1 typecheck | HECHO · exit 0 | `evidencia/typecheck.txt` |
| C.2 lint | HECHO · exit 0 (tras prettier sobre los archivos del carril; 42 avisos de formato corregidos, sin cambios de comportamiento) | `evidencia/lint.txt` |
| C.3 specs dirigidos de los módulos tocados | HECHO · 90 suites / 1168 pruebas, 0 fallos | `evidencia/test-dirigido.txt` |
| C.4 este reporte | HECHO | — |
| C.5 PR contra `test` mergeable | **HECHO** · PR #473 · `MERGEABLE` · `CLEAN` · `isDraft=false` · sin checks reportados (runners propios apagados) · consultado tras el push `ba7ff18b` · **mergeado en `test`** (`f5c8c11c`, `Jsaldias39`) | `evidencia/pr-mergeable.txt` |
| C.6 daily de M3 y de máquinas en el PM | **A MEDIAS** · ver §«A medias» | rama pusheada en `AlovidaPromptManager` |

## A medias

### C.6 — Daily de M3 y Daily de máquinas en el Prompt Manager
- Qué anda: el daily de M3 y la fila de M3 en `Daily-Maquinas-2026-09-26.md` están actualizados (hitos, bitácora, salida de la instalación, pedidos) en la rama `justin/m3-daily-2026-09-26` de `AlovidaPromptManager`, pusheada.
- Qué no anda: el PR contra `main` del PM no está abierto, por la misma denegación (`gh pr create` bloqueado por el clasificador del modo automático; el propietario abrió a mano el de la API).
- Qué falta exactamente: `gh pr create --base main --head justin/m3-daily-2026-09-26` en `AlovidaPromptManager`.
- Dónde quedó: `AlovidaPromptManager`, rama `justin/m3-daily-2026-09-26`, con el PR #473 y su estado ya anotados.

## Pendiente

Nada del encargo quedó sin empezar. Lo que sigue **no era de este carril** y se deja escrito para que no se pierda:

| Qué | Estado | Qué lo destraba / de quién es |
|---|---|---|
| DDL de las tres piezas nuevas (`allergy_intolerances.encounter_id`, `medication_requests.indication_text`, tabla `patient_reported_health_statements`) | `TODO` en el modelo | M1, con los pedidos de abajo. **Este PR no se despliega antes** (ver riesgos) |
| Barrera WORM del módulo 15 (CL-33) y el cambio de `cosignVersion` para que no mute la versión firmada | `TODO` (decisión PROPUESTA) | propietario decide; M1 regenera; el código de la cofirma es de un carril de `chart` posterior (BR-13) |
| `GET /charts/notes/:noteId/versions` (historial, CL-32) | `TODO` | BR-13, fuera de las 13 microtareas de M3 |
| Copiar las preguntas al abrir una versión nueva de encuesta (CL-70) | `TODO` | BR-19, fuera del encargo |
| Bloque «declarado por el paciente» en el resumen del médico (BR-12 §4) | `TODO` | requiere D-B confirmada; el front no lo consume todavía |
| IDOR preexistente del listado genérico para `CONDITION` y `PROCEDURE` | `TODO` (observación) | dueño de `common/files`; ver §«Observaciones fuera de alcance» |
| `@Roles` en `POST /forms/field-definitions`, `POST /forms/fields/:id/dependencies`, `PUT /forms/fields/:id/localizations/:lang` (CL-68) | `TODO` | M2 (única que edita `@Roles` de endpoints existentes) |
| Los cinco catálogos de alergia (fuente clínica con procedencia) | `TODO` | M1 + equipo clínico; **no se inventan** |
| Front: listar/adjuntar por las rutas clínicas, `encounterId` en el tipo, docs de pendientes | `TODO` | M5 (ver §«Contrato para el front») |

## Evidencia

Índice de `evidencia/` (comandos y su salida literal, recortada, nunca parafraseada):

| Archivo | Qué es |
|---|---|
| `baseline-typecheck.txt`, `baseline-lint.txt`, `baseline-test-dirigido.txt` | Línea base sobre `origin/test` @ `016caaa1` antes de tocar nada: typecheck 0, lint 0, 10 suites / 174 pruebas |
| `h1-typecheck.txt`, `h1-test-dirigido.txt` | Tras H1: typecheck 0; 19 suites / 515 pruebas |
| `h2-typecheck.txt`, `h2-test-dirigido.txt` | Tras H2: typecheck 0; 2 suites / 12 pruebas |
| `h3s1-typecheck.txt`, `h3s1-test-dirigido.txt` | Tras H3.S1: typecheck 0; 9 suites / 124 pruebas |
| `h3s2-typecheck.txt`, `h3s2-test-dirigido.txt` | Tras H3.S2: typecheck 0; 12 suites / 207 pruebas |
| `typecheck.txt`, `lint.txt`, `test-dirigido.txt` | **Finales, posteriores al último edit**: typecheck 0, lint 0, 90 suites / 1168 pruebas |
| `diff-stat.txt` | `git diff --stat origin/test` del carril |
| `pr-mergeable.txt` | Estado del PR consultado con `gh` tras el último push (ver §«Entrega») |

```text
$ corepack yarn typecheck   # final
exit=0

$ corepack yarn lint   # final
exit=0

$ corepack yarn test --testPathPatterns="clinical|chart|forms|surveys|files.service"   # final
Test Suites: 90 passed, 90 total
Tests:       1168 passed, 1168 total
exit=0
```

Dos fallos aparecieron durante el carril y se clasificaron antes de tocar nada (regla 80.4), los dos `TEST_BUG` de mis propios specs nuevos, ninguno de producto: (1) `medications.service.spec` — el doble por defecto de `conditionsRepo.findById` devolvía una condición de `patient-1` y mis casos usaban `p1` (422 esperado por el propio servicio); (2) `forms-fields.service.spec` — el caso «quien gobierna» usaba el actor `USER` del archivo en vez de un `SECURITY_ADMIN`. Se corrigió la fixture, no el requisito.

## No cubierto

Lo que se hizo pero **no se probó**, y que le toca correr a M1 con base y API vivas:

1. **Ningún camino se ejercitó contra la API viva ni contra Postgres.** Todos los 200/201/403/404/409/422 salen de unitarias con `EntityManager` mockeado y de `class-validator` sobre los DTO reales. Persistencia, constraints, RLS, `@Version()` y transacciones reales: sin cubrir.
2. **Las tres columnas/tabla nuevas no existen en el DDL** hasta que M1 regenere el modelo. Las entidades ya las mapean, así que **con este PR desplegado sin el patch, MikroORM incluye `encounter_id` e `indication_text` en todo `SELECT`/`INSERT` de alergias y recetas, y la ruta de aspectos médicos referencia una tabla ausente → 500**. El arranque con `ORM_SCHEMA_SYNC=dry-run` lo reporta como `columna-ausente`/`tabla-ausente`. Orden obligatorio: patch de M1 (expand) → este PR.
3. **Rutas montadas**: no se arrancó la API, así que no hay `Mapped {…}` en el log. El registro del controlador nuevo lo exige `clinical.module.spec.ts`; las rutas agregadas a controladores ya registrados no tienen ese riesgo.
4. **Semilla de los conceptos nuevos** (`common:owner-type:{medication-request,allergy-intolerance,encounter}`, `FORMS_ASSIGNMENT_RETIRED`) en el arranque: el seed recorre `CONCEPT_DEFS` y `FORMS_CONCEPT_SEEDS` enteros, pero no se observó.
5. **`PATIENT` a nivel de handler en un controlador con `@Roles` de clase**: `RolesGuard` usa `getAllAndOverride([handler, class])` (`roles.guard.ts:26-29`), así que manda el del handler; no ejercitado en runtime.
6. **Matriz negativa con `curl`** (sin token 401, paciente 403, médico sin relación 403, recurso inexistente 404) por rol real: sólo unitarias.
7. **N-09**: cómo resuelve hoy el GUC de tenant una sesión de paciente sin tenant (`test/integration/rls.int-spec.ts`) — no se corrió.
8. **El PDF de receta** no imprime `indicationText` bajo «Diagnóstico» (BR-10 §4): fuera de las microtareas; sólo se persiste y se lee.

## Desvíos del plan

| Desvío | Por qué | Cómo se verificó |
|---|---|---|
| Se agregó **H1.S1.M4** (el listado genérico rechaza los tres tipos clínicos) | BR-11 §1.C: sumar tipos clínicos a un listado sin actor amplía el IDOR; `security-guardrails` manda sobre la conveniencia | `files.service.spec` (`it.each` de los tres tipos → 403 sin leer) |
| Se agregó **H1.S1.M5** (las rutas clínicas de lectura de adjuntos) | Al cerrar M4 el front se quedaba sin forma de listar; la mitad «rechazar» sin la mitad «ruta clínica» no es un contrato | specs de los tres servicios (404 → política → `listLinkedFilesOf`) |
| Se tocaron tres archivos de `common` (`dto/enums.ts`, `constants/concepts.ts`, `services/files.service.ts`) fuera del IN literal del encargo | Sin `OwnerType`/`CONCEPTS.OWNER_*` los adjuntos no existen (`createLink` rompe en runtime); declarado en el plan como IN por necesidad | typecheck + `files.service.spec` |
| Se tocó `docs/trabajo/2026-09-25-auditoria-produccion-backend/reproducciones.spec.ts` (carril ajeno): un `{} as any` más | Instancia `EncountersService` con 7 argumentos y `tsc` incluye ese spec; sin el 8.º (`FilesService`) el typecheck del repo queda en rojo. Cumple las cinco condiciones de `scope-discipline` §4 | `evidencia/typecheck.txt` |
| `PATCH /forms/field-definitions/:id` no estaba nombrado en la microtarea («editar, quitar y ordenar») | El generador (`form-builder.ts:710`) llama primero a esa ruta al renombrar/cambiar tipo y hoy da 404: sin ella «editar» no funciona | `forms-fields.service.spec` + `forms-controllers.spec` |
| `PATCH /surveys/templates/:id` (CL-72) incluido en H3.S2.M3 | Es la ruta 1 del contrato de `docs/pendientes-backend-surveys.md`, que el cliente ya implementa; dejar tres de cuatro deja el contrato a medias | `surveys-templates.service.spec` |
| Un solo PR para los tres hitos, con un commit por hito | Los tres tocan `docs/progress/DECISIONS.md`; tres PRs contra `test` se pisarían ahí. M1 mergea uno | — |

## Riesgos residuales

| Riesgo | Impacto | Mitigación |
|---|---|---|
| **Orden de despliegue**: este PR antes del patch de M1 rompe alergias, recetas y aspectos médicos en runtime (500) | alto; ver «No cubierto» 2 | el PR lo dice en su cuerpo; M1 mergea después del patch; `ORM_SCHEMA_SYNC=dry-run` lo caza antes de servir tráfico |
| Las decisiones D-B, N-09, CL-33 y D-D están **PROPUESTAS**, no confirmadas | si el propietario elige otra opción, H2 se rehace (tabla) y las opciones de formularios cambian de forma | todo lo construido contra la propuesta está aislado (entidad, repo, servicio, controlador propios) y es reversible |
| `PUT /clinical/me/medical-aspects` sin versión del cliente: entre dos pestañas gana la última escritura | pérdida silenciosa de una sección | registrado en D-B; agregar `expectedRowVersion` opcional es un cambio compatible |
| El seed de conceptos nuevos no se observó | `createLink` con `OWNER_*` sin concepto → error en runtime | M1 verifica en el arranque (punto 4 de «No cubierto») |
| `RolesGuard` con `PATIENT` a nivel de handler | si la precedencia no fuera la leída, el titular no listaría sus adjuntos (403), no habría fuga | runtime de M1; `roles.guard.ts:26-29` leído |

## Decisiones y ambigüedades

Las cuatro del encargo se **registraron**, no se resolvieron por conveniencia; están en
[`docs/progress/DECISIONS.md`](../../progress/DECISIONS.md) con opciones, evidencia y quién confirma:

| ID | Qué se propuso | Qué se construyó contra la propuesta | Confirma |
|---|---|---|---|
| Q-01 · D-B | Tabla propia `clinical.patient_reported_health_statements`, una fila por titular | entidad, repo, DTO, servicio, controlador; sin DDL | propietario + modelo |
| Q-02 · D-D | (a) value set local por campo | nada del modelo; `PATCH field-definitions` sólo `name`/`dataType` | propietario + modelo |
| Q-03 · CL-33 | DELETE prohibido + UPDATE sólo desde DRAFT en `clinical_note_versions`; UPDATE/DELETE prohibidos en firmas y liberaciones | nada (cofirma sin UPDATE queda pendiente en BR-13) | propietario + M1 |
| Q-04 · N-09 | La declaración del paciente no lleva `custodian_tenant_id`; excepción declarada a la RLS | la entidad no tiene la columna | propietario / M1 |

Supuestos técnicos tomados y dónde se dejaron escritos: prescriptor/autor «en nombre de» sólo para `SUPERADMIN` (mismo criterio que `assertFirmaConPerfilPropio`); `indicationText` vacío o en blanco no se guarda como `''`; `''` borra un aspecto médico (contrato del front); una lista parcial de reorden conserva las no nombradas al final (contrato de `pendientes-backend-surveys.md`, aplicado igual a `forms`).

## Pedidos a M1 (modelo, DDL y runtime)

Todo empieza en `mantra-core-health-model` (`.puml` → `gen_ddl.py` → `SQL/` + patch → `yarn db:vendor` en la API, **sólo después de cerrar H-2 del reparto**). Nada de esto se escribió en `database/SQL` de la API.

1. **`clinical.allergy_intolerances.encounter_id`** — `uuid` nullable, FK → `clinical.encounters(id)`, índice `ix_allergy_intolerances_encounter_id (encounter_id) BTREE`, relación `encounters ||--o{ allergy_intolerances` junto a las de `diagram_08_clinical.puml:283-287`. Comentario: «encuentro en que se detectó; nullable: hay alergias declaradas fuera de una atención». Patch para bases vivas.
2. **`clinical.medication_requests.indication_text`** — `varchar(200)` nullable, en `entity medication_requests` (`diagram_08_clinical.puml:316`), comentario «excluyente con `indication_condition_id`; gana el concepto» (mismo criterio que `occupation_free_text` en `persons`). Patch para bases vivas.
3. **`clinical.patient_reported_health_statements`** (D-B, si se confirma A) — `id uuid PK`, `patient_profile_id uuid NOT NULL UNIQUE` FK → `profiles.patient_profiles(profile_id)`, `blood_type_text varchar(20)`, `allergies_text text`, `chronic_conditions_text text`, `current_medications_text text`, `surgeries_text text`, `family_history_text text`, `habits_text text` (todos nullable), `created_at`, `updated_at`, `created_by_user_id`, `updated_by_user_id`, `row_version int DEFAULT 1`. **Sin `custodian_tenant_id`** (N-09). Índice único con nombre explícito. Comentario «declarado por el titular, no verificado». `gen_seeds.py`: `INTENTIONALLY_EMPTY`. Patch para bases vivas.
4. **Matriz de integridad (CL-33, si se confirma)** — en `diagram_33_integrity.puml`: `chart.clinical_note_signatures` y `chart.note_release_events` con `UPDATE_DELETE : forbidden`; `chart.clinical_note_versions` con DELETE prohibido y UPDATE permitido sólo si `OLD.status_concept_id` es DRAFT (capacidad nueva de `gen_integrity.py`, patrón v4.0.10) → `SQL/15_chart/05_constraints.sql` generado.
5. **Cinco catálogos de alergia** (`substance`, `type`, `category`, `criticality`, `manifestation`): hoy `src/common/seed/dynamic-enum-catalog.ts` no declara ningún target `clinical.allergy_*`. Necesitan **fuente clínica con procedencia** (subconjunto SNOMED CT u otro que apruebe el equipo clínico). No se inventan; para la evidencia de runtime se usa una sustancia del vademécum.
6. **Al arrancar**: verificar que el seed inserte los conceptos nuevos (`common:owner-type:medication-request`, `…:allergy-intolerance`, `…:encounter` en `CONCEPT_DEFS`; `FORMS_ASSIGNMENT_RETIRED` en `FORMS_CONCEPT_SEEDS`), y que `ORM_SCHEMA_SYNC=dry-run` no reporte `columna-ausente`/`tabla-ausente` para las piezas 1–3.
7. **Runtime a ejercitar** (lo de «No cubierto»): alergia desde «Atención» con `encounterId` → 201 → `SELECT encounter_id FROM clinical.allergy_intolerances WHERE id = …`; receta con «Otro motivo» sin `prescriberProfileId` → 201 → `SELECT prescriber_profile_id, indication_text …`; `PUT /clinical/me/medical-aspects` → fila; tres adjuntos a una receta → 201 × 3 → `common.file_links` con `OWNER_MEDICATION_REQUEST`; `GET /clinical/patients/:id/summary` → fila en `audit.data_access_log`; `curl` de la matriz negativa.

## Pedidos a M2 (roles)

1. **CL-68**: `POST /forms/field-definitions`, `POST /forms/fields/:id/dependencies` y `PUT /forms/fields/:id/localizations/:lang` siguen sin `@Roles` (cualquier sesión, incluido `PATIENT`, declara campos globales y reescribe etiquetas del estándar). Propuesta: `@Roles('CLINICIAN','PRACTITIONER','SECURITY_ADMIN')` en las tres; localizar campos del estándar sólo `SECURITY_ADMIN` (regla en el servicio). **No se tocó**: son endpoints existentes.
2. Las rutas **nuevas** de este carril ya llevan sus roles: `PATCH/DELETE /forms/assignments/:id`, `PUT /forms/assignments/order`, `PATCH /forms/field-definitions/:id` → `CLINICIAN, PRACTITIONER, SECURITY_ADMIN`; `GET …/:id/attachments` clínicos → `CLINICIAN, PRACTITIONER, PATIENT`; `clinical/me/medical-aspects` sin `@Roles` (patrón `forms/me`).

## Contrato para el front (M5)

Lo que cambia del lado de la API y el front todavía no usa:

| Antes | Ahora |
|---|---|
| `GET /common/files/links?ownerType=MEDICATION_REQUEST\|ALLERGY_INTOLERANCE\|ENCOUNTER` (400 hoy) | `GET /clinical/medication-requests/:id/attachments`, `GET /clinical/allergy-intolerances/:id/attachments`, `GET /clinical/encounters/:id/attachments` → `LinkedFilePageDto`; el genérico responde **403** para esos tres tipos |
| `POST /common/files/:id/links { ownerType: 'ENCOUNTER' }` (400 hoy) | `POST /clinical/encounters/:id/attachments { fileId }` → 201 |
| `POST /clinical/medication-requests/:id/attachments`, `POST /clinical/allergy-intolerances/:id/attachments` (404 hoy) | existen → 201 `FileLinkResponseDto` |
| `NewAllergyIntolerance` sin `encounterId` en el tipo (viaja por spread) | declararlo: `encounterId?: string`; la lectura devuelve `encounterId` en la alergia |
| `authorProfileId` / `prescriberProfileId` obligatorios o inventados por el mock | opcionales; si viajan con el propio perfil se confirman, con otro → 403 |
| `docs/pendientes-backend-surveys.md` «el backend todavía no» | las cuatro rutas existen con el contrato del doc; `docs/pendientes-backend-formularios.md` «se ignoran» → **400** (D-D) |

## Observaciones fuera de alcance

```text
OBSERVACIÓN (fuera de alcance)
Qué:       GET /common/files/links no recibe al actor ni tiene @Roles: cualquier sesión lista los adjuntos de cualquier CONDITION o PROCEDURE por id (IDOR preexistente, BR-11 §1.C).
Dónde:     src/modules/common/controllers/common-files.controller.ts:106-111 · src/modules/common/services/files.service.ts (listLinkedFiles)
Evidencia: lectura del controlador y del servicio; los tres tipos NUEVOS quedaron cerrados (403) en este carril, los dos preexistentes no.
Impacto:   fuga de nombres de archivo/metadatos clínicos por id adivinado, para dos tipos.
Sugerido:  mismo cierre que acá — GET /clinical/conditions/:id/attachments y procedures/:id/attachments con assertPuedeLeerHistoria, y el genérico rechazándolos — en un carril del dueño de common/files.
```

```text
OBSERVACIÓN (fuera de alcance)
Qué:       cosignVersion vuelve a actualizar statusConceptId y releaseEligibilityConceptId de una versión ya firmada (CL-33, mitad de código).
Dónde:     src/modules/chart/services/chart-notes.service.ts (cosignVersion)
Evidencia: lectura; registrado en DECISIONS.md § CL-33 punto 3.
Impacto:   con la barrera WORM propuesta aplicada, la cofirma fallaría en la base.
Sugerido:  BR-13: la cofirma inserta en clinical_note_signatures y releaseVersion deriva «cofirmada» de las firmas.
```

## Entrega

- Commits en la rama, uno por hito más plan, formato y reporte: `9e3731aa` (plan + decisiones) · `1356cc39` (H1) · `741ed19d` (H2) · `1f18b25b` (H3.S1) · `1965fb95` (H3.S2) · `b9a90110` (prettier + plan) · `c1174f59` (H1.S1.M5) · `6406d4f3` (reporte). Rama pusheada: `origin/justin/test-m3-api-clinica-2026-09-26`.
- PR contra `test`: **#473** — https://github.com/mdavila-2001/mantra-core-health-api/pull/473 — abierto por el propietario con el comando de `evidencia/pr-body.md`; consultado tras el push `ba7ff18b`: `MERGEABLE` · `CLEAN` · `isDraft=false` · sin checks reportados (runners propios apagados). **MERGEADO en `test`** por `Jsaldias39` el 2026-09-26 07:05 UTC, merge `f5c8c11c` (`origin/test` @ `f5c8c11c` contiene `ba7ff18b`). Este commit de cierre (`ffe4ee22`+) es sólo documentación y quedó **en la rama, no en `test`**; si se quiere en `test`, va en un PR de docs aparte.
- **`test` ya tiene el código de M3 y todavía no tiene el DDL de M1**: hasta que entren `encounter_id`, `indication_text` y la tabla D-B, **no desplegar `test`** (alergias, recetas y aspectos médicos responderían 500). Ver «Riesgos residuales» y «Pedidos a M1».
- Procesos que quedaron corriendo al cerrar: ninguno.
