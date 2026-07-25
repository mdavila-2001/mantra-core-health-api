import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ schema: 'time_series', tableName: 'lab_analyzer_event_series' })
export class LabAnalyzerEventSeries {
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

  @Property({ fieldName: 'analyzer_id', type: 'uuid' })
  analyzerId!: string;

  @Property({ fieldName: 'accession_id', type: 'uuid' })
  accessionId!: string;

  @Property({ fieldName: 'event_code', columnType: 'varchar' })
  eventCode!: string;

  @Property({ fieldName: 'test_code', columnType: 'varchar', nullable: true })
  testCode?: string;

  @Property({
    fieldName: 'numeric_value',
    columnType: 'double precision',
    nullable: true,
  })
  numericValue?: number;

  @Property({ fieldName: 'unit_code', columnType: 'varchar', nullable: true })
  unitCode?: string;

  @Property({ type: 'json', columnType: 'jsonb', nullable: true })
  details?: unknown;
}
