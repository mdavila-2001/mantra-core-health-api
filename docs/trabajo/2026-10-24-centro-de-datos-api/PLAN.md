# Plan — Centro de datos: API de gobierno del catálogo, auditoría y RBAC

- Fecha: 2026-10-24 · Repos afectados: `mantra-core-health-api` · Predecesor: modelo `v4248` (PR #52 de `mantra-core-health-model`: operaciones, procesos, linaje, bitácoras inmutables y los 9 códigos de `data_classifications`); #700 (`fix(forms)`, para que `dev` arranque)
- Resultado observable: un administrador de gobierno de datos ve el catálogo de la base real actualizado por una sonda, con cada columna clasificada (HIPAA/LGPD) y en revisión cuando la clasificación no es segura; consulta la auditoría con filtros y las lecturas de datos sensibles; administra asignaciones de roles; y ve la deriva entre los roles que usa el código y los que siembra la base.
- Kill-test: un usuario sin rol del centro de datos llama a cualquiera de las rutas nuevas y recibe algo distinto de 403; o la clasificación automática marca con certeza una columna sin datos de personas.

## Alcance
- IN: `src/modules/data_catalog` (roles, sonda, fichas por columna, clasificador, deriva), `src/modules/audit` (consulta de bitácora y de accesos a datos), `src/modules/authz` (lectura y revocación de asignaciones, regla de alcance de roles GLOBAL), seed de roles del sistema, `route-index` (metadatos de ruta para la auditoría) y los artefactos generados (`openapi/`, `docs/modules`, `docs/postman`).
- OUT: el esquema (va por el modelo, PR #52); el front del portal; los gates de CI nuevos; los seeds del modelo (`AUDITOR` duplicado, anotado); el parche `v4239` (anotado).
- Ambigüedades registradas:
  - ¿La clasificación automática puede dar certeza fuera de tablas de personas o esquemas clínicos? Supuesto: no; fuera de ellas el mismo nivel va a `NEEDS_REVIEW` (las credenciales quedan exentas). Confirmar con Pablo.
  - ¿Un rol GLOBAL puede asignarse con alcance de tenant? Supuesto: no; se rechaza con 422. Confirmar con Pablo.

## H1 — Catálogo vivo y clasificado
**CA:** Dado el catálogo vacío, cuando corre la sonda y luego la clasificación, entonces cada tabla y columna de la base aparece en el catálogo y las columnas sensibles tienen ficha con su sensibilidad y estado de revisión.
**DoD:** `corepack yarn test src/modules/data_catalog` en verde; escaneo `SUCCEEDED` y `POST /admin/catalog/classification/run` → 200 contra una base con `v4248`.
**Estado:** HECHO

### H1.S1 — Roles y sonda
**CA:** Dado un ejecutor de la sonda, cuando toma el siguiente escaneo, entonces ningún otro ejecutor puede tomar el mismo. **DoD:** specs de `catalog-scan.service` y `data_catalog.roles` en verde. **Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Roles del centro de datos sembrados con los del sistema | los roles existen tras el seed | `corepack yarn test src/modules/data_catalog/data_catalog.roles.spec.ts` → verde | HECHO |
| H1.S1.M2 | `POST /internal/catalog/scans/run-next` con fencing | dos ejecutores no toman el mismo escaneo | `corepack yarn test src/modules/data_catalog/services/catalog-scan.service.spec.ts` → verde | HECHO |

### H1.S2 — Fichas por columna y clasificador
**CA:** Dada una columna, cuando se clasifica, entonces su ficha queda `AUTO_DETECTED` solo con contexto seguro, y una ficha manual o revisada nunca se pisa. **DoD:** specs del clasificador y del repositorio en verde. **Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S2.M1 | Vocabulario de sensibilidad = 9 códigos de `data_classifications` + `UNKNOWN` | el DTO acepta exactamente esos valores | `corepack yarn test src/modules/data_catalog/catalog` → verde | HECHO |
| H1.S2.M2 | Rutas por columna: evidencia GET/POST y `PUT columns/:id/annotation` | aprobar sin evidencia → 422 | `corepack yarn test src/modules/data_catalog/catalog/annotation.rules.spec.ts` → verde | HECHO |
| H1.S2.M3 | Clasificador por nombre, tipo y contexto de tabla | certeza solo en tablas de personas/esquemas clínicos | `corepack yarn test src/modules/data_catalog/classification` → verde | HECHO |
| H1.S2.M4 | `POST /admin/catalog/classification/run` sin pisar fichas manuales ni revisadas | `skippedManual`/`skippedReviewed` > 0 al re-clasificar | `corepack yarn test src/modules/data_catalog/services/catalog-classification.service.spec.ts` → verde | HECHO |
| H1.S2.M5 | Alta de fichas con cada parámetro en su placeholder | cada `?::jsonb` recibe JSON | `corepack yarn test src/modules/data_catalog/repositories/catalog.repository.spec.ts` → verde | HECHO |

## H2 — Auditoría consultable
**CA:** Dado un auditor, cuando consulta la bitácora con filtros, entonces recibe las entradas con riesgo calculado y paginación por cursor; y las lecturas de datos sensibles en su propia ruta.
**DoD:** `corepack yarn test src/modules/audit src/observability/route-index` en verde; `GET /audit/log` y `GET /audit/data-access` → 200 con rol, 403 sin rol.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H2.S1.M1 | `GET /audit/log` con filtros, riesgo y cursor | filtrar por acción devuelve método y ruta | `corepack yarn test src/modules/audit/services/audit-query.service.spec.ts` → verde | HECHO |
| H2.S1.M2 | `GET /audit/data-access` | 200 con rol, 403 sin rol | llamada con y sin rol | HECHO |
| H2.S1.M3 | Metadatos de ruta para resolver método y ruta de una acción | cada acción auditada se resuelve | `corepack yarn test src/observability/route-index` → verde | HECHO |

## H3 — Administración de RBAC y deriva
**CA:** Dado un administrador de seguridad, cuando lista, asigna o revoca roles, entonces un rol GLOBAL con alcance se rechaza y la revocación quita el acceso al renovar la sesión; y la deriva lista los roles usados que la base no siembra.
**DoD:** `corepack yarn test src/modules/authz src/modules/data_catalog/services/permission-drift.service.spec.ts` en verde; llamadas reales con y sin rol.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H3.S1.M1 | Lecturas `/authz` (asignaciones, permisos, permisos por rol, usuarios internos) | 200 con rol, 403 sin rol | `corepack yarn test src/modules/authz/services/authz-admin-read.service.spec.ts` → verde | HECHO |
| H3.S1.M2 | `DELETE users/:userId/role-assignments/:assignmentId` | tras revocar, la ruta protegida vuelve a 403 | `corepack yarn test src/modules/authz/services/authz-assignment-revocation.service.spec.ts` → verde | HECHO |
| H3.S1.M3 | Rol GLOBAL con tenant/sucursal/práctica → 422 `ROLE_ASSIGNMENT_GLOBAL_ROLE_WITH_SCOPE` | 422 con alcance, 201 sin alcance | `corepack yarn test src/modules/authz/services/authz-grants.service.spec.ts` → verde | HECHO |
| H3.S2.M1 | `GET /admin/catalog/permission-drift` con lógica pura | lista roles usados no sembrados | `corepack yarn test src/modules/data_catalog/services/permission-drift.service.spec.ts` → verde | HECHO |

## H4 — Contrato publicado
**CA:** Dado el código nuevo, cuando se regeneran los artefactos, entonces OpenAPI, endpoints, módulos y Postman describen las rutas nuevas.
**DoD:** `node tools/openapi/generate-openapi.mjs`, `yarn docs:endpoints:generate`, `yarn docs:modules:sync`, `yarn postman:generate` exit 0; `yarn docs:openapi:request-bodies:test` en verde.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H4.S1.M1 | Regenerar artefactos | las rutas nuevas aparecen en `openapi.json` | generadores exit 0 | HECHO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| `dev` sin #700 no arranca | no se puede verificar en runtime | depende de #700 (ya fusionado) |
| Los seeds del modelo traen `AUDITOR` duplicado como TENANT | el `AUDITOR` global no se siembra | anotado; se corrige en el modelo |
| El clasificador da falsos positivos con certeza | fichas `AUTO_DETECTED` erróneas | certeza solo con contexto seguro; el resto a revisión |
