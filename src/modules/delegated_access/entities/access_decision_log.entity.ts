import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `access_decision_log`.
 */
@Entity({ schema: 'delegated_access', tableName: 'access_decision_log' })
export class AccessDecisionLog {
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
   * Identificador asociado a user.
   */
  @Property({ fieldName: 'user_id', type: 'uuid' }) // FK → iam.users (inferida)
  userId!: string;

  /**
   * Valor de permission code mantenido por la instancia.
   */
  @Property({ fieldName: 'permission_code', columnType: 'varchar' })
  permissionCode!: string;

  /**
   * Identificador asociado a effect concept.
   */
  @Property({ fieldName: 'effect_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  effectConceptId!: string;

  /**
   * Valor de reason code mantenido por la instancia.
   */
  @Property({ fieldName: 'reason_code', columnType: 'varchar' })
  reasonCode!: string;

  /**
   * Identificador asociado a grant.
   */
  @Property({ fieldName: 'grant_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  grantId?: string;

  /**
   * Identificador asociado a rule.
   */
  @Property({ fieldName: 'rule_id', type: 'uuid', nullable: true })
  ruleId?: string;

  /**
   * Identificador asociado a practitioner role assignment.
   */
  @Property({
    fieldName: 'practitioner_role_assignment_id',
    type: 'uuid',
    nullable: true,
  })
  practitionerRoleAssignmentId?: string;

  /**
   * Identificador asociado a healthcare service.
   */
  @Property({
    fieldName: 'healthcare_service_id',
    type: 'uuid',
    nullable: true,
  })
  healthcareServiceId?: string;

  /**
   * Identificador asociado a care space.
   */
  @Property({ fieldName: 'care_space_id', type: 'uuid', nullable: true })
  careSpaceId?: string;

  /**
   * Identificador asociado a patient profile.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid', nullable: true })
  patientProfileId?: string;

  /**
   * Identificador asociado a approval.
   */
  @Property({ fieldName: 'approval_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  approvalId?: string;

  /**
   * Identificador asociado a correlation.
   */
  @Property({ fieldName: 'correlation_id', type: 'uuid', nullable: true })
  correlationId?: string;

  /**
   * Identificador asociado a session.
   */
  @Property({ fieldName: 'session_id', type: 'uuid', nullable: true })
  sessionId?: string;

  /**
   * Valor de ip mantenido por la instancia.
   */
  @Property({ columnType: 'inet', nullable: true })
  ip?: string;

  /**
   * Valor de detail json mantenido por la instancia.
   */
  @Property({
    fieldName: 'detail_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  detailJson?: unknown;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  recordedByUserId?: string;
}
