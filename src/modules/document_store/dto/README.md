# src / modules / document store / dto

Contratos de entrada y salida, validación y documentación de la API.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `create-document.dto.ts` | Contratos validados de entrada y salida. |
| `document-response.dto.ts` | Contratos validados de entrada y salida. |
| `index.ts` | Public export barrel for this folder. |
| `list-documents-query.dto.ts` | Contratos validados de entrada y salida. |
| `tenant-scope-query.dto.ts` | Contratos validados de entrada y salida. |
| `update-document.dto.ts` | Contratos validados de entrada y salida. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
