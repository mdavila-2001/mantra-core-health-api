# src / modules / automation / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

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
| `index.ts` | Public export barrel for this folder. |
| `knowledge_sources.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `record_automations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `workflow_runs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `workflow_steps.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `workflows.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
