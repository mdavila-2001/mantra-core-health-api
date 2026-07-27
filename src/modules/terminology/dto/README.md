# Terminology · dto

Contratos de entrada y salida de los endpoints. Entrada validada con
`class-validator` + `class-transformer`; documentación OpenAPI con
`@nestjs/swagger`. Las respuestas exponen solo campos seguros (ids, códigos,
estados) y nunca filtran columnas internas.

| Archivo | Entrada | Salida |
| --- | --- | --- |
| `create-code-system.dto.ts` | `CreateCodeSystemDto` | `CodeSystemResponseDto` |
| `create-code-system-version.dto.ts` | `CreateCodeSystemVersionDto` | `CodeSystemVersionResponseDto` |
| `import-concepts.dto.ts` | `ImportConceptsDto` (+ `ImportConceptItemDto`) | `ImportConceptsResponseDto` |
| `publish-version.dto.ts` | — | `PublishVersionResponseDto` |
| `create-designation.dto.ts` | `CreateDesignationDto` (+ `ConceptPropertyInputDto`) | `DesignationResponseDto` |
| `create-relationship.dto.ts` | `CreateRelationshipDto` | `RelationshipResponseDto` |
| `create-value-set.dto.ts` | `CreateValueSetDto` (+ `ValueSetRuleInputDto`) | `ValueSetResponseDto` |
| `concept-properties.dto.ts` | `UpsertConceptPropertiesDto`, `DeprecateConceptDto` | `ConceptPropertiesResponseDto`, `DeprecateConceptResponseDto`, `LookupResponseDto` (+ `LookupDesignationDto`, `LookupPropertyDto`) |
| `expand-value-set.dto.ts` | `ExpandValueSetDto` | `ExpandValueSetResponseDto` |
| `translate-concept.dto.ts` | `TranslateConceptDto` | `TranslateResponseDto` (+ `TranslationMatchDto`) |
| `tenant-catalog-policy.dto.ts` | `UpsertTenantCatalogPolicyDto` (+ `TenantConceptConfigInputDto`) | `TenantCatalogPolicyResponseDto` |

Los enums del contrato (`language`, `designationType`, `relationshipType`,
`operator`, `equivalence`, `mode`) son códigos legibles (`ES`/`EN`,
`IS_A`/`PART_OF`, `EQUIVALENT`/`WIDER`/…, `INHERIT`/`SUBSET`/`EXTEND`). El
servicio los traduce a `*_concept_id` vía `CONCEPTS`; el cliente nunca maneja UUID
de concepto.

`TranslateConceptDto` cubre los dos caminos del mismo endpoint: con
`targetConceptId` la llamada cura el mapeo (y entonces `equivalence` es
obligatoria, validado en el servicio); sin él, sólo consulta.
