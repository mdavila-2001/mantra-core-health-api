import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `engagement_requests`.
 */
@Entity({ schema: 'delegated_access', tableName: 'engagement_requests' })
export class EngagementRequests {
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
   * Identificador asociado a requester user.
   */
  @Property({ fieldName: 'requester_user_id', type: 'uuid' }) // FK → iam.users (inferida)
  requesterUserId!: string;

  /**
   * Identificador asociado a direction concept.
   */
  @Property({ fieldName: 'direction_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  directionConceptId!: string;

  /**
   * Identificador asociado a role template.
   */
  @Property({ fieldName: 'role_template_id', type: 'uuid' }) // FK → delegated_access.role_templates (inferida)
  roleTemplateId!: string;

  /**
   * Identificador asociado a parent assignment.
   */
  @Property({ fieldName: 'parent_assignment_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  parentAssignmentId?: string;

  /**
   * Valor de message text mantenido por la instancia.
   */
  @Property({ fieldName: 'message_text', columnType: 'text', nullable: true })
  messageText?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  statusConceptId!: string;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @Property({ fieldName: 'expires_at', columnType: 'timestamptz' })
  expiresAt!: Date;

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
   * Valor de decision reason text mantenido por la instancia.
   */
  @Property({
    fieldName: 'decision_reason_text',
    columnType: 'text',
    nullable: true,
  })
  decisionReasonText?: string;

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
