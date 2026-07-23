import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'geo', tableName: 'geofences' })
export class Geofences {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'shape_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  shapeTypeConceptId!: string;

  @Property({
    fieldName: 'geometry_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  geometryJson?: unknown;

  @Property({ fieldName: 'radius_m', columnType: 'numeric', nullable: true })
  radiusM?: string;

  @Property({ fieldName: 'center_lat', columnType: 'numeric', nullable: true })
  centerLat?: string;

  @Property({ fieldName: 'center_lng', columnType: 'numeric', nullable: true })
  centerLng?: string;

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
