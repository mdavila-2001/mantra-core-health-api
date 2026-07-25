import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'community', tableName: 'reactions' })
export class Reactions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'actor_profile_id', type: 'uuid' })  // FK → community.public_profiles
  actorProfileId!: string;

  @Property({ fieldName: 'reactable_type_concept_id', type: 'uuid' })  // FK → terminology.catalog_concepts
  reactableTypeConceptId!: string;

  @Property({ fieldName: 'reactable_ref_id', type: 'uuid' })
  reactableRefId!: string;

  @Property({ fieldName: 'reaction_type_concept_id', type: 'uuid' })  // FK → terminology.catalog_concepts
  reactionTypeConceptId!: string;

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
