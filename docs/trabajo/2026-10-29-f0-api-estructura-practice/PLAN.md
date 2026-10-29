# Plan — F0 de la API: estructura de `practice` aislada por tenant, auditada e historizada

- Fecha: 2026-10-29 · Repos afectados: `mantra-core-health-api` (rama `claude/trusting-hawking-q3p12v`) · Predecesor: contrato `SALUD/Arquitectura/infraestructura-hospitalaria/CONTRATO-F0-F1.md` §3 «F0 de la API»
- Resultado observable: un OWNER/ADMIN del tenant (o la plataforma) puede crear sede, unidad clínica y espacio de atención en **su** tenant; desde otro tenant recibe 404; cada alta deja sello en `audit.audit_log` con acción de negocio y revisión en `audit.*_history`; las entidades tienen las columnas que el modelo ya declara.
- Kill-test: `POST /sites/<sede del tenant B>/care-spaces` con `X-Tenant-Id: A` responde 201 (o 403 en vez de 404).

## Alcance
- IN: `src/modules/practice/{controllers/practices.controller.ts,controllers/sites.controller.ts,services/clinical-structure.service.ts,services/practice-sites.service.ts,practice.module.ts}` y sus specs; `src/modules/audit/repositories/history.repository.ts` (registro de 3 historiales); `src/common/audit-trail/{audit-trail-baseline.json,audit-trail-coverage.spec.ts}`; `database/SQL`/`database/NoSQL` (vendoreo); entidades regeneradas por `gen_entities.py`; `test/integration/practice-structure-tenancy.int-spec.ts` (nuevo); `openapi/` si cambia; este plan, reporte y `evidencia/`.
- OUT: DDL (no se escribe), endpoints nuevos de F1 (árbol, PATCH, move, lifecycle, outbox), admin de sucursal (`access_scope BRANCH`), lectura por «miembro del tenant» en `GET /sites/:siteId/care-spaces`, `publishHealthcareService`, `managingTenantId`.
- Ambigüedades registradas:
  1. El contrato §3 admite además «admin de sucursal» para escribir estructura; el pedido de F0 dice `assertCanAdminister` + `SECURITY_ADMIN`. Supuesto: F0 implementa sólo OWNER/ADMIN del tenant + plataforma (`SECURITY_ADMIN`/`SUPERADMIN`, que es lo que ya hace `TenantAdministrationService`); admin de sucursal queda para F1. Confirmar con quien orquesta F0/F1.
  2. `branchId` de otro tenant: el patrón existente (`DirectoryMembershipsService.requireBranchInTenant`) responde 404 si no existe y 422 si es de otro tenant. Se replica ese patrón.
  3. El modelo está recibiendo un patch en paralelo: se vendorea el HEAD commiteado de `mantra-core-health-model` (snapshot `git archive`, no el árbol de trabajo) y se documenta el commit. F1 vuelve a vendorear.
  4. Para que el OWNER (rol global `USER`) llegue al servicio, se quita `@Roles('SECURITY_ADMIN')` de las 4 rutas de escritura de estructura; la autorización pasa al servicio (mismo patrón que `POST /tenants/:tenantId/branches`).

