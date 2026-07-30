# read_models · repositories

Repositorios stateless: cada método recibe el `EntityManager` activo como primer
parámetro para que el servicio controle la transacción y sean triviales de mockear.
Las FK son columnas `uuid` planas, así que el servicio hace `flush` del padre antes
de crear los hijos.

| Repositorio | Tabla(s) | Notas |
| --- | --- | --- |
| `ReadModelDefinitionsRepository` | `read_model_definitions` | contrato versionado; búsqueda por (schema, object, version) |
| `ReadModelDependenciesRepository` | `read_model_dependencies` | fuentes upstream; solo `created_at` |
| `ReadModelRefreshRunsRepository` | `read_model_refresh_runs` | bitácora append-only de refresh/backfill/reconcile |
| `PortalSurfacesRepository` | `portal_surfaces` | upsert por `portal_code` |
| `FrontendRoutesRepository` | `frontend_routes` | upsert por (surface, route_code) |
| `FrontendPageViewsRepository` | `frontend_page_views` | vista; guarda de retiro por definición |
| `FrontendViewChildrenRepository` | `frontend_view_{fields,filters,sort_options,actions,kpis,states}` | allow-list del contrato |
| `UserViewPreferencesRepository` | `user_view_preferences` | upsert por (user_id, page_view_id) |
