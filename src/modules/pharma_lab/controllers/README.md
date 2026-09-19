# src / modules / pharma_lab / controllers

Adaptadores HTTP que validan solicitudes, aplican autorización y delegan la lógica en servicios.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `medical-visitors.controller.ts` | Adaptador HTTP del dominio. |
| `pharma-catalog.controller.ts` | Adaptador HTTP del dominio. |
| `pharma-lab-social.controller.ts` | Adaptador HTTP del dominio. |
| `pharma-labs.controller.ts` | Adaptador HTTP del dominio. |
| `pharmacovigilance.controller.ts` | Adaptador HTTP del dominio. |
| `regulatory-documents.controller.ts` | Adaptador HTTP del dominio. |
| `visit-agenda.controller.ts` | Adaptador HTTP del dominio. |
| `visit-records.controller.ts` | Adaptador HTTP del dominio. |
| `visit-requests.controller.ts` | Adaptador HTTP del dominio. |
| `visit-surveys.controller.ts` | Adaptador HTTP del dominio. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
