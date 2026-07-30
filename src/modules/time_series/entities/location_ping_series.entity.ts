import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

/**
 * Mapea la entidad persistente asociada a `location_ping_series`.
 */
@Entity({ schema: 'time_series', tableName: 'location_ping_series' })
export class LocationPingSeries {
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
   * Valor de subject type mantenido por la instancia.
   */
  @Property({ fieldName: 'subject_type', columnType: 'varchar' })
  subjectType!: string;

  /**
   * Identificador asociado a subject.
   */
  @Property({ fieldName: 'subject_id', type: 'uuid' })
  subjectId!: string;

  /**
   * Valor de latitude mantenido por la instancia.
   */
  @Property({ columnType: 'double precision' })
  latitude!: number;

  /**
   * Valor de longitude mantenido por la instancia.
   */
  @Property({ columnType: 'double precision' })
  longitude!: number;

  /**
   * Valor de altitude m mantenido por la instancia.
   */
  @Property({
    fieldName: 'altitude_m',
    columnType: 'double precision',
    nullable: true,
  })
  altitudeM?: number;

  /**
   * Valor de accuracy m mantenido por la instancia.
   */
  @Property({
    fieldName: 'accuracy_m',
    columnType: 'double precision',
    nullable: true,
  })
  accuracyM?: number;

  /**
   * Valor de speed mps mantenido por la instancia.
   */
  @Property({
    fieldName: 'speed_mps',
    columnType: 'double precision',
    nullable: true,
  })
  speedMps?: number;

  /**
   * Valor de geohash mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  geohash?: string;
}
