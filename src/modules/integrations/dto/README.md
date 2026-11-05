# src / modules / integrations / dto

Contratos de entrada y salida, validación y documentación de la API.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `dispatch-message.dto.ts` | Contratos validados de entrada y salida. |
| `enqueue-outbound.dto.ts` | Contratos validados de entrada y salida. |
| `inbound-webhook.dto.ts` | Contratos validados de entrada y salida. |
| `index.ts` | Public export barrel for this folder. |
| `provision-connection.dto.ts` | Contratos validados de entrada y salida. |
| `publish-endpoint.dto.ts` | Contratos validados de entrada y salida. |
| `register-provider.dto.ts` | Contratos validados de entrada y salida. |
| `responses.dto.ts` | Contratos validados de entrada y salida. |
| `rotate-credential.dto.ts` | Contratos validados de entrada y salida. |
| `webhook-subscription.dto.ts` | Contratos validados de entrada y salida. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
