# Plan — Un médico solo ve las prácticas donde tiene una vinculación ACTIVE

- Fecha: 2026-10-23 · Repos afectados: `mantra-core-health-api` · Predecesor: auditoría contra la API real del 2026-10-23 (en el front ya se filtró solo la contabilidad)
- Resultado observable: un `PRACTITIONER` sin vinculación ACTIVE con una práctica no la ve en `GET /practices` y recibe 404 en `GET /practices/:practiceId/organization` (ficha, plantilla, legajo, inventario).
- Kill-test: con un médico recién registrado en `DEFAULT`, hacer `GET /practices/<id de práctica ajena>/organization` y verificar que no responda 200.

> **Desvío declarado:** este plan se escribió **después** del código. El `AGENTS.md` del repo pide escribirlo antes, y la sesión no lo leyó a tiempo. El contenido refleja el alcance que se usó de hecho.

## Alcance

- IN: las lecturas de `practice` que alcanzan a `PRACTITIONER` (`GET /practices`, `GET /practices/:id/organization`); una regla de acceso compartida; que las tres copias de la regla en contabilidad usen esa regla sin cambiar su comportamiento; tests unitarios; un int-spec; OpenAPI regenerado; `docs/api/authorization.md`.
- OUT: módulo `insurance` (hay otra sesión trabajando en él); el front; DDL y migraciones (ADR-0021); lecturas de `practice` que no admiten `PRACTITIONER` en `@Roles`; `GET /practitioners/:profileId/sites` (lista dónde atiende un profesional, abierta a pacientes por diseño).
- Ambigüedades registradas:
  - ¿403 o 404 para una práctica no permitida? Supuesto: **404**, el patrón de `PracticeOrganizationReadService` y del int-spec H6 (no revelar qué ids existen). A confirmar con Justin en la revisión.
  - ¿Un `PRACTITIONER` sin `practitionerProfileId` en el token? Supuesto: no ve ninguna práctica (falla cerrado). Contabilidad, en cambio, responde 422.

## H1 — Las lecturas de práctica respetan la vinculación del médico

**CA:** Dado un médico en `DEFAULT` sin vinculación ACTIVE con la práctica P, cuando pide la lista o la consola, entonces P no aparece en la lista y la consola responde 404. Con vinculación ACTIVE la ve. El admin ve todo.
**DoD:** `yarn test --testPathPatterns='src/modules/(practice|accounting)/'` en verde; `yarn typecheck` con salida 0; `yarn lint --max-warnings=0` con salida 0; int-spec contra Postgres.
**Estado:** A MEDIAS (el int-spec no se corrió)

### H1.S1 — Regla con un solo dueño

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | `practiceAccessScope` + `PracticeAccessService` | admin y aprobador contable → todo; quien no es PRACTITIONER → sin filtro; PRACTITIONER → solo vinculaciones ACTIVE | `jest practice-access.service.spec` → verde | HECHO |
| H1.S1.M2 | Contabilidad (3 servicios) usa `practiceAccessScope` | sus specs pasan sin modificarse | `jest src/modules/accounting/` → verde | HECHO |

### H1.S2 — Endpoints

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S2.M1 | `GET /practices` filtra para PRACTITIONER | ACTIVE ve; PENDING o sin vinculación no ve; admin ve todas | `jest practice-sites.service.spec` → verde | HECHO |
| H1.S2.M2 | `GET /practices/:id/organization` responde 404 sin vinculación | 404 sin leer sub-recursos; ACTIVE ve; admin ve | `jest practice-organization-read.service.spec` → verde | HECHO |
| H1.S2.M3 | El controlador pasa el actor a ambos | se llama con `(tenant, actor)` | `jest practice.controllers.spec` → verde | HECHO |
| H1.S2.M4 | Int-spec de punta a punta | sin vinculación 404 → PENDING 404 → ACTIVE 200; admin ve | `yarn test:integration --testPathPatterns=practice-ownership` → verde | BLOQUEADO |

### H1.S3 — Gates y documentación

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S3.M1 | Typecheck | salida 0 | `yarn typecheck` → `TYPECHECK_EXIT=0` | HECHO |
| H1.S3.M2 | Lint | salida 0 | `yarn lint --max-warnings=0` → `LINT_EXIT=0` | HECHO |
| H1.S3.M3 | OpenAPI regenerado | el diff solo cambia la descripción de `GET /practices` | `node tools/openapi/generate-openapi.mjs` + `git diff --stat openapi/` | HECHO |
| H1.S3.M4 | `docs/api/authorization.md` | la sección describe la regla | lectura | HECHO |
| H1.S3.M5 | Suite completa | sin fallos nuevos atribuibles al cambio | `yarn test` | HECHO |

## Riesgos y bloqueos previstos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Sin Postgres en la nube | el int-spec no se puede correr | declararlo NO corrido; correrlo en CI o en local |
| `repo.yarnpkg.com` y `cdn.sheetjs.com` bloqueados | `corepack yarn` falla; no se puede instalar `xlsx@0.20.3` | yarn 4.14.1 desde npm; `xlsx@0.18.5` solo en local, sin commitear |
| Un médico con consultorio propio deja de verlo | regresión funcional | `OwnSiteProvisioningService` crea la vinculación ACTIVE (`own-site-provisioning.service.ts`) |
