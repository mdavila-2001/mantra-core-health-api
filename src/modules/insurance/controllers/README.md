# src / modules / insurance / controllers

Adaptadores HTTP que validan solicitudes, aplican autorización y delegan la lógica en servicios.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `appeals.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `broker-commission.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `claims.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `coverage.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `insurance-backbone.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `insurance-read.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `prior-auth.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `reconciliation.controller.ts` | Endpoints HTTP y adaptación del transporte. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
