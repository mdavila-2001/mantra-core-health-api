# Reporte — Centro de datos: API de gobierno del catálogo, auditoría y RBAC

- Fecha: 2026-10-24 · Plan: [PLAN.md](./PLAN.md) · Rama(s): `itzan/centro-datos-api`
- Peldaño de evidencia alcanzado: `VERIFIED` (rutas ejercitadas contra una base con `v4248`, persistencia observada en la base, gates del CI en verde salvo rojos heredados de `dev`). No llega a `REGRESSION_VERIFIED` porque `test:cov` conserva un rojo heredado (ver Evidencia).
- Avance: 16 / 16 microtareas HECHO (100 %).

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | Roles del centro de datos sembrados | `corepack yarn test src/modules/data_catalog` | verde (dentro de 521/521) |
| H1.S1.M2 | Sonda con fencing | `POST /internal/catalog/scans/run-next` | escaneo `SUCCEEDED`: 1278 objetos, 17 429 columnas |
| H1.S2.M1 | Vocabulario de 9 códigos + `UNKNOWN` | `corepack yarn test src/modules/data_catalog/catalog` | verde |
| H1.S2.M2 | Rutas por columna | GET/POST evidencia, `PUT columns/:id/annotation` | 200/201; aprobar sin evidencia → 422; con evidencia → `APPROVED`; ficha nueva → `DRAFT`/`MANUAL` |
| H1.S2.M3 | Clasificador con certeza solo en contexto seguro | `POST /admin/catalog/classification/run` | 178 fichas: 56 `AUTO_DETECTED`, 122 `NEEDS_REVIEW` |
| H1.S2.M4 | Re-clasificar no pisa lo manual ni lo revisado | segunda corrida | `skippedManual` 1, `skippedReviewed` 64 |
| H1.S2.M5 | Alta de fichas con parámetros alineados | `catalog.repository.spec.ts` | verde; falla con la versión anterior (28 placeholders para 29 parámetros) |
| H2.S1.M1 | Bitácora consultable | `GET /audit/log?action=…` | 200 con riesgo, cursor, método y ruta |
| H2.S1.M2 | Accesos a datos sensibles | `GET /audit/data-access` | 200 con rol; 403 sin rol |
| H2.S1.M3 | Metadatos de ruta | `corepack yarn test src/observability/route-index` | verde |
| H3.S1.M1 | Lecturas `/authz` | llamadas con y sin rol | 200 / 403 |
| H3.S1.M2 | Revocación | `DELETE users/:userId/role-assignments/:assignmentId` | tras revocar y renovar sesión, `/audit/log` → 403 |
| H3.S1.M3 | Regla de alcance de roles GLOBAL | `POST` asignación | con tenant → 422 `ROLE_ASSIGNMENT_GLOBAL_ROLE_WITH_SCOPE`; sin tenant → 201 |
| H3.S2.M1 | Deriva de permisos | `GET /admin/catalog/permission-drift` | 200; 98 roles usados no sembrados |
| H4.S1.M1 | Artefactos regenerados | generadores de OpenAPI, endpoints, módulos y Postman | exit 0; 1387 paths, 1523 operaciones |

## A medias
ninguna

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| — | — | ninguno dentro de este plan |

## Evidencia
```
yarn typecheck                         → exit 0
yarn lint --max-warnings=0             → exit 0
yarn alovida:guardrails                → exit 0 (bloqueantes: 0)
yarn db:vendor:check                   → exit 0
yarn docs:openapi:request-bodies:test  → exit 0
yarn test:cov                          → Tests: 1 failed, 1 skipped, 10911 passed, 10913 total
                                         All files | 75.83 | 69.88 | 62.15 | 76.79 (sin error de umbral)
                                         único rojo: glossary-articles.catalog.spec.ts › cada artículo llega al piso de 2.000 palabras
yarn npm audit … --environment production → exit 1 (deprecaciones de dependencias del lockfile)
check-breaking (base origin/dev)       → Sin cambios incompatibles no aprobados en el contrato OpenAPI.
yarn docs:openapi:lint                 → Your API description is valid.
yarn docs:asyncapi:validate            → AsyncAPI válido: 0 advertencia(s), 0 errores.
yarn docs:coverage                     → Cobertura documental OK
yarn docs:links                        → 1 enlaces rotos (docs/trabajo/2026-10-24-farmacologia-clinica/REPORTE.md -> ./evidencia/)
```

Clasificación (conteo por estado y sensibilidad tras una corrida sobre el catálogo vacío):
```
NEEDS_REVIEW|PHI_IDENTIFIER|100
AUTO_DETECTED|PHI_IDENTIFIER|27
NEEDS_REVIEW|CREDENTIAL|16
AUTO_DETECTED|PERSONAL|11
AUTO_DETECTED|CREDENTIAL|10
AUTO_DETECTED|PHI_SENSITIVE|8
NEEDS_REVIEW|PHI_SENSITIVE|4
NEEDS_REVIEW|PERSONAL|2
```

## No cubierto
- `test:integration`: no se corrió la suite de integración completa; las rutas nuevas se ejercitaron una por una contra una base con `v4248`.
- La sonda en ejecución periódica (cada 15 min) no se observó durante varios ciclos; se observó un escaneo completo.

## Desvíos del plan
- Este `PLAN.md` se escribió en el repo al cerrar el trabajo, no antes de la primera línea de código (§2.1); el plan previo vivía fuera del repo. Se registra como incumplimiento.
- El arreglo de `forms` que `dev` necesitaba para arrancar salió en un PR propio (#700, ya fusionado) y no viaja acá.
- La rama se apoya en `7813feaa` (#716) y no en la punta de `dev`: el merge del #717 (`373880fc`) deja imports duplicados en `src/modules/insurance/insurance-patient-settlement.module.ts:6-10` y `yarn build` falla (TS2300 ×4). Fuera de alcance; anotado.
- `openapi/endpoints/iam.md` y `pharma-lab.md` traen campos de DTO que ya estaban en `dev` sin documentar: salen del generador y viajan con la regeneración.

## Riesgos residuales
- Las fichas con certeza dependen de cómo se nombran tablas y columnas; un esquema nuevo con datos de personas y nombres atípicos queda en revisión hasta que alguien lo apruebe.
- `docs/data/entity-catalog.md` en `dev` está desfasado respecto de las entidades de `billing`; no se toca acá.

## Decisiones y ambigüedades
- Certeza (`AUTO_DETECTED`) solo en esquemas clínicos o tablas de personas; fuera de ellas, el mismo nivel va a revisión. Las credenciales quedan exentas. A confirmar con Pablo.
- Un rol GLOBAL no se asigna con alcance (422). A confirmar con Pablo.
- Hallazgos para el equipo, sin tocar:
  - `AUDITOR` duplicado en los seeds del modelo (`06_authz.seeds.json`), ambos TENANT y uno llamado «Administrador de plataforma»: el `AUDITOR` global de la API no se siembra.
  - `database/SQL/patches/2026-10-11_v4239_agenda_centros_diagnosticos.sql:16` usa un usuario fijo que nada siembra; en una base nueva corta el init.
  - `v4231_seed_insurer_accounts.sql` depende de un concepto que se siembra después del init.
