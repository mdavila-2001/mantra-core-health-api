import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'platform_ops', tableName: 'service_level_objectives' })
export class ServiceLevelObjectives {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'service_level_indicator_id', type: 'uuid' }) // FK → platform_ops.service_level_indicators
  serviceLevelIndicatorId!: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ fieldName: 'target_value', columnType: 'numeric(12,8)' })
  targetValue!: string;

  @Property({ fieldName: 'rolling_window_seconds', type: 'bigint' })
  rollingWindowSeconds!: string;

  @Property({
    fieldName: 'warning_threshold',
    columnType: 'numeric(12,8)',
    nullable: true,
  })
  warningThreshold?: string;

  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

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
