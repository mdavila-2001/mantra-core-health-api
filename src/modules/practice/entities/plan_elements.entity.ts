import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'practice', tableName: 'plan_elements' })
export class PlanElements {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  @Property({ fieldName: 'floor_plan_id', type: 'uuid' }) // FK → practice.floor_plans (inferida)
  floorPlanId!: string;

  @Property({ columnType: 'varchar(12)' })
  kind!: string;

  @Property({ type: 'json', columnType: 'jsonb', nullable: true })
  vertices?: unknown;

  @Property({
    fieldName: 'thickness_m',
    columnType: 'numeric(6,3)',
    nullable: true,
  })
  thicknessM?: string;

  @Property({ fieldName: 'host_element_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  hostElementId?: string;

  @Property({
    fieldName: 'offset_m',
    columnType: 'numeric(8,3)',
    nullable: true,
  })
  offsetM?: string;

  @Property({
    fieldName: 'width_m',
    columnType: 'numeric(6,3)',
    nullable: true,
  })
  widthM?: string;

  @Property({ columnType: 'varchar(8)', nullable: true })
  swing?: string;

  @Property({
    fieldName: 'swing_side',
    columnType: 'varchar(5)',
    nullable: true,
  })
  swingSide?: string;

  @Property({ columnType: 'varchar(120)', nullable: true })
  label?: string;

  @Property({
    fieldName: 'vertical_link_code',
    columnType: 'varchar(40)',
    nullable: true,
  })
  verticalLinkCode?: string;

  @Property({ fieldName: 'connects_space_a_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  connectsSpaceAId?: string;

  @Property({ fieldName: 'connects_space_b_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  connectsSpaceBId?: string;

  @Property({ fieldName: 'z_order', columnType: 'int' })
  zOrder!: number;

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
