> **AVANCE: 25 / 29 microtareas HECHO (86 %). 1 BLOQUEADA, 1 NO CUBIERTA, 2 de entrega (push y PR) en curso.**

# REPORTE — Hito 4: cierre de brechas críticas en la API

- Fecha: 2026-10-01 · Repo: `mantra-core-health-api` · Rama: `marcelo/feat-brechas-criticas-backend-h4` (desde `origin/dev` `502dcbf7`)
- Resultado: **9 de las 11 rutas** pasan de `Missing in Backend` a `Matched`. Las 2 rutas de factura quedan **BLOQUEADAS por una decisión de modelo** que no es mía.
- Escalera de evidencia: **TESTED** para las 9 rutas (specs unitarios de DTO, controlador y servicio). **No llega a VERIFIED**: ninguna se observó contra una base viva (ver «No cubierto»).

## Completado

| Bloque | Rutas | Cómo |
|---|---|---|
| Dependientes | `POST /profiles/patients/search`, `POST /profiles/patients/me/dependent-requests`, `GET …/me/dependent-candidates`, `GET …/me/dependent-requests/incoming`, `POST …/:id/accept`, `POST …/:id/reject` | Cherry-pick `-x` del trabajo de Pablo (`20bad55b`) y se completó: `patientProfileId` como alternativa al CI, candidatos por nombre (≥3 letras, ≤8, CI enmascarado) y `POST patients/search` |
| Verificación clínica | `POST /clinical/conditions/:id/verification` | Cherry-pick `-x` de `8a827543` y `9a35684e`; más `ed443855`: el alta admite `verificationStatusConceptId` (presuntivo o confirmado, default confirmado), porque sin eso la ruta siempre daba 409 |
| Aseguradora | `GET /insurance/received-claims`, `POST /insurance/received-claims/:id/decision` | Listado acotado a la aseguradora del tenant activo (tope 500 + `truncated`); dictamen transaccional con `FOR UPDATE`, 409 `ALREADY_DECIDED`, reparto en centavos exactos y evento `InsuranceClaimDecided` por outbox en la misma transacción |
| Artefactos | `openapi/`, `docs/modules`, `docs/postman` | Solo las 9 operaciones nuevas. Comparación estructural contra el contrato anterior: 0 operaciones perdidas, 9 añadidas, 0 cambiadas, 1 esquema cambiado (`CreateConditionDto`, intencional) |

Evidencia literal (carpeta `evidencia/`):
- `corepack yarn typecheck` → exit 0 (`25-typecheck-final.txt`).
- `corepack yarn lint --max-warnings=0` → exit 0 (`26-lint-final.txt`).
- `yarn test` sobre profiles, clinical, insurance y `src/common/seed` → **136 de 137 suites, 1 842 de 1 843 pruebas** (`27-tests-final.txt`). El fallo se explica abajo.
- `compare_mock_api.py` → **Matched 581** (antes 572) y **Missing in Backend 62** (antes 71). Las únicas rutas del hito que siguen faltando son las 2 de factura (`28`, `29`).
- Baseline previo a cualquier cambio: 25 suites, 501 pruebas, typecheck exit 0 (`02`, `03`).

## A medias

- **Rutas de factura: `POST /insurance/received-claims/:id/invoice/annulment` y `POST …/:id/invoice`. BLOQUEADO · DECISION_REQUIRED.** No existe dónde persistir la factura del prestador a la aseguradora: `billing.invoices` exige `practice_id` y `patient_profile_id`, no tiene anulación ni motivo, y el propio contrato del front dice «pendiente en el modelo». Pregunta para el propietario: ¿se reutiliza `billing.invoices` + `billing_document_links` con columnas de anulación (patch del modelo), o se crea una tabla propia `insurance.claim_invoices`? Mientras tanto el listado devuelve `invoice: null` siempre. Cualquiera de las dos entra por `.puml` → patch, no por este PR.
- **Alcance del dictamen en la factura:** el evento `InsuranceClaimDecided` ya se publica para `APPROVED`/`PARTIAL`; quien emita la factura deberá consumirlo cuando se decida el modelo.

