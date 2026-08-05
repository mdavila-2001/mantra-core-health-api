# Dashboards

> Fase 14. **Sin dashboards existentes** identificados en el repositorio (sin configuración de
> Grafana, sin definiciones de panel versionadas). Consecuencia directa de la brecha de
> [métricas](metrics.md): sin backend de métricas expuesto, no hay datos que un dashboard pueda
> consultar todavía.

## Qué existe como sustituto parcial hoy

- **Logs estructurados** (`docs/observability/logging.md`) consultables por un agregador de logs,
  si existe uno configurado en el entorno de despliegue — no verificado en esta fase.
- **`platform_ops.health_checks`/`health_check_runs`** — registro de resultados de health checks
  a nivel de datos, potencial fuente de un dashboard de disponibilidad si se consulta
  directamente contra la base (ver [health checks](../operations/health-checks.md)).

## Qué se necesita para tener dashboards reales

1. Cerrar la brecha de [métricas](metrics.md) (exponer `/metrics` o equivalente).
2. Desplegar un backend de series de tiempo para métricas (Prometheus u otro).
3. Definir los paneles mínimos: latencia/errores de la API, actividad de los 20 workers,
   profundidad de las colas (`queued_jobs`), consultas lentas del ORM.
4. Versionar las definiciones de dashboard junto al código (como este mismo plan versiona
   `structurizr/workspace.dsl` y `asyncapi/asyncapi.yaml`), no crearlas manualmente en una UI sin
   respaldo en control de versiones.

## Ver también

- [Métricas](metrics.md), [Alertas](alerts.md).
