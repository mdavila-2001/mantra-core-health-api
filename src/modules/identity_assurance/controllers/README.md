# src / modules / identity assurance / controllers

Adaptadores HTTP que validan solicitudes, aplican autorización y delegan la lógica en servicios.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `identity-assertions.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `identity-authorities.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `identity-cases.controller.spec.ts` | Pruebas unitarias del componente homónimo. |
| `identity-cases.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `identity-checks.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `identity-endpoints.controller.spec.ts` | Pruebas unitarias del componente homónimo. |
| `identity-manual-review.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `identity-policies.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `index.ts` | Punto de exportación pública de la carpeta. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
