import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Política de sesión por organización: inactividad, aviso de dispositivo nuevo, horario permitido, reglas de IP y MFA.
 */
@Entity({ schema: 'iam', tableName: 'session_policies' })
export class SessionPolicies {
  /** Identificador único de la instancia. */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /** Columna `tenant_id`. */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /** Columna `scope_concept_id`. */
  @Property({ fieldName: 'scope_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  scopeConceptId!: string;

  /** Columna `role_code`. */
  @Property({ fieldName: 'role_code', columnType: 'varchar', nullable: true })
  roleCode?: string;

  /** Columna `idle_timeout_minutes`. */
  @Property({ fieldName: 'idle_timeout_minutes', columnType: 'int' })
  idleTimeoutMinutes!: number;

  /** Columna `new_device_alert`. */
  @Property({ fieldName: 'new_device_alert', type: 'boolean' })
  newDeviceAlert!: boolean;

  /** Columna `allowed_hours_json`. */
  @Property({
    fieldName: 'allowed_hours_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  allowedHoursJson?: unknown;

  /** Columna `enforce_ip_rules`. */
  @Property({ fieldName: 'enforce_ip_rules', type: 'boolean' })
  enforceIpRules!: boolean;

  /** Columna `require_mfa`. */
  @Property({ fieldName: 'require_mfa', type: 'boolean' })
  requireMfa!: boolean;

  /** Columna `status_concept_id`. */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
