# Terminology · repositories

Acceso a datos de los catálogos de terminología. Repositorios **sin estado**: cada
método recibe el `EntityManager` activo como primer parámetro, de modo que el
servicio controla la unidad de trabajo y la transacción, y varios repositorios
pueden participar en un mismo `flush` atómico. Aquí no vive ninguna regla de
negocio; solo construcción de consultas y de entidades.

## Convenciones

- `findX(em, ...)` → `Promise<Entity | null>` (o `Set<string>` para búsquedas de
  existencia en bloque). No lanzan; devolver `null` es responsabilidad del servicio
  interpretarlo.
- `create(em, data)` construye la entidad en la unidad de trabajo **sin** `flush`.
  Los campos de auditoría se rellenan con `createdBy(actorUserId)`.
- `em.create(...)` se invoca con `{ partial: true }`: la columna `row_version`
  (`version: true`) tiene `DEFAULT 1` en base y MikroORM la gestiona, así que se
  omite del alta; `partial` evita que el tipado la exija.

## Repositorios

| Archivo | Entidades | Métodos clave |
| --- | --- | --- |
| `terminology-sources.repository.ts` | `TerminologySources` | `findByCode`, `create` |
| `code-systems.repository.ts` | `CodeSystems` | `findById`, `findByInternalCode`, `create` |
| `code-system-versions.repository.ts` | `CodeSystemVersions` | `findById`, `findByCodeSystemAndVersion`, `create` |
| `catalog-concepts.repository.ts` | `CatalogConcepts` | `findById`, `findExistingCodes`, `create` |
| `concept-designations.repository.ts` | `ConceptDesignations`, `ConceptProperties` | `createDesignation`, `createProperty` |
| `concept-relationships.repository.ts` | `ConceptRelationships` | `findEquivalent`, `create` |
| `value-sets.repository.ts` | `ValueSets`, `ValueSetVersions`, `ValueSetRules` | `findByInternalCode`, `createValueSet`, `createVersion`, `createRule` |

Las tablas hijas se agrupan con su raíz (`concept_properties` con designaciones;
versiones y reglas con `value_sets`) porque se materializan en la misma operación
de negocio.
