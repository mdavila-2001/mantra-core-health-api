import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'insight_breakdown_definitions' })
export class InsightBreakdownDefinitions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'platform_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  platformConceptId!: string;

  @Property({ fieldName: 'breakdown_code', columnType: 'varchar' })
  breakdownCode!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({
    fieldName: 'compatible_metrics_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  compatibleMetricsJson?: unknown;

  @Property({
    fieldName: 'privacy_threshold_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  privacyThresholdJson?: unknown;

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
