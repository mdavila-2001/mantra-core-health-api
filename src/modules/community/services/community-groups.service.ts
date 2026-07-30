import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { GroupsRepository } from '../repositories';
import { COMM } from '../community.concepts';
import {
  CreateGroupDto,
  JoinGroupDto,
  IdResponseDto,
  GroupMembershipResponseDto,
} from '../dto';

const GROUP_VISIBILITY_BY_CODE: Record<string, string> = {
  PUBLIC: COMM.GROUP_VISIBILITY_PUBLIC,
  PRIVATE: COMM.GROUP_VISIBILITY_PRIVATE,
  SECRET: COMM.GROUP_VISIBILITY_SECRET,
};

const GROUP_TYPE_BY_CODE: Record<string, string> = {
  GENERAL: COMM.GROUP_TYPE_GENERAL,
  SUPPORT: COMM.GROUP_TYPE_SUPPORT,
};

/**
 * Grupos/comunidades: creación (bootstrap) y unión de miembros (UC-19-13). En
 * grupos públicos la membresía queda activa; en privados/secretos queda pendiente
 * de aprobación.
 */
@Injectable()
export class CommunityGroupsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param groupsRepo - Valor de groups repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly groupsRepo: GroupsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommunityGroupsService.name);
  }

  /** Bootstrap: crea un grupo. */
  async createGroup(
    dto: CreateGroupDto,
    actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    return this.em.transactional(async (tx) => {
      const group = this.groupsRepo.create(tx, {
        slug: dto.slug,
        name: dto.name,
        description: dto.description,
        visibilityConceptId:
          GROUP_VISIBILITY_BY_CODE[dto.visibility ?? 'PUBLIC'],
        groupTypeConceptId: GROUP_TYPE_BY_CODE[dto.groupType ?? 'GENERAL'],
        ownerProfileId: dto.ownerProfileId,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();
      return { id: group.id };
    });
  }

  /** UC-19-13: une un perfil a un grupo (activo si público; pendiente si no). */
  async joinGroup(
    groupId: string,
    dto: JoinGroupDto,
    actor: AuthenticatedUser,
  ): Promise<GroupMembershipResponseDto> {
    this.logger.info(
      { operation: 'community.group.join', groupId },
      'Joining group',
    );
    return this.em.transactional(async (tx) => {
      const group = await this.groupsRepo.findById(tx, groupId);
      if (!group)
        throw new ResourceNotFoundException('Grupo no encontrado', { groupId });

      const dup = await this.groupsRepo.findMember(
        tx,
        groupId,
        dto.memberProfileId,
      );
      if (dup)
        throw new ConflictException('El perfil ya es miembro del grupo', {
          groupId,
          memberProfileId: dto.memberProfileId,
        });

      const isPublic =
        group.visibilityConceptId === COMM.GROUP_VISIBILITY_PUBLIC;
      const joinStatus = isPublic
        ? COMM.GROUP_JOIN_ACTIVE
        : COMM.GROUP_JOIN_PENDING;

      const member = this.groupsRepo.createMember(tx, {
        groupId,
        memberProfileId: dto.memberProfileId,
        memberRoleConceptId: COMM.GROUP_ROLE_MEMBER,
        joinStatusConceptId: joinStatus,
        invitedByProfileId: dto.invitedByProfileId,
        actorUserId: actor.id,
      });

      if (isPublic) {
        group.memberCount = (group.memberCount ?? 0) + 1;
        touch(group, actor.id);
      }
      await tx.flush();

      return { id: member.id, joinStatus };
    });
  }
}
