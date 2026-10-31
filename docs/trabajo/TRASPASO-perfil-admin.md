# Traspaso — lado API del trabajo «Perfil admin, medición, gobernanza, permisos y cargas masivas»

El traspaso completo (qué está hecho, qué falta, qué está bloqueado y cómo continuar) vive en el repositorio del front:
`mantra-core-health` → `docs/trabajo/2026-10-30-perfil-admin-medicion-gobierno/TRASPASO.md` (rama `claude/stoic-johnson-4vl5bf`).

## Resumen para la API
- **Endpoints nuevos** (todos `TESTED` contra dobles, ninguno contra Postgres/Redis reales): `GET /admin/ops/instances/liveness` y
  `POST /internal/ops/heartbeats` (ops_console), `GET /admin/ops/tools[/:code]` (platform_ops), `GET /admin/analytics/devices`, `/money`, `/heatmap`
  (telemetry, reporting), `/admin/catalogs/services` y `/glossary` (billing, terminology), lecturas de gobernanza (audit, data_catalog, system_ops),
  ciclo de vida de cuentas (iam) y «quién puede qué» / revisión de accesos / simulaciones (authz), `/admin/bulk-imports` (bulk_import).
- **Seguridad:** `PlatformAdminScopeGuard` (`src/common/auth/`) cierra el ciclo de vida de cuentas y `authz-governance` a administradores de plataforma;
  las escrituras del glosario exigen `SUPERADMIN` de plataforma.
- **Bloqueado / faltante en el modelo** (`mantra-core-health-model`, sin DDL a mano): tabla del lote de cargas masivas; columnas de criticidad, variables
  requeridas y procedencia en `tool_registry`; propiedades de `ux_interaccion` (el seeder del heatmap no las declara → 0 clics con datos reales).
- **Despliegue:** definir `OPS_LIVENESS_REQUIRED_WORKERS=messaging,scheduling,workflow,read_models` en `docker-compose.coolify.yml`; regenerar `openapi/`.
- **Verificación que falta:** levantar Postgres + Redis (`docker-compose.yml`, perfil `local-db`) y correr los escenarios «romper a propósito» y los cuadres.
- Contratos de rutas para el front: `mantra-core-health/docs/trabajo/2026-10-30-perfil-admin-medicion-gobierno/contratos/`.
