# Plan — Hito 4 (API): cierre de brechas críticas P0/P1 (aseguradora, verificación C3, dependientes)

- Fecha: 2026-10-01 · Repos afectados: `mantra-core-health-api` (único) · Predecesor: Hito 3 (PR #527, mergeado)
- Rama: `marcelo/feat-brechas-criticas-backend-h4` desde `origin/dev` (`502dcbf7`). Reviewers: `jsaldias39`, `PabloArauzCaballero`.
- Resultado observable: `compare_mock_api.py` pasa 9 de las 11 rutas del Hito 4 de `Missing in Backend` a `Matched` (las 2 de factura quedan bloqueadas por decisión de modelo, D2) y cada una responde con el contrato que ya consume el front.
- Kill-test: el script de comparación sigue listando alguna de las 9 rutas, o dictaminar dos veces el mismo reclamo no responde 409 con `details.reason = ALREADY_DECIDED`.

## Hechos que cambian el plan (descubrimiento, peldaño DISCOVERED)

1. Pablo ya escribió los bloques de dependientes (PR #493, commit `20bad55b`, rama `origin/pablo/api-dependientes-2026-09-26`) y de verificación C3 (PR #495, commits `ddfa24a5` + `11f186b0`, rama `origin/pablo/api-rutas-faltantes-2026-09-26`). Se mergearon a `test` el 27/09, pero la reconciliación del Hito 1 (PR #520) no los trajo: `origin/test` no los contiene. El dry-run de merge de #493 contra `origin/dev` es limpio. El tercer commit de la rama de #495 (`5ddf4ce9`, `care_plans.reason_text`) conflictúa y no es de este hito: no se trae.
2. «Dependiente» en la API es `profiles.patient_portal_proxies`; `profiles.patient_dependents` no existe en el modelo. El PR #493 modela la solicitud como apoderamiento en `PROXY_PENDING` sin DDL.
3. El filtro global serializa `{ code, message, details, correlationId, timestamp, path }`, sin `statusCode`. El 409 del contrato del front va como `ConflictException(msg, { reason })`.
4. Aseguradora: no existe ninguna ruta `received-claims`. Sí existen `ClaimsReadService.resolveScope()` (acota por `insurance_carrier_id` si el tenant activo es una aseguradora), `ClaimsService.adjudicate` (versión + líneas) y el patrón de autorización de `InsuranceAnalyticsService`. No existen: outcome `PARTIAL`, estado «rechazado» del reclamo, 409 por doble dictamen, ni factura ligada al reclamo (`billing.invoices` exige práctica y paciente, sin anulación, sin SIAT, sin outbox en insurance).
5. Ni la API ni el front crean un diagnóstico provisional: `ConditionsService.create` fija `COND_CONFIRMED` y `CreateConditionDto` no acepta el campo.
6. Jest 30: el flag es `--testPathPatterns` (plural). `yarn test [ruta]`, nunca `npx jest`. `test:integration` puede no arrancar (B-16). El job `docs` del CI ya falla en `dev` por `yarn npm audit` (EXTERNAL).

## Alcance

- IN: cherry-picks de Pablo; `patientProfileId` en la solicitud de dependiente; `GET dependent-candidates`; `POST profiles/patients/search`; alta provisional de diagnóstico; designaciones ES de conceptos nuevos; `GET /insurance/received-claims` y `POST …/:id/decision` con concepto `ADJUDICATION_PARTIAL` y evento outbox; specs en tres niveles; READMEs de módulo; injerto de las operaciones nuevas en `openapi/`, `docs/modules`, `docs/postman`; PLAN, REPORTE y evidencia; commit por rutas explícitas, push, PR con reviewers.
- OUT: modelo, bóveda y front; `POST /insurance-claims/:id/adjudications` y `ClaimsReadController`; roles nuevos en `role-mapping.ts`; cierre de notificaciones con acciones; el commit `5ddf4ce9`; la colisión de versión v4.2.32 entre modelo y API; el rojo previo de `yarn npm audit`; regenerar todo el OpenAPI; mergear el PR.
- Ambigüedades registradas (confirmadas el 2026-10-01 salvo indicación): D1 recuperar el trabajo de Pablo por cherry-pick `-x`; D2 las dos rutas de factura (`invoice/annulment`, `invoice`) quedan `BLOQUEADO · DECISION_REQUIRED` hasta que el propietario decida si la factura vive en `billing.invoices` + `billing_document_links` (con patch de anulación) o en tabla propia; el dictamen favorable publica `InsuranceClaimDecided` por outbox; D3 `ADJUDICATION_PARTIAL` como concepto dinámico de la API; D5 (sin confirmar) el estado `REVERSED` se envía como código tal cual; D6 (sin confirmar) líneas de `REJECTED` en `LINE_DECISION_DENIED` con la razón como justificación y líneas de `PARTIAL` aprobadas sin monto por línea; D7 (sin confirmar) el alta de diagnóstico acepta `COND_PROVISIONAL` o `COND_CONFIRMED` y por defecto sigue siendo `CONFIRMED`. Confirmar D5-D7 con Pablo en la revisión del PR.

## H1 — Preparación
**CA:** rama desde `origin/dev` actualizado, plan en disco antes del primer cambio de código, baselines verdes.
**DoD:** `git rev-parse HEAD` = `origin/dev`; typecheck 0; specs de los tres módulos verdes (salidas en `evidencia/`).
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Rama desde `origin/dev` | HEAD = `502dcbf7` | `git log -1 --oneline` → `502dcbf7 Merge pull request #528` | HECHO |
| H1.S1.M2 | Este PLAN antes del primer cambio de código | archivo en disco | `git status --short docs/trabajo/2026-10-01-brechas-criticas-backend-h4/PLAN.md` | HECHO |
| H1.S1.M3 | Carril registrado en `progress_state.json` | declara `hito4-brechas-criticas` | `python .claude/hooks/progress.py …` → estado actualizado | HECHO |
| H1.S1.M4 | Baselines: typecheck y specs de profiles, conditions y claims-read | exit 0 | `corepack yarn typecheck`; `corepack yarn test src/modules/profiles src/modules/clinical/services/conditions.service.spec.ts src/modules/insurance/services/claims-read.service.spec.ts` | HECHO (typecheck exit 0; 25 suites, 501 pruebas; evidencia 02 y 03) |

## H2 — Bloque C: ciclo de dependientes (6 rutas)
**CA:** Dado un paciente con cuenta, cuando pide representar a otro por CI o por el perfil elegido en los candidatos, entonces el otro ve la solicitud en `incoming`, al aceptarla aparece en `GET /profiles/patients/me/dependents` y una segunda respuesta da 409; `POST /profiles/patients/search` responde igual que `GET /profiles/patients` con los filtros en el cuerpo.
**DoD:** `corepack yarn test src/modules/profiles` verde con los specs nuevos.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando) | Estado |
|---|---|---|---|---|
| H2.S1.M1 | `git cherry-pick -x 20bad55b` y correr sus specs | commit aplicado sin conflicto; specs del PR verdes | `corepack yarn test src/modules/profiles/services/dependent-link-requests.service.spec.ts src/modules/profiles/controllers/profiles-dependent-requests.controller.spec.ts` → PASS | HECHO (`1aaa798f`, `e3f30221`; evidencia 04-10) |
| H2.S1.M2 | `patientProfileId?` alternativo a `nationalId` en `RequestDependentLinkDto` y servicio | por perfil: mismo 404/409/422 que por CI; ninguno de los dos → 400 | spec de DTO y de servicio → PASS | HECHO (`1aaa798f`, `e3f30221`; evidencia 04-10) |
| H2.S1.M3 | `GET patients/me/dependent-candidates?q=` (≥3 letras, ≤8 filas, CI enmascarado, sin titular ni ya vinculados) | los tres niveles del contrato | spec de servicio y controlador → PASS | HECHO (`1aaa798f`, `e3f30221`; evidencia 04-10) |
| H2.S1.M4 | `POST profiles/patients/search` (200, mismo DTO, mismos roles, antes de `patients/:profileId`) | delega igual que el `GET` | spec de controlador (orden de rutas) → PASS | HECHO (`1aaa798f`, `e3f30221`; evidencia 04-10) |
| H2.S1.M5 | README del módulo con las 6 rutas | tabla lista las 6 | `git diff --stat` del README | HECHO (`1aaa798f`, `e3f30221`; evidencia 04-10) |
## H3 — Bloque B: verificación de diagnósticos (1 ruta)
**CA:** Dado un diagnóstico provisional, cuando se verifica sin motivo ni evidencia → 422; con motivo (o evidencia del mismo paciente) y fin esperado o curso crónico → 200, confirmado y activo; refutado cierra con `resolvedAt`; una segunda decisión → 409; evidencia ajena → 422.
**DoD:** specs de conditions, condition-verification, controlador clínico y designaciones ES en verde.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando) | Estado |
|---|---|---|---|---|
| H3.S1.M1 | `git cherry-pick -x ddfa24a5 11f186b0`, resolviendo solapes en `clinical-read.dto.ts` y `clinical-read.service.ts` | ambos aplicados; specs verdes | `corepack yarn test src/modules/clinical/services/conditions.service.spec.ts src/modules/clinical/services/condition-verification.spec.ts src/modules/clinical/controllers/clinical-records.controller.spec.ts` → PASS | HECHO → `8a827543` y `9a35684e` por cherry-pick sin conflicto manual; clinical + seed: 75 suites, 708 pruebas, exit 0 (`evidencia/11`) |
| H3.S1.M2 | Designaciones ES de `COND_PROVISIONAL` y `COND_REFUTED` si el spec las exige | spec de designaciones sin conceptos faltantes nuevos | `corepack yarn test src/common/seed/terminology-designations.es.spec.ts` | HECHO → sin cambios necesarios: `COND_PROVISIONAL` y `COND_REFUTED` no pertenecen a ningún value set publicado y el spec de designaciones sólo exige los que sí; pasa (`evidencia/11`). Deuda anotada: no existe value set de verificación (regla 99 §2) |
| H3.S1.M3 | Alta provisional: `CreateConditionDto.verificationStatusConceptId?` (dos valores admitidos), default `CONFIRMED` | un diagnóstico nace provisional y se verifica; sin el campo sigue confirmado | spec nuevo + spec existente «records a condition as active and confirmed» → PASS | HECHO → `ed443855`: alta presuntiva en DTO y servicio, spec nuevo del DTO; 2 suites, 55 pruebas (`evidencia/12`); `yarn test src/modules/clinical`: 51 suites, 518 pruebas (`evidencia/14`) |
| H3.S1.M4 | Autorización y autor de la decisión | `verify` usa `assertPuedeEscribirHistoria`; sin `practitionerProfileId` → 422 sin fallback | spec negativo → PASS | HECHO → ya lo hace `ConditionsService.verify` (Pablo): `loadConditionForWrite` → `assertPuedeEscribirHistoria`; autor `practitionerProfileId` con 403 sin fallback; specs de `verify` en `evidencia/11` |
| H3.S1.M5 | README del módulo clínico | fila de la ruta | `git diff --stat` | HECHO → `ed443855`: fila de la ruta y regla de negocio en `src/modules/clinical/README.md` |

