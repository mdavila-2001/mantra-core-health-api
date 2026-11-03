# src / modules / forms / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `dynamic_field_definitions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `dynamic_field_sections.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `extension_target_policies.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `field_assignments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `field_definition_localizations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `field_definition_set_versions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `field_definition_sets.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `field_dependencies.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `field_schema_migrations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `field_set_members.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `field_validation_rules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `field_value_access_rules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `field_value_audit.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `field_value_provenance.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `field_values.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `form_instances.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Public export barrel for this folder. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
