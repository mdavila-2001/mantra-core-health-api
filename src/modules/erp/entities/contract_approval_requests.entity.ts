import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'erp', tableName: 'contract_approval_requests' })
export class ContractApprovalRequests {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'contract_id', type: 'uuid' }) // FK → erp.contracts
  contractId!: string;

  @Property({ fieldName: 'contract_version_id', type: 'uuid', nullable: true }) // FK → erp.contract_versions
  contractVersionId?: string;

  @Property({
    fieldName: 'contract_amendment_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.contract_amendments
  contractAmendmentId?: string;

  @Property({ fieldName: 'approval_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  approvalTypeConceptId!: string;

  @Property({ fieldName: 'requested_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  requestedByUserId?: string;

  @Property({
    fieldName: 'requested_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  requestedAt?: Date;

  @Property({ fieldName: 'due_at', columnType: 'timestamptz', nullable: true })
  dueAt?: Date;

  @Property({ fieldName: 'workflow_instance_id', type: 'uuid', nullable: true }) // FK → workflow.workflow_instances
  workflowInstanceId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
