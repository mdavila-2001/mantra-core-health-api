import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'health_data',
  tableName: 'canonical_resource_relationships',
})
export class CanonicalResourceRelationships {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'source_resource_id', type: 'uuid' }) // FK (destino no resuelto)
  sourceResourceId!: string;

  @Property({ fieldName: 'target_resource_id', type: 'uuid' }) // FK (destino no resuelto)
  targetResourceId!: string;

  @Property({ fieldName: 'relationship_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  relationshipTypeConceptId!: string;

  @Property({
    fieldName: 'relationship_role_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  relationshipRoleConceptId?: string;

  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

  @Property({
    fieldName: 'confidence_score',
    columnType: 'numeric(8,5)',
    nullable: true,
  })
  confidenceScore?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
