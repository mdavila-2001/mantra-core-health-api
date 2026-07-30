import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `consents`.
 */
@Entity({ schema: 'consent', tableName: 'consents' })
export class Consents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a patient profile.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  /**
   * Identificador asociado a granted by user.
   */
  @Property({ fieldName: 'granted_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  grantedByUserId?: string;

  /**
   * Identificador asociado a granted by related person.
   */
  @Property({
    fieldName: 'granted_by_related_person_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.related_persons
  grantedByRelatedPersonId?: string;

  /**
   * Identificador asociado a category concept.
   */
  @Property({ fieldName: 'category_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  categoryConceptId!: string;

  /**
   * Identificador asociado a processing purpose.
   */
  @Property({ fieldName: 'processing_purpose_id', type: 'uuid' }) // FK → consent.processing_purposes
  processingPurposeId!: string;

  /**
   * Identificador asociado a processing legal basis.
   */
  @Property({
    fieldName: 'processing_legal_basis_id',
    type: 'uuid',
    nullable: true,
  }) // FK → consent.processing_legal_bases
  processingLegalBasisId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de policy uri mantenido por la instancia.
   */
  @Property({ fieldName: 'policy_uri', columnType: 'text', nullable: true })
  policyUri?: string;

  /**
   * Valor de policy version mantenido por la instancia.
   */
  @Property({
    fieldName: 'policy_version',
    columnType: 'varchar',
    nullable: true,
  })
  policyVersion?: string;

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @Property({
    fieldName: 'valid_from',
    columnType: 'timestamptz',
    nullable: true,
  })
  validFrom?: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @Property({
    fieldName: 'valid_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  validTo?: Date;

  /**
   * Identificador asociado a withdrawal reason concept.
   */
  @Property({
    fieldName: 'withdrawal_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  withdrawalReasonConceptId?: string;

  /**
   * Valor de withdrawn at mantenido por la instancia.
   */
  @Property({
    fieldName: 'withdrawn_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  withdrawnAt?: Date;

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
