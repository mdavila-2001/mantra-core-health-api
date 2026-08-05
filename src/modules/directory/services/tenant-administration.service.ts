import { ForbiddenException, Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../common';
import { DIR } from '../directory.concepts';
import { TenantMembershipsRepository } from '../repositories';

/** Roles de membresía que pueden administrar la organización desde dentro. */
const ADMIN_TENANT_ROLES = new Set<string>([DIR.ROLE_OWNER, DIR.ROLE_ADMIN]);

/** Roles globales de plataforma que pasan por encima de la membresía. */
const PLATFORM_ROLES = ['SECURITY_ADMIN', 'SUPERADMIN'];

/**
 * Decide quién puede administrar una organización.
 *
 * El auto-registro crea al owner con rol global `USER` y le da su poder por la **membresía**
 * `DIR.ROLE_OWNER` —así lo dice el servicio que lo crea, y con razón: `SECURITY_ADMIN` y
 * `SUPERADMIN` son roles de plataforma, y concedérselos a cualquiera que rellene un formulario
 * de alta convertiría al dueño de una clínica en administrador del sistema entero—.
 *
 * Pero ningún endpoint miraba esa membresía: `/tenants/{id}/branches`, `/memberships` y sus
 * derivados exigían el rol **global** `SECURITY_ADMIN`. El resultado era que una organización
 * recién registrada no podía abrir una sede ni dar de alta a un empleado sin que un administrador
 * de la plataforma lo hiciera por ella. El poder que el alta prometía no existía en ninguna parte.
 *
 * Esta clase cierra ese hueco en un solo lugar, porque las seis operaciones comparten la regla y
 * repartirla por los servicios invitaría a que una se quedara atrás:
 *
 * - pasa quien tiene un rol de plataforma (`SECURITY_ADMIN`, `SUPERADMIN`);
 * - pasa quien tiene membresía **activa** con rol `OWNER` o `ADMIN` **en ese tenant**;
 * - el resto recibe 403, incluido el `STAFF` del propio tenant.
 *
 * Lo que no cambia: el aislamiento entre organizaciones. Un owner sigue sin poder tocar el tenant
 * de al lado, porque su membresía es la de su tenant y esta comprobación es por tenant.
 */
@Injectable()
export class TenantAdministrationService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param membershipsRepo - Membresías, de donde sale el rol del actor en el tenant.
   */
  constructor(
    private readonly membershipsRepo: TenantMembershipsRepository,
  ) {}

  /**
   * Exige que el actor pueda administrar el tenant indicado.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Tenant sobre el que se quiere operar.
   * @param actor - Quien pide la operación.
   * @throws ForbiddenException si no es plataforma ni OWNER/ADMIN del tenant.
   */
  async assertCanAdminister(
    em: EntityManager,
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const roles = actor.roles ?? [];
    if (PLATFORM_ROLES.some((role) => roles.includes(role))) return;

    const membership = await this.membershipsRepo.findActiveByUserTenant(
      em,
      actor.id,
      tenantId,
      DIR.MEMBERSHIP_ACTIVE,
    );
    if (membership && ADMIN_TENANT_ROLES.has(membership.tenantRoleConceptId)) {
      return;
    }

    throw new ForbiddenException(
      'Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma',
    );
  }
}
