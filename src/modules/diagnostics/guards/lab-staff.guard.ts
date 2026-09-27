import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, roleAuthorizesInTenant } from '../../../common';
import type { AuthenticatedRequest } from '../../../common/auth/authenticated-user.interface';
import { Tenants } from '../../directory/entities';
import { DIR } from '../../directory/directory.concepts';
import { TenantMembershipsRepository } from '../../directory/repositories';

/**
 * Los roles que ya operaban el circuito de especímenes antes de este guard:
 * los que el controlador declaraba con `@Roles(...)`. Siguen pasando igual,
 * con la misma regla de ámbito (MCH-001).
 */
export const LAB_CLINICAL_ROLES: readonly string[] = [
  'CLINICIAN',
  'PRACTITIONER',
];

/**
 * Exige que quien opera la recepción de muestras sea **personal del
 * laboratorio** del tenant activo.
 *
 * ## Por qué no alcanzaba con `@Roles('CLINICIAN', 'PRACTITIONER')`
 *
 * El alta de un laboratorio (`POST /iam/auth/register-organization` con
 * `tenantType: DIAGNOSTIC_CENTER`) le da a su dueño el rol global `USER` y la
 * membresía `OWNER` del tenant — nada más, y a propósito: el poder de un dueño
 * es su membresía, no un rol de plataforma (`TenantAdministrationService`). Su
 * personal entra por invitación como `STAFF`. Ninguno de los dos tiene
 * `CLINICIAN` ni `PRACTITIONER`, así que el laboratorio que se registraba no
 * podía recibir una sola muestra en su propia casa.
 *
 * ## La regla
 *
 * Pasa, en este orden:
 * 1. `SUPERADMIN` (el mismo comodín que `RolesGuard`);
 * 2. un rol de {@link LAB_CLINICAL_ROLES} que autorice en el tenant activo
 *    —lo que ya pasaba: el laboratorio de un hospital lo opera su personal
 *    clínico—;
 * 3. una membresía **activa** en el tenant activo, **si ese tenant es un
 *    `DIAGNOSTIC_CENTER`**. Cualquier rol de membresía (OWNER, ADMIN o STAFF):
 *    en un centro de diagnóstico no hay otra clase de miembro.
 *
 * Lo tercero exige el tipo de tenant, y no es un detalle: el alta de paciente
 * crea una membresía `STAFF` en el tenant por defecto de la plataforma
 * (`iam-patient-self-registration.service.ts`), así que «ser miembro» a secas
 * habría puesto la bandeja de órdenes —PHI de terceros— al alcance de
 * cualquier paciente. En un centro de diagnóstico, en cambio, sólo es miembro
 * quien trabaja ahí.
 *
 * No se agregó un rol de laboratorio: hubiera tenido que asignarlo un
 * `SECURITY_ADMIN` de la plataforma (`POST /authz/users/:id/role-assignments`)
 * a cada técnico de cada laboratorio, y la membresía ya dice lo mismo.
 *
 * Sin tenant resuelto no hay laboratorio del que ser personal: 403.
 */
@Injectable()
export class LabStaffGuard implements CanActivate {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia; se usa un fork por petición.
   * @param memberships - Membresías de tenant.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly memberships: TenantMembershipsRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const actor = request.user;
    // Ruta sin sujeto: `JwtAuthGuard` ya la habrá rechazado si no es pública.
    if (!actor) return true;

    if (actor.roles.includes('SUPERADMIN')) return true;

    const tenantId = request.resolvedTenantId;
    if (
      tenantId !== undefined &&
      LAB_CLINICAL_ROLES.some((role) =>
        roleAuthorizesInTenant(actor, role, tenantId),
      )
    ) {
      return true;
    }

    if (tenantId !== undefined && (await this.isLabMember(actor.id, tenantId)))
      return true;

    throw new ForbiddenException(
      'Se requiere ser personal del laboratorio de la organización activa',
    );
  }

  /** Miembro activo de un tenant que es un centro de diagnóstico. */
  private async isLabMember(
    userId: string,
    tenantId: string,
  ): Promise<boolean> {
    const em = this.em.fork();
    const tenant = await em.findOne(Tenants, { id: tenantId });
    if (tenant?.tenantTypeConceptId !== CONCEPTS.TENANT_TYPE_DIAGNOSTIC_CENTER)
      return false;
    const membership = await this.memberships.findActiveByUserTenant(
      em,
      userId,
      tenantId,
      DIR.MEMBERSHIP_ACTIVE,
    );
    return membership !== null;
  }
}
