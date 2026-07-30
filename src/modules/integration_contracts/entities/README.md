# src / modules / integration contracts / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `contract_webhook_subscriptions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `integration_auth_profiles.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `integration_contract_versions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `integration_contracts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `integration_exchange_attempts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `integration_exchange_records.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `integration_idempotency_records.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `integration_sync_cursors.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `webhook_delivery_evidence.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
