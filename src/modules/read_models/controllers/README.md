# read_models · controllers

Capa fina: valida parámetros (`ParseUUIDPipe`), aplica auth (`@Roles`/`@Public`) y
delega en el servicio. Endpoints admin → `@Roles('SECURITY_ADMIN')`; lectura de
datos/acciones y preferencias → usuario autenticado; proyecciones públicas →
`@Public()`.

| Controller | Endpoints |
| --- | --- |
| `ReadModelDefinitionsController` | `POST /read-models/definitions`, `POST /read-models/definitions/:schema/:object/versions`, `GET /read-models/health`, `POST /read-models/:definitionId/{refresh,backfill,invalidate,reconcile}`, `POST /read-models/definitions/:id/deprecate`, `DELETE /read-models/definitions/:id` |
| `FrontendViewsController` | `POST /portals/:portalCode/routes/:routeCode/views`, `GET /portals/:portalCode/routes/:routeCode/views/:viewCode/data`, `GET .../views/:viewCode/actions`, `PUT /views/:frontendPageViewId/preferences` |
| `PublicProjectionsController` | `GET /public/directory`, `GET /public/:slug` |
