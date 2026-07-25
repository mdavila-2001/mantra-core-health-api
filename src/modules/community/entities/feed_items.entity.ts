import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'community', tableName: 'feed_items' })
export class FeedItems {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'owner_profile_id', type: 'uuid' })  // FK → community.public_profiles
  ownerProfileId!: string;

  @Property({ fieldName: 'item_type_concept_id', type: 'uuid' })  // FK → terminology.catalog_concepts
  itemTypeConceptId!: string;

  @Property({ fieldName: 'source_type_concept_id', type: 'uuid' })  // FK → terminology.catalog_concepts
  sourceTypeConceptId!: string;

  @Property({ fieldName: 'source_ref_id', type: 'uuid' })
  sourceRefId!: string;

  @Property({ fieldName: 'origin_concept_id', type: 'uuid' })  // FK → terminology.catalog_concepts
  originConceptId!: string;

  @Property({ fieldName: 'rank_score', columnType: 'numeric', nullable: true })
  rankScore?: string;

  @Property({ fieldName: 'is_seen', type: 'boolean', nullable: true })
  isSeen?: boolean;

  @Property({ fieldName: 'is_hidden', type: 'boolean', nullable: true })
  isHidden?: boolean;

  @Property({ fieldName: 'surfaced_at', columnType: 'timestamptz', nullable: true })
  surfacedAt?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })  // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })  // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;

}
