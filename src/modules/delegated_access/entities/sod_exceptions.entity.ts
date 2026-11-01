import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `sod_exceptions`.
 */
@Entity({ schema: 'delegated_access', tableName: 'sod_exceptions' })
export class SodExceptions {
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
   * Identificador asociado a sod rule.
   */
  @Property({ fieldName: 'sod_rule_id', type: 'uuid' }) // FK → delegated_access.sod_rules (inferida)
  sodRuleId!: string;

  /**
   * Identificador asociado a organization user assignment.
   */
  @Property({ fieldName: 'organization_user_assignment_id', type: 'uuid' }) // FK → delegated_access.organization_user_assignments (inferida)
  organizationUserAssignmentId!: string;

  /**
   * Identificador asociado a four eyes request.
   */
  @Property({ fieldName: 'four_eyes_request_id', type: 'uuid' }) // FK → delegated_access.four_eyes_requests (inferida)
  fourEyesRequestId!: string;

  /**
   * Valor de justification text mantenido por la instancia.
   */
  @Property({ fieldName: 'justification_text', columnType: 'text' })
  justificationText!: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_from', columnType: 'timestamptz' })
  validFrom!: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_to', columnType: 'timestamptz' })
  validTo!: Date;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  statusConceptId!: string;

  /**
   * Valor de revoked at mantenido por la instancia.
   */
  @Property({
    fieldName: 'revoked_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  revokedAt?: Date;

  /**
   * Identificador asociado a revoked by user.
   */
  @Property({ fieldName: 'revoked_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  revokedByUserId?: string;

  /**
   * Valor de revoke reason text mantenido por la instancia.
   */
  @Property({
    fieldName: 'revoke_reason_text',
    columnType: 'text',
    nullable: true,
  })
  revokeReasonText?: string;

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
