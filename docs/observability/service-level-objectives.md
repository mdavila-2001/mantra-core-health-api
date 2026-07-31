# Objetivos de nivel de servicio (SLO)

> Fase 14. **Sin SLO formales definidos** en el repositorio. Esta página no inventa números de
> disponibilidad/latencia sin evidencia — documenta qué se necesita para definirlos honestamente y
> qué candidatos de negocio ya identificó [flujos críticos](../business/critical-workflows.md).

## Por qué no hay SLO todavía

Un SLO requiere (a) una métrica real que medirlo, y (b) una decisión de negocio sobre el umbral
aceptable. La brecha de [métricas](metrics.md) — sin datos de latencia/error HTTP expuestos —
significa que cualquier SLO definido hoy sería un número sin forma de verificarse. Definir SLO
antes de tener métricas sería documentación de apariencia, exactamente lo que este plan maestro
prohíbe.

## Candidatos de negocio a SLO (identificados, no cuantificados)

De [flujos críticos](../business/critical-workflows.md):

- Latencia de evaluación de decisión del PDP clínico (`authz`) — un profesional esperando acceso a
  PHI en una urgencia no puede esperar segundos.
- Tasa de éxito de confirmación de hold de cita antes de expirar (`scheduling`, TTL 300s por
  defecto) — mide si el flujo de reserva es usable bajo carga real.
- Tiempo entre publicación de un evento de dominio y su entrega al suscriptor final
  (`messaging`) — relevante para notificaciones clínicas/administrativas sensibles al tiempo.
- Disponibilidad de la API (`GET /health`) — sonda de liveness ya existe; sin SLO de disponibilidad
  formal encima.

## Qué se necesita para definir SLO reales

1. Cerrar [métricas](metrics.md) — sin datos, no hay SLO verificable.
2. Que negocio (no solo ingeniería) decida los umbrales aceptables por flujo crítico.
3. Definir SLI (indicador) → SLO (objetivo) → error budget, y a quién le pertenece cada uno.

## Ver también

- [Métricas](metrics.md), [Flujos críticos](../business/critical-workflows.md).
