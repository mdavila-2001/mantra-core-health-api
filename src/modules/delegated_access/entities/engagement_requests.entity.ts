import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Solicitud o invitación de vínculo de apoyo (o ampliación de uno existente). Vence a los 15 días.
 */
@Entity({ schema: 'delegated_access', tableName: 'engagement_requests' })
export class EngagementRequests {
  /** Identificador único de la instancia. */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /** Columna `tenant_id`. */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /** Columna `requester_user_id`. */
  @Property({ fieldName: 'requester_user_id', type: 'uuid' }) // FK → iam.users
  requesterUserId!: string;

  /** Columna `direction_concept_id`. */
  @Property({ fieldName: 'direction_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  directionConceptId!: string;

  /** Columna `role_template_id`. */
  @Property({ fieldName: 'role_template_id', type: 'uuid' }) // FK → delegated_access.role_templates
  roleTemplateId!: string;

  /** Columna `parent_assignment_id`. */
  @Property({ fieldName: 'parent_assignment_id', type: 'uuid', nullable: true }) // FK → delegated_access.organization_user_assignments
  parentAssignmentId?: string;

  /** Columna `message_text`. */
  @Property({ fieldName: 'message_text', columnType: 'text', nullable: true })
  messageText?: string;

  /** Columna `status_concept_id`. */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /** Columna `expires_at`. */
  @Property({ fieldName: 'expires_at', columnType: 'timestamptz' })
  expiresAt!: Date;

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

  /** Columna `decision_reason_text`. */
  @Property({
    fieldName: 'decision_reason_text',
    columnType: 'text',
    nullable: true,
  })
  decisionReasonText?: string;

  /** Columna `created_at`. */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /** Columna `updated_at`. */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /** Versión usada para controlar actualizaciones concurrentes. */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;

  /** Columna `created_by_user_id`. */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /** Columna `updated_by_user_id`. */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;
}
