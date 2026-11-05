# src / modules / qa lab / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

| Archivo                       | Responsabilidad                                    |
| ----------------------------- | -------------------------------------------------- |
| `assertion_results.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts`                    | Public export barrel for this folder.        |
| `request_payloads.entity.ts`  | Mapeo de una entidad persistente y sus relaciones. |
| `response_payloads.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `run_artifacts.entity.ts`     | Mapeo de una entidad persistente y sus relaciones. |
| `test_assertions.entity.ts`   | Mapeo de una entidad persistente y sus relaciones. |
| `test_case_results.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `test_cases.entity.ts`        | Mapeo de una entidad persistente y sus relaciones. |
| `test_defects.entity.ts`      | Mapeo de una entidad persistente y sus relaciones. |
| `test_environments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `test_fixtures.entity.ts`     | Mapeo de una entidad persistente y sus relaciones. |
| `test_runs.entity.ts`         | Mapeo de una entidad persistente y sus relaciones. |
| `test_schedules.entity.ts`    | Mapeo de una entidad persistente y sus relaciones. |
| `test_suites.entity.ts`       | Mapeo de una entidad persistente y sus relaciones. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
