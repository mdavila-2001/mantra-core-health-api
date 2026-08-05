# src / modules / integrations / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `external_providers.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `inbound_messages.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `integration_endpoints.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `integration_field_mappings.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `message_responses.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `message_retries.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `outbound_messages.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `provider_connections.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `provider_credentials.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `webhook_subscriptions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
