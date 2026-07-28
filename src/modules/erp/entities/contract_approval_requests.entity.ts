import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `contract_approval_requests`.
 */
@Entity({ schema: 'erp', tableName: 'contract_approval_requests' })
export class ContractApprovalRequests {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a contract.
   */
  @Property({ fieldName: 'contract_id', type: 'uuid' }) // FK → erp.contracts
  contractId!: string;

  /**
   * Identificador asociado a contract version.
   */
  @Property({ fieldName: 'contract_version_id', type: 'uuid', nullable: true }) // FK → erp.contract_versions
  contractVersionId?: string;

  /**
   * Identificador asociado a contract amendment.
   */
  @Property({
    fieldName: 'contract_amendment_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.contract_amendments
  contractAmendmentId?: string;

  /**
   * Identificador asociado a approval type concept.
   */
  @Property({ fieldName: 'approval_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  approvalTypeConceptId!: string;

  /**
   * Identificador asociado a requested by user.
   */
  @Property({ fieldName: 'requested_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  requestedByUserId?: string;

  /**
   * Valor de requested at mantenido por la instancia.
   */
  @Property({
    fieldName: 'requested_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  requestedAt?: Date;

  /**
   * Valor de due at mantenido por la instancia.
   */
  @Property({ fieldName: 'due_at', columnType: 'timestamptz', nullable: true })
  dueAt?: Date;

  /**
   * Identificador asociado a workflow instance.
   */
  @Property({ fieldName: 'workflow_instance_id', type: 'uuid', nullable: true }) // FK → workflow.workflow_instances
  workflowInstanceId?: string;

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
}
