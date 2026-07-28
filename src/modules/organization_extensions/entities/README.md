# src / modules / organization extensions / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `data_use_agreements.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `facility_licenses.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `hospital_service_lines.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `hospitals.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `organization_affiliations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `organization_data_boundaries.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
