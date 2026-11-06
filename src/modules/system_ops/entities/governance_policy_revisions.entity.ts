import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `governance_policy_revisions`.
 */
@Entity({ schema: 'system_ops', tableName: 'governance_policy_revisions' })
export class GovernancePolicyRevisions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de policy type mantenido por la instancia.
   */
  @Property({ fieldName: 'policy_type', columnType: 'varchar' })
  policyType!: string;

  /**
   * Identificador asociado a policy.
   */
  @Property({ fieldName: 'policy_id', type: 'uuid' })
  policyId!: string;

  /**
   * Valor de revision no mantenido por la instancia.
   */
  @Property({ fieldName: 'revision_no', columnType: 'int' })
  revisionNo!: number;

  /**
   * Valor de content json mantenido por la instancia.
   */
  @Property({ fieldName: 'content_json', type: 'json', columnType: 'jsonb' })
  contentJson!: unknown;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @Property({ fieldName: 'content_hash', columnType: 'varchar' })
  contentHash!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  status!: string;

  /**
   * Valor de change reason mantenido por la instancia.
   */
  @Property({ fieldName: 'change_reason', columnType: 'text' })
  changeReason!: string;

  /**
   * Identificador asociado a submitted by user.
   */
  @Property({ fieldName: 'submitted_by_user_id', type: 'uuid' }) // FK → iam.users (inferida)
  submittedByUserId!: string;

  /**
   * Valor de submitted at mantenido por la instancia.
   */
  @Property({ fieldName: 'submitted_at', columnType: 'timestamptz' })
  submittedAt!: Date;

  /**
   * Identificador asociado a decided by user.
   */
  @Property({ fieldName: 'decided_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  decidedByUserId?: string;

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
   * Valor de decision comment mantenido por la instancia.
   */
  @Property({
    fieldName: 'decision_comment',
    columnType: 'text',
    nullable: true,
  })
  decisionComment?: string;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @Property({
    fieldName: 'effective_from',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveFrom?: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
