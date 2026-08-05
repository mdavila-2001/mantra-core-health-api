# src / modules / common / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `addresses.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `contact_points.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `file_derivatives.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `file_links.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `file_versions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `files.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `identifiers.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