## H4 — Bloque A: solicitudes recibidas y dictamen (2 rutas)
**CA:** Dado un operador con membresía o rol en la aseguradora (tenant `PAYER` activo), cuando lista, entonces sólo ve reclamos de su aseguradora, por `submitted_at` descendente, con tope 500 y `truncated`, importes como cadena; sin aseguradora 404, sin permiso 403; dictaminar `APPROVED` deja el reclamo adjudicado con versión 1 y repetirlo da 409 `ALREADY_DECIDED`; `PARTIAL` con monto no menor al solicitado o razón de menos de 5 caracteres → 422; `REJECTED` sin razón → 422; reclamo de otra aseguradora → 404.
**DoD:** `corepack yarn test src/modules/insurance` verde, sin tocar `insurance-controllers.spec.ts`.
**Estado:** A MEDIAS — M1 a M6 HECHO; M7 BLOQUEADO por decisión de modelo. Además `src/modules/insurance` no queda 100 % verde: falla `insurance-controllers.spec.ts › la lectura de solicitudes exige BILLING_OPERATOR o SECURITY_ADMIN` (espera 2 roles, el controlador declara 6). Es **previo y ajeno**: ni el controlador ni su spec difieren de `origin/dev`, y el PR #520 ya lo documentó como roto allí (#513/#514 cambiaron los roles sin actualizar el spec). No se toca aquí (decisión del autor); evidencia en `evidencia/16`. El resto del módulo: 33 de 35 suites en esa corrida, y las 5 suites nuevas del hito, 136 pruebas, en verde (`evidencia/17`).
**Corrección del CA:** «sin aseguradora → 403», no 404: es lo que dice el contrato del front y evita revelar qué organización es aseguradora.

