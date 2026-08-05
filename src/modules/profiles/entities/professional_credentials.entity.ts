import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `professional_credentials`.
 */
@Entity({ schema: 'profiles', tableName: 'professional_credentials' })
export class ProfessionalCredentials {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a practitioner profile.
   */
  @Property({ fieldName: 'practitioner_profile_id', type: 'uuid' }) // FK → profiles.health_practitioner_profiles
  practitionerProfileId!: string;

  /**
   * Identificador asociado a credential type concept.
   */
  @Property({ fieldName: 'credential_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  credentialTypeConceptId!: string;

  /**
   * Valor de number mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  number!: string;

  /**
   * Identificador asociado a issuing authority tenant.
   */
  @Property({
    fieldName: 'issuing_authority_tenant_id',
    type: 'uuid',
    nullable: true,
  }) // FK → directory.tenants
  issuingAuthorityTenantId?: string;

  /**
   * Valor de issuing institution text mantenido por la instancia.
   */
  @Property({
    fieldName: 'issuing_institution_text',
    columnType: 'varchar',
    nullable: true,
  })
  issuingInstitutionText?: string;

  /**
   * Identificador asociado a issuing country concept.
   */
  @Property({
    fieldName: 'issuing_country_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  issuingCountryConceptId?: string;

  /**
   * Valor de issue date mantenido por la instancia.
   */
  @Property({ fieldName: 'issue_date', columnType: 'date', nullable: true })
  issueDate?: Date;

  /**
   * Valor de expiry date mantenido por la instancia.
   */
  @Property({ fieldName: 'expiry_date', columnType: 'date', nullable: true })
  expiryDate?: Date;

  /**
   * Identificador asociado a state concept.
   */
  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

  /**
   * Identificador asociado a file.
   */
  @Property({ fieldName: 'file_id', type: 'uuid', nullable: true }) // FK → common.files
  fileId?: string;

  /**
   * Valor de verification source uri mantenido por la instancia.
   */
  @Property({
    fieldName: 'verification_source_uri',
    columnType: 'text',
    nullable: true,
  })
  verificationSourceUri?: string;

  /**
   * Identificador asociado a verified by user.
   */
  @Property({ fieldName: 'verified_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  verifiedByUserId?: string;

  /**
   * Valor de verified at mantenido por la instancia.
   */
  @Property({
    fieldName: 'verified_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  verifiedAt?: Date;

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
}
