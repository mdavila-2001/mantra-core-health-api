# src / modules / identity assurance / dto

Contratos de entrada y salida, validación y documentación de la API.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `create-authority-endpoint.dto.ts` | Contratos validados de entrada y salida. |
| `create-authority.dto.ts` | Contratos validados de entrada y salida. |
| `create-policy.dto.ts` | Contratos validados de entrada y salida. |
| `identity-responses.dto.ts` | Contratos validados de entrada y salida. |
| `index.ts` | Public export barrel for this folder. |
| `issue-assertion.dto.ts` | Contratos validados de entrada y salida. |
| `open-case.dto.ts` | Contratos validados de entrada y salida. |
| `open-manual-review.dto.ts` | Contratos validados de entrada y salida. |
| `plan-checks.dto.ts` | Contratos validados de entrada y salida. |
| `raise-fraud-signal.dto.ts` | Contratos validados de entrada y salida. |
| `record-attempt.dto.ts` | Contratos validados de entrada y salida. |
| `record-result.dto.ts` | Contratos validados de entrada y salida. |
| `review-decision.dto.ts` | Contratos validados de entrada y salida. |
| `revoke-assertion.dto.ts` | Contratos validados de entrada y salida. |
| `submit-evidence.dto.ts` | Contratos validados de entrada y salida. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
