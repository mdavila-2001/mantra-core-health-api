import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'ad_placements' })
export class AdPlacements {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'ad_set_id', type: 'uuid' }) // FK → ads.ad_sets
  adSetId!: string;

  @Property({ fieldName: 'platform_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  platformConceptId!: string;

  @Property({ fieldName: 'position_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  positionConceptId!: string;

  @Property({ fieldName: 'device_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  deviceConceptId?: string;

  @Property({ fieldName: 'is_enabled', type: 'boolean', nullable: true })
  isEnabled?: boolean;

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
