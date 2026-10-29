import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'practice', tableName: 'floor_plans' })
export class FloorPlans {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  @Property({ fieldName: 'practice_site_id', type: 'uuid' }) // FK → practice.practice_sites (inferida)
  practiceSiteId!: string;

  @Property({ fieldName: 'anchor_space_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  anchorSpaceId?: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'width_m', columnType: 'numeric(10,3)' })
  widthM!: string;

  @Property({ fieldName: 'height_m', columnType: 'numeric(10,3)' })
  heightM!: string;

  @Property({
    fieldName: 'elevation_m',
    columnType: 'numeric(8,3)',
    nullable: true,
  })
  elevationM?: string;

  @Property({ fieldName: 'north_bearing_deg', columnType: 'numeric(6,3)' })
  northBearingDeg!: string;

  @Property({ fieldName: 'grid_size_m', columnType: 'numeric(6,3)' })
  gridSizeM!: string;

  @Property({ fieldName: 'snap_to_grid', type: 'boolean', default: true })
  snapToGrid!: boolean;

  @Property({ fieldName: 'contact_tolerance_m', columnType: 'numeric(5,3)' })
  contactToleranceM!: string;

  @Property({ fieldName: 'background_file_id', type: 'uuid', nullable: true }) // FK → common.files (inferida)
  backgroundFileId?: string;

  @Property({
    fieldName: 'background_scale_m_per_px',
    columnType: 'numeric(12,6)',
    nullable: true,
  })
  backgroundScaleMPerPx?: string;

  @Property({ fieldName: 'background_offset_x_m', columnType: 'numeric(10,3)' })
  backgroundOffsetXM!: string;

  @Property({ fieldName: 'background_offset_y_m', columnType: 'numeric(10,3)' })
  backgroundOffsetYM!: string;

  @Property({
    fieldName: 'background_rotation_deg',
    columnType: 'numeric(6,3)',
  })
  backgroundRotationDeg!: string;

  @Property({ fieldName: 'background_opacity', columnType: 'numeric(3,2)' })
  backgroundOpacity!: string;

  @Property({ fieldName: 'layout_version', columnType: 'int' })
  layoutVersion!: number;

  @Property({
    fieldName: 'layout_version_txid',
    type: 'bigint',
    nullable: true,
  })
  layoutVersionTxid?: string;

  @Property({
    fieldName: 'layout_changed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  layoutChangedAt?: Date;

  @Property({ fieldName: 'valid_from', columnType: 'timestamptz' })
  validFrom!: Date;

  @Property({
    fieldName: 'valid_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  validTo?: Date;

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
