import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `change_approvals`.
 */
@Entity({ schema: 'platform_ops', tableName: 'change_approvals' })
export class ChangeApprovals {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a change request.
   */
  @Property({ fieldName: 'change_request_id', type: 'uuid' }) // FK → platform_ops.change_requests
  changeRequestId!: string;

  /**
   * Valor de approval step mantenido por la instancia.
   */
  @Property({ fieldName: 'approval_step', columnType: 'int' })
  approvalStep!: number;

  /**
   * Identificador asociado a approver user.
   */
  @Property({ fieldName: 'approver_user_id', type: 'uuid' }) // FK → iam.users
  approverUserId!: string;

  /**
   * Identificador asociado a decision concept.
   */
  @Property({ fieldName: 'decision_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  decisionConceptId!: string;

  /**
   * Valor de decision reason mantenido por la instancia.
   */
  @Property({
    fieldName: 'decision_reason',
    columnType: 'text',
    nullable: true,
  })
  decisionReason?: string;

  /**
   * Valor de decided at mantenido por la instancia.
   */
  @Property({ fieldName: 'decided_at', columnType: 'timestamptz' })
  decidedAt!: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
