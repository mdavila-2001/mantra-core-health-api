import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ schema: 'time_series', tableName: 'audit_access_metric_series' })
export class AuditAccessMetricSeries {
  @PrimaryKey({ columnType: 'timestamptz' })
  time!: Date;

  @PrimaryKey({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @PrimaryKey({ fieldName: 'series_id', columnType: 'varchar' })
  seriesId!: string;

  @Property({ fieldName: 'ingestion_id', type: 'uuid' })
  ingestionId!: string;

  @Property({ fieldName: 'source_version', columnType: 'varchar' })
  sourceVersion!: string;

  @Property({ fieldName: 'quality_state', columnType: 'varchar' })
  qualityState!: string;

  @Property({ fieldName: 'actor_type', columnType: 'varchar' })
  actorType!: string;

  @Property({ fieldName: 'actor_id', type: 'uuid' })
  actorId!: string;

  @Property({ fieldName: 'action_code', columnType: 'varchar' })
  actionCode!: string;

  @Property({ fieldName: 'target_type', columnType: 'varchar' })
  targetType!: string;

  @Property({ columnType: 'varchar' })
  outcome!: string;

  @Property({ columnType: 'bigint' })
  count!: string;

  @Property({ type: 'json', columnType: 'jsonb', nullable: true })
  dimensions?: unknown;
}