## Pendiente

- Decisión de modelo de la factura (arriba) y luego sus 2 rutas.
- Revisión humana del PR (`jsaldias39`, `PabloArauzCaballero`). No lo mergeo yo.
- Regenerar `openapi/ENDPOINTS.md` y `openapi/endpoints/*.md`: están desactualizados desde antes del hito y regenerarlos completo es un PR aparte.
- Probar contra base viva (ver «No cubierto») y redesplegar para que la API siembre los conceptos nuevos.

## No cubierto

- **`test/integration/dependent-link-requests.int-spec.ts`** (ampliado en este hito): escrito, **no corrido**. Docker estaba apagado y no usé las bases de Neon/Atlas sin autorización.
- **El SQL de candidatos** (`searchRepresentableByName`): solo verificado por spec con el `EntityManager` mockeado (alineación de parámetros y escape de `LIKE`). Nunca corrió contra Postgres.
- **Ninguna ruta se ejercitó por HTTP** contra una API levantada.
- En stacks vivos faltan los conceptos nuevos (`ADJUDICATION_PARTIAL`, `COND_PROVISIONAL`/`COND_REFUTED`) hasta redesplegar.

## Desvíos respecto del plan

1. **403, no 404, para quien no es aseguradora** en `received-claims`: el contrato del front declara 403, con un solo texto para no distinguir causas.
2. **`ADJUDICATION_PARTIAL` es un concepto del módulo** (`insurance.concepts.ts`), no una entrada de un value set dinámico: no existe un value set dinámico de adjudicación al que sumarlo.
3. **`policyClauseReference` es opcional** en el dictamen: la regla de cláusula obligatoria vive en el DTO de `/adjudications`, no en el esquema.
4. **Se tocó `InsurancePortabilityService`** para contar `PARTIAL` como aprobado (con spec): sin eso un dictamen parcial desaparecía de ese resumen.
5. **No se tocó** `POST /insurance-claims/:id/adjudications`; sigue permitiendo re-versionar, a diferencia de la ruta nueva.

## Rojo previo que no es de este diff

`src/modules/insurance/controllers/insurance-controllers.spec.ts` › «la lectura de solicitudes exige BILLING_OPERATOR o SECURITY_ADMIN». El controlador `claims-read.controller.ts` declara además `BILLING` y `FINANCE` y el spec espera solo dos roles. `git diff origin/dev...HEAD -- src/modules/insurance/controllers/` muestra que esta rama **solo añade** el controlador nuevo, su spec y una línea en `index.ts`: no toca ese archivo. Clasificación: `PRODUCT_BUG` preexistente en `dev`, fuera de alcance.

## Riesgos y observaciones abiertas

- El listado del admin de pacientes del front puede enviar filtros ABO/Rh/idioma que `POST patients/search` rechaza con 400 (la API no los declara en su DTO).
- `InsuranceAnalyticsService` no acota roles por tenant (el servicio nuevo sí, con `roleAuthorizesInTenant`).
- Colisión de número de versión `v4.2.32` entre el modelo y los parches vendidos en `database/` de la API.
- No existe un value set de estado de verificación diagnóstica (`COND_PROVISIONAL`/`COND_REFUTED` no pertenecen a ninguno): deuda de la regla 99 §2.
- `uq_person_account_links_active_user` vive **comentado** en el DDL (según `CLAUDE.md`), así que la base no garantiza un solo vínculo activo por cuenta. No lo toqué ni lo verifiqué en este hito; lo anoto porque los flujos de dependientes parten de la identidad de la cuenta.
- El job `docs` del CI ya falla en `dev` por `yarn npm audit` (EXTERNAL, previo).

## Decisiones del usuario (2026-10-01)

- D1: recuperar el trabajo de Pablo con cherry-pick `-x`.
- D2: entregar listado y dictamen con evento outbox; facturas bloqueadas.
- D3: `ADJUDICATION_PARTIAL` como concepto nuevo, dueño la API.
