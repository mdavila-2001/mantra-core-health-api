# src / modules / iam / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `account_activations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `account_lockouts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `api_key_scopes.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `api_keys.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `authentication_credentials.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `devices.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `mfa_factors.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `refresh_tokens.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `security_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `sessions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `user_global_roles.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `users.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
