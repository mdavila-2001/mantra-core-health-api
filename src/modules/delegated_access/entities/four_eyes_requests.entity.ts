import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Solicitud de aprobación de cuatro ojos genérica: acción sensible, cambio por encima del techo, excepción SoD, reactivación o traslado con más privilegio.
 */
@Entity({ schema: 'delegated_access', tableName: 'four_eyes_requests' })
export class FourEyesRequests {
  /** Identificador único de la instancia. */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /** Columna `tenant_id`. */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /** Columna `kind_concept_id`. */
  @Property({ fieldName: 'kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  kindConceptId!: string;

  /** Columna `requester_user_id`. */
  @Property({ fieldName: 'requester_user_id', type: 'uuid' }) // FK → iam.users
  requesterUserId!: string;

  /** Columna `subject_user_id`. */
  @Property({ fieldName: 'subject_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  subjectUserId?: string;

  /** Columna `organization_user_assignment_id`. */
  @Property({
    fieldName: 'organization_user_assignment_id',
    type: 'uuid',
    nullable: true,
  }) // FK → delegated_access.organization_user_assignments
  organizationUserAssignmentId?: string;

  /** Columna `permission_code`. */
  @Property({
    fieldName: 'permission_code',
    columnType: 'varchar',
    nullable: true,
  })
  permissionCode?: string;

  /** Columna `approver_kind_concept_id`. */
  @Property({ fieldName: 'approver_kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  approverKindConceptId!: string;

  /** Columna `payload_json`. */
  @Property({ fieldName: 'payload_json', type: 'json', columnType: 'jsonb' })
  payloadJson!: unknown;

  /** Columna `payload_hash`. */
  @Property({ fieldName: 'payload_hash', columnType: 'varchar' })
  payloadHash!: string;

  /** Columna `payload_schema_version`. */
  @Property({ fieldName: 'payload_schema_version', columnType: 'int' })
  payloadSchemaVersion!: number;

  /** Columna `reason_text`. */
  @Property({ fieldName: 'reason_text', columnType: 'text', nullable: true })
  reasonText?: string;

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

  /** Columna `decision_comment_text`. */
  @Property({
    fieldName: 'decision_comment_text',
    columnType: 'text',
    nullable: true,
  })
  decisionCommentText?: string;

  /** Columna `approved_until`. */
  @Property({
    fieldName: 'approved_until',
    columnType: 'timestamptz',
    nullable: true,
  })
  approvedUntil?: Date;

  /** Columna `consumed_at`. */
  @Property({
    fieldName: 'consumed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  consumedAt?: Date;

  /** Columna `executed_at`. */
  @Property({
    fieldName: 'executed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  executedAt?: Date;

  /** Columna `execution_result_json`. */
  @Property({
    fieldName: 'execution_result_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  executionResultJson?: unknown;

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
