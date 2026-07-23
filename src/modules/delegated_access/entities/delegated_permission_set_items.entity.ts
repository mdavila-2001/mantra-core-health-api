import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'delegated_access',
  tableName: 'delegated_permission_set_items',
})
export class DelegatedPermissionSetItems {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'delegated_permission_set_id', type: 'uuid' }) // FK → delegated_access.delegated_permission_sets
  delegatedPermissionSetId!: string;

  @Property({ fieldName: 'permission_id', type: 'uuid' }) // FK → authz.permissions
  permissionId!: string;

  @Property({
    fieldName: 'constraint_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  constraintJson?: unknown;

  @Property({
    fieldName: 'requires_step_up_authentication',
    type: 'boolean',
    nullable: true,
  })
  requiresStepUpAuthentication?: boolean;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
