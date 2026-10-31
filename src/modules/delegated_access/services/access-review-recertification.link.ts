import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { touch } from '../../../common';
import { DELEG } from '../delegated_access.concepts';
import {
  AccessReviewItems,
  type OrganizationUserAssignments,
} from '../entities';

/**
 * Une la recertificación individual EXISTENTE (`POST /org/support-engagements/:id/recertify`,
 * cada 6 o 12 meses) con las campañas de certificación (CONTRATO-GOBIERNO §6.2,
 * K-04): un `recertify` hecho por la ruta antigua fija `last_certified_at` y
 * cierra como `CERTIFIED` el ítem de vínculo que estuviera abierto, para que la
 * persona no quede con una tarea pendiente de algo que ya se hizo. No cambia lo
 * que `recertify` hace; se enchufa a su final dentro de la misma transacción.
 */
@Injectable()
export class RecertificationReviewLink {
  /**
   * Registra que el vínculo se recertificó.
   *
   * @param tx - Transacción de la recertificación.
   * @param assignment - Vínculo recertificado.
   * @param actorUserId - Quien recertificó.
   * @param now - Instante de la recertificación.
   * @returns Cuántos ítems de vínculo se cerraron.
   */
  async onRecertified(
    tx: EntityManager,
    assignment: OrganizationUserAssignments,
    actorUserId: string | undefined,
    now: Date,
  ): Promise<number> {
    assignment.lastCertifiedAt = now;
    const pending = await tx.find(AccessReviewItems, {
      organizationUserAssignmentId: assignment.id,
      supportScopeGrantId: null,
      decisionConceptId: DELEG.REVIEW_ITEM_PENDING,
    });
    for (const item of pending) {
      item.decisionConceptId = DELEG.REVIEW_ITEM_CERTIFIED;
      item.decidedAt = now;
      item.decidedByUserId = actorUserId;
      touch(item, actorUserId, now);
    }
    return pending.length;
  }
}
