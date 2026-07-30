# src / modules / identity assurance / dto

Contratos de entrada y salida, validación y documentación de la API.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `create-authority-endpoint.dto.ts` | Contratos validados de entrada y salida. |
| `create-authority.dto.ts` | Contratos validados de entrada y salida. |
| `create-policy.dto.ts` | Contratos validados de entrada y salida. |
| `identity-responses.dto.ts` | Contratos validados de entrada y salida. |
| `index.ts` | Punto de exportación pública de la carpeta. |
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

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
