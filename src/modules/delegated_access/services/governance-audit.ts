import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../common';
import { AuditTrailService } from '../../audit/services/audit-trail.service';

/**
 * Sella en la cadena WORM de auditoría (`audit.audit_log`) un hecho del
 * gobierno de accesos con su nombre de negocio (`ACCESS_REVIEW_ITEM_REVOKED`,
 * `ANOMALY_DISMISSED`, …) cuando la ruta no puede declararlo con un solo
 * `@Audited` (la acción depende de lo decidido). Al sellar aquí, el
 * interceptor transversal no repite el sello de la petición. Solo
 * identificadores: nunca texto libre ni datos del paciente.
 */
@Injectable()
export class GovernanceAudit {
  /**
   * @param audit - Sello en la cadena de auditoría.
   */
  constructor(private readonly audit: AuditTrailService) {}

  /**
   * Sella un hecho dentro de la transacción en curso.
   *
   * @param tx - Transacción activa.
   * @param actor - Quien lo provoca; sin actor (un trabajo interno) no se sella aquí.
   * @param tenantId - Organización.
   * @param action - Verbo de negocio en pasado y MAYÚSCULAS.
   * @param entity - Tabla afectada en singular.
   * @param entityId - Id del recurso (uuid).
   */
  async seal(
    tx: EntityManager,
    actor: AuthenticatedUser | undefined,
    tenantId: string,
    action: string,
    entity: string,
    entityId?: string,
  ): Promise<void> {
    if (!actor) return;
    await this.audit.record(tx, actor, {
      action,
      entity,
      entityId,
      tenantId,
      success: true,
    });
  }
}
