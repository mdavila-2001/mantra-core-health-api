import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'iam', tableName: 'api_keys' })
export class ApiKeys {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'key_prefix', columnType: 'varchar' })
  keyPrefix!: string;

  @Property({ fieldName: 'key_hash', columnType: 'varchar' })
  keyHash!: string;

  @Property({ fieldName: 'hash_algorithm_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  hashAlgorithmConceptId!: string;

  @Property({ fieldName: 'owner_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  ownerUserId?: string;

  @Property({ fieldName: 'service_principal_id', type: 'uuid', nullable: true }) // FK → authz.service_principals
  servicePrincipalId?: string;

  @Property({
    fieldName: 'expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  expiresAt?: Date;

  @Property({
    fieldName: 'last_used_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastUsedAt?: Date;

  @Property({
    fieldName: 'last_used_ip',
    columnType: 'varchar',
    nullable: true,
  })
  lastUsedIp?: string;

  @Property({
    fieldName: 'rate_limit_per_min',
    columnType: 'int',
    nullable: true,
  })
  rateLimitPerMin?: number;

  @Property({ fieldName: 'ip_access_rule_id', type: 'uuid', nullable: true }) // FK → authz.ip_access_rules
  ipAccessRuleId?: string;

  @Property({
    fieldName: 'revoked_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  revokedAt?: Date;

  @Property({ fieldName: 'revoked_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  revokedByUserId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