## H1 — Autorización por tenant en la estructura
**CA:** Dado un actor con tenant activo A, cuando crea/desmantela estructura de una sede/práctica de B, entonces 404; cuando es OWNER/ADMIN de A o plataforma y el recurso es de A, entonces 201/200; cuando es STAFF de A, 403.
**DoD:** `yarn test src/modules/practice` verde con casos nuevos; int-spec `practice-structure-tenancy` verde contra la base real.
**Estado:** TODO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | `createClinicalUnit` exige sede del tenant activo (404) | unit: sede de otro tenant → `ResourceNotFoundException` | `yarn test clinical-structure.service` | TODO |
| H1.S1.M2 | `createClinicalUnit` autoriza con `assertCanAdminister` | unit: denegado → 403, no crea | `yarn test clinical-structure.service` | TODO |
| H1.S1.M3 | `createCareSpace` exige sede del tenant activo (404) | unit | `yarn test clinical-structure.service` | TODO |
| H1.S1.M4 | `createCareSpace` autoriza con `assertCanAdminister` | unit | `yarn test clinical-structure.service` | TODO |
| H1.S2.M1 | `createSite` exige práctica del tenant activo (404) | unit | `yarn test practice-sites.service` | TODO |
| H1.S2.M2 | `createSite` valida `branchId` del tenant (404/422) | unit | `yarn test practice-sites.service` | TODO |
| H1.S2.M3 | `createSite` autoriza con `assertCanAdminister` | unit | `yarn test practice-sites.service` | TODO |
| H1.S2.M4 | `decommissionSite` exige tenant (404) y `assertCanAdminister` | unit | `yarn test practice-sites.service` | TODO |
| H1.S3.M1 | Controladores pasan `requireTenantId()` y sin `@Roles` global | unit de controladores verde | `yarn test practice.controllers` | TODO |
| H1.S4.M1 | Int-spec: 404 cruzado y caso permitido contra base real | int-spec verde | `yarn test:integration practice-structure-tenancy` | TODO |

## H2 — Auditoría e historia
**CA:** Dada una alta/baja de estructura exitosa, entonces hay una fila en `audit.audit_log` con la acción de negocio y una revisión en `audit.{practice_sites,clinical_units,care_spaces}_history`.
**DoD:** `yarn test audit-trail-coverage` verde con `BASELINE_SIZE` reducido; int-spec consulta las filas.
**Estado:** TODO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H2.S1.M1 | `@Audited` en las 4 rutas y salen del baseline | coverage spec verde, `BASELINE_SIZE` = 717 | `yarn test audit-trail-coverage` | TODO |
| H2.S2.M1 | Registrar 3 historiales en `HISTORY_REGISTRY` | `isSupported('care_spaces')` true | `yarn test history` | TODO |
| H2.S2.M2 | Altas y baja escriben revisión | unit: `historyRepo.append` llamado | `yarn test src/modules/practice` | TODO |
| H2.S2.M3 | Filas reales en base | int-spec lee `audit.care_spaces_history` | int-spec | TODO |

## H3 — Desfase API↔modelo
**CA:** Dado el modelo en su HEAD commiteado, cuando se vendorea y regeneran entidades, entonces `db:vendor:check` y `orm:audit` no reportan las columnas faltantes listadas.
**DoD:** `yarn db:vendor:check` exit 0; `yarn orm:audit` exit 0 y sin esas columnas en `columnasFaltantes`.
**Estado:** TODO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H3.S1.M1 | `db:vendor` desde snapshot del modelo | `database/` = snapshot | `MODEL_REPO=<snap> yarn db:vendor:check` exit 0 | TODO |
| H3.S2.M1 | `gen_entities.py` para los módulos afectados | entidades con columnas nuevas | `git diff --stat src/modules/*/entities` | TODO |
| H3.S2.M2 | `orm:audit` sin las columnas faltantes | jq sobre `fidelity-audit.json` | `yarn orm:audit` | TODO |

## H4 — Gates
| ID | Microtarea | DoD | Estado |
|---|---|---|---|
| H4.S1.M1 | typecheck | `yarn typecheck` exit 0 | TODO |
| H4.S1.M2 | lint | `yarn lint` exit 0 | TODO |
| H4.S1.M3 | openapi regenerado si cambió | `yarn docs:openapi:generate` + `yarn docs:validate` exit 0 | TODO |
| H4.S1.M4 | Commits en la rama (sin push) | `git log` | TODO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Base/deps no listas (otro agente) | int-spec y gates no se pueden correr | esperar `.env-ready-api*`; si no llegan, A MEDIAS con evidencia |
| `gen_entities` toca más que las columnas pedidas | diff grande | regenerar sólo los módulos afectados; documentar el diff |
| Quitar `@Roles` cambia el 403 temprano por 403 del servicio | contrato OpenAPI | documentar; el resultado para no-admin sigue siendo 403 |
