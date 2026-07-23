import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'community', tableName: 'groups' })
export class Groups {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ columnType: 'varchar' })
  slug!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ columnType: 'text', nullable: true })
  description?: string;

  @Property({ fieldName: 'visibility_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  visibilityConceptId!: string;

  @Property({ fieldName: 'group_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  groupTypeConceptId!: string;

  @Property({ fieldName: 'topic_id', type: 'uuid', nullable: true }) // FK → community.topics
  topicId?: string;

  @Property({ fieldName: 'owner_profile_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  ownerProfileId?: string;

  @Property({ fieldName: 'cover_file_id', type: 'uuid', nullable: true }) // FK → common.files
  coverFileId?: string;

  @Property({ fieldName: 'member_count', columnType: 'int', nullable: true })
  memberCount?: number;

  @Property({ fieldName: 'post_count', columnType: 'int', nullable: true })
  postCount?: number;

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
