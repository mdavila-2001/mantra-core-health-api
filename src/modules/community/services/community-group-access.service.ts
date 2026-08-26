import { ForbiddenException, Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  CONCEPTS,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { GroupsRepository } from '../repositories';
import { COMM } from '../community.concepts';
import type { GroupMembers, Groups } from '../entities';
import { CommunityVisibilityService } from './community-visibility.service';

/** Roles que administran un grupo: aprueban altas y moderan el muro. */
const ADMIN_ROLES = [COMM.GROUP_ROLE_OWNER, COMM.GROUP_ROLE_ADMIN];

/** Roles que además pueden moderar contenido sin resolver altas. */
const MODERATION_ROLES = [...ADMIN_ROLES, COMM.GROUP_ROLE_MODERATOR];

/** Lo que hace falta saber del lector para decidir qué ve y qué puede hacer. */
export interface GroupAccess {
  /** El grupo resuelto. */
  group: Groups;
  /** Perfil con el que actúa el lector, si tiene uno. */
  actorProfileId?: string;
  /** Membresía del lector, en cualquier estado, si existe. */
  membership: GroupMembers | null;
  /** `true` si la membresía está activa. */
  isMember: boolean;
  /** `true` si el rol resuelve altas pendientes. */
  canAdminister: boolean;
  /** `true` si el rol modera el contenido del muro. */
  canModerate: boolean;
  /** `true` si el lector puede leer el muro y el padrón. */
  canRead: boolean;
  /** `true` si el lector puede escribir en el muro. */
  canPost: boolean;
}

/**
 * Quién puede leer y escribir dentro de un grupo (P7).
 *
 * ## Por qué es un servicio y no un `if` en cada endpoint
 *
 * Las mismas cuatro preguntas —¿existe?, ¿soy miembro?, ¿puedo leer?, ¿puedo
 * escribir?— las necesitan la ficha, el padrón, el muro, la publicación y la
 * administración de miembros. Escritas cinco veces, la quinta se olvida de los
 * grupos secretos; y el grupo secreto es justamente el caso que existe para no
 * filtrarse.
 *
 * ## Las reglas
 *
 * - **Público**: lo lee cualquier sesión; escribe sólo quien es integrante.
 *   Un grupo público sin lectura abierta no serviría para lo que existe —que
 *   alguien lo encuentre y decida entrar—, pero dejar publicar sin unirse
 *   convierte el muro en un tablón abierto.
 * - **Privado**: lo lee y escribe el integrante activo. Quien no lo es ve la
 *   ficha —nombre, descripción, cuántos son— porque es lo que le permite pedir
 *   el ingreso, pero no el muro ni el padrón.
 * - **Secreto**: para quien no es integrante activo **no existe**. Responde 404
 *   incluso en la ficha: un 403 ya confirmaría que ese grupo existe con ese id.
 */
@Injectable()
export class CommunityGroupAccessService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param groupsRepo - Acceso a `community.groups` y `group_members`.
   * @param visibility - Resuelve el perfil del lector contra la sesión.
   */
  constructor(
    private readonly groupsRepo: GroupsRepository,
    private readonly visibility: CommunityVisibilityService,
  ) {}

  /**
   * Resuelve el grupo y lo que el actor puede hacer en él.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param groupId - Grupo a resolver.
   * @param actor - Quien pide.
   * @param requestedProfileId - Perfil propuesto por el cliente; se verifica.
   * @returns El grupo y los permisos del actor sobre él.
   * @throws ResourceNotFoundException si el grupo no existe, o si es secreto y
   *   el actor no es integrante activo.
   */
  async resolve(
    em: EntityManager,
    groupId: string,
    actor: AuthenticatedUser,
    requestedProfileId?: string,
  ): Promise<GroupAccess> {
    const actorProfileId = await this.visibility.resolveActorProfileId(
      em,
      actor,
      requestedProfileId,
    );
    const group = await this.groupsRepo.findById(em, groupId);
    if (!group)
      throw new ResourceNotFoundException('Grupo no encontrado', { groupId });

    const membership = actorProfileId
      ? await this.groupsRepo.findMember(em, groupId, actorProfileId)
      : null;
    const isMember = membership?.joinStatusConceptId === COMM.GROUP_JOIN_ACTIVE;

    // La plataforma modera cualquier grupo: es su trabajo, y sin esto un grupo
    // secreto sería un punto ciego para la cola de reportes de P6.
    const isPlatform = this.visibility.isPlatform(actor);
    const role = membership?.memberRoleConceptId;
    const canAdminister =
      isPlatform || (isMember && !!role && ADMIN_ROLES.includes(role));
    const canModerate =
      isPlatform || (isMember && !!role && MODERATION_ROLES.includes(role));

    const isSecret = group.visibilityConceptId === COMM.GROUP_VISIBILITY_SECRET;
    if (isSecret && !isMember && !isPlatform)
      throw new ResourceNotFoundException('Grupo no encontrado', { groupId });

    // TP-3 · regla 08: un grupo disuelto ya no está en pie, y su dirección deja
    // de abrir para todos —incluidos los que fueron miembros—. 404 y no 403
    // porque no es una cuestión de permiso: el grupo dejó de existir como tal,
    // y su rastro vive en la auditoría, no en una pantalla.
    //
    // La plataforma sí lo alcanza: moderar lo que se publicó en un grupo que
    // después se disolvió sigue siendo su trabajo, y dejarlo fuera crearía un
    // punto ciego que se abre con sólo vaciar el grupo.
    if (group.statusConceptId !== CONCEPTS.STATE_ACTIVE && !isPlatform)
      throw new ResourceNotFoundException('Grupo no encontrado', { groupId });

    const isPublic = group.visibilityConceptId === COMM.GROUP_VISIBILITY_PUBLIC;

    return {
      group,
      actorProfileId,
      membership,
      isMember,
      canAdminister,
      canModerate,
      canRead: isPublic || isMember || isPlatform,
      canPost: isMember || isPlatform,
    };
  }

  /**
   * Exige poder leer el interior del grupo (muro y padrón).
   *
   * @param access - Acceso ya resuelto.
   * @throws ForbiddenException si el grupo es privado y el actor no entró.
   */
  assertCanRead(access: GroupAccess): void {
    if (access.canRead) return;
    throw new ForbiddenException(
      'Hay que ser integrante del grupo para ver su contenido',
    );
  }

  /**
   * Exige poder publicar en el muro.
   *
   * @param access - Acceso ya resuelto.
   * @throws ForbiddenException si el actor no es integrante activo.
   */
  assertCanPost(access: GroupAccess): void {
    if (access.canPost) return;
    throw new ForbiddenException(
      'Hay que ser integrante del grupo para publicar en su muro',
    );
  }

  /**
   * Exige poder administrar el grupo.
   *
   * @param access - Acceso ya resuelto.
   * @throws ForbiddenException si el actor no administra el grupo.
   */
  assertCanAdminister(access: GroupAccess): void {
    if (access.canAdminister) return;
    throw new ForbiddenException(
      'Sólo quien administra el grupo puede resolver sus membresías',
    );
  }
}