| ID | Microtarea | CA (binario) | DoD (comando) | Estado |
|---|---|---|---|---|
| H4.S1.M1 | DTOs `received-claims.dto.ts` y su spec con el `ValidationPipe` de `main.ts` | claves extra → 400; `outcome` fuera del set → 400; monto no decimal → 400 | spec del DTO → PASS | HECHO → `dto/received-claims.dto.ts` y su spec con el pipe estricto; 5 suites nuevas del hito: 136 pruebas, exit 0 (`evidencia/17`); lint 0 (`evidencia/19`) |
| H4.S1.M2 | Resolución de la aseguradora y permisos (calcada de `InsuranceAnalyticsService`) | 404 sin aseguradora; 403 sin rol ni membresía OWNER/ADMIN | spec de servicio → PASS | HECHO → `resolveCarrier` en `insurer-received-claims.service.ts`: aseguradora del tenant activo + OWNER/ADMIN o rol vigente en ese tenant (`roleAuthorizesInTenant`); 403 con un solo texto (desvío: el plan decía 404 sin aseguradora, el contrato del front dice 403) |
| H4.S1.M3 | Lectura: encuentro→profesional, líneas, plan, versión vigente, estado mapeado, tope 500 | 500 filas → `truncated=false`; 501 → `true` | spec de servicio → PASS | HECHO → listado con tope 500 y `truncated`, exactamente 500 → `false`, 501 → `true`; lookups por lote en `claim-read.repository.ts`; spec de servicio en `evidencia/17` |
| H4.S1.M4 | Dictamen transaccional con `ADJUDICATION_PARTIAL`, 409, líneas D6 y evento outbox `InsuranceClaimDecided` | tres niveles del contrato | spec de servicio → PASS | HECHO → dictamen transaccional con bloqueo `FOR UPDATE`, 409 `ALREADY_DECIDED`, 422, reparto en centavos (`received-claim-settlement.ts`, 37 pruebas, `evidencia/15`), concepto `ADJUDICATION_PARTIAL` en `insurance.concepts.ts` (desvío: no hay value set dinámico de adjudicación al que sumarlo) y evento `InsuranceClaimDecided` por outbox; el resumen de portabilidad cuenta lo parcial como aprobado |
| H4.S1.M5 | `InsurerReceivedClaimsController` (`GET /`, `POST :id/decision` 200) y registro en `insurance.module.ts` | delega; rutas fijas antes de `:id` | spec de controlador → PASS | HECHO → `InsurerReceivedClaimsController` (`GET /`, `POST :id/decision` 200, sin `@Roles`) registrado en `insurance.module.ts` junto con `MessagingModule`; spec del controlador en `evidencia/17` |
| H4.S1.M6 | README de insurance: sección «Solicitudes recibidas» | tabla con las 2 rutas | `git diff --stat` | HECHO → sección «Solicitudes recibidas por la aseguradora» en `src/modules/insurance/README.md` |
| H4.S1.M7 | Rutas `invoice/annulment` e `invoice` | decisión de modelo registrada | — | BLOQUEADO |

