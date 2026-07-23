import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'platform_ops', tableName: 'change_approvals' })
export class ChangeApprovals {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'change_request_id', type: 'uuid' }) // FK → platform_ops.change_requests
  changeRequestId!: string;

  @Property({ fieldName: 'approval_step', columnType: 'int' })
  approvalStep!: number;

  @Property({ fieldName: 'approver_user_id', type: 'uuid' }) // FK → iam.users
  approverUserId!: string;

  @Property({ fieldName: 'decision_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  decisionConceptId!: string;

  @Property({
    fieldName: 'decision_reason',
    columnType: 'text',
    nullable: true,
  })
  decisionReason?: string;

  @Property({ fieldName: 'decided_at', columnType: 'timestamptz' })
  decidedAt!: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
