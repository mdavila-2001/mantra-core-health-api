import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Groups, GroupMembers } from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create group data.
 */
export interface CreateGroupData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Valor de slug mantenido por la instancia.
   */
  slug: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Valor de description mantenido por la instancia.
   */
  description?: string;
  /**
   * Identificador asociado a visibility concept.
   */
  visibilityConceptId: string;
  /**
   * Identificador asociado a group type concept.
   */
  groupTypeConceptId: string;
  /**
   * Identificador asociado a owner profile.
   */
  ownerProfileId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create member data.
 */
export interface CreateMemberData {
  /**
   * Identificador asociado a group.
   */
  groupId: string;
  /**
   * Identificador asociado a member profile.
   */
  memberProfileId: string;
  /**
   * Identificador asociado a member role concept.
   */
  memberRoleConceptId: string;
  /**
   * Identificador asociado a join status concept.
   */
  joinStatusConceptId: string;
  /**
   * Identificador asociado a invited by profile.
   */
  invitedByProfileId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de grupos/comunidades y sus miembros. */
@Injectable()
export class GroupsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<Groups | null>`.
   */
  findById(em: EntityManager, id: string): Promise<Groups | null> {
    return em.findOne(Groups, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `Groups`.
   */
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

  /**
   * Obtiene find member.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param groupId - Identificador de group.
   * @param memberProfileId - Identificador de member profile.
   * @returns Resultado de find member conforme al contrato `Promise<GroupMembers | null>`.
   */
  findMember(
    em: EntityManager,
    groupId: string,
    memberProfileId: string,
  ): Promise<GroupMembers | null> {
    return em.findOne(GroupMembers, { groupId, memberProfileId });
  }

  /**
   * Crea create member.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create member conforme al contrato `GroupMembers`.
   */
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
