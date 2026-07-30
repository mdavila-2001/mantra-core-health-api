# docker / db init

Agrupa los componentes relacionados con **db init** y mantiene cohesionada esta responsabilidad del sistema.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `init-mongo.sh` | Implementación o recurso de soporte de esta carpeta. |
| `init-opensearch.sh` | Implementación o recurso de soporte de esta carpeta. |
| `init-postgres.sh` | Implementación o recurso de soporte de esta carpeta. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
