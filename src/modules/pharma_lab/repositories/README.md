# src / modules / pharma_lab / repositories

Consultas y operaciones de persistencia aisladas de la lógica de negocio.

## Contenido

### Archivos

| Archivo                           | Responsabilidad                                 |
| --------------------------------- | ----------------------------------------------- |
| `agenda.repository.ts`            | Acceso a datos aislado de la lógica de negocio. |
| `analytics.repository.ts`         | Acceso a datos aislado de la lógica de negocio. |
| `catalog.repository.ts`           | Acceso a datos aislado de la lógica de negocio. |
| `doctor-calendar.repository.ts`   | Acceso a datos aislado de la lógica de negocio. |
| `index.ts`                        | Punto de exportación pública de la carpeta.     |
| `organization.repository.ts`      | Acceso a datos aislado de la lógica de negocio. |
| `pharmacovigilance.repository.ts` | Acceso a datos aislado de la lógica de negocio. |
| `regulatory.repository.ts`        | Acceso a datos aislado de la lógica de negocio. |
| `surveys.repository.ts`           | Acceso a datos aislado de la lógica de negocio. |
| `visitors.repository.ts`          | Acceso a datos aislado de la lógica de negocio. |
| `visits.repository.ts`            | Acceso a datos aislado de la lógica de negocio. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
