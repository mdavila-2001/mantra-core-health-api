<!-- Cuerpo del PR contra `test`. Para abrirlo desde el worktree:
     gh pr create --base test --head justin/test-m3-api-clinica-2026-09-26 --reviewer jsaldias39,PabloArauzCaballero --body-file docs/trabajo/2026-09-26-m3-api-clinica/evidencia/pr-body.md --title "M3 · API clínica sin base: alergia con encuentro, prescriptor y autor por sesión, aspectos médicos, adjuntos, auditoría de lectura, editor de formularios y encuestas"
     y después: gh pr view <n> --json number,url,isDraft,mergeable,mergeStateStatus > docs/trabajo/2026-09-26-m3-api-clinica/evidencia/pr-mergeable.txt -->

Carril **M3 · Dell Inspiron 1 · API clínica sin base** del reparto de preproducción `test` (2026-09-26, seis máquinas). Rama desde `origin/test` @ `016caaa1`. **Peldaño: `TESTED`** (unitarias con `EntityManager` mockeado + `class-validator` sobre los DTO reales). No es `VERIFIED`: nada se ejercitó contra la API viva ni contra Postgres; lo que le falta correr a M1 está en el reporte.

- Plan: `docs/trabajo/2026-09-26-m3-api-clinica/PLAN.md` · Reporte: `docs/trabajo/2026-09-26-m3-api-clinica/REPORTE.md` · Evidencia: `docs/trabajo/2026-09-26-m3-api-clinica/evidencia/`
- Decisiones registradas (PROPUESTA, no tomadas): `docs/progress/DECISIONS.md` — D-B, N-09, CL-33, D-D.

## ⚠️ Orden de despliegue — leer antes de mergear

Tres piezas del modelo **no existen todavía en el DDL** y las entidades ya las mapean:
`clinical.allergy_intolerances.encounter_id`, `clinical.medication_requests.indication_text` y la tabla `clinical.patient_reported_health_statements`. Con este PR desplegado **sin el patch de M1**, MikroORM incluye esas columnas en todo `SELECT`/`INSERT` de alergias y recetas → 500. Orden obligatorio: patch de M1 (expand) → este PR. El arranque con `ORM_SCHEMA_SYNC=dry-run` lo reporta como `columna-ausente`/`tabla-ausente`. Los pedidos exactos para el modelo están en el reporte, sección «Pedidos a M1». No se escribió DDL en este repo.

## Qué entra (15/15 microtareas; un commit por hito)

**H1 — la receta y la alergia dejan de rebotar con 400**
- CL-01 / P26: `CreateAllergyIntoleranceDto` declara `encounterId`; el servicio exige que el encuentro sea del mismo paciente (422); se persiste y se proyecta. Kill-test: el cuerpo literal de `allergy-block.ts:243-258` valida.
- CL-02 (BR-10): el prescriptor sale de la sesión en `prescribe()`/`editDraft()`; otro perfil → 403 sin fila; sin perfil → 403; `SUPERADMIN` pasa.
- CL-03 / P24: `indicationText` (≤200) en alta y edición, excluyente con `indicationConditionId` (gana el concepto); en snapshot, `replace`, `renew` y lectura.
- CL-05 / P25: `OwnerType.MEDICATION_REQUEST|ALLERGY_INTOLERANCE|ENCOUNTER` + `CONCEPTS.OWNER_*`; `POST` y `GET …/:id/attachments` para receta, alergia y encuentro (404 → política de la historia → `FilesService`). El genérico `GET /common/files/links` responde 403 para esos tres tipos (BR-11 §1.C: no ampliar el IDOR).

**H2 — el paciente declara y lee sus aspectos médicos**
- `GET|PUT /clinical/me/medical-aspects` (sin `@Roles`, titular por vínculo de cuenta; UPSERT parcial: ausente = no tocar, `''` = borrar; sin perfil de paciente → 403; sin PHI en logs), contra la propuesta D-B. `clinical.module.spec.ts` exige el controlador.

**H3 — notas, formularios y encuestas**
- CL-20 / CL-29 (BR-13): `authorProfileId` opcional; el autor de nota, versión, enmienda y plan sale de la sesión (otro → 403).
- N-04: `getPatientSummary` asienta la lectura en `audit.data_access_log` (fail-closed, sólo identificadores).
- CL-61 / CL-69 (BR-18): `PATCH|DELETE /forms/assignments/:id`, `PUT /forms/assignments/order`, `PATCH /forms/field-definitions/:id` (name/dataType; tipo con valores → 409); sólo lo propio del tenant; baja lógica con `FORMS_ASSIGNMENT_RETIRED`.
- CL-60 / CL-72 (BR-19), contrato de `docs/pendientes-backend-surveys.md`: `PATCH :id`, `PATCH|DELETE :id/questions/:questionId`, `PUT :id/questions/order`; 422 sobre publicada; `DELETE` renumera.

## Compuertas (finales, posteriores al último edit)

```text
$ corepack yarn typecheck  → exit 0
$ corepack yarn lint       → exit 0
$ corepack yarn test --testPathPatterns="clinical|chart|forms|surveys|files.service"
Test Suites: 90 passed, 90 total
Tests:       1168 passed, 1168 total
```

Baseline sobre `origin/test` antes de tocar: typecheck 0, lint 0, 174 specs dirigidos en verde.

## Fuera de alcance, registrado

Cofirma sin UPDATE y `GET :noteId/versions` (BR-13); copia de preguntas al abrir versión (CL-70); bloque «declarado por el paciente» en el resumen; IDOR preexistente del genérico para `CONDITION`/`PROCEDURE`; `@Roles` en `POST /forms/field-definitions` y hermanas (CL-68 → M2); los cinco catálogos de alergia (fuente clínica pendiente). Desvíos declarados en el reporte (tres archivos de `common` y un `{} as any` en un spec de otro carril que instancia `EncountersService`).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
