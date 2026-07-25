import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'community', tableName: 'public_profiles' })
export class PublicProfiles {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })  // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'target_type_concept_id', type: 'uuid' })  // FK → terminology.catalog_concepts
  targetTypeConceptId!: string;

  @Property({ fieldName: 'target_id', type: 'uuid' })
  targetId!: string;

  @Property({ columnType: 'varchar' })
  slug!: string;

  @Property({ fieldName: 'display_name', columnType: 'varchar' })
  displayName!: string;

  @Property({ columnType: 'varchar', nullable: true })
  headline?: string;

  @Property({ columnType: 'text', nullable: true })
  biography?: string;

  @Property({ fieldName: 'avatar_file_id', type: 'uuid', nullable: true })  // FK → common.files
  avatarFileId?: string;

  @Property({ fieldName: 'cover_file_id', type: 'uuid', nullable: true })  // FK → common.files
  coverFileId?: string;

  @Property({ fieldName: 'verification_status_concept_id', type: 'uuid', nullable: true })  // FK → terminology.catalog_concepts
  verificationStatusConceptId?: string;

  @Property({ fieldName: 'visibility_concept_id', type: 'uuid', nullable: true })  // FK → terminology.catalog_concepts
  visibilityConceptId?: string;

  @Property({ fieldName: 'accepts_reviews', type: 'boolean', nullable: true })
  acceptsReviews?: boolean;

  @Property({ fieldName: 'comments_default_enabled', type: 'boolean', nullable: true })
  commentsDefaultEnabled?: boolean;

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
