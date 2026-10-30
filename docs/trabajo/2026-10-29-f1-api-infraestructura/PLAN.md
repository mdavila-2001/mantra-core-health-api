# Plan — F1 de la API: infraestructura hospitalaria (estructura, reglas, ciclo de vida, regulatorio)

- Fecha: 2026-10-29 · Repos afectados: `mantra-core-health-api` (rama `claude/trusting-hawking-q3p12v`, sin push) · Predecesor: [F0](../2026-10-29-f0-api-estructura-practice/PLAN.md)
- Contrato que manda: `SALUD/Arquitectura/infraestructura-hospitalaria/CONTRATO-F0-F1.md` §2, §3 y «Desvíos» (repo de documentación), más los avisos del orquestador del 2026-10-29 (habilitaciones sobre `organization_extensions.facility_licenses`; patch f1b de seguridad del modelo).
- Resultado observable: un OWNER/ADMIN del tenant (o el admin de la sucursal de la sede, o la plataforma) arma el árbol físico de su establecimiento con formas y funciones validadas por reglas de datos, lo edita con `If-Match`, lo mueve sin ciclos, lo activa/suspende/retira con bloqueos explicados, vincula espacios a unidades, carga datos regulatorios de Bolivia, habilitaciones y capacidad declarada vs. derivada; desde otro tenant todo responde 404; cada mutación deja `audit_log`, revisión en `audit.*_history` y evento outbox.
- Kill-test: `POST /sites/<sede de B>/care-spaces/bulk` con `X-Tenant-Id: A` responde algo distinto de 404, o `POST /sites/<sede A>/care-spaces` con `formCode: LOC_FORM_BED` sin padre responde 201.

## Alcance
- IN:
  - `database/` (vendoreo desde commits del modelo, nunca del árbol de trabajo) y entidades regeneradas con `gen_entities.py` (14; 10/22 sólo las tablas que toque el modelo).
  - `src/modules/practice/**` (conceptos, `domain/structure/` puro, servicios, repositorios, DTO, controladores, specs, README).
  - `src/modules/audit/repositories/history.repository.ts` (tenant en la revisión cuando la tabla lo tenga).
  - `src/common/seed/{practice-infrastructure-seed.service.ts,seed-bootstrap.service.ts,seed.module.ts}` y sus specs (siembra de reglas y backfill de forma).
  - `src/common/audit-trail/*` (sólo si cambia el baseline; no debe crecer).
  - `asyncapi/asyncapi.yaml`, `docs/events/event-catalog.md` si existe la tabla de eventos.
  - `openapi/` regenerado.
  - `test/integration/practice-structure-tenancy.int-spec.ts` (422→404 de `branchId`) y `test/integration/practice-infrastructure.int-spec.ts` (nuevo).
- OUT: migrar `practice` entero al molde DDD; tocar lecturas cruzadas de `practice_sites` en otros módulos (se inventarían y se fijan con un spec); F2+ (camas, ADT, quirófano); DDL (es del modelo); `site_licenses` (el orquestador lo retira del modelo).
- Ambigüedades registradas (supuesto tomado · a confirmar con el orquestador):
  1. Reglas de tipología: el contrato nombra `TYPO_ALLOWED/TYPO_REQUIRED` pero el seed pedido es de prohibiciones («no admite»). ~~Supuesto inicial: agregar `TYPO_FORBIDDEN`.~~ **Revisado (2026-10-30):** lista blanca con sólo ALLOWED/REQUIRED, igual que la web («Desvíos» WEB-F1 punto 5); «no admite X» = ALLOWED de todo menos X; REQUIRED no bloquea el alta, se informa como faltante.
  2. `SPACE_TYPE_ROOM` queda como función GENERIC con su código histórico (`SPACE_TYPE_ROOM`); renombrar el código cambiaría filas del catálogo ya sembradas.
  3. `If-Match` ausente en PATCH/move/lifecycle: ~~412~~ **428** `IF_MATCH_REQUIRED` (revisado 2026-10-30, como la web, «Desvíos» WEB-F1 punto 3); la concurrencia optimista no se vuelve opcional.
  4. Admin de sucursal: membresía activa rol ADMIN con `access_scope BRANCH`, cuya sucursal es `primary_branch_id` o una `branch_membership` activa, igual a `practice_sites.branch_id`. Un ADMIN con alcance BRANCH ya **no** pasa las escrituras de nivel organización de `practice` (sede, regulatorio, habilitaciones, capacidad declarada); la matriz del PLAN §3 le da sólo «ver».
  5. POST care-spaces sin `formCode`/`functionCode` (clientes viejos: smoke, `tools/alovida`): `LOC_FORM_ROOM` + GENERIC, y nace ACTIVO como antes; con el cuerpo nuevo nace PLANNED salvo `activate:true`.
  6. Habilitaciones: fachada de `/sites/:siteId/licenses` sobre `organization_extensions.facility_licenses` (orden del orquestador). Estado LIC_* derivado de `verification_status_concept_id` + `valid_to`.
  7. Bloqueos de retiro sin FK al espacio en F1 (`inventory_locations`, `diagnostic_equipment`): se informan como no verificables, no como 0.

