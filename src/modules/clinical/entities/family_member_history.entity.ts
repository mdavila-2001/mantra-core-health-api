import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'clinical', tableName: 'family_member_history' })
export class FamilyMemberHistory {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'custodian_tenant_id', type: 'uuid' }) // FK → directory.tenants
  custodianTenantId!: string;

  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  @Property({ fieldName: 'relationship_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  relationshipConceptId!: string;

  @Property({ fieldName: 'condition_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  conditionConceptId?: string;

  @Property({ fieldName: 'onset_age_years', columnType: 'int', nullable: true })
  onsetAgeYears?: number;

  @Property({ type: 'boolean', nullable: true })
  deceased?: boolean;

  @Property({
    fieldName: 'deceased_age_years',
    columnType: 'int',
    nullable: true,
  })
  deceasedAgeYears?: number;

  @Property({ fieldName: 'note_text', columnType: 'text', nullable: true })
  noteText?: string;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;

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
