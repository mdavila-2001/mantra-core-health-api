import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'auth_providers', tableName: 'provisioning_rules' })
export class ProvisioningRules {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'provider_id', type: 'uuid' }) // FK → auth_providers.identity_providers
  providerId!: string;

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ columnType: 'int' })
  priority!: number;

  @Property({
    fieldName: 'condition_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  conditionJson?: unknown;

  @Property({
    fieldName: 'assign_role_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  assignRoleConceptId?: string;

  @Property({ fieldName: 'assign_tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  assignTenantId?: string;

  @Property({ fieldName: 'effect_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  effectConceptId?: string;

  @Property({ fieldName: 'is_active', type: 'boolean' })
  isActive!: boolean;

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
