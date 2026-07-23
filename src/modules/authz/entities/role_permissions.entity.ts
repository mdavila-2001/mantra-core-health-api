import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'authz', tableName: 'role_permissions' })
export class RolePermissions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'role_id', type: 'uuid' }) // FK → authz.roles
  roleId!: string;

  @Property({ fieldName: 'permission_id', type: 'uuid' }) // FK → authz.permissions
  permissionId!: string;

  @Property({ fieldName: 'effect_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  effectConceptId!: string;

  @Property({ fieldName: 'scope_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  scopeConceptId?: string;

  @Property({
    fieldName: 'constraint_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  constraintJson?: unknown;

  @Property({ fieldName: 'field_value_set_id', type: 'uuid', nullable: true }) // FK → terminology.value_sets
  fieldValueSetId?: string;

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
