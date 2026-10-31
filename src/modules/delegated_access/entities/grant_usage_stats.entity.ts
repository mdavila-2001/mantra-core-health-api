import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Uso agregado por hora de un permiso de apoyo (derivada, no WORM). Alimenta el tablero y la certificación.
 */
@Entity({ schema: 'delegated_access', tableName: 'grant_usage_stats' })
export class GrantUsageStats {
  /** Identificador único de la instancia. */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /** Columna `tenant_id`. */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /** Columna `user_id`. */
  @Property({ fieldName: 'user_id', type: 'uuid' }) // FK → iam.users
  userId!: string;

  /** Columna `support_scope_grant_id`. */
  @Property({ fieldName: 'support_scope_grant_id', type: 'uuid' }) // FK → delegated_access.support_scope_grants
  supportScopeGrantId!: string;

  /** Columna `permission_code`. */
  @Property({ fieldName: 'permission_code', columnType: 'varchar' })
  permissionCode!: string;

  /** Columna `bucket_start`. */
  @Property({ fieldName: 'bucket_start', columnType: 'timestamptz' })
  bucketStart!: Date;

  /** Columna `permit_count`. */
  @Property({ fieldName: 'permit_count', columnType: 'int', default: 0 })
  permitCount: number = 0;

  /** Columna `deny_count`. */
  @Property({ fieldName: 'deny_count', columnType: 'int', default: 0 })
  denyCount: number = 0;

  /** Columna `challenge_count`. */
  @Property({ fieldName: 'challenge_count', columnType: 'int', default: 0 })
  challengeCount: number = 0;

  /** Columna `off_hours_count`. */
  @Property({ fieldName: 'off_hours_count', columnType: 'int', default: 0 })
  offHoursCount: number = 0;

  /** Columna `distinct_patients_in_bucket`. */
  @Property({
    fieldName: 'distinct_patients_in_bucket',
    columnType: 'int',
    default: 0,
  })
  distinctPatientsInBucket: number = 0;

  /** Columna `last_used_at`. */
  @Property({
    fieldName: 'last_used_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastUsedAt?: Date;

  /** Columna `updated_at`. */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;
}
