import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `canonical_resource_relationships`.
 */
@Entity({
  schema: 'health_data',
  tableName: 'canonical_resource_relationships',
})
export class CanonicalResourceRelationships {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a source resource.
   */
  @Property({ fieldName: 'source_resource_id', type: 'uuid' }) // FK → health_data.canonical_health_resources
  sourceResourceId!: string;

  /**
   * Identificador asociado a target resource.
   */
  @Property({ fieldName: 'target_resource_id', type: 'uuid' }) // FK → health_data.canonical_health_resources
  targetResourceId!: string;

  /**
   * Identificador asociado a relationship type concept.
   */
  @Property({ fieldName: 'relationship_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  relationshipTypeConceptId!: string;

  /**
   * Identificador asociado a relationship role concept.
   */
  @Property({
    fieldName: 'relationship_role_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  relationshipRoleConceptId?: string;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  /**
   * Valor de effective to mantenido por la instancia.
   */
  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

  /**
   * Valor de confidence score mantenido por la instancia.
   */
  @Property({
    fieldName: 'confidence_score',
    columnType: 'numeric(8,5)',
    nullable: true,
  })
  confidenceScore?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
