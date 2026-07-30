import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `radiation_dose_events`.
 */
@Entity({ schema: 'diagnostics', tableName: 'radiation_dose_events' })
export class RadiationDoseEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a custodian tenant.
   */
  @Property({ fieldName: 'custodian_tenant_id', type: 'uuid' }) // FK → directory.tenants
  custodianTenantId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  /**
   * Identificador asociado a imaging study.
   */
  @Property({ fieldName: 'imaging_study_id', type: 'uuid' }) // FK → diagnostics.imaging_studies
  imagingStudyId!: string;

  /**
   * Identificador asociado a imaging series.
   */
  @Property({ fieldName: 'imaging_series_id', type: 'uuid', nullable: true }) // FK → diagnostics.imaging_series
  imagingSeriesId?: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Valor de dose length product mantenido por la instancia.
   */
  @Property({
    fieldName: 'dose_length_product',
    columnType: 'numeric(20,6)',
    nullable: true,
  })
  doseLengthProduct?: string;

  /**
   * Valor de computed tomography dose index mantenido por la instancia.
   */
  @Property({
    fieldName: 'computed_tomography_dose_index',
    columnType: 'numeric(20,6)',
    nullable: true,
  })
  computedTomographyDoseIndex?: string;

  /**
   * Valor de dose area product mantenido por la instancia.
   */
  @Property({
    fieldName: 'dose_area_product',
    columnType: 'numeric(20,6)',
    nullable: true,
  })
  doseAreaProduct?: string;

  /**
   * Valor de effective dose msv mantenido por la instancia.
   */
  @Property({
    fieldName: 'effective_dose_msv',
    columnType: 'numeric(20,6)',
    nullable: true,
  })
  effectiveDoseMsv?: string;

  /**
   * Identificador asociado a unit concept.
   */
  @Property({ fieldName: 'unit_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  unitConceptId?: string;

  /**
   * Valor de source sop instance uid mantenido por la instancia.
   */
  @Property({
    fieldName: 'source_sop_instance_uid',
    columnType: 'varchar',
    nullable: true,
  })
  sourceSopInstanceUid?: string;

  /**
   * Identificador asociado a device.
   */
  @Property({ fieldName: 'device_id', type: 'uuid', nullable: true }) // FK → iam.devices
  deviceId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
