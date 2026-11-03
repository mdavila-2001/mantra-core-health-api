import { Injectable } from '@nestjs/common';
import {
  roleAuthorizesInTenant,
  type AuthenticatedUser,
} from '../../../common';
import { AuthzPdpService } from '../../authz/services/authz-pdp.service';
import type { BulkImportPermission } from '../bulk-import.constants';
import type { BulkImportAccessPolicyPort } from '../ports/bulk-import.ports';

/**
 * Permiso fino de una carga, resuelto por el PDP de `authz` que ya existe.
 *
 * No hay tablas nuevas: `bulk_import.users` y `bulk_import.clinical` son filas
 * de `authz.permissions` (`resource` = el código, acción `EXECUTE`) que se crean
 * por `POST /authz/permissions` y se conceden por rol o por
 * `authz.user_permission_grants`. Sin esa fila, el PDP responde `DENY` (deny por
 * defecto): nadie puede cargar hasta que se conceda a propósito.
 *
 * `SUPERADMIN` de plataforma pasa, como en el resto del sistema
 * (`RolesGuard`); un `SUPERADMIN` acotado a un tenant, no.
 */
@Injectable()
export class PdpAccessPolicyAdapter implements BulkImportAccessPolicyPort {
  constructor(private readonly pdp: AuthzPdpService) {}

  async isAllowed(
    actor: AuthenticatedUser,
    tenantId: string,
    permission: BulkImportPermission,
  ): Promise<boolean> {
    if (roleAuthorizesInTenant(actor, 'SUPERADMIN', undefined)) return true;
    const decision = await this.pdp.evaluate(
      { userId: actor.id, tenantId, action: 'EXECUTE', resource: permission },
      actor,
    );
    return decision.decision === 'PERMIT';
  }
}
