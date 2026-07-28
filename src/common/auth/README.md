# src / common / auth

Agrupa los componentes relacionados con **auth** y mantiene cohesionada esta responsabilidad del sistema.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `auth.env.ts` | Implementación o recurso de soporte de esta carpeta. |
| `auth.module.ts` | Composición de dependencias del módulo NestJS. |
| `authenticated-user.interface.ts` | Implementación o recurso de soporte de esta carpeta. |
| `current-user.decorator.ts` | Implementación o recurso de soporte de esta carpeta. |
| `jwt-auth.guard.ts` | Implementación o recurso de soporte de esta carpeta. |
| `jwt-payload.interface.ts` | Implementación o recurso de soporte de esta carpeta. |
| `jwt.strategy.ts` | Implementación o recurso de soporte de esta carpeta. |
| `public.decorator.ts` | Implementación o recurso de soporte de esta carpeta. |
| `roles.decorator.ts` | Implementación o recurso de soporte de esta carpeta. |
| `roles.guard.ts` | Implementación o recurso de soporte de esta carpeta. |
| `token.service.ts` | Casos de uso y reglas de negocio. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
