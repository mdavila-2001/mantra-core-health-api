# src / modules / document store / repositories

Consultas y operaciones de persistencia aisladas de la lógica de negocio.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `document-store.repository.ts` | Consultas y operaciones de persistencia. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `mongo-connection.provider.ts` | Implementación o recurso de soporte de esta carpeta. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
