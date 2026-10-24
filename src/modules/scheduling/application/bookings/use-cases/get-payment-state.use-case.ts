import type { AuthenticatedUser } from '../../../../../common';
import { BookingAccess } from '../support/booking-access';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { PaymentStateDto } from '../../../presentation/dto';
import { SchedulingBookingsRepository } from '../../../infrastructure/repositories';
import { projectPaymentState } from '../support/booking-projections';

/** El estado de pago de una cita, para leerlo. */
@Injectable()
export class GetPaymentStateUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly bookingsRepo: SchedulingBookingsRepository,
    private readonly access: BookingAccess,
  ) {}

  /**
   * El estado de pago de una cita, para leerlo.
   *
   * Devuelve `null` cuando **nadie lo marcó todavía**, que no es lo mismo que
   * «pendiente de pago»: pendiente es una afirmación que alguien firmó, y la
   * ausencia de fila es que del pago aún no se dijo nada.
   */
  async execute(
    bookingId: string,
    actor: AuthenticatedUser,
  ): Promise<PaymentStateDto | null> {
    const booking = await this.access.loadForOperation(
      this.em,
      bookingId,
      actor,
    );
    const row = await this.bookingsRepo.findPaymentState(this.em, booking.id);
    return row ? projectPaymentState(row) : null;
  }
}
