# src / common / dto

Contratos de entrada y salida, validación y documentación de la API.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `bulk-load.dto.ts` | Cuerpo y respuesta de la carga masiva, compartidos por `pharmacy` y `pharmacy_inventory`. |
| `medical-facility.dto.ts` | Contratos validados de entrada y salida. |
| `page-response.dto.ts` | Contratos validados de entrada y salida. |
| `pagination-query.dto.ts` | Contratos validados de entrada y salida. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
