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
   * Grupos de un tenant (UC-19-12, cara de lectura).
   *
   * El `tenantId` es obligatorio y no opcional a propósito: `groups` es de las
   * pocas tablas del módulo con `tenant_id`, y un listado abierto sin acotarlo
   * mostraría los grupos de una organización a otra.
   *
   * Los grupos secretos no se listan acá: los ve quien ya es miembro,
   * resolviéndolos por id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización cuyos grupos se listan.
   * @param secretVisibilityConceptId - Visibilidad que no se publica en listado.
   * @param after - Clave de continuación `(createdAt, id)`.
   * @param limit - Tope de filas.
   * @returns Página de grupos, del más reciente al más antiguo.
   */
  searchPage(
    em: EntityManager,
    tenantId: string,
    secretVisibilityConceptId: string,
    after: { createdAt: string; id: string } | undefined,
    limit: number,
  ): Promise<Groups[]> {
    return em.find(
      Groups,
      {
        tenantId,
        visibilityConceptId: { $ne: secretVisibilityConceptId },
        ...(after
          ? {
              $or: [
                { createdAt: { $lt: new Date(after.createdAt) } },
                { createdAt: new Date(after.createdAt), id: { $lt: after.id } },
              ],
            }
          : {}),
      },
      { orderBy: { createdAt: 'DESC', id: 'DESC' }, limit },
    );
  }

  /**
   * Integrantes de un grupo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param groupId - Grupo a leer.
   * @param after - Clave de continuación `(createdAt, id)`.
   * @param limit - Tope de filas.
   * @returns Página de integrantes, por antigüedad de alta.
   */
  listMembers(
    em: EntityManager,
    groupId: string,
    after: { createdAt: string; id: string } | undefined,
    limit: number,
  ): Promise<GroupMembers[]> {
    return em.find(
      GroupMembers,
      {
        groupId,
        ...(after
          ? {
              $or: [
                { createdAt: { $gt: new Date(after.createdAt) } },
                { createdAt: new Date(after.createdAt), id: { $gt: after.id } },
              ],
            }
          : {}),
      },
      { orderBy: { createdAt: 'ASC', id: 'ASC' }, limit },
    );
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
