import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'chart', tableName: 'clinical_note_headers' })
export class ClinicalNoteHeaders {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  @Property({ fieldName: 'encounter_id', type: 'uuid', nullable: true }) // FK → clinical.encounters
  encounterId?: string;

  @Property({ fieldName: 'note_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  noteTypeConceptId!: string;

  @Property({ fieldName: 'lifecycle_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  lifecycleStatusConceptId!: string;

  @Property({ fieldName: 'current_version_id', type: 'uuid', nullable: true }) // FK → chart.clinical_note_versions
  currentVersionId?: string;

  @Property({
    fieldName: 'current_released_version_id',
    type: 'uuid',
    nullable: true,
  }) // FK → chart.clinical_note_versions
  currentReleasedVersionId?: string;

  @Property({
    fieldName: 'patient_release_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  patientReleaseStatusConceptId?: string;

  @Property({
    fieldName: 'confidentiality_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  confidentialityConceptId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
