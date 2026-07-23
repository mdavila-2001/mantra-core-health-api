import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'authz', tableName: 'permissions' })
export class Permissions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ fieldName: 'category_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  categoryId?: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ columnType: 'varchar' })
  resource!: string;

  @Property({ fieldName: 'action_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  actionConceptId!: string;

  @Property({
    fieldName: 'default_scope_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  defaultScopeConceptId?: string;

  @Property({ fieldName: 'is_field_level', type: 'boolean', nullable: true })
  isFieldLevel?: boolean;

  @Property({ fieldName: 'is_dangerous', type: 'boolean', nullable: true })
  isDangerous?: boolean;

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

  @Property({ fieldName: 'is_role_restricted', type: 'boolean' })
  isRoleRestricted!: boolean;

  @Property({
    fieldName: 'required_role_code',
    columnType: 'varchar',
    nullable: true,
  })
  requiredRoleCode?: string;

  @Property({ fieldName: 'allow_direct_user_grant', type: 'boolean' })
  allowDirectUserGrant!: boolean;
}
