import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, type AuthenticatedUser } from '../../../common';
// Lectura cruzada acotada: `community` no puede importar `DirectoryModule`
// (éste importa a `community`), así que usa el repositorio de membresías que
// `DirectoryAuthorizationModule` exporta justamente para esto, y lee la fila del
// tenant por su entidad, como hace el login al embeber las membresías.
import { TenantMembershipsRepository } from '../../directory/repositories/tenant-memberships.repository';
import { Tenants } from '../../directory/entities/tenants.entity';
import { DIR } from '../../directory/directory.concepts';
import { COMM } from '../community.concepts';

/** Tipos de vitrina que representan a una organización, no a una persona. */
export const ORGANIZATION_PROFILE_TARGET_TYPES: readonly string[] = [
  COMM.PROFILE_TARGET_ORGANIZATION,
  COMM.PROFILE_TARGET_PHARMACY,
];

/**
 * Roles de membresía que atienden la bandeja de la organización.
 *
 * OWNER, ADMIN y STAFF: quien trabaja en el mostrador es STAFF. Queda fuera
 * `DIR_ROLE_PRACTITIONER`, que es el vínculo de un profesional con la clínica
 * donde atiende, no un puesto de atención de la organización.
 */
const INBOX_TENANT_ROLES: ReadonlySet<string> = new Set([
  DIR.ROLE_OWNER,
  DIR.ROLE_ADMIN,
  DIR.ROLE_STAFF,
]);

/**
 * Rol de runtime del personal de farmacia (lo materializa el login a partir de
 * una membresía activa en un tenant `PHARMACY`).
 */
const PHARMACY_STAFF_ROLE = 'PHARMACY_STAFF';

/** Lo que hace falta de una vitrina para decidir sobre ella. */
type OrganizationProfileRef = {
  readonly targetId: string;
  readonly targetTypeConceptId: string;
  readonly statusConceptId: string;
};

/**
 * Quién atiende la vitrina de una organización (farmacia o clínica) en la
 * mensajería.
 *
 * ## Por qué existe
 *
 * El participante de un hilo es un perfil público. El de una persona lo
 * encarna su cuenta (`target_id = sub | hpid`); el de una organización no lo
 * encarna ninguna cuenta: lo atiende su personal. Sin esta regla nadie podía
 * leer ni contestar lo que se le escribía a una farmacia, y el aviso de mensaje
 * nuevo caía en `created_by_user_id`, que es el administrador de plataforma que
 * verificó el tenant.
 *
 * ## Qué tan estrecha es
 *
 * Sólo para la **mensajería** (no publicar, reseñar ni seguir como la
 * organización), sólo para vitrinas de organización **activas**, y sólo con una
 * membresía **activa en la base** —no la lista de tenants del token, que es una
 * foto del login— en el tenant que la vitrina representa (`target_id`), con rol
 * OWNER, ADMIN o STAFF. Una vitrina de farmacia exige además el rol de runtime
 * `PHARMACY_STAFF`.
 */
@Injectable()
export class CommunityOrganizationStaffService {
  /**
   * @param membershipsRepo - Membresías de `directory`.
   */
  constructor(private readonly membershipsRepo: TenantMembershipsRepository) {}

  /** `true` si la vitrina es de una organización (farmacia o clínica). */
  isOrganizationProfile(
    profile: Pick<OrganizationProfileRef, 'targetTypeConceptId'> | null,
  ): boolean {
    return Boolean(
      profile &&
      ORGANIZATION_PROFILE_TARGET_TYPES.includes(profile.targetTypeConceptId),
    );
  }

  /**
   * ¿Puede este actor atender la bandeja de esta vitrina de organización?
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param profile - La vitrina.
   * @param actor - La sesión.
   */
  async canAttend(
    em: EntityManager,
    profile: OrganizationProfileRef | null,
    actor: AuthenticatedUser,
  ): Promise<boolean> {
    if (!profile || !this.isOrganizationProfile(profile)) return false;
    if (profile.statusConceptId !== CONCEPTS.STATE_ACTIVE) return false;
    if (
      profile.targetTypeConceptId === COMM.PROFILE_TARGET_PHARMACY &&
      !(actor.roles ?? []).includes(PHARMACY_STAFF_ROLE)
    ) {
      return false;
    }
    const membership = await this.membershipsRepo.findActiveByUserTenant(
      em,
      actor.id,
      profile.targetId,
      DIR.MEMBERSHIP_ACTIVE,
    );
    return Boolean(
      membership && INBOX_TENANT_ROLES.has(membership.tenantRoleConceptId),
    );
  }

  /**
   * Las cuentas que atienden la bandeja de la organización, para avisarles de
   * un mensaje nuevo. Vacía si no es una vitrina de organización.
   *
   * @param em - Contexto de persistencia.
   * @param profile - La vitrina destinataria.
   */
  async attendantUserIds(
    em: EntityManager,
    profile: OrganizationProfileRef,
  ): Promise<string[]> {
    if (!this.isOrganizationProfile(profile)) return [];
    const memberships = await this.membershipsRepo.findByTenantAndStatus(
      em,
      profile.targetId,
      DIR.MEMBERSHIP_ACTIVE,
    );
    return [
      ...new Set(
        memberships
          .filter((m) => INBOX_TENANT_ROLES.has(m.tenantRoleConceptId))
          .map((m) => m.userId),
      ),
    ];
  }

  /**
   * ¿El tenant que la vitrina representa está activo y verificado?
   *
   * La vitrina sólo se proyecta como pública al verificar el tenant, pero un
   * tenant puede suspenderse después: el chat no se abre con una organización
   * que dejó de operar.
   */
  async isVerifiedActiveTenant(
    em: EntityManager,
    tenantId: string,
  ): Promise<boolean> {
    const tenant = await em.findOne(Tenants, { id: tenantId });
    return (
      tenant?.statusConceptId === CONCEPTS.TENANT_ACTIVE &&
      tenant.verificationStatusConceptId === CONCEPTS.TENANT_VERIFIED
    );
  }

  /**
   * De estos tenants, los activos y verificados — en una consulta.
   *
   * @param em - Contexto de persistencia.
   * @param tenantIds - Tenants a comprobar.
   */
  async verifiedActiveTenantIds(
    em: EntityManager,
    tenantIds: readonly string[],
  ): Promise<Set<string>> {
    if (tenantIds.length === 0) return new Set();
    const tenants = await em.find(Tenants, {
      id: { $in: [...tenantIds] },
      statusConceptId: CONCEPTS.TENANT_ACTIVE,
      verificationStatusConceptId: CONCEPTS.TENANT_VERIFIED,
    });
    return new Set(tenants.map((tenant) => tenant.id));
  }
}
