import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  getCurrentTenantId,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { GroupsRepository } from '../repositories';
import { COMM, GROUP_ROLE_CONCEPT_BY_CODE } from '../community.concepts';
import {
  CreateGroupDto,
  JoinGroupDto,
  IdResponseDto,
  GroupMembershipResponseDto,
  GroupMemberUpdatedDto,
  UpdateGroupMemberDto,
} from '../dto';
import { CommunityGroupAccessService } from './community-group-access.service';
import { CommunityVisibilityService } from './community-visibility.service';

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
 * Grupos/comunidades: creación, altas, bajas y administración de membresías
 * (UC-19-13, ampliado por P7).
 *
 * En grupos públicos la membresía queda activa; en privados/secretos queda
 * pendiente hasta que alguien que administra la resuelva.
 */
@Injectable()
export class CommunityGroupsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param groupsRepo - Acceso a `community.groups` y `group_members`.
   * @param access - Reglas de quién administra el grupo.
   * @param visibility - Resuelve el perfil del actor contra la sesión.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly groupsRepo: GroupsRepository,
    private readonly access: CommunityGroupAccessService,
    private readonly visibility: CommunityVisibilityService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommunityGroupsService.name);
  }

  /**
   * Crea un grupo y deja a su dueño dentro.
   *
   * ## Por qué el grupo nace con su organización y con un integrante
   *
   * Dos cosas que faltaban y rompían el recorrido completo del carril:
   *
   * 1. **`tenant_id`.** El directorio (`GET /community/groups`) exige la
   *    organización, así que un grupo creado sin ella no aparecía en ningún
   *    listado: se creaba bien y quedaba invisible para todos, incluido su
   *    autor.
   * 2. **La membresía del dueño.** Crear el grupo dejaba `group_members` vacío,
   *    de modo que el creador no era integrante de su propio grupo y no podía
   *    publicar en él. Ahora el alta del dueño es parte del mismo acto.
   *
   * @param dto - Datos del grupo.
   * @param actor - Quien lo crea.
   * @returns Identificador del grupo creado.
   * @throws ConflictException si el slug ya existe en la organización.
   * @throws ResourceNotFoundException si el tema declarado no existe.
   */
  async createGroup(
    dto: CreateGroupDto,
    actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    return this.em.transactional(async (tx) => {
      const tenantId = getCurrentTenantId();

      const duplicate = await this.groupsRepo.findBySlug(
        tx,
        tenantId,
        dto.slug,
      );
      if (duplicate)
        throw new ConflictException('Ya hay un grupo con ese slug', {
          slug: dto.slug,
        });

      if (dto.topicId) {
        const topic = await this.groupsRepo.findTopicById(tx, dto.topicId);
        if (!topic)
          throw new ResourceNotFoundException('Tema no encontrado', {
            topicId: dto.topicId,
          });
      }

      const ownerProfileId = await this.visibility.resolveActorProfileId(
        tx,
        actor,
        dto.ownerProfileId,
      );

      const group = this.groupsRepo.create(tx, {
        tenantId,
        slug: dto.slug,
        name: dto.name,
        description: dto.description,
        visibilityConceptId:
          GROUP_VISIBILITY_BY_CODE[dto.visibility ?? 'PUBLIC'],
        groupTypeConceptId: GROUP_TYPE_BY_CODE[dto.groupType ?? 'GENERAL'],
        topicId: dto.topicId,
        ownerProfileId,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      if (ownerProfileId) {
        this.groupsRepo.createMember(tx, {
          groupId: group.id,
          memberProfileId: ownerProfileId,
          memberRoleConceptId: COMM.GROUP_ROLE_OWNER,
          joinStatusConceptId: COMM.GROUP_JOIN_ACTIVE,
          actorUserId: actor.id,
        });
        group.memberCount = 1;
        await tx.flush();
      }

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
      // Una membresía que terminó —se fue, lo rechazaron— se reabre en vez de
      // fallar: si no, quien se dio de baja de un grupo público no podría volver
      // nunca, porque la fila sigue estando ahí.
      if (dup && this.isLiveMembership(dup))
        throw new ConflictException('El perfil ya es miembro del grupo', {
          groupId,
          memberProfileId: dto.memberProfileId,
        });

      const isPublic =
        group.visibilityConceptId === COMM.GROUP_VISIBILITY_PUBLIC;
      const joinStatus = isPublic
        ? COMM.GROUP_JOIN_ACTIVE
        : COMM.GROUP_JOIN_PENDING;

      let memberId: string;
      if (dup) {
        dup.joinStatusConceptId = joinStatus;
        dup.memberRoleConceptId = COMM.GROUP_ROLE_MEMBER;
        dup.joinedAt = new Date();
        dup.invitedByProfileId = dto.invitedByProfileId;
        touch(dup, actor.id);
        memberId = dup.id;
      } else {
        const member = this.groupsRepo.createMember(tx, {
          groupId,
          memberProfileId: dto.memberProfileId,
          memberRoleConceptId: COMM.GROUP_ROLE_MEMBER,
          joinStatusConceptId: joinStatus,
          invitedByProfileId: dto.invitedByProfileId,
          actorUserId: actor.id,
        });
        await tx.flush();
        memberId = member.id;
      }

      if (isPublic) {
        group.memberCount = (group.memberCount ?? 0) + 1;
        touch(group, actor.id);
      }
      await tx.flush();

      return { id: memberId, joinStatus };
    });
  }

  /**
   * Baja de un integrante: propia o dispuesta por quien administra (P7).
   *
   * La fila no se borra. Se marca `LEFT` o `REMOVED` según quién haya cortado
   * el vínculo, porque volver a entrar a un grupo del que uno se fue y volver a
   * entrar a uno del que lo echaron no son el mismo hecho, y borrar la fila
   * haría que el segundo caso no se pueda distinguir del primero.
   *
   * @param groupId - Grupo del que se sale.
   * @param memberProfileId - Perfil que deja el grupo.
   * @param actor - Quien ejecuta la baja.
   * @returns La membresía con su estado resultante.
   * @throws ConflictException si se intenta dar de baja al dueño.
   */
  async leaveGroup(
    groupId: string,
    memberProfileId: string,
    actor: AuthenticatedUser,
  ): Promise<GroupMemberUpdatedDto> {
    this.logger.info(
      { operation: 'community.group.leave', groupId },
      'Leaving group',
    );
    return this.em.transactional(async (tx) => {
      const access = await this.access.resolve(tx, groupId, actor);
      const isSelf = access.actorProfileId === memberProfileId;
      if (!isSelf) this.access.assertCanAdminister(access);

      const member = await this.groupsRepo.findMember(
        tx,
        groupId,
        memberProfileId,
      );
      if (!member)
        throw new ResourceNotFoundException('El perfil no es del grupo', {
          groupId,
          memberProfileId,
        });

      if (member.memberRoleConceptId === COMM.GROUP_ROLE_OWNER)
        throw new ConflictException(
          'El dueño no puede dejar el grupo: primero hay que transferirlo',
          { groupId, memberProfileId },
        );

      const wasActive = member.joinStatusConceptId === COMM.GROUP_JOIN_ACTIVE;
      member.joinStatusConceptId = isSelf
        ? COMM.GROUP_JOIN_LEFT
        : COMM.GROUP_JOIN_REMOVED;
      touch(member, actor.id);

      if (wasActive) {
        access.group.memberCount = Math.max(
          0,
          (access.group.memberCount ?? 1) - 1,
        );
        touch(access.group, actor.id);
      }
      await tx.flush();

      return this.toMemberUpdated(member);
    });
  }

  /**
   * Resuelve un alta pendiente y/o cambia el rol de un integrante (P7).
   *
   * @param groupId - Grupo administrado.
   * @param memberId - Membresía afectada.
   * @param dto - Decisión y/o rol nuevo.
   * @param actor - Quien administra.
   * @returns La membresía con su rol y estado resultantes.
   * @throws PreconditionFailedException si el cuerpo no pide ningún cambio, o
   *   si se resuelve un alta que no está pendiente.
   */
  async updateMember(
    groupId: string,
    memberId: string,
    dto: UpdateGroupMemberDto,
    actor: AuthenticatedUser,
  ): Promise<GroupMemberUpdatedDto> {
    if (!dto.decision && !dto.role)
      throw new PreconditionFailedException(
        'Hay que indicar una decisión o un rol',
        { groupId, memberId },
      );

    this.logger.info(
      { operation: 'community.group.member.update', groupId, memberId },
      'Updating group membership',
    );

    return this.em.transactional(async (tx) => {
      const access = await this.access.resolve(
        tx,
        groupId,
        actor,
        dto.actorProfileId,
      );
      this.access.assertCanAdminister(access);

      const member = await this.groupsRepo.findMemberById(
        tx,
        groupId,
        memberId,
      );
      if (!member)
        throw new ResourceNotFoundException('Membresía no encontrada', {
          groupId,
          memberId,
        });

      if (dto.decision) {
        if (member.joinStatusConceptId !== COMM.GROUP_JOIN_PENDING)
          throw new PreconditionFailedException(
            'La solicitud de ingreso ya estaba resuelta',
            { groupId, memberId },
          );

        if (dto.decision === 'APPROVE') {
          member.joinStatusConceptId = COMM.GROUP_JOIN_ACTIVE;
          member.joinedAt = new Date();
          access.group.memberCount = (access.group.memberCount ?? 0) + 1;
          touch(access.group, actor.id);
        } else {
          member.joinStatusConceptId = COMM.GROUP_JOIN_REJECTED;
        }
      }

      if (dto.role)
        member.memberRoleConceptId = GROUP_ROLE_CONCEPT_BY_CODE[dto.role];

      touch(member, actor.id);
      await tx.flush();

      return this.toMemberUpdated(member);
    });
  }

  // --- Apoyo ---

  /** `true` si la membresía sigue viva (activa o esperando aprobación). */
  private isLiveMembership(member: { joinStatusConceptId: string }): boolean {
    return (
      member.joinStatusConceptId === COMM.GROUP_JOIN_ACTIVE ||
      member.joinStatusConceptId === COMM.GROUP_JOIN_PENDING
    );
  }

  /** Proyecta la membresía a la respuesta de administración. */
  private toMemberUpdated(member: {
    id: string;
    memberRoleConceptId: string;
    joinStatusConceptId: string;
  }): GroupMemberUpdatedDto {
    return {
      id: member.id,
      memberRoleConceptId: member.memberRoleConceptId,
      joinStatusConceptId: member.joinStatusConceptId,
    };
  }
}
