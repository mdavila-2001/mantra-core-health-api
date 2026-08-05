# src / modules / integrations / dto

Contratos de entrada y salida, validación y documentación de la API.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `dispatch-message.dto.ts` | Contratos validados de entrada y salida. |
| `enqueue-outbound.dto.ts` | Contratos validados de entrada y salida. |
| `inbound-webhook.dto.ts` | Contratos validados de entrada y salida. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `provision-connection.dto.ts` | Contratos validados de entrada y salida. |
| `publish-endpoint.dto.ts` | Contratos validados de entrada y salida. |
| `register-provider.dto.ts` | Contratos validados de entrada y salida. |
| `responses.dto.ts` | Contratos validados de entrada y salida. |
| `rotate-credential.dto.ts` | Contratos validados de entrada y salida. |
| `webhook-subscription.dto.ts` | Contratos validados de entrada y salida. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
