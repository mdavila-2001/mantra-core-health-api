import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'community', tableName: 'hashtags' })
export class Hashtags {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ columnType: 'varchar' })
  tag!: string;

  @Property({ fieldName: 'normalized_tag', columnType: 'varchar', nullable: true })
  normalizedTag?: string;

  @Property({ fieldName: 'usage_count', type: 'bigint', nullable: true })
  usageCount?: string;

  @Property({ fieldName: 'topic_id', type: 'uuid', nullable: true })  // FK → community.topics
  topicId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' })  // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
