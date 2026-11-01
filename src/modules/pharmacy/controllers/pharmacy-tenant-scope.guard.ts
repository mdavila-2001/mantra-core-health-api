import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedRequest } from '../../../common/auth/authenticated-user.interface';
import { roleAuthorizesInTenant } from '../../../common/auth/roles.guard';
import { Pharmacies } from '../entities/pharmacies.entity';

/**
 * Acota las operaciones de `/pharmacies/:pharmacyId/...` al personal de la
 * propia farmacia.
 *
 * `@Roles('SECURITY_ADMIN', 'PHARMACY_STAFF')` sólo dice «es de una farmacia»;
 * lo que impide que el personal de la farmacia A toque el catálogo de la B es
 * esto: el `pharmacyId` de la ruta tiene que pertenecer a un tenant del que el
 * actor es miembro activo (y, si manda `X-Tenant-Id`, a ése). Sin `pharmacyId`
 * en la ruta (el alta de una farmacia con `tenantId` en el cuerpo) el personal
 * no pasa: eso es de la plataforma. `SECURITY_ADMIN` y `SUPERADMIN` **globales**
 * no se acotan; concedidos dentro de un tenant (`scopedRoles`, MCH-001) sólo pasan
 * sobre las farmacias de ese tenant y no hacen las operaciones sin farmacia
 * (#1241). Fuera de su tenant siguen la regla del personal.
 */
/** Roles de plataforma que no se acotan a una farmacia. */
const PLATFORM_ROLES = ['SECURITY_ADMIN', 'SUPERADMIN'];

@Injectable()
export class PharmacyTenantScopeGuard implements CanActivate {
  constructor(private readonly em: EntityManager) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const platformIn = (tenantId: string | undefined): boolean =>
      PLATFORM_ROLES.some((role) =>
        roleAuthorizesInTenant(request.user, role, tenantId),
      );
    // Sin tenant: sólo el rol global.
    if (platformIn(undefined)) return true;
    const pharmacyId = (request.params as Record<string, string | undefined>)
      .pharmacyId;
    if (!pharmacyId) {
      throw new ForbiddenException(
        'Esta operación es de la plataforma, no del personal de una farmacia',
      );
    }
    const pharmacy = await this.em
      .fork()
      .findOne(Pharmacies, { id: pharmacyId });
    if (pharmacy && platformIn(pharmacy.tenantId)) return true;
    const tenantIds = request.user?.tenantIds ?? [];
    const header = request.headers['x-tenant-id'];
    const declared = Array.isArray(header) ? header[0] : header;
    if (
      !pharmacy ||
      !tenantIds.includes(pharmacy.tenantId) ||
      (declared && declared !== pharmacy.tenantId)
    ) {
      // El mismo 403 para inexistente y ajena: distinguirlas filtra.
      throw new ForbiddenException(
        'La farmacia no pertenece a su organización',
      );
    }
    return true;
  }
}
