import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../../common';
import { CenterBookingsRepository } from '../infrastructure/center-bookings.repository';
import { OrderPatientRepository } from '../infrastructure/order-patient.repository';
import { OrderBookingAccessService } from './order-booking-access.service';

/**
 * `DELETE /diagnostic-results/me/orders/:orderId/booking`: the patient cancels
 * the order's appointment and its place goes back to the slot. An appointment
 * that already started is not cancelled from here.
 */
@Injectable()
export class CancelOrderBookingUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly access: OrderBookingAccessService,
    private readonly patients: OrderPatientRepository,
    private readonly bookingsRepo: CenterBookingsRepository,
  ) {}

  execute(actor: AuthenticatedUser, orderId: string): Promise<void> {
    return this.em.transactional(async (tx) => {
      const { patientProfileId, order } = await this.access.ownOrder(
        tx,
        actor,
        orderId,
      );
      await this.patients.lockOrder(tx, order.id);
      const booking = await this.bookingsRepo.findForOrder(
        tx,
        patientProfileId,
        order.id,
      );
      if (!booking) {
        throw new ResourceNotFoundException('La orden no tiene cita');
      }
      if (new Date(booking.start_at).getTime() <= Date.now()) {
        throw new PreconditionFailedException('Ese turno ya pasó.', {
          bookingId: booking.id,
        });
      }
      await this.bookingsRepo.cancel(tx, booking, actor.id);
    });
  }
}
