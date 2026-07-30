# src / modules / messaging / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `adapter_event_mappings.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `adapter_inbound_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `adapter_tracking_capabilities.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `dead_letter_jobs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `delivery_receipts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `delivery_reconciliation_runs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `delivery_status_transitions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `delivery_tracking_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `domain_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `event_deliveries.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `event_subscriptions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `in_app_notifications.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `message_channels.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `message_queues.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `message_templates.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `messaging_providers.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `notification_deliveries.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `notification_requests.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `outbox_messages.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `provider_channel_configs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `queued_jobs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `recipient_preferences.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
