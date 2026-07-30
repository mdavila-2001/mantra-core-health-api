# src / modules / pharmacy inventory / controllers

Adaptadores HTTP que validan solicitudes, aplican autorización y delegan la lógica en servicios.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `pharmacy-dispensing.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `pharmacy-inventory-internal.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `pharmacy-inventory.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `pharmacy-procurement.controller.ts` | Endpoints HTTP y adaptación del transporte. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
