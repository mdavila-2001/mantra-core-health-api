import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `users`.
 */
@Entity({ schema: 'iam', tableName: 'users' })
export class Users {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de display name mantenido por la instancia.
   */
  @Property({ fieldName: 'display_name', columnType: 'varchar' })
  displayName!: string;

  /**
   * Identificador asociado a preferred language concept.
   */
  @Property({
    fieldName: 'preferred_language_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  preferredLanguageConceptId?: string;

  /**
   * Valor de time zone mantenido por la instancia.
   */
  @Property({ fieldName: 'time_zone', columnType: 'varchar', nullable: true })
  timeZone?: string;

  /**
   * Identificador asociado a residence country concept.
   */
  @Property({
    fieldName: 'residence_country_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  residenceCountryConceptId?: string;

  /**
   * Identificador asociado a data residency region concept.
   */
  @Property({
    fieldName: 'data_residency_region_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  dataResidencyRegionConceptId?: string;

  /**
   * Valor de email verified mantenido por la instancia.
   */
  @Property({ fieldName: 'email_verified', type: 'boolean', nullable: true })
  emailVerified?: boolean;

  /**
   * Valor de phone verified mantenido por la instancia.
   */
  @Property({ fieldName: 'phone_verified', type: 'boolean', nullable: true })
  phoneVerified?: boolean;

  /**
   * Identificador asociado a mfa status concept.
   */
  @Property({
    fieldName: 'mfa_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  mfaStatusConceptId?: string;

  /**
   * Identificador asociado a legal basis concept.
   */
  @Property({
    fieldName: 'legal_basis_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  legalBasisConceptId?: string;

  /**
   * Valor de privacy accepted at mantenido por la instancia.
   */
  @Property({
    fieldName: 'privacy_accepted_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  privacyAcceptedAt?: Date;

  /**
   * Valor de privacy policy version mantenido por la instancia.
   */
  @Property({
    fieldName: 'privacy_policy_version',
    columnType: 'varchar',
    nullable: true,
  })
  privacyPolicyVersion?: string;

  /**
   * Valor de anonymized at mantenido por la instancia.
   */
  @Property({
    fieldName: 'anonymized_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  anonymizedAt?: Date;

  /**
   * Valor de last login at mantenido por la instancia.
   */
  @Property({
    fieldName: 'last_login_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastLoginAt?: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;

  /**
   * Valor de must change password mantenido por la instancia.
   */
  @Property({
    fieldName: 'must_change_password',
    type: 'boolean',
    nullable: true,
  })
  mustChangePassword?: boolean;
}
