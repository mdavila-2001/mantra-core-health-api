# src / modules / insurance / dto

Contratos de entrada y salida, validación y documentación de la API.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `appeals.dto.ts` | Contratos validados de entrada y salida. |
| `backbone.dto.ts` | Contratos validados de entrada y salida. |
| `broker-commission.dto.ts` | Contratos validados de entrada y salida. |
| `read.dto.ts` | Contratos validados de entrada y salida. |
| `claims.dto.ts` | Contratos validados de entrada y salida. |
| `common.dto.ts` | Contratos validados de entrada y salida. |
| `coverage.dto.ts` | Contratos validados de entrada y salida. |
| `index.ts` | Public export barrel for this folder. |
| `prior-auth.dto.ts` | Contratos validados de entrada y salida. |
| `reconciliation.dto.ts` | Contratos validados de entrada y salida. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
