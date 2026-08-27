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
 * La administración tiene además un segundo escalón: **cambiar quién es dueño**. Conceder el rol
 * `OWNER`, degradar a un OWNER o darlo de baja lo decide un OWNER (o la plataforma), nunca un
 * ADMIN — si administrar alcanzara, cualquier ADMIN podría auto-promoverse a OWNER o descabezar
 * a quien lo nombró, y la jerarquía que este servicio establece se invertiría sola.
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
  constructor(private readonly membershipsRepo: TenantMembershipsRepository) {}

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
    if (this.isPlatform(actor)) return;

    const membership = await this.activeMembershipOf(em, tenantId, actor);
    if (membership && ADMIN_TENANT_ROLES.has(membership.tenantRoleConceptId)) {
      return;
    }

    throw new ForbiddenException(
      'Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma',
    );
  }

  /**
   * Exige que el actor pueda **leer** el tenant indicado.
   *
   * Es el escalón por debajo de administrar: para consultar la ficha de la
   * organización, sus sedes o su plantilla basta con pertenecer a ella, sin ser
   * `OWNER` ni `ADMIN`. Exigir rol de administración para leer dejaría al `STAFF`
   * sin poder ver la organización en la que trabaja.
   *
   * Lo que no se relaja es el aislamiento: quien no es plataforma y no tiene
   * membresía activa **en ese tenant** recibe 403, que es lo que impide que un
   * listado se convierta en una fuga entre organizaciones.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Tenant que se quiere leer.
   * @param actor - Quien pide la operación.
   * @throws ForbiddenException si no es plataforma ni miembro activo del tenant.
   */
  async assertCanRead(
    em: EntityManager,
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (this.isPlatform(actor)) return;

    if (await this.activeMembershipOf(em, tenantId, actor)) return;

    throw new ForbiddenException(
      'Se requiere pertenecer a la organización, o ser administrador de la plataforma',
    );
  }

  /**
   * Exige que el actor pueda cambiar quién es dueño del tenant.
   *
   * Es el escalón por encima de administrar: cubre conceder `OWNER` (por invitación o
   * cambio de rol), degradar a un OWNER y darlo de baja. El rol del actor se resuelve
   * por su propia membresía en **ese** tenant, nunca por nada que venga en la petición.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Tenant cuya propiedad se quiere cambiar.
   * @param actor - Quien pide la operación.
   * @throws ForbiddenException si no es plataforma ni OWNER del tenant.
   */
  async assertCanChangeOwnership(
    em: EntityManager,
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (this.isPlatform(actor)) return;

    const membership = await this.activeMembershipOf(em, tenantId, actor);
    if (membership?.tenantRoleConceptId === DIR.ROLE_OWNER) return;

    throw new ForbiddenException(
      'Sólo un OWNER de la organización o la plataforma pueden cambiar quién la posee',
    );
  }

  /**
   * Si la organización tiene a alguien que pueda decidir por ella.
   *
   * ## Para qué existe
   *
   * El vínculo de un profesional nace `PENDIENTE` cuando hay a quién pedirle
   * permiso, y `DECLARADO` cuando no lo hay. Los hospitales públicos y las cajas
   * del padrón **nunca van a registrarse** en la plataforma: dejar a sus médicos
   * esperando una aprobación que nadie puede dar los bloquearía para siempre.
   *
   * Cuenta OWNER y ADMIN por separado y suma, en vez de una consulta con `$in`,
   * porque el repositorio cuenta por rol concreto — y son dos números chicos.
   *
   * @param em - Contexto de persistencia.
   * @param tenantId - La organización.
   * @returns `true` si alguien puede aprobar en su nombre.
   */
  async hasAdministrators(
    em: EntityManager,
    tenantId: string,
  ): Promise<boolean> {
    for (const rol of ADMIN_TENANT_ROLES) {
      const cuantos = await this.membershipsRepo.countActiveByTenantRole(
        em,
        tenantId,
        rol,
        DIR.MEMBERSHIP_ACTIVE,
      );
      if (cuantos > 0) return true;
    }
    return false;
  }

  /** `true` si el actor tiene un rol global de plataforma. */
  private isPlatform(actor: AuthenticatedUser): boolean {
    const roles = actor.roles ?? [];
    return PLATFORM_ROLES.some((role) => roles.includes(role));
  }

  /** Membresía activa del actor en el tenant, o `null` si no pertenece. */
  private activeMembershipOf(
    em: EntityManager,
    tenantId: string,
    actor: AuthenticatedUser,
  ) {
    return this.membershipsRepo.findActiveByUserTenant(
      em,
      actor.id,
      tenantId,
      DIR.MEMBERSHIP_ACTIVE,
    );
  }
}
