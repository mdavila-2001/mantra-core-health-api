# Reporte — F0 de la API: estructura de `practice` aislada por tenant, auditada e historizada

- Fecha: 2026-10-29 · Plan: [PLAN.md](./PLAN.md) · Rama: `claude/trusting-hawking-q3p12v` (sin push)
- Commits: `bebe22db` (vendoreo DDL), `82a5c12e` (entidades regeneradas), `daade564` (seguridad + auditoría + historia + tests), más el de este reporte.
- Peldaño de evidencia alcanzado: **WRITTEN** para el código TS (servicios, controladores, specs, int-spec). **VERIFIED** sólo para H3 (vendoreo y columnas contra la base real, ver Evidencia). Nada del código TS llegó a `RUNS`: `yarn install` está **BLOQUEADO** (`cdn.sheetjs.com` 403 en el proxy, dependencia `xlsx`; `/home/user/.env-blocked-api-deps`), así que no hay `tsc`, `eslint`, `jest` ni `nest build`.
- Avance: 4 HECHO / 21 microtareas = **19 %** (H3.S1.M1, H3.S2.M1, H3.S2.M2 (con hallazgo), H4.S1.M4).

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H3.S1.M1 | `database/` = modelo en `de23caf` | `MODEL_REPO=<snapshot de23caf> bash scripts/db/vendor-ddl.sh --check` | `=== database/SQL al día` / `=== database/NoSQL al día` / `EXIT=0` |
| H3.S2.M1 | Entidades regeneradas (04, 14, 53) sin edición a mano | `python3 salud-db/gen_entities.py 04|14|53` + `prettier@3.9.6 --write` | 8 archivos, +44/−1; el resto de esos módulos sale byte a byte igual |
| H3.S2.M2 | `orm:audit` corre y no hay `columnasFaltantes` | `SALUD_VAULT=… node tools/catalog/audit-fidelity.mjs` | `EXIT=0`, `columnasFaltantes: 0` (ver hallazgo en Riesgos) |
| H4.S1.M4 | Commits en la rama, sin push | `git log --oneline -4` | 3 commits + reporte |

## A medias
### H1 (todas las microtareas) — autorización por tenant
- Qué anda: código escrito en `clinical-structure.service.ts`, `practice-sites.service.ts`, `sites.controller.ts`, `practices.controller.ts`, `practice.module.ts`; unitarios escritos (permitido, 404 cruzado, 404 fail-closed por práctica ausente, 403 sin OWNER/ADMIN, branchId 404/422, controlador sin tenant falla cerrado). `prettier --check` sobre los 12 archivos tocados: limpio (prueba que parsean como TS, no que tipen).
- Qué no anda: nada observado; **no se ejecutó**.
- Qué falta exactamente: `yarn typecheck`, `yarn lint`, `yarn test src/modules/practice`, `yarn test:integration test/integration/practice-structure-tenancy.int-spec.ts`.
- Dónde quedó: commit `daade564`.
### H2 (todas) — `@Audited` e historia
- Qué anda: 4 rutas con `@Audited` (`PRACTICE_SITE_CREATED`, `PRACTICE_SITE_DECOMMISSIONED`, `CLINICAL_UNIT_CREATED`, `CARE_SPACE_CREATED`); salen del baseline (721 → 717, JSON válido con 717 entradas verificado con `python3 json.load`); `HISTORY_REGISTRY` registra `practice_sites`, `clinical_units`, `care_spaces`; altas escriben `AUDIT_OP_INSERT`, el desmantelamiento escribe `AUDIT_OP_UPDATE` por sede, unidad y espacio. Las 3 tablas `audit.*_history` existen en la base (psql).
- Qué falta: `yarn test src/common/audit-trail/audit-trail-coverage.spec.ts` y el int-spec (lee `audit.audit_log` y `audit.*_history`).
- Dónde quedó: commit `daade564`.
### H4.S1.M1–M3 — gates
- Qué falta: `yarn typecheck`, `yarn lint`, `yarn docs:openapi:generate` + `yarn docs:validate`, y `yarn docs:tsdoc` (agrega JSDoc a las 13 propiedades nuevas de entidades, como pide ADR-0022). Todos necesitan `node_modules`.

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| H1.S1.M1–H1.S4.M1 | A MEDIAS | `/home/user/.env-ready-api-deps` (install de la API) y, para el int-spec, `/home/user/.env-ready-api` |
| H2.S1.M1–H2.S2.M3 | A MEDIAS | ídem |
| H4.S1.M1–M3 | TODO | ídem |

