import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `opportunity_stage_history`.
 */
@Entity({ schema: 'crm', tableName: 'opportunity_stage_history' })
export class OpportunityStageHistory {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a opportunity.
   */
  @Property({ fieldName: 'opportunity_id', type: 'uuid' }) // FK → crm.opportunities
  opportunityId!: string;

  /**
   * Identificador asociado a from stage.
   */
  @Property({ fieldName: 'from_stage_id', type: 'uuid', nullable: true }) // FK → crm.pipeline_stages
  fromStageId?: string;

  /**
   * Identificador asociado a to stage.
   */
  @Property({ fieldName: 'to_stage_id', type: 'uuid' }) // FK → crm.pipeline_stages
  toStageId!: string;

  /**
   * Valor de changed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'changed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  changedAt?: Date;

  /**
   * Identificador asociado a changed by user.
   */
  @Property({ fieldName: 'changed_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  changedByUserId?: string;

  /**
   * Valor de amount at change mantenido por la instancia.
   */
  @Property({
    fieldName: 'amount_at_change',
    columnType: 'numeric',
    nullable: true,
  })
  amountAtChange?: string;

  /**
   * Valor de probability at change mantenido por la instancia.
   */
  @Property({
    fieldName: 'probability_at_change',
    columnType: 'numeric',
    nullable: true,
  })
  probabilityAtChange?: string;

  /**
   * Identificador asociado a reason concept.
   */
  @Property({ fieldName: 'reason_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  reasonConceptId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
