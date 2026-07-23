import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'authz', tableName: 'roles' })
export class Roles {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'parent_role_id', type: 'uuid', nullable: true }) // FK → authz.roles
  parentRoleId?: string;

  @Property({ fieldName: 'base_role_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  baseRoleConceptId?: string;

  @Property({ fieldName: 'scope_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  scopeConceptId?: string;

  @Property({ fieldName: 'is_system', type: 'boolean' })
  isSystem!: boolean;

  @Property({ fieldName: 'is_assignable', type: 'boolean' })
  isAssignable!: boolean;

  @Property({ columnType: 'int', nullable: true })
  priority?: number;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
