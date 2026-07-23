import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'community', tableName: 'group_members' })
export class GroupMembers {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'group_id', type: 'uuid' }) // FK → community.groups
  groupId!: string;

  @Property({ fieldName: 'member_profile_id', type: 'uuid' }) // FK (destino no resuelto)
  memberProfileId!: string;

  @Property({ fieldName: 'member_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  memberRoleConceptId!: string;

  @Property({ fieldName: 'join_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  joinStatusConceptId!: string;

  @Property({
    fieldName: 'joined_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  joinedAt?: Date;

  @Property({
    fieldName: 'invited_by_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  invitedByProfileId?: string;

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
