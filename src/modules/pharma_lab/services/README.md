# src / modules / pharma_lab / services

Casos de uso, reglas de negocio y coordinación transaccional.

## Contenido

### Archivos

| Archivo                                | Responsabilidad                             |
| -------------------------------------- | ------------------------------------------- |
| `index.ts`                             | Punto de exportación pública de la carpeta. |
| `medical-visitors.service.spec.ts`     | Pruebas unitarias del componente.           |
| `medical-visitors.service.ts`          | Casos de uso y reglas de negocio.           |
| `pharma-analytics.service.ts`          | Casos de uso y reglas de negocio.           |
| `pharma-catalog.service.spec.ts`       | Pruebas unitarias del componente.           |
| `pharma-catalog.service.ts`            | Casos de uso y reglas de negocio.           |
| `pharma-lab-access.service.spec.ts`    | Pruebas unitarias del componente.           |
| `pharma-lab-access.service.ts`         | Casos de uso y reglas de negocio.           |
| `pharma-lab-notifications.service.ts`  | Casos de uso y reglas de negocio.           |
| `pharma-lab-organization.service.ts`   | Casos de uso y reglas de negocio.           |
| `pharma-social.service.ts`             | Casos de uso y reglas de negocio.           |
| `pharmacovigilance.service.spec.ts`    | Pruebas unitarias del componente.           |
| `pharmacovigilance.service.ts`         | Casos de uso y reglas de negocio.           |
| `regulatory-documents.service.spec.ts` | Pruebas unitarias del componente.           |
| `regulatory-documents.service.ts`      | Casos de uso y reglas de negocio.           |
| `visit-agenda.service.spec.ts`         | Pruebas unitarias del componente.           |
| `visit-agenda.service.ts`              | Casos de uso y reglas de negocio.           |
| `visit-records.service.spec.ts`        | Pruebas unitarias del componente.           |
| `visit-records.service.ts`             | Casos de uso y reglas de negocio.           |
| `visit-requests.service.spec.ts`       | Pruebas unitarias del componente.           |
| `visit-requests.service.ts`            | Casos de uso y reglas de negocio.           |
| `visit-surveys.service.ts`             | Casos de uso y reglas de negocio.           |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
