import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `claim_disputes`.
 */
@Entity({ schema: 'insurance', tableName: 'claim_disputes' })
export class ClaimDisputes {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a insurance claim.
   */
  @Property({ fieldName: 'insurance_claim_id', type: 'uuid' }) // FK → insurance.insurance_claims
  insuranceClaimId!: string;

  /**
   * Identificador asociado a claim adjudication version.
   */
  @Property({
    fieldName: 'claim_adjudication_version_id',
    type: 'uuid',
    nullable: true,
  }) // FK → insurance.claim_adjudication_versions
  claimAdjudicationVersionId?: string;

  /**
   * Identificador asociado a dispute type concept.
   */
  @Property({ fieldName: 'dispute_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  disputeTypeConceptId!: string;

  /**
   * Identificador asociado a dispute reason concept.
   */
  @Property({ fieldName: 'dispute_reason_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  disputeReasonConceptId!: string;

  /**
   * Identificador asociado a initiated by party type concept.
   */
  @Property({ fieldName: 'initiated_by_party_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  initiatedByPartyTypeConceptId!: string;

  /**
   * Identificador asociado a initiated by entity.
   */
  @Property({
    fieldName: 'initiated_by_entity_id',
    type: 'uuid',
    nullable: true,
  })
  initiatedByEntityId?: string;

  /**
   * Identificador asociado a supporting evidence file.
   */
  @Property({
    fieldName: 'supporting_evidence_file_id',
    type: 'uuid',
    nullable: true,
  }) // FK → common.files
  supportingEvidenceFileId?: string;

  /**
   * Valor de filing deadline mantenido por la instancia.
   */
  @Property({
    fieldName: 'filing_deadline',
    columnType: 'date',
    nullable: true,
  })
  filingDeadline?: Date;

  /**
   * Valor de submitted at mantenido por la instancia.
   */
  @Property({
    fieldName: 'submitted_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  submittedAt?: Date;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
