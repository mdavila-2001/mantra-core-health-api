# src / modules / auth providers / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `account_link_requests.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `federated_identities.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `federated_login_attempts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `identity_providers.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `provider_attribute_mappings.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `provider_protocol_configs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `provider_signing_keys.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `provider_tenant_bindings.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `provisioning_rules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
