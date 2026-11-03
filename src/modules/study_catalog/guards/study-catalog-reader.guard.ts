import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, roleAuthorizesInTenant } from '../../../common';
import type { AuthenticatedRequest } from '../../../common/auth/authenticated-user.interface';
import { DIR } from '../../directory/directory.concepts';
import { Tenants } from '../../directory/entities';
import { TenantMembershipsRepository } from '../../directory/repositories';

/** Roles que leen el catálogo en el tenant activo (matriz de autorización §3.g). */
export const STUDY_CATALOG_ROLES: readonly string[] = [
  'CLINICIAN',
  'PRACTITIONER',
  'SECURITY_ADMIN',
];

/**
 * Quién lee el catálogo de estudios: el médico que pide (CLINICIAN/PRACTITIONER),
 * el personal de un centro diagnóstico (membresía activa en un tenant
 * `DIAGNOSTIC_CENTER`, sea o no el ejecutor de una orden) y la administración.
 * El paciente no: su cuenta es miembro `STAFF` del tenant por defecto, que no es
 * un centro diagnóstico (mismo razonamiento que `LabStaffGuard`).
 *
 * El catálogo no es PHI; el filtro existe para no publicar la superficie de
 * pedido a quien no pide ni ejecuta estudios.
 */
@Injectable()
export class StudyCatalogReaderGuard implements CanActivate {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia (se usa un fork por petición).
   * @param memberships - Membresías de tenant.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly memberships: TenantMembershipsRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const actor = request.user;
    if (!actor) return true;
    const tenantId = request.resolvedTenantId;
    // El comodín de plataforma se mide en el tenant activo: global en
    // cualquiera; acotado en `scopedRoles`, sólo en el suyo (#1241).
    if (roleAuthorizesInTenant(actor, 'SUPERADMIN', tenantId)) return true;
    if (
      STUDY_CATALOG_ROLES.some((role) =>
        roleAuthorizesInTenant(actor, role, tenantId),
      )
    ) {
      return true;
    }
    if (
      tenantId !== undefined &&
      (await this.isDiagnosticMember(actor.id, tenantId))
    ) {
      return true;
    }
    throw new ForbiddenException(
      'El catálogo de estudios es para quien pide o ejecuta estudios',
    );
  }

  private async isDiagnosticMember(
    userId: string,
    tenantId: string,
  ): Promise<boolean> {
    const em = this.em.fork();
    const tenant = await em.findOne(Tenants, { id: tenantId });
    if (
      tenant?.tenantTypeConceptId !== CONCEPTS.TENANT_TYPE_DIAGNOSTIC_CENTER
    ) {
      return false;
    }
    return (
      (await this.memberships.findActiveByUserTenant(
        em,
        userId,
        tenantId,
        DIR.MEMBERSHIP_ACTIVE,
      )) !== null
    );
  }
}
