import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `api_keys`.
 */
@Entity({ schema: 'iam', tableName: 'api_keys' })
export class ApiKeys {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Valor de key prefix mantenido por la instancia.
   */
  @Property({ fieldName: 'key_prefix', columnType: 'varchar' })
  keyPrefix!: string;

  /**
   * Valor de key hash mantenido por la instancia.
   */
  @Property({ fieldName: 'key_hash', columnType: 'varchar' })
  keyHash!: string;

  /**
   * Identificador asociado a hash algorithm concept.
   */
  @Property({ fieldName: 'hash_algorithm_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  hashAlgorithmConceptId!: string;

  /**
   * Identificador asociado a owner user.
   */
  @Property({ fieldName: 'owner_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  ownerUserId?: string;

  /**
   * Identificador asociado a service principal.
   */
  @Property({ fieldName: 'service_principal_id', type: 'uuid', nullable: true }) // FK → authz.service_principals
  servicePrincipalId?: string;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @Property({
    fieldName: 'expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  expiresAt?: Date;

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
   * Valor de last used ip mantenido por la instancia.
   */
  @Property({
    fieldName: 'last_used_ip',
    columnType: 'varchar',
    nullable: true,
  })
  lastUsedIp?: string;

  /**
   * Valor de rate limit per min mantenido por la instancia.
   */
  @Property({
    fieldName: 'rate_limit_per_min',
    columnType: 'int',
    nullable: true,
  })
  rateLimitPerMin?: number;

  /**
   * Identificador asociado a ip access rule.
   */
  @Property({ fieldName: 'ip_access_rule_id', type: 'uuid', nullable: true }) // FK → authz.ip_access_rules
  ipAccessRuleId?: string;

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
  @Property({ fieldName: 'revoked_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  revokedByUserId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
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
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
