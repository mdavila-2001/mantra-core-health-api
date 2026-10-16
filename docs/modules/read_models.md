<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/read_models/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver docs/progress/ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `read_models`

**Fuente:** [`src/modules/read_models/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/read_models/README.md)
· 3 controllers · 3 services · 8 repositories · 13 entidades · 5 DTO

---

# Módulo 30 · Read Models (Frontend View Contracts & Read Models)

Contratos versionados de read model, materialized views, contratos de vista de
frontend (portal, ruta, vista y sus hijos), preferencias de usuario y una
proyección pública de directorio. La administración de contratos y las consultas
públicas usan identificadores/columnas constantes o validadas; la proyección de
datos autenticada todavía no ejecuta la materialized view ni pagina filas.

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/read_models -name '*.controller.ts' | wc -l
  find src/modules/read_models -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/read_models -name '*.entity.ts' | wc -l
  find src/modules/read_models -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **3 controllers, 15 rutas HTTP, 13 entidades y 3 servicios**. La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Su `*.module.ts` no declara `imports` de otros módulos.

Entidades (`tableName`, 13 de 13 archivos `*.entity.ts`): `frontend_page_views`, `frontend_routes`, `frontend_view_actions`, `frontend_view_fields`, `frontend_view_filters`, `frontend_view_kpis`, `frontend_view_sort_options`, `frontend_view_states`, `portal_surfaces`, `read_model_definitions`, `read_model_dependencies`, `read_model_refresh_runs`, `user_view_preferences`.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `POST /portals/:portalCode/routes/:routeCode/views` | SECURITY_ADMIN | `frontend-views` |
| `GET /portals/:portalCode/routes/:routeCode/views/:viewCode/data` | sesión | `frontend-views` |
| `GET /portals/:portalCode/routes/:routeCode/views/:viewCode/actions` | sesión | `frontend-views` |
| `PUT /views/:frontendPageViewId/preferences` | sesión | `frontend-views` |
| `GET /public/directory` | pública | `public-projections` |
| `GET /public/:slug` | pública | `public-projections` |
| `POST /read-models/definitions` | SECURITY_ADMIN | `read-model-definitions` |
| `POST /read-models/definitions/:schema/:object/versions` | SECURITY_ADMIN | `read-model-definitions` |
| `GET /read-models/health` | SYSTEM, SECURITY_ADMIN | `read-model-definitions` |
| `POST /read-models/:definitionId/refresh` | SECURITY_ADMIN | `read-model-definitions` |
| `POST /read-models/:definitionId/backfill` | SECURITY_ADMIN | `read-model-definitions` |
| `POST /read-models/:definitionId/invalidate` | SECURITY_ADMIN | `read-model-definitions` |
| `POST /read-models/:definitionId/reconcile` | SYSTEM, SECURITY_ADMIN | `read-model-definitions` |
| `POST /read-models/definitions/:id/deprecate` | SECURITY_ADMIN | `read-model-definitions` |
| `DELETE /read-models/definitions/:id` | SECURITY_ADMIN | `read-model-definitions` |

## Endpoints (UC → ruta)

| UC | Método y ruta | Permiso | Descripción |
| --- | --- | --- | --- |
| UC-30-01 | `POST /read-models/definitions` | `SECURITY_ADMIN` | Registrar y publicar un contrato versionado + dependencias upstream |
| UC-30-02 | `POST /portals/:portalCode/routes/:routeCode/views` | `SECURITY_ADMIN` | Publicar contrato de vista (upsert portal/route + view + hijos) |
| UC-30-03 | `POST /read-models/:definitionId/refresh` | `SECURITY_ADMIN` | Refresh manual de la MV (REFRESH CONCURRENTLY) |
| UC-30-04 | `POST /read-models/:definitionId/backfill` | `SECURITY_ADMIN` | Backfill inicial (FULL) de la MV |
| UC-30-05 | `GET /portals/:portalCode/routes/:routeCode/views/:viewCode/data` | autenticado | Devuelve contrato, masking y staleness; actualmente `data` queda vacío |
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
- Las lecturas públicas seleccionan `slug`, `display_name`, `city` y
  `specialty`, con filtros parametrizados y máximo de 50 registros.
- `available_actions_json` es sugerencia de UI; el write debe revalidarla.

## Conceptos, permisos, logs, tests

- Conceptos propios en `read_models.concepts.ts` (`READ_MODELS_CONCEPT_SEEDS`, `RM`);
  el estado genérico `ACTIVE` reutiliza `CONCEPTS.STATE_ACTIVE` transversal.
- Auth: guard global; endpoints admin `@Roles('SECURITY_ADMIN')`; datos/acciones/
  preferencias con usuario autenticado; proyecciones públicas `@Public()`. Las
  rutas de datos y acciones todavía no hacen cumplir `requiredPermissionId`,
  audiencia, propósito, feature flag ni los contextos de tenant/paciente del
  contrato; ver el informe de revisión.
  `health` (UC-30-12) y `reconcile` (UC-30-07) suman `SYSTEM` al rol humano:
  el worker de reconciliación (Fase 4 del plan de corrección de workers)
  descubre definiciones `stale` por el primero y actúa con el segundo — mismo
  patrón que `GRAPH_PROJECTION_WORKER`/`EMBEDDING_WORKER` en otros módulos.
- Logs Pino estructurados (`operation`, ids); sin secretos ni PHI.
- Pruebas dirigidas: `corepack yarn test src/modules/read_models --runInBand --silent`
  (6 suites, 40 pruebas al 2026-10-05). Hay specs unitarias de servicios y
  controladores y smoke transversal en
  `test/smoke/modules/read_models.smoke.ts` (`READ_MODELS_SMOKE`). Faltan
  integración HTTP/SQL para permisos de contrato, cursores y disponibilidad de
  la MV pública.

## Limitaciones conocidas

La revisión de 2026-10-05 confirmó tres hallazgos altos: autorización omitida
al servir contratos de vista, datos autenticados no materializados y errores de
la MV pública convertidos en listas vacías. El plan y los casos de regresión
están en [el informe de revisión](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/docs/revision-backend-2026-10-04/modulos/read_models.md).
