import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ schema: 'time_series', tableName: 'service_sli_series' })
export class ServiceSliSeries {
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

  @Property({ fieldName: 'service_id', type: 'uuid' })
  serviceId!: string;

  @Property({ fieldName: 'sli_code', columnType: 'varchar' })
  sliCode!: string;

  @Property({ columnType: 'double precision' })
  numerator!: number;

  @Property({ columnType: 'double precision' })
  denominator!: number;

  @Property({ columnType: 'double precision' })
  value!: number;

  @Property({ fieldName: 'region_code', columnType: 'varchar', nullable: true })
  regionCode?: string;

  @Property({ type: 'json', columnType: 'jsonb', nullable: true })
  dimensions?: unknown;
}
