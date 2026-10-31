import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Tarea de una campaña: certificar, revocar o ajustar un vínculo o un permiso concreto.
 */
@Entity({ schema: 'delegated_access', tableName: 'access_review_items' })
export class AccessReviewItems {
  /** Identificador único de la instancia. */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /** Columna `tenant_id`. */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /** Columna `access_review_campaign_id`. */
  @Property({ fieldName: 'access_review_campaign_id', type: 'uuid' }) // FK → delegated_access.access_review_campaigns
  accessReviewCampaignId!: string;

  /** Columna `organization_user_assignment_id`. */
  @Property({ fieldName: 'organization_user_assignment_id', type: 'uuid' }) // FK → delegated_access.organization_user_assignments
  organizationUserAssignmentId!: string;

  /** Columna `support_scope_grant_id`. */
  @Property({
    fieldName: 'support_scope_grant_id',
    type: 'uuid',
    nullable: true,
  }) // FK → delegated_access.support_scope_grants
  supportScopeGrantId?: string;

  /** Columna `reviewer_user_id`. */
  @Property({ fieldName: 'reviewer_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  reviewerUserId?: string;

  /** Columna `reviewer_kind_concept_id`. */
  @Property({ fieldName: 'reviewer_kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  reviewerKindConceptId!: string;

  /** Columna `decision_concept_id`. */
  @Property({
    fieldName: 'decision_concept_id',
    type: 'uuid',
    default: '55a6db07-19e7-5bb4-978a-3d246492f49d',
  }) // FK → terminology.catalog_concepts
  decisionConceptId: string = '55a6db07-19e7-5bb4-978a-3d246492f49d';

  /** Columna `decided_at`. */
  @Property({
    fieldName: 'decided_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  decidedAt?: Date;

  /** Columna `decided_by_user_id`. */
  @Property({ fieldName: 'decided_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  decidedByUserId?: string;

  /** Columna `decision_comment_text`. */
  @Property({
    fieldName: 'decision_comment_text',
    columnType: 'text',
    nullable: true,
  })
  decisionCommentText?: string;

  /** Columna `adjustment_json`. */
  @Property({
    fieldName: 'adjustment_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  adjustmentJson?: unknown;

  /** Columna `evidence_json`. */
  @Property({ fieldName: 'evidence_json', type: 'json', columnType: 'jsonb' })
  evidenceJson!: unknown;

  /** Columna `evidence_hash`. */
  @Property({ fieldName: 'evidence_hash', columnType: 'varchar' })
  evidenceHash!: string;

  /** Columna `due_at`. */
  @Property({ fieldName: 'due_at', columnType: 'timestamptz' })
  dueAt!: Date;

  /** Columna `reminder_count`. */
  @Property({ fieldName: 'reminder_count', columnType: 'int', default: 0 })
  reminderCount: number = 0;

  /** Columna `last_reminded_at`. */
  @Property({
    fieldName: 'last_reminded_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastRemindedAt?: Date;

  /** Columna `escalated_at`. */
  @Property({
    fieldName: 'escalated_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  escalatedAt?: Date;

  /** Columna `escalated_to_user_id`. */
  @Property({ fieldName: 'escalated_to_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  escalatedToUserId?: string;

  /** Columna `created_at`. */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /** Columna `updated_at`. */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /** Columna `created_by_user_id`. */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /** Columna `updated_by_user_id`. */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /** Versión usada para controlar actualizaciones concurrentes. */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
