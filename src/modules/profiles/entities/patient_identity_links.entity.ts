import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `patient_identity_links`.
 */
@Entity({ schema: 'profiles', tableName: 'patient_identity_links' })
export class PatientIdentityLinks {
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
   * Identificador asociado a source tenant.
   */
  @Property({ fieldName: 'source_tenant_id', type: 'uuid' }) // FK → directory.tenants
  sourceTenantId!: string;

  /**
   * Valor de source patient identifier mantenido por la instancia.
   */
  @Property({ fieldName: 'source_patient_identifier', columnType: 'varchar' })
  sourcePatientIdentifier!: string;

  /**
   * Valor de source system uri mantenido por la instancia.
   */
  @Property({
    fieldName: 'source_system_uri',
    columnType: 'text',
    nullable: true,
  })
  sourceSystemUri?: string;

  /**
   * Identificador asociado a link type concept.
   */
  @Property({ fieldName: 'link_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  linkTypeConceptId!: string;

  /**
   * Valor de confidence score mantenido por la instancia.
   */
  @Property({ fieldName: 'confidence_score', columnType: 'numeric' })
  confidenceScore!: string;

  /**
   * Identificador asociado a verification status concept.
   */
  @Property({ fieldName: 'verification_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  verificationStatusConceptId!: string;

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
