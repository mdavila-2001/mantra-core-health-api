import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `claim_adjudication_versions`.
 */
@Entity({ schema: 'insurance', tableName: 'claim_adjudication_versions' })
export class ClaimAdjudicationVersions {
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
   * Valor de adjudication version mantenido por la instancia.
   */
  @Property({ fieldName: 'adjudication_version', columnType: 'int' })
  adjudicationVersion!: number;

  /**
   * Identificador asociado a outcome concept.
   */
  @Property({ fieldName: 'outcome_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  outcomeConceptId!: string;

  /**
   * Valor de disposition text mantenido por la instancia.
   */
  @Property({
    fieldName: 'disposition_text',
    columnType: 'text',
    nullable: true,
  })
  dispositionText?: string;

  /**
   * Valor de total approved amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'total_approved_amount',
    columnType: 'numeric',
    nullable: true,
  })
  totalApprovedAmount?: string;

  /**
   * Valor de total patient amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'total_patient_amount',
    columnType: 'numeric',
    nullable: true,
  })
  totalPatientAmount?: string;

  /**
   * Valor de total denied amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'total_denied_amount',
    columnType: 'numeric',
    nullable: true,
  })
  totalDeniedAmount?: string;

  /**
   * Identificador asociado a supersedes version.
   */
  @Property({
    fieldName: 'supersedes_version_id',
    type: 'uuid',
    nullable: true,
  }) // FK → insurance.claim_adjudication_versions
  supersedesVersionId?: string;

  /**
   * Valor de adjudicated at mantenido por la instancia.
   */
  @Property({ fieldName: 'adjudicated_at', columnType: 'timestamptz' })
  adjudicatedAt!: Date;

  /**
   * Identificador asociado a adjudicated by user.
   */
  @Property({
    fieldName: 'adjudicated_by_user_id',
    type: 'uuid',
    nullable: true,
  }) // FK → iam.users
  adjudicatedByUserId?: string;
}
