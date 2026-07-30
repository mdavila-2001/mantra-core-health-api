# src / modules / qa lab / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `assertion_results.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `request_payloads.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `response_payloads.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `run_artifacts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `test_assertions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `test_case_results.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `test_cases.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `test_defects.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `test_environments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `test_fixtures.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `test_runs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `test_schedules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `test_suites.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
