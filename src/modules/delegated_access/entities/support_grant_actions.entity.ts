import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `support_grant_actions`.
 */
@Entity({ schema: 'delegated_access', tableName: 'support_grant_actions' })
export class SupportGrantActions {
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
   * Identificador asociado a support scope grant.
   */
  @Property({ fieldName: 'support_scope_grant_id', type: 'uuid' }) // FK → delegated_access.support_scope_grants (inferida)
  supportScopeGrantId!: string;

  /**
   * Identificador asociado a permission.
   */
  @Property({ fieldName: 'permission_id', type: 'uuid' }) // FK → authz.permissions (inferida)
  permissionId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Valor de condition json mantenido por la instancia.
   */
  @Property({
    fieldName: 'condition_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  conditionJson?: unknown;

  /**
   * Valor de condition schema version mantenido por la instancia.
   */
  @Property({
    fieldName: 'condition_schema_version',
    columnType: 'int',
    nullable: true,
  })
  conditionSchemaVersion?: number;

  /**
   * Valor de superseded at mantenido por la instancia.
   */
  @Property({
    fieldName: 'superseded_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  supersededAt?: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({
    fieldName: 'updated_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  updatedAt?: Date;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;
}
