import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `session_policies`.
 */
@Entity({ schema: 'iam', tableName: 'session_policies' })
export class SessionPolicies {
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
   * Identificador asociado a scope concept.
   */
  @Property({ fieldName: 'scope_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  scopeConceptId!: string;

  /**
   * Valor de role code mantenido por la instancia.
   */
  @Property({ fieldName: 'role_code', columnType: 'varchar', nullable: true })
  roleCode?: string;

  /**
   * Valor de idle timeout minutes mantenido por la instancia.
   */
  @Property({ fieldName: 'idle_timeout_minutes', columnType: 'int' })
  idleTimeoutMinutes!: number;

  /**
   * Valor de new device alert mantenido por la instancia.
   */
  @Property({ fieldName: 'new_device_alert', type: 'boolean' })
  newDeviceAlert!: boolean;

  /**
   * Valor de allowed hours json mantenido por la instancia.
   */
  @Property({
    fieldName: 'allowed_hours_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  allowedHoursJson?: unknown;

  /**
   * Valor de enforce ip rules mantenido por la instancia.
   */
  @Property({ fieldName: 'enforce_ip_rules', type: 'boolean' })
  enforceIpRules!: boolean;

  /**
   * Valor de require mfa mantenido por la instancia.
   */
  @Property({ fieldName: 'require_mfa', type: 'boolean' })
  requireMfa!: boolean;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  statusConceptId!: string;

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
