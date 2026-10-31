import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Bitácora WORM de decisiones de acceso del personal de apoyo (razón, permiso, condición, doctor). Solo se anexa: sin updated_at ni row_version.
 */
@Entity({ schema: 'delegated_access', tableName: 'access_decision_log' })
export class AccessDecisionLog {
  /** Identificador único de la instancia. */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /** Columna `tenant_id`. */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /** Columna `user_id`. */
  @Property({ fieldName: 'user_id', type: 'uuid' }) // FK → iam.users
  userId!: string;

  /** Columna `permission_code`. */
  @Property({ fieldName: 'permission_code', columnType: 'varchar' })
  permissionCode!: string;

  /** Columna `effect_concept_id`. */
  @Property({ fieldName: 'effect_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  effectConceptId!: string;

  /** Columna `reason_code`. */
  @Property({ fieldName: 'reason_code', columnType: 'varchar' })
  reasonCode!: string;

  /** Columna `grant_id`. */
  @Property({ fieldName: 'grant_id', type: 'uuid', nullable: true }) // FK → delegated_access.support_scope_grants
  grantId?: string;

  /** Columna `rule_id`. */
  @Property({ fieldName: 'rule_id', type: 'uuid', nullable: true }) // FK → delegated_access.governance_rules
  ruleId?: string;

  /** Columna `practitioner_role_assignment_id`. */
  @Property({
    fieldName: 'practitioner_role_assignment_id',
    type: 'uuid',
    nullable: true,
  }) // FK → practice.practitioner_role_assignments
  practitionerRoleAssignmentId?: string;

  /** Columna `healthcare_service_id`. */
  @Property({
    fieldName: 'healthcare_service_id',
    type: 'uuid',
    nullable: true,
  }) // FK → practice.healthcare_services
  healthcareServiceId?: string;

  /** Columna `care_space_id`. */
  @Property({ fieldName: 'care_space_id', type: 'uuid', nullable: true }) // FK → practice.care_spaces
  careSpaceId?: string;

  /** Columna `patient_profile_id`. */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid', nullable: true }) // FK → profiles.patient_profiles
  patientProfileId?: string;

  /** Columna `approval_id`. */
  @Property({ fieldName: 'approval_id', type: 'uuid', nullable: true }) // FK → delegated_access.four_eyes_requests
  approvalId?: string;

  /** Columna `correlation_id`. */
  @Property({ fieldName: 'correlation_id', type: 'uuid', nullable: true }) // FK → sin FK (correlación de la petición)
  correlationId?: string;

  /** Columna `session_id`. */
  @Property({ fieldName: 'session_id', type: 'uuid', nullable: true }) // FK → iam.sessions (token_id)
  sessionId?: string;

  /** Columna `ip`. */
  @Property({ fieldName: 'ip', columnType: 'inet', nullable: true })
  ip?: string;

  /** Columna `detail_json`. */
  @Property({
    fieldName: 'detail_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  detailJson?: unknown;

  /** Columna `recorded_at`. */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /** Columna `recorded_by_user_id`. */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
