# src / modules / platform ops / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `artifacts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `capacity_measurements.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `capacity_plans.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `change_approvals.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `change_requests.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `component_tools.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `deployments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `error_budget_burn_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `error_budget_policies.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `escalation_policies.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `escalation_policy_steps.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `health_check_runs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `health_checks.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `health_incidents.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `incident_communications.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `incident_responders.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `incident_timeline_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `maintenance_windows.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `on_call_schedules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `on_call_shifts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `operational_improvement_items.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `operational_readiness_reviews.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `operational_teams.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `postmortem_action_items.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `postmortems.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `readiness_review_findings.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `recovery_objectives.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `resilience_exercises.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `runbook_executions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `runbook_versions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `runbooks.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `service_components.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `service_dependencies.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `service_level_indicators.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `service_level_objectives.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `service_ownerships.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `slo_measurements.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `tool_registry.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
