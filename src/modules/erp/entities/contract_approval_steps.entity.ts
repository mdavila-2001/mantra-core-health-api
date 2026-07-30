import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `contract_approval_steps`.
 */
@Entity({ schema: 'erp', tableName: 'contract_approval_steps' })
export class ContractApprovalSteps {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a contract approval request.
   */
  @Property({ fieldName: 'contract_approval_request_id', type: 'uuid' }) // FK → erp.contract_approval_requests
  contractApprovalRequestId!: string;

  /**
   * Valor de step number mantenido por la instancia.
   */
  @Property({ fieldName: 'step_number', columnType: 'int' })
  stepNumber!: number;

  /**
   * Identificador asociado a approver user.
   */
  @Property({ fieldName: 'approver_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  approverUserId?: string;

  /**
   * Identificador asociado a approver team role concept.
   */
  @Property({
    fieldName: 'approver_team_role_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  approverTeamRoleConceptId?: string;

  /**
   * Identificador asociado a decision concept.
   */
  @Property({ fieldName: 'decision_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  decisionConceptId?: string;

  /**
   * Valor de decision at mantenido por la instancia.
   */
  @Property({
    fieldName: 'decision_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  decisionAt?: Date;

  /**
   * Valor de comments mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  comments?: string;

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
