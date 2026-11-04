import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../../common';
import {
  OrderPatientRepository,
  type OrderRow,
} from '../infrastructure/order-patient.repository';

export interface OwnOrder {
  readonly patientProfileId: string;
  readonly order: OrderRow;
}

/**
 * The order the session's patient wants to book, checked server side: it is
 * theirs (another person's order answers like a missing one), it is a
 * laboratory or imaging order, and it has no released result yet — an order
 * with its result already published was performed, so it is not booked even
 * if someone reaches the booking URL.
 */
@Injectable()
export class OrderBookingAccessService {
  constructor(private readonly repo: OrderPatientRepository) {}

  async ownOrder(
    em: EntityManager,
    actor: AuthenticatedUser,
    orderId: string,
  ): Promise<OwnOrder> {
    const patientProfileId = await this.repo.ownPatientProfileId(em, actor.id);
    if (!patientProfileId) {
      throw new PreconditionFailedException(
        'La cuenta no tiene perfil de paciente',
      );
    }
    // The patient id goes into the query too: even under the system RLS
    // context, only this patient's own order is read.
    const order = await this.repo.findDiagnosticOrder(
      em,
      orderId,
      patientProfileId,
    );
    if (!order || order.patient_profile_id !== patientProfileId) {
      throw new ResourceNotFoundException('Orden no encontrada');
    }
    if (await this.repo.hasReleasedResult(em, order.id)) {
      throw new ConflictException(
        'Esta orden ya tiene su resultado: no hace falta reservar.',
      );
    }
    return { patientProfileId, order };
  }
}
