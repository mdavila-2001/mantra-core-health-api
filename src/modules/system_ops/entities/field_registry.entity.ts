import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'system_ops', tableName: 'field_registry' })
export class FieldRegistry {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'entity_registry_id', type: 'uuid' }) // FK → system_ops.entity_registry
  entityRegistryId!: string;

  @Property({ fieldName: 'column_name', columnType: 'varchar' })
  columnName!: string;

  @Property({ fieldName: 'classification_id', type: 'uuid', nullable: true }) // FK → system_ops.data_classifications
  classificationId?: string;

  @Property({ fieldName: 'is_pii', type: 'boolean', nullable: true })
  isPii?: boolean;

  @Property({ fieldName: 'is_phi', type: 'boolean', nullable: true })
  isPhi?: boolean;

  @Property({
    fieldName: 'masking_strategy_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  maskingStrategyConceptId?: string;

  @Property({
    fieldName: 'anonymization_rule_id',
    type: 'uuid',
    nullable: true,
  }) // FK → system_ops.anonymization_rules
  anonymizationRuleId?: string;

  @Property({ columnType: 'text', nullable: true })
  notes?: string;

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
