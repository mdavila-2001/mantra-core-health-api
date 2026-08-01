# database / SQL / 16 accounting

Agrupa los componentes relacionados con **16 accounting** y mantiene cohesionada esta responsabilidad del sistema.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `01_schema.sql` | Implementación o recurso de soporte de esta carpeta. |
| `02_tables.sql` | Implementación o recurso de soporte de esta carpeta. |
| `03_fk_intra.sql` | Implementación o recurso de soporte de esta carpeta. |
| `04_indexes.sql` | Implementación o recurso de soporte de esta carpeta. |
| `90_fk_deferred.sql` | Implementación o recurso de soporte de esta carpeta. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
