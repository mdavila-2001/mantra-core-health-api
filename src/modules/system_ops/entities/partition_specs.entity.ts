import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'system_ops', tableName: 'partition_specs' })
export class PartitionSpecs {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ fieldName: 'schema_name', columnType: 'varchar' })
  schemaName!: string;

  @Property({ fieldName: 'table_name', columnType: 'varchar' })
  tableName!: string;

  @Property({ fieldName: 'entity_registry_id', type: 'uuid', nullable: true })
  entityRegistryId?: string;

  @Property({ fieldName: 'partition_strategy_concept_id', type: 'uuid' })
  partitionStrategyConceptId!: string;

  @Property({
    fieldName: 'partition_key',
    columnType: 'varchar',
    nullable: true,
  })
  partitionKey?: string;

  @Property({
    fieldName: 'partition_interval_concept_id',
    type: 'uuid',
    nullable: true,
  })
  partitionIntervalConceptId?: string;

  @Property({
    fieldName: 'subpartition_key',
    columnType: 'varchar',
    nullable: true,
  })
  subpartitionKey?: string;

  @Property({ fieldName: 'hot_tier_days', columnType: 'int', nullable: true })
  hotTierDays?: number;

  @Property({ fieldName: 'warm_tier_days', columnType: 'int', nullable: true })
  warmTierDays?: number;

  @Property({ fieldName: 'cold_tier_days', columnType: 'int', nullable: true })
  coldTierDays?: number;

  @Property({
    fieldName: 'archive_target_concept_id',
    type: 'uuid',
    nullable: true,
  })
  archiveTargetConceptId?: string;

  @Property({ fieldName: 'retention_policy_id', type: 'uuid', nullable: true })
  retentionPolicyId?: string;

  @Property({ fieldName: 'is_time_series', type: 'boolean', nullable: true })
  isTimeSeries?: boolean;

  @Property({
    fieldName: 'enforces_tenant_isolation',
    type: 'boolean',
    nullable: true,
  })
  enforcesTenantIsolation?: boolean;

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
