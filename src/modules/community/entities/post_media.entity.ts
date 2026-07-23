import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'community', tableName: 'post_media' })
export class PostMedia {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'post_id', type: 'uuid' }) // FK (destino no resuelto)
  postId!: string;

  @Property({ fieldName: 'file_id', type: 'uuid' }) // FK → common.files
  fileId!: string;

  @Property({ fieldName: 'media_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  mediaRoleConceptId!: string;

  @Property({ fieldName: 'alt_text', columnType: 'varchar', nullable: true })
  altText?: string;

  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
