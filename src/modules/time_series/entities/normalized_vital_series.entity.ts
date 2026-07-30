import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

/**
 * Mapea la entidad persistente asociada a `normalized_vital_series`.
 */
@Entity({ schema: 'time_series', tableName: 'normalized_vital_series' })
export class NormalizedVitalSeries {
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
   * Identificador asociado a patient profile.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid' })
  patientProfileId!: string;

  /**
   * Valor de observation code mantenido por la instancia.
   */
  @Property({ fieldName: 'observation_code', columnType: 'varchar' })
  observationCode!: string;

  /**
   * Valor de numeric value mantenido por la instancia.
   */
  @Property({ fieldName: 'numeric_value', columnType: 'double precision' })
  numericValue!: number;

  /**
   * Valor de unit code mantenido por la instancia.
   */
  @Property({ fieldName: 'unit_code', columnType: 'varchar' })
  unitCode!: string;

  /**
   * Identificador asociado a device.
   */
  @Property({ fieldName: 'device_id', type: 'uuid', nullable: true })
  deviceId?: string;

  /**
   * Identificador asociado a encounter.
   */
  @Property({ fieldName: 'encounter_id', type: 'uuid', nullable: true })
  encounterId?: string;

  /**
   * Valor de validation state mantenido por la instancia.
   */
  @Property({ fieldName: 'validation_state', columnType: 'varchar' })
  validationState!: string;

  /**
   * Identificador asociado a clinically promoted observation.
   */
  @Property({
    fieldName: 'clinically_promoted_observation_id',
    type: 'uuid',
    nullable: true,
  })
  clinicallyPromotedObservationId?: string;
}