**H4.S1.M7 — BLOQUEADO · DECISION_REQUIRED.** Qué bloquea: no hay dónde persistir la factura del prestador a la aseguradora ni su anulación (`billing.invoices` exige práctica y paciente, no tiene anulación ni motivo; no hay SIAT). Qué se intentó: se revisaron entidades, DDL y los 70 `.puml`; el propio contrato del front lo declara pendiente. Qué lo destraba: que el propietario elija entre reusar `billing.invoices` + `billing_document_links` con patch de anulación, o una tabla propia `insurance.claim_invoices`; ambas son trabajo de modelo (ADR-0021). Regla 65: el contrato ya está escrito en `docs/contracts/insurer-received-claims.md` del front; el simulador del front sigue sirviéndolas y la API real responde 404 hasta la decisión.

## H5 — Verificación, artefactos y entrega
**CA:** typecheck 0, lint 0, tests dirigidos verdes, 9 rutas en `Matched`, PR abierto y mergeable salvo la revisión humana.
**DoD:** salidas literales en `evidencia/`.
**Estado:** TODO

| ID | Microtarea | CA (binario) | DoD (comando) | Estado |
|---|---|---|---|---|
| H5.S1.M1 | Typecheck y lint | exit 0 | `corepack yarn typecheck`; `corepack yarn lint --max-warnings=0` | HECHO |
| H5.S1.M2 | Tests dirigidos y de módulo | todo PASS | `corepack yarn test --testPathPatterns="received-claims\|condition\|dependent" --maxWorkers=2`; `corepack yarn test src/modules/profiles src/modules/clinical src/modules/insurance` | HECHO (1842/1843; el rojo es previo y ajeno) |
| H5.S1.M3 | Int-spec de dependientes (viene en el cherry-pick) | PASS o «No cubierto» declarado si `test:integration` no arranca | `corepack yarn test:integration --testPathPatterns=dependent-link-requests` | NO CUBIERTO (Docker apagado; no se usa la nube) |
| H5.S1.M4 | Comparación mock↔API | las 9 rutas en `Matched`; `Missing in Backend` baja de 71 a ≤ 62 | `python …\compare_mock_api.py` | HECHO (Matched 581, Missing 62; faltan solo las 2 de factura) |
| H5.S1.M5 | Artefactos del CI: injerto de operaciones nuevas en `openapi/`, `docs/modules`, `docs/postman` | cambian sólo líneas propias | `git status --short` acotado | HECHO |
| H5.S1.M6 | `REPORTE.md` con avance en la primera línea | archivo en disco | — | HECHO |
| H5.S1.M7 | Commit por rutas explícitas y push; `origin/dev` igual antes y después | rama en `origin` | `git push -u origin marcelo/feat-brechas-criticas-backend-h4` | TODO |
| H5.S1.M8 | PR a `dev` con reviewers y gate mergeable | `MERGEABLE`; `BLOCKED` sólo por la revisión humana | `gh pr view --json …`; `gh pr checks` | TODO |

