import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'community', tableName: 'moderation_decisions' })
export class ModerationDecisions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'moderation_queue_id', type: 'uuid' })  // FK → community.moderation_queue
  moderationQueueId!: string;

  @Property({ fieldName: 'decision_concept_id', type: 'uuid' })  // FK → terminology.catalog_concepts
  decisionConceptId!: string;

  @Property({ fieldName: 'policy_concept_id', type: 'uuid' })  // FK → terminology.catalog_concepts
  policyConceptId!: string;

  @Property({ fieldName: 'rationale_text', columnType: 'text', nullable: true })
  rationaleText?: string;

  @Property({ fieldName: 'action_taken_concept_id', type: 'uuid', nullable: true })  // FK → terminology.catalog_concepts
  actionTakenConceptId?: string;

  @Property({ fieldName: 'decided_by_user_id', type: 'uuid' })  // FK → iam.users
  decidedByUserId!: string;

  @Property({ fieldName: 'decided_at', columnType: 'timestamptz', nullable: true })
  decidedAt?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })  // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })  // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;

}
