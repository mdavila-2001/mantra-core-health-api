import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PaymentProofs } from '../entities';
import { createdBy } from '../../../common';
import { BILL } from '../billing.concepts';

export interface CreatePaymentProofData {
  encounterId: string;
  tenantId: string;
  patientProfileId: string;
  practiceSiteId?: string;
  methodConceptId: string;
  fileId?: string;
  amountMinor: number;
  currency: string;
  actorUserId: string;
}

export interface ReviewPaymentProofData {
  /** `PROOF_ACCEPTED` o `PROOF_REJECTED`. */
  statusConceptId: string;
  reviewedByUserId: string;
  rejectionReason?: string;
}

/**
 * Persistencia de los comprobantes de pago (C-01). La revisión lleva la
 * precondición EN LA ESCRITURA (`WHERE status = PENDING_REVIEW`): dos clics
 * simultáneos producen una sola transición y un 409, no dos aceptaciones.
 */
@Injectable()
export class PaymentProofsRepository {
  create(em: EntityManager, data: CreatePaymentProofData): PaymentProofs {
    const proof = em.create(PaymentProofs, {
      encounterId: data.encounterId,
      tenantId: data.tenantId,
      patientProfileId: data.patientProfileId,
      practiceSiteId: data.practiceSiteId,
      methodConceptId: data.methodConceptId,
      fileId: data.fileId,
      amountMinor: String(data.amountMinor),
      currency: data.currency,
      statusConceptId: BILL.PROOF_PENDING_REVIEW,
      rowVersion: 1,
      ...createdBy(data.actorUserId),
    });
    em.persist(proof);
    return proof;
  }

  findById(em: EntityManager, id: string): Promise<PaymentProofs | null> {
    return em.findOne(PaymentProofs, { id });
  }

  listByEncounter(
    em: EntityManager,
    encounterId: string,
  ): Promise<PaymentProofs[]> {
    return em.find(
      PaymentProofs,
      { encounterId },
      { orderBy: { createdAt: 'DESC', id: 'DESC' } },
    );
  }

  findPending(
    em: EntityManager,
    encounterId: string,
  ): Promise<PaymentProofs | null> {
    return em.findOne(PaymentProofs, {
      encounterId,
      statusConceptId: BILL.PROOF_PENDING_REVIEW,
    });
  }

  /**
   * PENDING_REVIEW → ACCEPTED | REJECTED, con la precondición en el `UPDATE`.
   * Devuelve `false` cuando la fila ya no estaba pendiente (o no existe).
   */
  async review(
    em: EntityManager,
    id: string,
    data: ReviewPaymentProofData,
  ): Promise<boolean> {
    const now = new Date();
    const affected = await em.nativeUpdate(
      PaymentProofs,
      { id, statusConceptId: BILL.PROOF_PENDING_REVIEW },
      {
        statusConceptId: data.statusConceptId,
        reviewedByUserId: data.reviewedByUserId,
        reviewedAt: now,
        rejectionReason: data.rejectionReason,
        updatedAt: now,
        updatedByUserId: data.reviewedByUserId,
      },
    );
    return affected === 1;
  }

  /**
   * Compensación: si saldar la cuenta falló después de aceptar, el comprobante
   * vuelve a pendiente para que no quede «aceptado» sin pago registrado.
   */
  async revertToPending(
    em: EntityManager,
    id: string,
    reviewedByUserId: string,
  ): Promise<boolean> {
    const affected = await em.nativeUpdate(
      PaymentProofs,
      { id, statusConceptId: BILL.PROOF_ACCEPTED, reviewedByUserId },
      {
        statusConceptId: BILL.PROOF_PENDING_REVIEW,
        reviewedByUserId: undefined,
        reviewedAt: undefined,
        updatedAt: new Date(),
      },
    );
    return affected === 1;
  }
}
