import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'erp', tableName: 'contract_approval_steps' })
export class ContractApprovalSteps {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'contract_approval_request_id', type: 'uuid' }) // FK → erp.contract_approval_requests
  contractApprovalRequestId!: string;

  @Property({ fieldName: 'step_number', columnType: 'int' })
  stepNumber!: number;

  @Property({ fieldName: 'approver_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  approverUserId?: string;

  @Property({
    fieldName: 'approver_team_role_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  approverTeamRoleConceptId?: string;

  @Property({ fieldName: 'decision_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  decisionConceptId?: string;

  @Property({
    fieldName: 'decision_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  decisionAt?: Date;

  @Property({ columnType: 'text', nullable: true })
  comments?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
