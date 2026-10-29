import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'practice', tableName: 'space_placements' })
export class SpacePlacements {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  @Property({ fieldName: 'floor_plan_id', type: 'uuid' }) // FK → practice.floor_plans (inferida)
  floorPlanId!: string;

  @Property({ fieldName: 'care_space_id', type: 'uuid' }) // FK → practice.care_spaces (inferida)
  careSpaceId!: string;

  @Property({ fieldName: 'sibling_group_id', type: 'uuid', nullable: true })
  siblingGroupId?: string;

  @Property({ fieldName: 'shape_kind', columnType: 'varchar(8)' })
  shapeKind!: string;

  @Property({
    fieldName: 'center_x_m',
    columnType: 'numeric(10,3)',
    nullable: true,
  })
  centerXM?: string;

  @Property({
    fieldName: 'center_y_m',
    columnType: 'numeric(10,3)',
    nullable: true,
  })
  centerYM?: string;

  @Property({
    fieldName: 'width_m',
    columnType: 'numeric(10,3)',
    nullable: true,
  })
  widthM?: string;

  @Property({
    fieldName: 'depth_m',
    columnType: 'numeric(10,3)',
    nullable: true,
  })
  depthM?: string;

  @Property({
    fieldName: 'rotation_deg',
    columnType: 'numeric(6,3)',
    nullable: true,
  })
  rotationDeg?: string;

  @Property({ type: 'json', columnType: 'jsonb' })
  vertices!: unknown;

  @Property({
    fieldName: 'area_calc_m2',
    columnType: 'numeric(12,3)',
    nullable: true,
  })
  areaCalcM2?: string;

  @Property({ fieldName: 'z_order', columnType: 'int' })
  zOrder!: number;

  @Property({ type: 'boolean', default: false })
  locked!: boolean;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
