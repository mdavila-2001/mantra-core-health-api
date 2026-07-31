# Métricas

> Fase 14. Ver [ADR-0010](../adr/ADR-0010-observabilidad-pino.md) — sin decisión formal de
> métricas transversales (Prometheus/OpenTelemetry) identificada en código. Esta página documenta
> lo real que existe, que es menos que un sistema de métricas completo.

## Lo que sí existe: contadores del ORM en memoria

`src/orm/observability/query-metrics.ts` — contadores en memoria de actividad de MikroORM:

| Métrica | Qué mide |
|---|---|
| `total` | Total de consultas ejecutadas |
| `byKind` | Desglose por tipo: `select`/`insert`/`update`/`delete`/`ddl`/`other` |
| `slowQueries` | Cuántas superaron `ORM_SLOW_QUERY_MS` |
| `failedQueries` | Consultas que fallaron |
| `totalMs` / `maxMs` | Tiempo acumulado y máximo observado |
| `slowestQuery` | SQL de la consulta más lenta (recortado a 500 caracteres) |

Diseño explícito según el propio código: *"contadores en memoria... por proceso, se pierde al
reiniciar. No sustituye a un backend de métricas; alimenta uno."* — es decir, está construido para
ser scrapeado, no para ser el sistema de métricas final.

## Brecha real: no está expuesto

**`QueryMetricsSnapshot` no se consume desde ningún controller ni endpoint de salud en el código
actual** (verificado: solo se re-exporta desde `src/orm/index.ts`, ningún otro archivo lo
importa). El contador existe y se actualiza en cada consulta, pero no hay forma de leerlo desde
fuera del proceso hoy — ni un endpoint `/metrics`, ni Prometheus, ni integración con el health
check. Es la pieza que falta para que esto sea observabilidad real, no solo instrumentación
interna.

## Log de consultas lentas — la señal que sí es visible hoy

Mientras no exista un endpoint de métricas, la única señal real y visible sobre latencia de base
de datos es el log estructurado: cada consulta que supera `ORM_SLOW_QUERY_MS` emite una línea con
`tookMs`, `thresholdMs`, `rows` y el SQL — ver [logs](logging.md). Es una señal, pero exige que
alguien esté mirando el log (o tenga un pipeline de alertas sobre patrones de log), no un panel de
métricas consultable.

## Sin métricas de negocio ni de HTTP

No se identificaron en esta fase métricas de tasa de requests, latencia HTTP, errores 5xx,
saturación, ni métricas de negocio (tasa de no-show en `scheduling`, tasa de accesos denegados por
el PDP en `authz`, etc. — candidatos mencionados en
[flujos críticos](../business/critical-workflows.md)). Brecha real, no oculta.

## Qué se necesita para cerrar esta brecha

1. Exponer `QueryMetricsSnapshot` en un endpoint (`/metrics` en formato Prometheus, o dentro de un
   health check enriquecido).
2. Decidir e implementar métricas HTTP transversales (interceptor global o middleware).
3. Instrumentar métricas de negocio específicas por dominio crítico.

## Ver también

- [Logs](logging.md), [Trazas](tracing.md), [SLO](service-level-objectives.md).