## Gate de seguridad (áreas sensibles: historia clínica, datos de pacientes, seguros)

| Amenaza | Control | Dónde | Prueba |
|---|---|---|---|
| IDOR: dictaminar reclamo de otra aseguradora | la aseguradora del tenant activo debe ser la del reclamo; si no, 404 indistinguible | servicio de recibidas | spec «ajeno → 404» |
| BFLA: paciente o prestador listando recibidas | membresía OWNER/ADMIN o rol de aseguradora; si no, 403 | servicio de recibidas | spec «sin rol → 403» |
| Enumerar CI por solicitudes y candidatos | `@Throttle` 10/min, candidatos ≥3 letras, ≤8, CI enmascarado, sin cuenta → mismo 404 | controlador de dependientes | specs |
| Mass assignment | `whitelist` + `forbidNonWhitelisted` global y DTOs cerrados | `main.ts`, DTOs | spec de DTO |
| Transición inválida | 409 con la fila bloqueada (`PESSIMISTIC_WRITE`); verificación sólo desde provisional | servicios | specs |
| PHI en logs | sólo ids y nombres de campo | servicios | revisión del diff |

## Riesgos y bloqueos previstos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Conflicto del cherry-pick de verificación en `clinical-read.*` | rojo en specs de lectura | resolver conservando ambos lados y re-correr antes de seguir |
| Spec de designaciones ES rojo por conceptos nuevos | falso rojo en CI | H3.S1.M2 y designación de `ADJUDICATION_PARTIAL` |
| `test:integration` no arranca (B-16) | persistencia no verificada | declarar «No cubierto», no maquillar |
| Un proceso de esta máquina mergea ramas a `dev` sin PR | trabajo ajeno mezclado | `git branch --show-current` antes de cada corrida; `origin/dev` antes y después del push |
| Terminología atrasada en el stack vivo | conceptos nuevos ausentes hasta redesplegar | anotarlo en el REPORTE |
