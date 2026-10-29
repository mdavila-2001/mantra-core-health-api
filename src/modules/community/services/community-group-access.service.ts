import { ForbiddenException, Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  CONCEPTS,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { InsufficientRoleException } from '../../../common/errors/domain.exception';
import { GroupsRepository } from '../repositories';
import { COMM } from '../community.concepts';
import type { GroupMembers, Groups } from '../entities';
import { CommunityGroupAudienceService } from './community-group-audience.service';
import { CommunityVisibilityService } from './community-visibility.service';
import { CommunityErrorReason } from '../community.error-reasons';

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
 * - **Público autorizado** (doctores verificados, personal de la organización,
 *   pacientes atendidos; API#837): quien no pertenece a ese público **no ve el
 *   foro** —404 idéntico al de un id inexistente— y quien sí pertenece lo lee
 *   como un grupo público: publica sólo si es integrante.
 */
@Injectable()
export class CommunityGroupAccessService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param groupsRepo - Acceso a `community.groups` y `group_members`.
   * @param visibility - Resuelve el perfil del lector contra la sesión.
   * @param audience - Decide si la sesión es del público autorizado del foro.
   */
  constructor(
    private readonly groupsRepo: GroupsRepository,
    private readonly visibility: CommunityVisibilityService,
    private readonly audience: CommunityGroupAudienceService,
  ) {}

  /**
   * Resuelve el grupo y lo que el actor puede hacer en él.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param groupId - Grupo a resolver.
   * @param actor - Quien pide.
   * @param requestedProfileId - Perfil propuesto por el cliente; se verifica.
   * @returns El grupo y los permisos del actor sobre él.
   * @throws ResourceNotFoundException si el grupo no existe, si es secreto y
   *   el actor no es integrante activo, o si restringe su público y el actor
   *   no pertenece a él.
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
      throw new ResourceNotFoundException(
        'Grupo no encontrado',
        { groupId },
        CommunityErrorReason.GROUP_NOT_FOUND,
      );

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

    // API#837: el público autorizado se decide en el servidor, con la sesión y
    // no con lo que el cliente declare.
    await this.assertAudienceVisible(em, group, actor);
    const isAudienceGroup = this.audience.isRestricted(
      group.visibilityConceptId,
    );

    const isSecret = group.visibilityConceptId === COMM.GROUP_VISIBILITY_SECRET;
    if (isSecret && !isMember && !isPlatform)
      throw new ResourceNotFoundException(
        'Grupo no encontrado',
        { groupId },
        CommunityErrorReason.GROUP_SECRET_NOT_VISIBLE,
      );

    // TP-3 · regla 08: un grupo disuelto ya no está en pie, y su dirección deja
    // de abrir para todos —incluidos los que fueron miembros—. 404 y no 403
    // porque no es una cuestión de permiso: el grupo dejó de existir como tal,
    // y su rastro vive en la auditoría, no en una pantalla.
    //
    // La plataforma sí lo alcanza: moderar lo que se publicó en un grupo que
    // después se disolvió sigue siendo su trabajo, y dejarlo fuera crearía un
    // punto ciego que se abre con sólo vaciar el grupo.
    if (group.statusConceptId !== CONCEPTS.STATE_ACTIVE && !isPlatform)
      throw new ResourceNotFoundException(
        'Grupo no encontrado',
        { groupId },
        CommunityErrorReason.GROUP_DISSOLVED,
      );

    const isPublic = group.visibilityConceptId === COMM.GROUP_VISIBILITY_PUBLIC;

    return {
      group,
      actorProfileId,
      membership,
      isMember,
      canAdminister,
      canModerate,
      canRead: isPublic || isAudienceGroup || isMember || isPlatform,
      canPost: isMember || isPlatform,
    };
  }

  /**
   * Exige que la sesión pertenezca al público autorizado del foro, si lo tiene.
   *
   * Responde exactamente lo que un id inexistente —mismo mensaje, mismo
   * `reason`— para no confirmar que el foro existe. La plataforma lo alcanza
   * por la misma razón que alcanza los grupos secretos: moderar es su trabajo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param group - Grupo ya cargado.
   * @param actor - Quien pide.
   * @throws ResourceNotFoundException si el foro restringe su público y el
   *   actor no pertenece a él.
   */
  async assertAudienceVisible(
    em: EntityManager,
    group: Groups,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (!this.audience.isRestricted(group.visibilityConceptId)) return;
    if (this.visibility.isPlatform(actor)) return;
    if (
      await this.audience.isEligible(
        em,
        group.visibilityConceptId,
        group.tenantId,
        actor,
      )
    )
      return;
    throw new ResourceNotFoundException(
      'Grupo no encontrado',
      { groupId: group.id },
      CommunityErrorReason.GROUP_NOT_FOUND,
    );
  }

  /**
   * Exige que la organización activa pueda abrir foros o iniciar debates.
   *
   * ALOVIDA prohíbe que una aseguradora cree foros o inicie debates, y la
   * organización médica sí puede (ORG-FOR-001, DOC-SOC-010, API#837). El tipo
   * de organización sale de la base —`directory.tenants`— y no del claim
   * `tenantTypes` del token, que es sólo presentación.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización activa del request; sin ella no hay tipo
   *   contra el cual negar.
   * @param action - Qué se intenta: abrir un foro o iniciar un debate.
   * @throws InsufficientRoleException si la organización activa es una aseguradora.
   */
  async assertOrganizationMayStartForums(
    em: EntityManager,
    tenantId: string | undefined,
    action: 'CREATE_GROUP' | 'START_DEBATE',
  ): Promise<void> {
    if (!tenantId) return;
    const type = await this.groupsRepo.findTenantTypeConceptId(em, tenantId);
    if (type !== CONCEPTS.TENANT_TYPE_PAYER) return;
    throw action === 'CREATE_GROUP'
      ? new InsufficientRoleException(
          'Una aseguradora no puede crear foros',
          undefined,
          CommunityErrorReason.INSURER_CANNOT_CREATE_GROUP,
        )
      : new InsufficientRoleException(
          'Una aseguradora no puede iniciar debates',
          undefined,
          CommunityErrorReason.INSURER_CANNOT_START_DEBATE,
        );
  }

  /**
   * Exige que quien abre un foro de público autorizado pertenezca a ese público.
   *
   * Sin esto, el creador quedaría fuera de su propio foro: un foro de «personal»
   * abierto por alguien que no lo es, o de «doctores verificados» por quien no
   * tiene la matrícula verificada. Una visibilidad que no restringe el público
   * no exige nada.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param visibilityConceptId - Visibilidad con la que se abre el foro.
   * @param tenantId - Organización activa, que será la del foro.
   * @param actor - Quien lo abre.
   * @throws InsufficientRoleException si el actor no pertenece al público.
   */
  async assertActorBelongsToAudience(
    em: EntityManager,
    visibilityConceptId: string,
    tenantId: string | undefined,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (!this.audience.isRestricted(visibilityConceptId)) return;
    if (
      await this.audience.isEligible(em, visibilityConceptId, tenantId, actor)
    )
      return;
    throw new InsufficientRoleException(
      'Para abrir un foro con este público hay que pertenecer a él',
      undefined,
      CommunityErrorReason.GROUP_AUDIENCE_OWNER_NOT_ELIGIBLE,
    );
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
