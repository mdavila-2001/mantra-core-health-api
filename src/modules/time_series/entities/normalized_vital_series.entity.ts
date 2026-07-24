import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ schema: 'time_series', tableName: 'normalized_vital_series' })
export class NormalizedVitalSeries {
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

  @Property({ fieldName: 'patient_profile_id', type: 'uuid' })
  patientProfileId!: string;

  @Property({ fieldName: 'observation_code', columnType: 'varchar' })
  observationCode!: string;

  @Property({ fieldName: 'numeric_value', columnType: 'double precision' })
  numericValue!: number;

  @Property({ fieldName: 'unit_code', columnType: 'varchar' })
  unitCode!: string;

  @Property({ fieldName: 'device_id', type: 'uuid', nullable: true })
  deviceId?: string;

  @Property({ fieldName: 'encounter_id', type: 'uuid', nullable: true })
  encounterId?: string;

  @Property({ fieldName: 'validation_state', columnType: 'varchar' })
  validationState!: string;

  @Property({
    fieldName: 'clinically_promoted_observation_id',
    type: 'uuid',
    nullable: true,
  })
  clinicallyPromotedObservationId?: string;
}
