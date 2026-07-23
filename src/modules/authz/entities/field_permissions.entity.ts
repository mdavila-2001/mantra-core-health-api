import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'authz', tableName: 'field_permissions' })
export class FieldPermissions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'role_id', type: 'uuid' }) // FK → authz.roles
  roleId!: string;

  @Property({ columnType: 'varchar' })
  entity!: string;

  @Property({ fieldName: 'column_name', columnType: 'varchar' })
  columnName!: string;

  @Property({ fieldName: 'can_read', type: 'boolean' })
  canRead!: boolean;

  @Property({ fieldName: 'can_write', type: 'boolean' })
  canWrite!: boolean;

  @Property({
    fieldName: 'mask_strategy_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  maskStrategyConceptId?: string;

  @Property({
    fieldName: 'condition_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  conditionJson?: unknown;

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
