import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'crm', tableName: 'opportunity_stage_history' })
export class OpportunityStageHistory {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'opportunity_id', type: 'uuid' }) // FK → crm.opportunities
  opportunityId!: string;

  @Property({ fieldName: 'from_stage_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  fromStageId?: string;

  @Property({ fieldName: 'to_stage_id', type: 'uuid' }) // FK (destino no resuelto)
  toStageId!: string;

  @Property({
    fieldName: 'changed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  changedAt?: Date;

  @Property({ fieldName: 'changed_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  changedByUserId?: string;

  @Property({
    fieldName: 'amount_at_change',
    columnType: 'numeric',
    nullable: true,
  })
  amountAtChange?: string;

  @Property({
    fieldName: 'probability_at_change',
    columnType: 'numeric',
    nullable: true,
  })
  probabilityAtChange?: string;

  @Property({ fieldName: 'reason_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  reasonConceptId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
