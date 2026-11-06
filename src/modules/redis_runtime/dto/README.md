# src / modules / redis runtime / dto

Contratos de entrada y salida, validación y documentación de la API.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `acquire-lock.dto.ts` | Contratos validados de entrada y salida. |
| `index.ts` | Public export barrel for this folder. |
| `redis-responses.dto.ts` | Contratos validados de entrada y salida. |
| `release-lock.query.ts` | Support implementation or resource for this folder. |
| `set-cache.dto.ts` | Contratos validados de entrada y salida. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
