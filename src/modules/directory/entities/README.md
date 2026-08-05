# src / modules / directory / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `branch_memberships.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `branches.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `tenant_affiliation_documents.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `tenant_legal_representatives.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `tenant_memberships.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `tenant_web_configs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `tenants.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
