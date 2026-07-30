# src / modules / identity assurance / repositories

Consultas y operaciones de persistencia aisladas de la lógica de negocio.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `identity-assertions.repository.ts` | Consultas y operaciones de persistencia. |
| `identity-authorities.repository.ts` | Consultas y operaciones de persistencia. |
| `identity-cases.repository.ts` | Consultas y operaciones de persistencia. |
| `identity-checks.repository.ts` | Consultas y operaciones de persistencia. |
| `identity-evidence.repository.ts` | Consultas y operaciones de persistencia. |
| `identity-fraud-signals.repository.ts` | Consultas y operaciones de persistencia. |
| `identity-manual-review.repository.ts` | Consultas y operaciones de persistencia. |
| `identity-policies.repository.ts` | Consultas y operaciones de persistencia. |
| `index.ts` | Punto de exportación pública de la carpeta. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
