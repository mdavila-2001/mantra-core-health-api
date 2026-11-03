import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `patient_admission_footprints`.
 */
@Entity({ schema: 'clinical', tableName: 'patient_admission_footprints' })
export class PatientAdmissionFootprints {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles (inferida)
  patientProfileId!: string;

  /**
   * Identificador asociado a encounter.
   */
  @Property({ fieldName: 'encounter_id', type: 'uuid' }) // FK → clinical.encounters (inferida)
  encounterId!: string;

  /**
   * Identificador asociado a practice site.
   */
  @Property({ fieldName: 'practice_site_id', type: 'uuid' }) // FK → practice.practice_sites (inferida)
  practiceSiteId!: string;

  /**
   * Identificador asociado a admission origin concept.
   */
  @Property({ fieldName: 'admission_origin_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  admissionOriginConceptId!: string;

  /**
   * Identificador asociado a identity verification method concept.
   */
  @Property({
    fieldName: 'identity_verification_method_concept_id',
    type: 'uuid',
  }) // FK → terminology.catalog_concepts (inferida)
  identityVerificationMethodConceptId!: string;

  /**
   * Valor de identity document type mantenido por la instancia.
   */
  @Property({ fieldName: 'identity_document_type', columnType: 'varchar(32)' })
  identityDocumentType!: string;

  /**
   * Valor de identity document last4 mantenido por la instancia.
   */
  @Property({ fieldName: 'identity_document_last4', columnType: 'varchar(4)' })
  identityDocumentLast4!: string;

  /**
   * Valor de identity document hmac mantenido por la instancia.
   */
  @Property({ fieldName: 'identity_document_hmac', columnType: 'varchar(64)' })
  identityDocumentHmac!: string;

  /**
   * Identificador asociado a referral.
   */
  @Property({ fieldName: 'referral_id', type: 'uuid', nullable: true }) // FK → clinical_ext.referrals (inferida)
  referralId?: string;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid' }) // FK → iam.users (inferida)
  recordedByUserId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
