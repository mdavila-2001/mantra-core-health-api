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
import { GroupsRepository, PublicProfilesRepository } from '../repositories';
import type { GroupMembers } from '../entities';
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
import { CommunityGroupNotificationsService } from './community-group-notifications.service';
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
 * El código que la pantalla lee para saber qué ofrecer (TP-3, regla 06).
 *
 * Viaja en el cuerpo del 422 junto al texto. El texto es para que una persona
 * entienda qué pasó; el código es para que la pantalla pueda enlazar a
 * «configurá tu perfil» sin adivinar por el contenido del mensaje — que
 * cambiaría con cualquier reescritura.
 */
export const PERFIL_PUBLICO_REQUERIDO = 'PUBLIC_PROFILE_REQUIRED';

/**
 * El estado terminal de un grupo sin nadie adentro (TP-3, regla 08).
 *
 * ## El bloqueador, dicho en voz alta
 *
 * El catálogo transversal de estados no tiene un concepto de «disuelto», y el
 * value set de estados del grupo tampoco declara uno propio: `groups` nace y
 * vive en `state:active` y no hay ningún otro estado previsto. Crear el
 * concepto es de Marcelo (`.puml → gen_ddl.py`).
 *
 * Mientras tanto se usa `state:revoked`, que es el que en el resto del sistema
 * significa «esto ya no está en pie». No es la palabra —un grupo no se revoca—
 * pero es el único estado terminal disponible, y dejarlo activo sería peor: el
 * grupo seguiría apareciendo en el directorio sin nadie adentro.
 *
 * Cuando el concepto exista, cambia esta constante y nada más.
 */
export const GRUPO_DISUELTO = CONCEPTS.STATE_REVOKED;

/**
 * Los roles que heredan el grupo antes que un integrante común.
 *
 * Se prefiere a quien ya administraba: la sucesión es una continuidad, no un
 * ascenso sorpresa para alguien que sólo participaba.
 */
const ROLES_QUE_PUEDEN_HEREDAR: readonly string[] = [
  COMM.GROUP_ROLE_ADMIN,
  COMM.GROUP_ROLE_MODERATOR,
];

/**
 * Si el grupo que se está creando va a ser público.
 *
 * `PUBLIC` es el valor por omisión del alta, así que **no declarar la
 * visibilidad también crea un grupo público**: la comprobación tiene que
 * tratar la ausencia igual que el valor explícito, o la regla se saltea con
 * sólo omitir el campo.
 */
