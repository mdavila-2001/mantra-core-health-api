import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ schema: 'observability', tableName: 'rollup_watermarks' })
export class RollupWatermarks {
  @PrimaryKey({ fieldName: 'rollup_name', columnType: 'varchar' })
  rollupName!: string;

  @Property({ fieldName: 'materialized_until', columnType: 'timestamptz' })
  materializedUntil!: Date;

  @Property({
    fieldName: 'last_run_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastRunAt?: Date;

  @Property({
    fieldName: 'last_duration_ms',
    columnType: 'int',
    nullable: true,
  })
  lastDurationMs?: number;

  @Property({ fieldName: 'last_error', columnType: 'varchar', nullable: true })
  lastError?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