## Evidencia
Salidas completas en `evidencia/`:
- `db-vendor-check.txt`: check contra el snapshot `de23caf` → `EXIT=0`; check contra el árbol de trabajo del modelo → `EXIT=1`, esperado: el agente de MODELO tiene sin commitear `site_licenses_history` y cambios en `14_practice` (`git status` del modelo, `diff -r`).
- `orm-audit.txt`: resumen antes/después; `columnasSobrantes` 84 → 97 por las 13 columnas nuevas.
- `psql-columnas.txt`: las 13 columnas existen en la base local (`localhost:5433/alovida`), y las 3 tablas `audit.{practice_sites,clinical_units,care_spaces}_history` (`count = 3`).

## No cubierto
- Nada del código TS se ejecutó (ni compilación). Rutas, guardas, el interceptor de auditoría y la escritura de historia son `WRITTEN`.
- No hay int-spec para el 403 de un STAFF del mismo tenant (sólo unitario).
- `openapi/` no se regeneró; por inspección del generador (`generate-openapi.mjs:316`) los roles no se publican y no se tocó ningún `@ApiOperation`, así que se espera diff nulo, sin confirmar.

## Desvíos del plan
- `rsync` no estaba instalado; se instaló con `apt-get install rsync` para poder correr `scripts/db/vendor-ddl.sh` tal cual.
- Prettier se usó desde una instalación aislada en el scratchpad (`prettier@3.9.6`, la versión de `yarn.lock`), porque el install de la API está bloqueado. No se tocó `package.json` ni `yarn.lock`.
- `fidelity-audit.json` no se commitea: regenerarlo cambia 724 líneas por diferencias de la bóveda ajenas a este trabajo; el resumen queda en `evidencia/orm-audit.txt`.
- Se movió el JSDoc `UC-14-01` que estaba pegado a `listPractices` hasta `createSite`, que es a donde corresponde.

## Riesgos residuales
- **`orm:audit` mide contra la bóveda de Obsidian, no contra el modelo `.puml`/SQL.** La bóveda todavía no tiene las 13 columnas, así que pasan de «faltantes» a «sobrantes». Lo que destraba: regenerar las notas de entidad de la bóveda (repo de docs / agente de MODELO).
- Sin `@Roles`, las 4 rutas de escritura están abiertas a cualquier autenticado hasta el servicio. El tenant lo resuelve el interceptor (membresía del token) y el servicio exige OWNER/ADMIN o plataforma. El dueño de una organización ahora puede crear estructura (es lo buscado); antes sólo podía `SECURITY_ADMIN`.
- `branchId` de otro tenant responde 422 (mismo patrón que el directorio), lo que confirma que el id existe. Si se prefiere 404, es un cambio de una línea.
- El desmantelamiento escribe una revisión por fila con 2 consultas cada una (N+1). Con sedes chicas está bien; F1 debería agruparlas.
- Las entidades regeneradas no tienen JSDoc en las propiedades nuevas hasta que corra `yarn docs:tsdoc`, y el lint puede exigirlo.

## Decisiones y ambigüedades
1. Admin de sucursal (`access_scope BRANCH`, contrato §3) **no** entra en F0: el pedido dice `assertCanAdminister` + `SECURITY_ADMIN`. Queda para F1. A confirmar con el orquestador.
2. Plataforma = `SECURITY_ADMIN` **y** `SUPERADMIN`: es lo que ya define `TenantAdministrationService`; no se duplicó la regla.
3. Incluso la plataforma recibe 404 si la sede no es del tenant activo: tiene que mandar `X-Tenant-Id` del dueño (el harness y `fx2` ya lo hacen).
4. Vendoreo desde `de23caf` (commiteado), no del árbol de trabajo del modelo.
5. `GET /sites/:siteId/care-spaces` ya respondía 404 cruzado; no se cambió. Abrirla a «miembro del tenant» es F1.
6. `gen_entities` se corrió sólo para 04/14/53. Con `all` aparecen ~30 entidades nuevas y otras 45 con cambios de columnas en otros módulos: es fuera de alcance para F0 y está anotado para F1/MODELO.