function esVisibilidadPublica(visibility: string | undefined): boolean {
  return (visibility ?? 'PUBLIC') === 'PUBLIC';
}

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
   * @param publicProfilesRepo - El perfil con el que se presenta un grupo público.
   * @param access - Reglas de quién administra el grupo.
   * @param visibility - Resuelve el perfil del actor contra la sesión.
   * @param notifications - Avisos in-app del grupo por el canal de P1.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly groupsRepo: GroupsRepository,
    // TP-3 · regla 06: un grupo público se presenta con la cara de quien lo
    // creó, así que hay que poder mirar ese perfil antes de dejarlo publicar.
    private readonly publicProfilesRepo: PublicProfilesRepository,
    private readonly access: CommunityGroupAccessService,
    private readonly visibility: CommunityVisibilityService,
    private readonly notifications: CommunityGroupNotificationsService,
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

      // TP-3 · regla 07: sin perfil público no hay dueño, y sin dueño no hay
      // grupo.
      //
      // Éste es el defecto F-30 en su raíz. El alta creaba el grupo siempre y
      // le ponía dueño **sólo si** el actor tenía perfil público; quien no lo
      // tenía terminaba con un grupo suyo, sin dueño y sin un solo integrante:
      // «creé el grupo y no puedo entrar». Y no era recuperable, porque para
      // entrar hay que ser miembro y para hacerse miembro hay que ser dueño.
      //
      // Va antes de crear nada: rechazar después obligaría a confiar en que el
      // rollback llegue, y así ni siquiera hace falta.
      if (!ownerProfileId) {
        throw new PreconditionFailedException(
          'Para crear un grupo necesitás tu perfil público configurado',
          { code: PERFIL_PUBLICO_REQUERIDO },
        );
      }

      // TP-3 · regla 06: un grupo público exige un perfil público completo.
      //
      // Un grupo público se le muestra a desconocidos con la cara de quien lo
      // creó. Si esa cara es un perfil a medio hacer —sin nombre visible, sin
      // foto, o en privado— el grupo aparece en el directorio presentado por
      // alguien que, del otro lado, no existe.
      if (esVisibilidadPublica(dto.visibility)) {
        await this.assertPerfilPublicoCompleto(tx, ownerProfileId);
      }

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

      // Dentro de la misma transacción que el grupo: si la membresía falla, el
      // grupo tampoco queda. Ya no hay `if` — el dueño está garantizado arriba.
      this.groupsRepo.createMember(tx, {
        groupId: group.id,
        memberProfileId: ownerProfileId,
        memberRoleConceptId: COMM.GROUP_ROLE_OWNER,
        joinStatusConceptId: COMM.GROUP_JOIN_ACTIVE,
        actorUserId: actor.id,
      });
      group.memberCount = 1;
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

      // TP-3 · regla 08: el candado va ANTES de leer el recuento.
      //
      // Sin él, dos salidas simultáneas leen las dos «quedaba uno» y deciden
      // las dos que el grupo sigue vivo — o las dos que hay que disolverlo.
      // `FOR UPDATE` sobre el grupo serializa el par recuento-decisión, que es
      // lo único que tiene que ser atómico acá.
      const group = await this.groupsRepo.findByIdForUpdate(tx, groupId);
      if (!group)
        throw new ResourceNotFoundException('Grupo no encontrado', { groupId });

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

      const wasActive = member.joinStatusConceptId === COMM.GROUP_JOIN_ACTIVE;
      const eraDueno = member.memberRoleConceptId === COMM.GROUP_ROLE_OWNER;

      member.joinStatusConceptId = isSelf
        ? COMM.GROUP_JOIN_LEFT
        : COMM.GROUP_JOIN_REMOVED;
      touch(member, actor.id);
      await tx.flush();

      // El recuento se recalcula DENTRO de la transacción y contra la base, no
      // restándole uno a lo que decía la fila. Un contador que se decrementa a
      // ciegas termina en negativo o en «uno de más» apenas dos salidas se
      // cruzan, y es el número del que depende disolver el grupo.
      const quedan = await this.groupsRepo.countMembersByStatus(
        tx,
        groupId,
        COMM.GROUP_JOIN_ACTIVE,
      );
      group.memberCount = quedan;

      if (quedan === 0) {
        // Sin nadie adentro, el grupo deja de estar en pie: fuera de listados,
        // fuera de la búsqueda, su dirección deja de abrir.
        //
        // No se borra ni se programa una purga: la historia del grupo vive en
        // `audit.groups_history`, que es WORM, y la retención la gobierna
        // UC-10-09. Inventar acá una segunda purga sería tener dos políticas de
        // borrado que se contradicen.
        group.statusConceptId = GRUPO_DISUELTO;
      } else if (eraDueno && wasActive) {
        // El dueño se fue y queda gente: alguien tiene que quedar a cargo. Sin
        // sucesión, el grupo sobrevive sin nadie que pueda administrarlo — la
        // misma trampa que la regla 07 arregla del otro lado.
        //
        // Antes esto ni siquiera podía pasar: el dueño tenía prohibido irse
        // «hasta transferirlo», lo que en la práctica lo dejaba atado a un
        // grupo del que quería salir.
        const heredero = await this.elegirHeredero(
          tx,
          groupId,
          memberProfileId,
        );
        if (heredero) {
          heredero.memberRoleConceptId = COMM.GROUP_ROLE_OWNER;
          touch(heredero, actor.id);
          group.ownerProfileId = heredero.memberProfileId;
        }
      }

      touch(group, actor.id);
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

    const { result, approved } = await this.em.transactional(async (tx) => {
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

      return {
        result: this.toMemberUpdated(member),
        // El aviso sale **después** del commit y nunca dentro de él: la persona
        // ya quedó dentro del grupo, y que el canal falle no puede deshacerlo.
        approved:
          member.joinStatusConceptId === COMM.GROUP_JOIN_ACTIVE &&
          dto.decision === 'APPROVE'
            ? {
                group: {
                  id: access.group.id,
                  name: access.group.name,
                  tenantId: access.group.tenantId,
                },
                memberProfileId: member.memberProfileId,
              }
            : undefined,
      };
    });

    if (approved)
      await this.notifications.notifyJoinApproved(
        approved.group,
        approved.memberProfileId,
        actor,
      );

    return result;
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
  /**
   * Quién queda a cargo cuando el dueño se va.
   *
   * El administrador más antiguo; si no hay ninguno, el integrante más
   * antiguo. La antigüedad es el criterio porque es el único objetivo que
   * existe sin pedirle a nadie que decida en el momento — y porque quien lleva
   * más tiempo adentro es, en general, quien más contexto tiene.
   *
   * @param em - Transacción activa.
   * @param groupId - Grupo que se queda sin dueño.
   * @param salienteProfileId - Quien se va, que no puede heredarse a sí mismo.
   * @returns La membresía que hereda, o `null` si no queda nadie.
   */
  private async elegirHeredero(
    em: EntityManager,
    groupId: string,
    salienteProfileId: string,
  ): Promise<GroupMembers | null> {
    const candidatos = await this.groupsRepo.listActiveMembersByAge(
      em,
      groupId,
      COMM.GROUP_JOIN_ACTIVE,
      salienteProfileId,
    );
    if (candidatos.length === 0) return null;

    return (
      candidatos.find((candidato) =>
        ROLES_QUE_PUEDEN_HEREDAR.includes(candidato.memberRoleConceptId),
      ) ?? candidatos[0]
    );
  }

  /**
   * Un grupo público exige que la cara con la que se presenta esté completa.
   *
   * Completo significa tres cosas, y las tres por el mismo motivo: el grupo se
   * le muestra a desconocidos con este perfil. Nombre visible —porque
   * «Usuario» no presenta a nadie—, foto —porque un avatar vacío en un
   * directorio público es indistinguible de una cuenta abandonada— y
   * visibilidad pública —porque un perfil privado presentando un grupo público
   * es una contradicción: el enlace del grupo lleva a una puerta cerrada—.
   *
   * El código del error viaja en el cuerpo (`PUBLIC_PROFILE_REQUIRED`) para que
   * la pantalla pueda ofrecer el enlace a configurar el perfil en vez de
   * repetir el texto del servidor.
   *
   * @param em - Transacción activa.
   * @param ownerProfileId - Perfil con el que se crearía el grupo.
   */
  private async assertPerfilPublicoCompleto(
    em: EntityManager,
    ownerProfileId: string,
  ): Promise<void> {
    const perfil = await this.publicProfilesRepo.findById(em, ownerProfileId);
    if (!perfil) {
      throw new PreconditionFailedException(
        'Para crear un grupo público necesitás tu perfil público configurado',
        { code: PERFIL_PUBLICO_REQUERIDO },
      );
    }

    const falta: string[] = [];
    if (!perfil.displayName?.trim()) falta.push('display-name');
    if (!perfil.avatarFileId) falta.push('avatar');
    if (perfil.visibilityConceptId !== COMM.PROFILE_VISIBILITY_PUBLIC) {
      falta.push('visibility');
    }

    if (falta.length > 0) {
      throw new PreconditionFailedException(
        'Para crear un grupo público, tu perfil público tiene que estar completo',
        { code: PERFIL_PUBLICO_REQUERIDO, missing: falta },
      );
    }
  }

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
