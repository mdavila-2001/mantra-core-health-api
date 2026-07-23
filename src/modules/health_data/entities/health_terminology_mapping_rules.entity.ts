import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'health_data',
  tableName: 'health_terminology_mapping_rules',
})
export class HealthTerminologyMappingRules {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'health_terminology_mapping_set_id', type: 'uuid' }) // FK → health_data.health_terminology_mapping_sets
  healthTerminologyMappingSetId!: string;

  @Property({ fieldName: 'source_code', columnType: 'varchar' })
  sourceCode!: string;

  @Property({ fieldName: 'target_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  targetConceptId!: string;

  @Property({ fieldName: 'equivalence_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  equivalenceConceptId!: string;

  @Property({
    fieldName: 'context_expression',
    columnType: 'text',
    nullable: true,
  })
  contextExpression?: string;

  @Property({
    fieldName: 'confidence_score',
    columnType: 'numeric(8,5)',
    nullable: true,
  })
  confidenceScore?: string;

  @Property({
    fieldName: 'mapping_comment',
    columnType: 'text',
    nullable: true,
  })
  mappingComment?: string;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
