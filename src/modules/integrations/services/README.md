# src / modules / integrations / services

Casos de uso, reglas de negocio y coordinación transaccional.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `integrations-connections.service.spec.ts` | Pruebas unitarias del componente homónimo. |
| `integrations-connections.service.ts` | Casos de uso y reglas de negocio. |
| `integrations-messaging.service.spec.ts` | Pruebas unitarias del componente homónimo. |
| `integrations-messaging.service.ts` | Casos de uso y reglas de negocio. |
| `integrations-providers.service.spec.ts` | Pruebas unitarias del componente homónimo. |
| `integrations-providers.service.ts` | Casos de uso y reglas de negocio. |
| `integrations-webhooks.service.spec.ts` | Pruebas unitarias del componente homónimo. |
| `integrations-webhooks.service.ts` | Casos de uso y reglas de negocio. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
