import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `four_eyes_requests`.
 */
@Entity({ schema: 'delegated_access', tableName: 'four_eyes_requests' })
export class FourEyesRequests {
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
   * Identificador asociado a kind concept.
   */
  @Property({ fieldName: 'kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  kindConceptId!: string;

  /**
   * Identificador asociado a requester user.
   */
  @Property({ fieldName: 'requester_user_id', type: 'uuid' }) // FK → iam.users (inferida)
  requesterUserId!: string;

  /**
   * Identificador asociado a subject user.
   */
  @Property({ fieldName: 'subject_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  subjectUserId?: string;

  /**
   * Identificador asociado a organization user assignment.
   */
  @Property({
    fieldName: 'organization_user_assignment_id',
    type: 'uuid',
    nullable: true,
  }) // FK → delegated_access.organization_user_assignments (inferida)
  organizationUserAssignmentId?: string;

  /**
   * Valor de permission code mantenido por la instancia.
   */
  @Property({
    fieldName: 'permission_code',
    columnType: 'varchar',
    nullable: true,
  })
  permissionCode?: string;

  /**
   * Valor de subject entity mantenido por la instancia.
   */
  @Property({
    fieldName: 'subject_entity',
    columnType: 'varchar',
    nullable: true,
  })
  subjectEntity?: string;

  /**
   * Identificador asociado a subject.
   */
  @Property({ fieldName: 'subject_id', type: 'uuid', nullable: true })
  subjectId?: string;

  /**
   * Identificador asociado a approver kind concept.
   */
  @Property({ fieldName: 'approver_kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  approverKindConceptId!: string;

  /**
   * Valor de payload json mantenido por la instancia.
   */
  @Property({ fieldName: 'payload_json', type: 'json', columnType: 'jsonb' })
  payloadJson!: unknown;

  /**
   * Valor de payload hash mantenido por la instancia.
   */
  @Property({ fieldName: 'payload_hash', columnType: 'varchar' })
  payloadHash!: string;

  /**
   * Valor de payload schema version mantenido por la instancia.
   */
  @Property({ fieldName: 'payload_schema_version', columnType: 'int' })
  payloadSchemaVersion!: number;

  /**
   * Valor de reason text mantenido por la instancia.
   */
  @Property({ fieldName: 'reason_text', columnType: 'text', nullable: true })
  reasonText?: string;

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
   * Valor de decision comment text mantenido por la instancia.
   */
  @Property({
    fieldName: 'decision_comment_text',
    columnType: 'text',
    nullable: true,
  })
  decisionCommentText?: string;

  /**
   * Valor de approved until mantenido por la instancia.
   */
  @Property({
    fieldName: 'approved_until',
    columnType: 'timestamptz',
    nullable: true,
  })
  approvedUntil?: Date;

  /**
   * Valor de consumed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'consumed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  consumedAt?: Date;

  /**
   * Valor de executed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'executed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  executedAt?: Date;

  /**
   * Valor de execution result json mantenido por la instancia.
   */
  @Property({
    fieldName: 'execution_result_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  executionResultJson?: unknown;

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