## H1 — Modelo al día en la API
**CA:** Dado el modelo en su último commit, cuando se vendorea y regenera, entonces `database/` coincide con el snapshot y las entidades tienen las columnas/tablas nuevas sin edición a mano.
**DoD:** `MODEL_REPO=<snapshot> yarn db:vendor:check` exit 0; `git diff --stat src/modules/practice/entities`.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Vendorear `database/` desde snapshot `git archive` del modelo | check exit 0 | `bash scripts/db/vendor-ddl.sh --check` | HECHO |
| H1.S1.M2 | `gen_entities.py 14` (+10/22 lo que toque) | entidades nuevas presentes | `ls src/modules/practice/entities` | HECHO |
| H1.S1.M3 | Re-vendorear cuando el modelo commitee f1b/licencias (hecho con `2f9967d`) | check exit 0 contra el nuevo commit | ídem | HECHO |

## H2 — Conceptos, reglas como datos y siembra
**CA:** Dado el arranque, cuando corre `seed:boot`, entonces existen los conceptos de §2, las filas de `space_form_parent_rules` y `facility_typology_rules`, y ningún espacio queda con `form_concept_id` NULL; una segunda corrida inserta 0.
**DoD:** unit del seed (idempotencia); `psql` cuenta filas tras `seed:boot`.
**Estado:** A MEDIAS

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Conceptos §2 en `practice.concepts.ts` | `concept-codes.spec` verde | `yarn test concept-codes` | A MEDIAS |
| H2.S1.M2 | Perfiles de función, reglas padre→hijo, raíz y tipología en `domain/structure/` (puro, con norma de origen) | unit verde | `yarn test src/modules/practice/domain` | A MEDIAS |
| H2.S2.M1 | `PracticeInfrastructureSeedService` (reglas + backfill forma) en la cadena, `core` | unit idempotente | `yarn test practice-infrastructure-seed` | A MEDIAS |

## H3 — Lectura de estructura
| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H3.S1.M1 | `GET /practice/infrastructure-catalog` | forma del contrato | unit + int | A MEDIAS |
| H3.S1.M2 | `GET /sites/:siteId/structure` (miembro del tenant; 404 cruzado) | unit permitido + 404 | unit | A MEDIAS |
| H3.S1.M3 | `GET /care-spaces/:id` (path, hijos, asignaciones, derivados) | unit | unit | A MEDIAS |

## H4 — Escritura de espacios
| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H4.S1.M1 | POST care-spaces extendido: regla padre→hijo, forma de la función, tipología, código único 409, padre activo/planificado, `tenant_id` | unit por regla | unit | A MEDIAS |
| H4.S1.M2 | Bulk con patrón `{A..H}`/`{1..12}`, todo o nada, máx. 200 | unit patrón | unit | A MEDIAS |
| H4.S1.M3 | Import `dryRun` con errores por línea, `parentCode`, todo o nada | unit | unit | A MEDIAS |
| H4.S2.M1 | PATCH con `If-Match` → 412; `code/formCode` inmutables si ACTIVO (422) | unit | unit | A MEDIAS |
| H4.S2.M2 | Move con regla y anti-ciclo (422 `SPACE_CYCLE`) | unit | unit | A MEDIAS |
| H4.S3.M1 | Lifecycle activate/suspend/reactivate/retire, `reason`, `PARENT_NOT_ACTIVE` | unit | unit | A MEDIAS |
| H4.S3.M2 | Retire-check y 409 `SPACE_RETIRE_BLOCKED` con bloqueos | unit | unit | A MEDIAS |
| H4.S4.M1 | Unit-assignments (un OWNER vigente) | unit | unit | A MEDIAS |

## H5 — Unidades clínicas
| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H5.S1.M1 | `GET /sites/:siteId/clinical-units`, `GET /clinical-units/:id` | unit | unit | A MEDIAS |
| H5.S1.M2 | `PATCH /clinical-units/:id` con `If-Match` | unit | unit | A MEDIAS |
| H5.S1.M3 | `POST /clinical-units/:id/lifecycle` con bloqueos (hijos, espacios, personal) | unit | unit | A MEDIAS |
| H5.S1.M4 | `createClinicalUnit` escribe `tenant_id`, evento, autoriza admin de sucursal | unit | unit | A MEDIAS |

