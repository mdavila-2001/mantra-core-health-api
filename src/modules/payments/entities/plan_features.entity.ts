import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'plan_features' })
export class PlanFeatures {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'plan_id', type: 'uuid' })
  planId!: string;

  @Property({ fieldName: 'feature_concept_id', type: 'uuid' })
  featureConceptId!: string;

  @Property({ fieldName: 'is_enabled', type: 'boolean' })
  isEnabled!: boolean;

  @Property({ fieldName: 'limit_value', columnType: 'numeric', nullable: true })
  limitValue?: string;

  @Property({
    fieldName: 'value_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  valueJson?: unknown;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' })
  stateConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
