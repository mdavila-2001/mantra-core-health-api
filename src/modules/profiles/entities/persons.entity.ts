import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'profiles', tableName: 'persons' })
export class Persons {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'person_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  personStatusConceptId!: string;

  @Property({
    fieldName: 'display_name',
    columnType: 'varchar',
    nullable: true,
  })
  displayName?: string;

  @Property({ fieldName: 'birth_date', columnType: 'date', nullable: true })
  birthDate?: Date;

  @Property({
    fieldName: 'administrative_gender_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  administrativeGenderConceptId?: string;

  @Property({
    fieldName: 'sex_at_birth_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  sexAtBirthConceptId?: string;

  @Property({
    fieldName: 'gender_identity_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  genderIdentityConceptId?: string;

  @Property({
    fieldName: 'vital_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  vitalStatusConceptId?: string;

  @Property({
    fieldName: 'deceased_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  deceasedAt?: Date;

  @Property({
    fieldName: 'nationality_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  nationalityConceptId?: string;

  @Property({
    fieldName: 'preferred_language_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  preferredLanguageConceptId?: string;

  @Property({
    fieldName: 'merge_survivor_person_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.persons
  mergeSurvivorPersonId?: string;

  @Property({
    fieldName: 'anonymized_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  anonymizedAt?: Date;

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
