# src / modules / automation / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `agent_guardrails.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `agent_memory.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `agent_run_steps.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `agent_runs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `agent_tool_bindings.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `agent_tools.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `agent_versions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `agents.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `automation_approvals.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `automation_triggers.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `guardrail_policies.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `knowledge_sources.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `record_automations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `workflow_runs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `workflow_steps.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `workflows.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
