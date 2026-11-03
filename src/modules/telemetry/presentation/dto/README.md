# src / modules / telemetry / presentation / dto

Contratos de entrada y salida, validación y documentación de la API.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `activity-event.dto.ts` | Contratos validados de entrada y salida. |
| `analytics-subject.dto.ts` | Contratos validados de entrada y salida. |
| `client-context.dto.ts` | Contratos validados de entrada y salida. |
| `conversion-event.dto.ts` | Contratos validados de entrada y salida. |
| `disclosure-acceptance.dto.ts` | Contratos validados de entrada y salida. |
| `disclosure-version.dto.ts` | Contratos validados de entrada y salida. |
| `event-schema.dto.ts` | Contratos validados de entrada y salida. |
| `funnel.dto.ts` | Contratos validados de entrada y salida. |
| `index.ts` | Public export barrel for this folder. |
| `session-journey.dto.ts` | Contratos validados de entrada y salida. |
| `tracking-consent.dto.ts` | Contratos validados de entrada y salida. |
| `tracking-purpose.dto.ts` | Contratos validados de entrada y salida. |
| `web-vital.dto.ts` | Contratos validados de entrada y salida. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
