import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'community', tableName: 'user_blocks' })
export class UserBlocks {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'blocker_profile_id', type: 'uuid' })  // FK → community.public_profiles
  blockerProfileId!: string;

  @Property({ fieldName: 'blocked_profile_id', type: 'uuid' })  // FK → community.public_profiles
  blockedProfileId!: string;

  @Property({ fieldName: 'reason_concept_id', type: 'uuid', nullable: true })  // FK → terminology.catalog_concepts
  reasonConceptId?: string;

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
