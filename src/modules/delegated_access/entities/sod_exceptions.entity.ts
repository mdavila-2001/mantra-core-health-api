import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Excepción justificada y con vencimiento a una regla de segregación de funciones (nace de una aprobación de cuatro ojos).
 */
@Entity({ schema: 'delegated_access', tableName: 'sod_exceptions' })
export class SodExceptions {
  /** Identificador único de la instancia. */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /** Columna `tenant_id`. */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /** Columna `sod_rule_id`. */
  @Property({ fieldName: 'sod_rule_id', type: 'uuid' }) // FK → delegated_access.sod_rules
  sodRuleId!: string;

  /** Columna `organization_user_assignment_id`. */
  @Property({ fieldName: 'organization_user_assignment_id', type: 'uuid' }) // FK → delegated_access.organization_user_assignments
  organizationUserAssignmentId!: string;

  /** Columna `four_eyes_request_id`. */
  @Property({ fieldName: 'four_eyes_request_id', type: 'uuid' }) // FK → delegated_access.four_eyes_requests
  fourEyesRequestId!: string;

  /** Columna `justification_text`. */
  @Property({ fieldName: 'justification_text', columnType: 'text' })
  justificationText!: string;

  /** Columna `valid_from`. */
  @Property({ fieldName: 'valid_from', columnType: 'timestamptz' })
  validFrom!: Date;

  /** Columna `valid_to`. */
  @Property({ fieldName: 'valid_to', columnType: 'timestamptz' })
  validTo!: Date;

  /** Columna `status_concept_id`. */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /** Columna `revoked_at`. */
  @Property({
    fieldName: 'revoked_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  revokedAt?: Date;

  /** Columna `revoked_by_user_id`. */
  @Property({ fieldName: 'revoked_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  revokedByUserId?: string;

  /** Columna `revoke_reason_text`. */
  @Property({
    fieldName: 'revoke_reason_text',
    columnType: 'text',
    nullable: true,
  })
  revokeReasonText?: string;

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
