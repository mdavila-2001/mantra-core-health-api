import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

/**
 * Mapea la entidad persistente asociada a `device_raw_reading_series`.
 */
@Entity({ schema: 'time_series', tableName: 'device_raw_reading_series' })
export class DeviceRawReadingSeries {
  /**
   * Valor de time mantenido por la instancia.
   */
  @PrimaryKey({ columnType: 'timestamptz' })
  time!: Date;

  /**
   * Identificador asociado a tenant.
   */
  @PrimaryKey({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  /**
   * Identificador asociado a series.
   */
  @PrimaryKey({ fieldName: 'series_id', columnType: 'varchar' })
  seriesId!: string;

  /**
   * Identificador asociado a ingestion.
   */
  @Property({ fieldName: 'ingestion_id', type: 'uuid' })
  ingestionId!: string;

  /**
   * Valor de source version mantenido por la instancia.
   */
  @Property({ fieldName: 'source_version', columnType: 'varchar' })
  sourceVersion!: string;

  /**
   * Valor de quality state mantenido por la instancia.
   */
  @Property({ fieldName: 'quality_state', columnType: 'varchar' })
  qualityState!: string;

  /**
   * Identificador asociado a device.
   */
  @Property({ fieldName: 'device_id', type: 'uuid' })
  deviceId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid', nullable: true })
  patientProfileId?: string;

  /**
   * Valor de channel code mantenido por la instancia.
   */
  @Property({ fieldName: 'channel_code', columnType: 'varchar' })
  channelCode!: string;

  /**
   * Valor de raw value mantenido por la instancia.
   */
  @Property({ fieldName: 'raw_value', type: 'json', columnType: 'jsonb' })
  rawValue!: unknown;

  /**
   * Valor de numeric value mantenido por la instancia.
   */
  @Property({
    fieldName: 'numeric_value',
    columnType: 'double precision',
    nullable: true,
  })
  numericValue?: number;

  /**
   * Valor de unit code mantenido por la instancia.
   */
  @Property({ fieldName: 'unit_code', columnType: 'varchar', nullable: true })
  unitCode?: string;

  /**
   * Valor de device sequence mantenido por la instancia.
   */
  @Property({
    fieldName: 'device_sequence',
    columnType: 'bigint',
    nullable: true,
  })
  deviceSequence?: string;

  /**
   * Valor de observed at device mantenido por la instancia.
   */
  @Property({
    fieldName: 'observed_at_device',
    columnType: 'timestamptz',
    nullable: true,
  })
  observedAtDevice?: Date;

  /**
   * Valor de received at mantenido por la instancia.
   */
  @Property({ fieldName: 'received_at', columnType: 'timestamptz' })
  receivedAt!: Date;
}
