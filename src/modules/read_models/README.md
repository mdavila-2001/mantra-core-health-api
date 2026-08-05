# Módulo 30 · Read Models (Frontend View Contracts & Read Models)

Contratos de read model versionados, materialized views, contratos de vista de
frontend (route + view + fields/filters/sort/actions/kpis/states), preferencias de
usuario y proyecciones públicas. Los endpoints son contratos de lectura y de
materialización: no exponen SQL crudo al cliente (allow-lists de campos, filtros,
orden y acciones), aplican masking heredado y derivan las acciones en servidor.

## Endpoints (UC → ruta)

| UC | Método y ruta | Permiso | Descripción |
| --- | --- | --- | --- |
| UC-30-01 | `POST /read-models/definitions` | `SECURITY_ADMIN` | Registrar y publicar un contrato versionado + dependencias upstream |
| UC-30-02 | `POST /portals/:portalCode/routes/:routeCode/views` | `SECURITY_ADMIN` | Publicar contrato de vista (upsert portal/route + view + hijos) |
| UC-30-03 | `POST /read-models/:definitionId/refresh` | `SECURITY_ADMIN` | Refresh manual de la MV (REFRESH CONCURRENTLY) |
| UC-30-04 | `POST /read-models/:definitionId/backfill` | `SECURITY_ADMIN` | Backfill inicial (FULL) de la MV |
| UC-30-05 | `GET /portals/:portalCode/routes/:routeCode/views/:viewCode/data` | autenticado | Servir el read model (masking + cursor + staleness) |
| UC-30-06 | `POST /read-models/:definitionId/invalidate` | `SECURITY_ADMIN` | Invalidar y recomputar tras cambio upstream |
| UC-30-07 | `POST /read-models/:definitionId/reconcile` | `SECURITY_ADMIN`, `SYSTEM` | Reconciliar la MV divergente (result REPAIRED) |
| UC-30-08 | `POST /read-models/definitions/:schema/:object/versions` | `SECURITY_ADMIN` | Nueva versión N+1 en DRAFT (anterior sigue ACTIVE) |
| UC-30-09 | `PUT /views/:frontendPageViewId/preferences` | autenticado | Preferencias de vista (validadas contra el allow-list) |
| UC-30-10 | `GET /public/directory`, `GET /public/:slug` | `@Public()` | Proyecciones públicas (sin PHI, sin sesión) |
| UC-30-11 | `GET /portals/:portalCode/routes/:routeCode/views/:viewCode/actions` | autenticado | Derivar available_actions_json (estado + permiso) |
| UC-30-12 | `GET /read-models/health` | `SECURITY_ADMIN`, `SYSTEM` | Detectar staleness/degradación de las MV |
| UC-30-13 | `POST /read-models/definitions/:id/deprecate`, `DELETE /read-models/definitions/:id` | `SECURITY_ADMIN` | Deprecar (ACTIVE→DEPRECATED) y retirar (guarda de FK) |

## Entidades

`read_model_definitions`, `read_model_dependencies`, `read_model_refresh_runs`,
`portal_surfaces`, `frontend_routes`, `frontend_page_views`, `frontend_view_fields`,
`frontend_view_filters`, `frontend_view_sort_options`, `frontend_view_actions`,
`frontend_view_kpis`, `frontend_view_states`, `user_view_preferences`.

## Reglas de negocio

- `unique(schema_name, object_name, version_number)`: no colisionan versiones;
  publicar es DRAFT→ACTIVE (UC-30-01 nace ACTIVE; UC-30-08 nace DRAFT).
- Refresh/backfill/reconcile exigen `object_type = MATERIALIZED_VIEW` (→ 422 si no).
- Retirar exige que ninguna `frontend_page_views` apunte a la versión (→ 422).
- Preferencias: `visibleFields` debe ser subconjunto del allow-list del contrato.
- `available_actions_json` es sugerencia de UI; el write siempre revalida.

## Conceptos, permisos, logs, tests

- Conceptos propios en `read_models.concepts.ts` (`READ_MODELS_CONCEPT_SEEDS`, `RM`);
  el estado genérico `ACTIVE` reutiliza `CONCEPTS.STATE_ACTIVE` transversal.
- Auth: guard global; endpoints admin `@Roles('SECURITY_ADMIN')`; datos/acciones/
  preferencias con usuario autenticado; proyecciones públicas `@Public()`.
  `health` (UC-30-12) y `reconcile` (UC-30-07) suman `SYSTEM` al rol humano:
  el worker de reconciliación (Fase 4 del plan de corrección de workers)
  descubre definiciones `stale` por el primero y actúa con el segundo — mismo
  patrón que `GRAPH_PROJECTION_WORKER`/`EMBEDDING_WORKER` en otros módulos.
- Logs Pino estructurados (`operation`, ids); sin secretos ni PHI.
- Tests: unit specs de servicios y controladores (`*.spec.ts`) y smoke transversal
  en `test/smoke/modules/read_models.smoke.ts` (`READ_MODELS_SMOKE`).
