import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'forms', tableName: 'field_dependencies' })
export class FieldDependencies {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'target_field_id', type: 'uuid' }) // FK (destino no resuelto)
  targetFieldId!: string;

  @Property({ fieldName: 'source_field_id', type: 'uuid' }) // FK (destino no resuelto)
  sourceFieldId!: string;

  @Property({ fieldName: 'operator_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  operatorConceptId!: string;

  @Property({
    fieldName: 'comparison_value_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  comparisonValueJson?: unknown;

  @Property({ fieldName: 'behavior_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  behaviorConceptId!: string;

  @Property({
    fieldName: 'logical_group',
    columnType: 'varchar',
    nullable: true,
  })
  logicalGroup?: string;

  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

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
