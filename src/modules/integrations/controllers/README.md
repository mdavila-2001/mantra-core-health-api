# src / modules / integrations / controllers

Adaptadores HTTP que validan solicitudes, aplican autorización y delegan la lógica en servicios.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `integrations-connections.controller.spec.ts` | Pruebas unitarias del componente homónimo. |
| `integrations-connections.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `integrations-messages.controller.spec.ts` | Pruebas unitarias del componente homónimo. |
| `integrations-messages.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `integrations-providers.controller.spec.ts` | Pruebas unitarias del componente homónimo. |
| `integrations-providers.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `integrations-webhooks.controller.ts` | Endpoints HTTP y adaptación del transporte. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.

## Lecturas de colección

`IntegrationsCollectionsController` (`integrations-collections.controller.ts`) expone los `GET` de colección que pedía el catálogo de vistas: `GET /integrations/connections` (V12-08), `GET /integrations/providers/{id}/connections` (V12-11), `GET /integrations/providers/{id}/webhook-subscriptions` (V12-13). Cada handler declara el mismo `@Roles(...)` que las escrituras del recurso; la página la acota al tenant del contexto el servicio.
