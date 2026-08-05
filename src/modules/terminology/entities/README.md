# src / modules / terminology / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `catalog_concepts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `catalog_import_batches.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `code_system_versions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `code_systems.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `concept_designations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `concept_maps.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `concept_properties.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `concept_relationships.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `tenant_catalog_policies.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `tenant_concept_config.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `terminology_sources.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `value_set_members.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `value_set_rules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `value_set_versions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `value_sets.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
