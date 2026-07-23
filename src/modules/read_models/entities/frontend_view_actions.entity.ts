import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'read_models', tableName: 'frontend_view_actions' })
export class FrontendViewActions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'frontend_page_view_id', type: 'uuid' }) // FK → read_models.frontend_page_views
  frontendPageViewId!: string;

  @Property({ fieldName: 'action_code', columnType: 'varchar' })
  actionCode!: string;

  @Property({ columnType: 'varchar' })
  label!: string;

  @Property({ fieldName: 'action_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  actionTypeConceptId!: string;

  @Property({
    fieldName: 'route_template',
    columnType: 'varchar',
    nullable: true,
  })
  routeTemplate?: string;

  @Property({
    fieldName: 'required_permission_id',
    type: 'uuid',
    nullable: true,
  }) // FK → authz.permissions
  requiredPermissionId?: string;

  @Property({
    fieldName: 'allowed_state_value_set_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.value_sets
  allowedStateValueSetId?: string;

  @Property({
    fieldName: 'confirmation_policy_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  confirmationPolicyConceptId?: string;

  @Property({
    fieldName: 'idempotency_required',
    type: 'boolean',
    nullable: true,
  })
  idempotencyRequired?: boolean;

  @Property({ fieldName: 'icon_key', columnType: 'varchar', nullable: true })
  iconKey?: string;

  @Property({
    fieldName: 'prominence_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  prominenceConceptId?: string;

  @Property({ columnType: 'int' })
  ordinal!: number;

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
