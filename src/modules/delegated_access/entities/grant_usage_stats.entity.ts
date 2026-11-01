import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `grant_usage_stats`.
 */
@Entity({ schema: 'delegated_access', tableName: 'grant_usage_stats' })
export class GrantUsageStats {
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
   * Identificador asociado a support scope grant.
   */
  @Property({ fieldName: 'support_scope_grant_id', type: 'uuid' }) // FK → delegated_access.support_scope_grants (inferida)
  supportScopeGrantId!: string;

  /**
   * Valor de permission code mantenido por la instancia.
   */
  @Property({ fieldName: 'permission_code', columnType: 'varchar' })
  permissionCode!: string;

  /**
   * Valor de bucket start mantenido por la instancia.
   */
  @Property({ fieldName: 'bucket_start', columnType: 'timestamptz' })
  bucketStart!: Date;

  /**
   * Valor de permit count mantenido por la instancia.
   */
  @Property({ fieldName: 'permit_count', columnType: 'int', default: 0 })
  permitCount!: number;

  /**
   * Valor de deny count mantenido por la instancia.
   */
  @Property({ fieldName: 'deny_count', columnType: 'int', default: 0 })
  denyCount!: number;

  /**
   * Valor de challenge count mantenido por la instancia.
   */
  @Property({ fieldName: 'challenge_count', columnType: 'int', default: 0 })
  challengeCount!: number;

  /**
   * Valor de off hours count mantenido por la instancia.
   */
  @Property({ fieldName: 'off_hours_count', columnType: 'int', default: 0 })
  offHoursCount!: number;

  /**
   * Valor de distinct patients in bucket mantenido por la instancia.
   */
  @Property({
    fieldName: 'distinct_patients_in_bucket',
    columnType: 'int',
    default: 0,
  })
  distinctPatientsInBucket!: number;

  /**
   * Valor de last used at mantenido por la instancia.
   */
  @Property({
    fieldName: 'last_used_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastUsedAt?: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;
}
