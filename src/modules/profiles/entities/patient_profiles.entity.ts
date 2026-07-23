import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'profiles', tableName: 'patient_profiles' })
export class PatientProfiles {
  @PrimaryKey({ fieldName: 'profile_id', type: 'uuid' })
  profileId: string = randomUUID();

  @Property({ fieldName: 'patient_code', columnType: 'varchar' })
  patientCode!: string;

  @Property({
    fieldName: 'master_patient_index_code',
    columnType: 'varchar',
    nullable: true,
  })
  masterPatientIndexCode?: string;

  @Property({ fieldName: 'abo_group_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  aboGroupConceptId?: string;

  @Property({ fieldName: 'rh_factor_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  rhFactorConceptId?: string;

  @Property({
    fieldName: 'insurance_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  insuranceStatusConceptId?: string;

  @Property({
    fieldName: 'clinical_language_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  clinicalLanguageConceptId?: string;

  @Property({
    fieldName: 'record_linkage_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  recordLinkageStatusConceptId?: string;

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