## H6 — Establecimiento regulado
| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H6.S1.M1 | `PATCH /sites/:siteId/regulatory` con 409 `TYPOLOGY_CONFLICT` | unit | unit | A MEDIAS |
| H6.S1.M2 | Verificación de SNIS sólo plataforma, error genérico | unit | unit | A MEDIAS |
| H6.S2.M1 | Habilitaciones (fachada sobre `facility_licenses`), vencida calculada | unit | unit | A MEDIAS |
| H6.S3.M1 | Capacidad declarada vs. derivada (+ hospital como declarada) y `POST declared-capacities` | unit | unit | A MEDIAS |

## H7 — Autorización, auditoría, historia, eventos
| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H7.S1.M1 | `StructureAccessService`: lectura miembro, escritura org/sucursal/plataforma, 404 cruzado | unit permitido + fail-closed | unit | A MEDIAS |
| H7.S1.M2 | `branchId` ajeno en `createSite` → 404; `createSite` escribe `tenant_id` | unit + int F0 | unit/int | A MEDIAS |
| H7.S2.M1 | `@Audited` en todas las rutas nuevas; baseline no crece | coverage spec | `yarn test audit-trail-coverage` | A MEDIAS |
| H7.S2.M2 | Historia con `tenant_id` cuando la tabla lo tenga | unit | unit | A MEDIAS |
| H7.S3.M1 | Eventos outbox `practice.care_space.*`, `practice.clinical_unit.*`, `practice.site_license.*` y AsyncAPI | `docs:asyncapi:validate` | `yarn docs:asyncapi:validate` | A MEDIAS |
| H7.S4.M1 | Inventario de lecturas cruzadas de `practice_sites` con RLS, fijado por spec | spec verde | `yarn test practice-sites-cross-tenant` | A MEDIAS |

## H8 — Pruebas de integración y gates
| ID | Microtarea | DoD | Estado |
|---|---|---|---|
| H8.S1.M1 | int-spec F1: crear/editar/mover/retirar con request→response→base→relectura, y 404 cruzado | `yarn test:integration practice-infrastructure` | A MEDIAS |
| H8.S2.M1 | typecheck | `yarn typecheck` exit 0 | A MEDIAS |
| H8.S2.M2 | lint | `yarn lint` exit 0 | A MEDIAS |
| H8.S2.M3 | tests practice + audit-trail coverage + module-layering | `yarn test …` | A MEDIAS |
| H8.S2.M4 | OpenAPI regenerado y validado | `yarn docs:openapi:generate && yarn docs:validate` | A MEDIAS |
| H8.S2.M5 | `db:vendor:check`, `orm:audit` | exit 0 | HECHO |
| H8.S2.M6 | `seed:boot`, API arriba, `/health` | `curl /health` | A MEDIAS |
| H8.S3.M1 | README del módulo con tabla de rutas; REPORTE | archivos | HECHO |

## Microtareas agregadas en el camino (AGENTS §1.3)
| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H3.S1.M4 | `GET /care-spaces/:id/history` («Desvíos» WEB-F1 punto 1) | unit: orden, acción, motivo, 404 cruzado | `yarn test infrastructure-read` | A MEDIAS |
| H7.S5.M1 | El espejo global de historia no duplica las revisiones de sede/unidad/espacio (defecto de F0 que encontró el E2E) | unit del subscriber | `yarn test history-mirror` | A MEDIAS |
| H7.S6.M1 | Alinear `reason`, 428, lista blanca, `SiteSummary`, `nextAction`, `status`/`notes` y `message` con WEB-F1 | unit + E2E | `yarn test src/modules/practice` | A MEDIAS |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| `yarn install` bloqueado (`cdn.sheetjs.com` 403) | sin tsc/jest/int-spec | reintentar periódicamente; no rodear; REPORTE con peldaño WRITTEN |
| El modelo cambia en paralelo (f1b, licencias) | entidades desfasadas | vendorear sólo commits; re-vendorear al aparecer el commit |
| f1b: `audit.*_history` sólo SELECT/INSERT, y `HistoryRepository.append` hace UPDATE de `valid_to` | escritura de historia rota con `mantra_app` | avisado al orquestador; no se cambia `append` sin decisión |
| RLS en `practice_sites` y lecturas cruzadas | listados vacíos con `RLS_ENFORCE=true` | inventario + spec + evidencia psql con `mantra_app` |
