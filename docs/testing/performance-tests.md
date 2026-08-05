# Pruebas de rendimiento

> Fase 15. **No identificadas** en el repositorio — sin herramienta de carga (k6, Artillery,
> Gatling, JMeter) en `package.json` ni scripts de prueba de carga en `tools/`.

## Por qué esto importa en este sistema específicamente

- **Paginación con límite duro de 100** (ver [convenciones de API](../api/conventions.md)) —
  diseñado con costo de consulta en mente, pero nunca medido bajo carga real.
- **`scheduling`** usa bloqueo pesimista (`SELECT ... FOR UPDATE`) para anti-double-booking (ver
  [flujos críticos](../business/critical-workflows.md)) — su comportamiento bajo alta
  concurrencia real (¿cuántas reservas simultáneas por segundo soporta un slot muy demandado?) no
  está medido.
- **`ORM_SLOW_QUERY_MS`** (ver [métricas](../observability/metrics.md)) define qué es "lento" pero
  sin una prueba de carga que establezca una línea base real de qué throughput soporta el sistema
  antes de degradar.

## Qué se necesita

1. Herramienta de carga y escenarios representativos de los flujos críticos.
2. Línea base de throughput/latencia por endpoint crítico, contra la que medir regresiones.
3. Integración con [SLO](../observability/service-level-objectives.md) una vez que existan.

## Ver también

- [Estrategia de pruebas](strategy.md), [Escalado](../operations/scaling.md).
