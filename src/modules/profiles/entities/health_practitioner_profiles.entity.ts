import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'profiles', tableName: 'health_practitioner_profiles' })
export class HealthPractitionerProfiles {
  @PrimaryKey({ fieldName: 'profile_id', type: 'uuid' })
  profileId: string = randomUUID();

  @Property({ fieldName: 'practitioner_code', columnType: 'varchar' })
  practitionerCode!: string;

  @Property({ fieldName: 'practitioner_category_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  practitionerCategoryConceptId!: string;

  @Property({
    fieldName: 'professional_title',
    columnType: 'varchar',
    nullable: true,
  })
  professionalTitle?: string;

  @Property({ fieldName: 'verification_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  verificationStatusConceptId!: string;

  @Property({ fieldName: 'practice_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  practiceStatusConceptId!: string;

  @Property({
    fieldName: 'professional_bio',
    columnType: 'text',
    nullable: true,
  })
  professionalBio?: string;

  @Property({ fieldName: 'photo_file_id', type: 'uuid', nullable: true }) // FK → common.files
  photoFileId?: string;

  @Property({
    fieldName: 'accepts_new_patients',
    type: 'boolean',
    nullable: true,
  })
  acceptsNewPatients?: boolean;

  @Property({
    fieldName: 'telehealth_available',
    type: 'boolean',
    nullable: true,
  })
  telehealthAvailable?: boolean;

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
