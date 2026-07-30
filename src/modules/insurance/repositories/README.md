# src / modules / insurance / repositories

Consultas y operaciones de persistencia aisladas de la lógica de negocio.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `catalog.repository.ts` | Consultas y operaciones de persistencia. |
| `claim.repository.ts` | Consultas y operaciones de persistencia. |
| `coverage.repository.ts` | Consultas y operaciones de persistencia. |
| `dispute.repository.ts` | Consultas y operaciones de persistencia. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `prior-auth.repository.ts` | Consultas y operaciones de persistencia. |
| `settlement.repository.ts` | Consultas y operaciones de persistencia. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
