import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'iam', tableName: 'users' })
export class Users {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'display_name', columnType: 'varchar' })
  displayName!: string;

  @Property({
    fieldName: 'preferred_language_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  preferredLanguageConceptId?: string;

  @Property({ fieldName: 'time_zone', columnType: 'varchar', nullable: true })
  timeZone?: string;

  @Property({
    fieldName: 'residence_country_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  residenceCountryConceptId?: string;

  @Property({
    fieldName: 'data_residency_region_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  dataResidencyRegionConceptId?: string;

  @Property({ fieldName: 'email_verified', type: 'boolean', nullable: true })
  emailVerified?: boolean;

  @Property({ fieldName: 'phone_verified', type: 'boolean', nullable: true })
  phoneVerified?: boolean;

  @Property({
    fieldName: 'mfa_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  mfaStatusConceptId?: string;

  @Property({
    fieldName: 'legal_basis_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  legalBasisConceptId?: string;

  @Property({
    fieldName: 'privacy_accepted_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  privacyAcceptedAt?: Date;

  @Property({
    fieldName: 'privacy_policy_version',
    columnType: 'varchar',
    nullable: true,
  })
  privacyPolicyVersion?: string;

  @Property({
    fieldName: 'anonymized_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  anonymizedAt?: Date;

  @Property({
    fieldName: 'last_login_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastLoginAt?: Date;

  @Property({
    fieldName: 'must_change_password',
    type: 'boolean',
    nullable: true,
  })
  mustChangePassword?: boolean;

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
