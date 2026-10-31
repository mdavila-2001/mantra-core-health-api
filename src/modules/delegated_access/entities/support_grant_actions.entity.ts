import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Acción (permiso) que incluye un permiso de apoyo. Cada permiso tiene sus propias acciones.
 */
@Entity({ schema: 'delegated_access', tableName: 'support_grant_actions' })
export class SupportGrantActions {
  /** Identificador único de la instancia. */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /** Organización dueña de la fila (la del padre, verificada por el modelo). */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /** Columna `support_scope_grant_id`. */
  @Property({ fieldName: 'support_scope_grant_id', type: 'uuid' }) // FK → delegated_access.support_scope_grants
  supportScopeGrantId!: string;

  /** Columna `permission_id`. */
  @Property({ fieldName: 'permission_id', type: 'uuid' }) // FK → authz.permissions
  permissionId!: string;

  /** Columna `created_at`. */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /** Condición ABAC propia de esta acción (esquema versionado); nula = sin condición. */
  @Property({
    fieldName: 'condition_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  conditionJson?: unknown;

  /** Versión del esquema de `condition_json`. */
  @Property({
    fieldName: 'condition_schema_version',
    columnType: 'int',
    nullable: true,
  })
  conditionSchemaVersion?: number;

  /** Cuándo la reemplazaron átomos (normalize-legacy); las filas reemplazadas se ignoran al evaluar. */
  @Property({
    fieldName: 'superseded_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  supersededAt?: Date | null;

  /** Última modificación de la fila; nula si nunca se modificó. */
  @Property({
    fieldName: 'updated_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  updatedAt?: Date;

  /** Quién la modificó por última vez. */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;
}
