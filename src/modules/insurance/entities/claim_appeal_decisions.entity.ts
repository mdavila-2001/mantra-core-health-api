import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `claim_appeal_decisions`.
 */
@Entity({ schema: 'insurance', tableName: 'claim_appeal_decisions' })
export class ClaimAppealDecisions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a claim dispute.
   */
  @Property({ fieldName: 'claim_dispute_id', type: 'uuid' }) // FK → insurance.claim_disputes
  claimDisputeId!: string;

  /**
   * Identificador asociado a appeal level concept.
   */
  @Property({ fieldName: 'appeal_level_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  appealLevelConceptId!: string;

  /**
   * Valor de decision version mantenido por la instancia.
   */
  @Property({ fieldName: 'decision_version', columnType: 'int' })
  decisionVersion!: number;

  /**
   * Identificador asociado a decision concept.
   */
  @Property({ fieldName: 'decision_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  decisionConceptId!: string;

  /**
   * Valor de adjusted amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'adjusted_amount',
    columnType: 'numeric',
    nullable: true,
  })
  adjustedAmount?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Valor de rationale text mantenido por la instancia.
   */
  @Property({ fieldName: 'rationale_text', columnType: 'text', nullable: true })
  rationaleText?: string;

  /**
   * Identificador asociado a supersedes decision.
   */
  @Property({
    fieldName: 'supersedes_decision_id',
    type: 'uuid',
    nullable: true,
  }) // FK → insurance.claim_appeal_decisions
  supersedesDecisionId?: string;

  /**
   * Valor de decided at mantenido por la instancia.
   */
  @Property({
    fieldName: 'decided_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  decidedAt?: Date;

  /**
   * Identificador asociado a decided by reviewer user.
   */
  @Property({
    fieldName: 'decided_by_reviewer_user_id',
    type: 'uuid',
    nullable: true,
  }) // FK → iam.users
  decidedByReviewerUserId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
