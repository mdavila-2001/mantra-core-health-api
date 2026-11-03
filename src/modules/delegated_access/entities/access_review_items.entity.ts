import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `access_review_items`.
 */
@Entity({ schema: 'delegated_access', tableName: 'access_review_items' })
export class AccessReviewItems {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  /**
   * Identificador asociado a access review campaign.
   */
  @Property({ fieldName: 'access_review_campaign_id', type: 'uuid' }) // FK → delegated_access.access_review_campaigns (inferida)
  accessReviewCampaignId!: string;

  /**
   * Identificador asociado a organization user assignment.
   */
  @Property({ fieldName: 'organization_user_assignment_id', type: 'uuid' }) // FK → delegated_access.organization_user_assignments (inferida)
  organizationUserAssignmentId!: string;

  /**
   * Identificador asociado a support scope grant.
   */
  @Property({
    fieldName: 'support_scope_grant_id',
    type: 'uuid',
    nullable: true,
  }) // FK → delegated_access.support_scope_grants (inferida)
  supportScopeGrantId?: string;

  /**
   * Identificador asociado a reviewer user.
   */
  @Property({ fieldName: 'reviewer_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  reviewerUserId?: string;

  /**
   * Identificador asociado a reviewer kind concept.
   */
  @Property({ fieldName: 'reviewer_kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  reviewerKindConceptId!: string;

  /**
   * Identificador asociado a decision concept.
   */
  @Property({
    fieldName: 'decision_concept_id',
    type: 'uuid',
    default: '55a6db07-19e7-5bb4-978a-3d246492f49d',
  }) // FK → terminology.catalog_concepts (inferida)
  decisionConceptId!: string;

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
   * Identificador asociado a decided by user.
   */
  @Property({ fieldName: 'decided_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  decidedByUserId?: string;

  /**
   * Valor de decision comment text mantenido por la instancia.
   */
  @Property({
    fieldName: 'decision_comment_text',
    columnType: 'text',
    nullable: true,
  })
  decisionCommentText?: string;

  /**
   * Valor de adjustment json mantenido por la instancia.
   */
  @Property({
    fieldName: 'adjustment_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  adjustmentJson?: unknown;

  /**
   * Valor de evidence json mantenido por la instancia.
   */
  @Property({ fieldName: 'evidence_json', type: 'json', columnType: 'jsonb' })
  evidenceJson!: unknown;

  /**
   * Valor de evidence hash mantenido por la instancia.
   */
  @Property({ fieldName: 'evidence_hash', columnType: 'varchar' })
  evidenceHash!: string;

  /**
   * Valor de due at mantenido por la instancia.
   */
  @Property({ fieldName: 'due_at', columnType: 'timestamptz' })
  dueAt!: Date;

  /**
   * Valor de reminder count mantenido por la instancia.
   */
  @Property({ fieldName: 'reminder_count', columnType: 'int', default: 0 })
  reminderCount!: number;

  /**
   * Valor de last reminded at mantenido por la instancia.
   */
  @Property({
    fieldName: 'last_reminded_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastRemindedAt?: Date;

  /**
   * Valor de escalated at mantenido por la instancia.
   */
  @Property({
    fieldName: 'escalated_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  escalatedAt?: Date;

  /**
   * Identificador asociado a escalated to user.
   */
  @Property({ fieldName: 'escalated_to_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  escalatedToUserId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
