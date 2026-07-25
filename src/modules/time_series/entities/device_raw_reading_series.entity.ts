import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ schema: 'time_series', tableName: 'device_raw_reading_series' })
export class DeviceRawReadingSeries {
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

  @Property({ fieldName: 'device_id', type: 'uuid' })
  deviceId!: string;

  @Property({ fieldName: 'patient_profile_id', type: 'uuid', nullable: true })
  patientProfileId?: string;

  @Property({ fieldName: 'channel_code', columnType: 'varchar' })
  channelCode!: string;

  @Property({ fieldName: 'raw_value', type: 'json', columnType: 'jsonb' })
  rawValue!: unknown;

  @Property({
    fieldName: 'numeric_value',
    columnType: 'double precision',
    nullable: true,
  })
  numericValue?: number;

  @Property({ fieldName: 'unit_code', columnType: 'varchar', nullable: true })
  unitCode?: string;

  @Property({
    fieldName: 'device_sequence',
    columnType: 'bigint',
    nullable: true,
  })
  deviceSequence?: string;

  @Property({
    fieldName: 'observed_at_device',
    columnType: 'timestamptz',
    nullable: true,
  })
  observedAtDevice?: Date;

  @Property({ fieldName: 'received_at', columnType: 'timestamptz' })
  receivedAt!: Date;
}
