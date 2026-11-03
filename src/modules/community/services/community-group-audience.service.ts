import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../common';
import { COMM } from '../community.concepts';
import {
  GroupsRepository,
  PublicProfilesRepository,
  VerifiedBadgesRepository,
} from '../repositories';

/**
 * Las visibilidades que declaran un público autorizado (ORG-FOR-002,
 * DOC-SOC-015, API#837), en el orden en que ALOVIDA las enumera.
 *
 * Los otros dos públicos de la fuente —invitados y público general— ya son
 * `GROUP_VISIBILITY_PRIVATE` y `GROUP_VISIBILITY_PUBLIC`.
 */
export const AUDIENCE_VISIBILITIES: readonly string[] = [
  COMM.GROUP_VISIBILITY_VERIFIED_DOCTORS,
  COMM.GROUP_VISIBILITY_ORGANIZATION_STAFF,
  COMM.GROUP_VISIBILITY_ATTENDED_PATIENTS,
];

/**
 * Quién pertenece al público autorizado de un foro.
 *
 * ## Qué decide y qué no
 *
 * Responde una sola pregunta: ¿esta sesión es del público que el foro declara?
 * No decide membresía ni rol dentro del grupo —eso sigue en
 * `CommunityGroupAccessService`— y **no mira nada que mande el cliente**: el
 * médico se reconoce por el perfil profesional del token y el sello vigente que
 * la base tiene sobre él; el personal, por su membresía activa en la
 * organización del foro; el paciente, por una atención terminada en esa
 * organización.
 *
 * El público se evalúa en cada lectura y cada escritura, no sólo al entrar: un
 * sello vencido o una baja de la organización cierran el foro a quien dejó de
 * pertenecer a su público, sin esperar a que alguien lo expulse.
 */
@Injectable()
export class CommunityGroupAudienceService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param groupsRepo - Membresías de organización y atenciones terminadas.
   * @param profilesRepo - Perfil público del profesional.
   * @param badgesRepo - Sello de matrícula verificada.
   */
  constructor(
    private readonly groupsRepo: GroupsRepository,
    private readonly profilesRepo: PublicProfilesRepository,
    private readonly badgesRepo: VerifiedBadgesRepository,
  ) {}

  /** `true` si la visibilidad restringe el foro a un público autorizado. */
  isRestricted(visibilityConceptId: string): boolean {
    return AUDIENCE_VISIBILITIES.includes(visibilityConceptId);
  }

  /**
   * ¿La sesión pertenece al público que declara la visibilidad?
   *
   * Una visibilidad que no restringe el público no excluye a nadie.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param visibilityConceptId - Visibilidad del foro.
   * @param groupTenantId - Organización del foro; sin ella, el personal y los
   *   pacientes atendidos no tienen contra qué cotejarse.
   * @param actor - Sesión que pide.
   * @returns `true` si pertenece al público (o el foro no lo restringe).
   */
  async isEligible(
    em: EntityManager,
    visibilityConceptId: string,
    groupTenantId: string | null | undefined,
    actor: AuthenticatedUser,
  ): Promise<boolean> {
    switch (visibilityConceptId) {
      case COMM.GROUP_VISIBILITY_VERIFIED_DOCTORS:
        return this.isVerifiedPractitioner(em, actor);
      case COMM.GROUP_VISIBILITY_ORGANIZATION_STAFF:
        return (
          !!groupTenantId &&
          this.groupsRepo.isActiveTenantMember(em, actor.id, groupTenantId)
        );
      case COMM.GROUP_VISIBILITY_ATTENDED_PATIENTS:
        return (
          !!groupTenantId &&
          !!actor.patientProfileId &&
          this.groupsRepo.hasFinishedEncounter(
            em,
            actor.patientProfileId,
            groupTenantId,
          )
        );
      default:
        return true;
    }
  }

  /**
   * Las visibilidades de público autorizado que la sesión **no** cumple en esa
   * organización: son los foros que, para ella, no existen.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización cuyo directorio se lista.
   * @param actor - Sesión que pide.
   * @returns Las visibilidades a excluir del listado.
   */
  async hiddenFrom(
    em: EntityManager,
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<string[]> {
    const hidden: string[] = [];
    for (const visibility of AUDIENCE_VISIBILITIES) {
      if (!(await this.isEligible(em, visibility, tenantId, actor)))
        hidden.push(visibility);
    }
    return hidden;
  }

  /**
   * Profesional con la matrícula vigente verificada contra la autoridad.
   *
   * El sello se busca por el perfil público del profesional que el token
   * declara (`hpid`) y se cotejan sus fechas: el barrido que revoca los sellos
   * vencidos corre aparte, y hasta que corra un sello vencido no puede abrir
   * una puerta.
   */
  private async isVerifiedPractitioner(
    em: EntityManager,
    actor: AuthenticatedUser,
  ): Promise<boolean> {
    if (!actor.practitionerProfileId) return false;
    const profile = await this.profilesRepo.findByTarget(
      em,
      actor.practitionerProfileId,
    );
    if (!profile) return false;
    const badge = await this.badgesRepo.findActive(
      em,
      profile.id,
      COMM.BADGE_TYPE_LICENSE_VERIFIED,
    );
    if (!badge) return false;
    const now = Date.now();
    return (
      (!badge.validFrom || badge.validFrom.getTime() <= now) &&
      (!badge.validTo || badge.validTo.getTime() >= now)
    );
  }
}
