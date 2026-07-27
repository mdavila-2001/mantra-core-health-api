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
| `code-systems.repository.ts` | `CodeSystems` | `findById`, `findByInternalCode`, `findByCanonicalUrl`, `create` |
| `code-system-versions.repository.ts` | `CodeSystemVersions` | `findById`, `findByCodeSystemAndVersion`, `findDefaultActiveVersion`, `create` |
| `catalog-concepts.repository.ts` | `CatalogConcepts` | `findById`, `findByIdForUpdate`, `findExistingCodes`, `findByVersionAndCode`, `findByVersion`, `create` |
| `concept-designations.repository.ts` | `ConceptDesignations`, `ConceptProperties` | `createDesignation`, `createProperty`, `findByLanguageForUpdate`, `findByConcept`, `findProperty`, `findPropertiesByConcept`, `findPropertyForConcepts` |
| `concept-relationships.repository.ts` | `ConceptRelationships` | `findEquivalent`, `findByTypeForSources`, `create` |
| `value-sets.repository.ts` | `ValueSets`, `ValueSetVersions`, `ValueSetRules`, `ValueSetMembers` | `findById`, `findByInternalCode`, `createValueSet`, `createVersion`, `createRule`, `findVersionForUpdate`, `findDefaultVersionsForUpdate`, `findRulesByVersion`, `deleteMembersByVersion`, `createMember`, `findMembersByConceptForUpdate` |
| `concept-maps.repository.ts` | `ConceptMaps` | `findEquivalent`, `findByIdForUpdate`, `findTranslations`, `create` |
| `tenant-catalog.repository.ts` | `TenantCatalogPolicies`, `TenantConceptConfig` | `findPolicyForUpdate`, `createPolicy`, `findConfig`, `findDefaultsForUpdate`, `createConfig` |

Las tablas hijas se agrupan con su raíz (`concept_properties` con designaciones;
versiones, reglas y miembros con `value_sets`; la configuración por concepto con
la política del tenant) porque se materializan en la misma operación de negocio.

## Bloqueos y consultas en bloque

- Los métodos `…ForUpdate` aplican `LockMode.PESSIMISTIC_WRITE` (`SELECT … FOR
  UPDATE`). Existen donde el caso de uso declara una invariante de "sólo uno"
  (designación preferida por idioma, versión por defecto, `is_default` del tenant)
  o una competencia por la misma fila (retirada de concepto, recurado de un mapeo).
- `findByTypeForSources`, `findPropertyForConcepts` y `findExistingCodes` reciben
  listas y resuelven en una sola query: la expansión de un conjunto de valores
  recorre el catálogo entero y hacerlo concepto a concepto sería un N+1.
