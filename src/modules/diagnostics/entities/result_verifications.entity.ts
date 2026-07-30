import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `result_verifications`.
 */
@Entity({ schema: 'diagnostics', tableName: 'result_verifications' })
export class ResultVerifications {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a custodian tenant.
   */
  @Property({ fieldName: 'custodian_tenant_id', type: 'uuid' }) // FK → directory.tenants
  custodianTenantId!: string;

  /**
   * Identificador asociado a verifiable type concept.
   */
  @Property({ fieldName: 'verifiable_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  verifiableTypeConceptId!: string;

  /**
   * Identificador asociado a verifiable.
   */
  @Property({ fieldName: 'verifiable_id', type: 'uuid' })
  verifiableId!: string;

  /**
   * Identificador asociado a verification level concept.
   */
  @Property({ fieldName: 'verification_level_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  verificationLevelConceptId!: string;

  /**
   * Identificador asociado a result concept.
   */
  @Property({ fieldName: 'result_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resultConceptId!: string;

  /**
   * Identificador asociado a verified by profile.
   */
  @Property({ fieldName: 'verified_by_profile_id', type: 'uuid' }) // FK → profiles.health_practitioner_profiles
  verifiedByProfileId!: string;

  /**
   * Valor de verified at mantenido por la instancia.
   */
  @Property({ fieldName: 'verified_at', columnType: 'timestamptz' })
  verifiedAt!: Date;

  /**
   * Valor de verification comment mantenido por la instancia.
   */
  @Property({
    fieldName: 'verification_comment',
    columnType: 'text',
    nullable: true,
  })
  verificationComment?: string;

  /**
   * Identificador asociado a previous verification.
   */
  @Property({
    fieldName: 'previous_verification_id',
    type: 'uuid',
    nullable: true,
  }) // FK → diagnostics.result_verifications
  previousVerificationId?: string;

  /**
   * Identificador asociado a signature.
   */
  @Property({ fieldName: 'signature_id', type: 'uuid', nullable: true }) // FK → chart.clinical_note_signatures
  signatureId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
