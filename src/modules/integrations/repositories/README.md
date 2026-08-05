# src / modules / integrations / repositories

Consultas y operaciones de persistencia aisladas de la lógica de negocio.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `external-providers.repository.ts` | Consultas y operaciones de persistencia. |
| `inbound-messages.repository.ts` | Consultas y operaciones de persistencia. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `integration-endpoints.repository.ts` | Consultas y operaciones de persistencia. |
| `message-responses.repository.ts` | Consultas y operaciones de persistencia. |
| `message-retries.repository.ts` | Consultas y operaciones de persistencia. |
| `outbound-messages.repository.ts` | Consultas y operaciones de persistencia. |
| `provider-connections.repository.ts` | Consultas y operaciones de persistencia. |
| `provider-credentials.repository.ts` | Consultas y operaciones de persistencia. |
| `webhook-subscriptions.repository.ts` | Consultas y operaciones de persistencia. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
