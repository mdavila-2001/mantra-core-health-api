# src / modules / chart / controllers

Adaptadores HTTP que validan solicitudes, aplican autorización y delegan la lógica en servicios.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `chart-care-plans.controller.spec.ts` | Pruebas unitarias del componente homónimo. |
| `chart-care-plans.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `chart-documents.controller.spec.ts` | Pruebas unitarias del componente homónimo. |
| `chart-documents.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `chart-notes.controller.spec.ts` | Pruebas unitarias del componente homónimo. |
| `chart-notes.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `chart-templates.controller.spec.ts` | Pruebas unitarias del componente homónimo. |
| `chart-templates.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `index.ts` | Punto de exportación pública de la carpeta. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
