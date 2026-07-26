import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Groups, GroupMembers } from '../entities';
import { createdBy } from '../../../common';

export interface CreateGroupData {
  tenantId?: string;
  slug: string;
  name: string;
  description?: string;
  visibilityConceptId: string;
  groupTypeConceptId: string;
  ownerProfileId?: string;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateMemberData {
  groupId: string;
  memberProfileId: string;
  memberRoleConceptId: string;
  joinStatusConceptId: string;
  invitedByProfileId?: string;
  actorUserId?: string;
}

/** Acceso a datos de grupos/comunidades y sus miembros. */
@Injectable()
export class GroupsRepository {
  findById(em: EntityManager, id: string): Promise<Groups | null> {
    return em.findOne(Groups, { id });
  }

  create(em: EntityManager, data: CreateGroupData): Groups {
    return em.create(
      Groups,
      {
        tenantId: data.tenantId,
        slug: data.slug,
        name: data.name,
        description: data.description,
        visibilityConceptId: data.visibilityConceptId,
        groupTypeConceptId: data.groupTypeConceptId,
        ownerProfileId: data.ownerProfileId,
        memberCount: 0,
        postCount: 0,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findMember(
    em: EntityManager,
    groupId: string,
    memberProfileId: string,
  ): Promise<GroupMembers | null> {
    return em.findOne(GroupMembers, { groupId, memberProfileId });
  }

  createMember(em: EntityManager, data: CreateMemberData): GroupMembers {
    return em.create(
      GroupMembers,
      {
        groupId: data.groupId,
        memberProfileId: data.memberProfileId,
        memberRoleConceptId: data.memberRoleConceptId,
        joinStatusConceptId: data.joinStatusConceptId,
        joinedAt: new Date(),
        invitedByProfileId: data.invitedByProfileId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
