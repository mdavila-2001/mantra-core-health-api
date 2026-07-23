import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'diagnostics', tableName: 'radiation_dose_events' })
export class RadiationDoseEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'custodian_tenant_id', type: 'uuid' }) // FK → directory.tenants
  custodianTenantId!: string;

  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  @Property({ fieldName: 'imaging_study_id', type: 'uuid' }) // FK → diagnostics.imaging_studies
  imagingStudyId!: string;

  @Property({ fieldName: 'imaging_series_id', type: 'uuid', nullable: true }) // FK → diagnostics.imaging_series
  imagingSeriesId?: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({
    fieldName: 'dose_length_product',
    columnType: 'numeric(20,6)',
    nullable: true,
  })
  doseLengthProduct?: string;

  @Property({
    fieldName: 'computed_tomography_dose_index',
    columnType: 'numeric(20,6)',
    nullable: true,
  })
  computedTomographyDoseIndex?: string;

  @Property({
    fieldName: 'dose_area_product',
    columnType: 'numeric(20,6)',
    nullable: true,
  })
  doseAreaProduct?: string;

  @Property({
    fieldName: 'effective_dose_msv',
    columnType: 'numeric(20,6)',
    nullable: true,
  })
  effectiveDoseMsv?: string;

  @Property({ fieldName: 'unit_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  unitConceptId?: string;

  @Property({
    fieldName: 'source_sop_instance_uid',
    columnType: 'varchar',
    nullable: true,
  })
  sourceSopInstanceUid?: string;

  @Property({ fieldName: 'device_id', type: 'uuid', nullable: true }) // FK → iam.devices
  deviceId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
