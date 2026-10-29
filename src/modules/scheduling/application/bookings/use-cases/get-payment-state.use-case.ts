import type { AuthenticatedUser } from '../../../../../common';
import { BookingAccess } from '../support/booking-access';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { PaymentStateDto } from '../../../presentation/dto';
import { SchedulingBookingsRepository } from '../../../infrastructure/repositories';
import { projectPaymentState } from '../support/booking-projections';
import {
  BookingBillingBridge,
  amountsOf,
} from '../support/booking-billing-bridge';

/** El estado de pago de una cita, para leerlo. */
@Injectable()
export class GetPaymentStateUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly bookingsRepo: SchedulingBookingsRepository,
    private readonly access: BookingAccess,
    private readonly billing: BookingBillingBridge,
  ) {}

  /**
   * El estado de pago de una cita, para leerlo.
   *
   * Devuelve `null` cuando **nadie lo marcó todavía**, que no es lo mismo que
   * «pendiente de pago»: pendiente es una afirmación que alguien firmó, y la
   * ausencia de fila es que del pago aún no se dijo nada.
   *
   * Corre en una transacción porque `loadForOperation` carga la cita con
   * `FOR UPDATE`: fuera de una, MikroORM la rechaza y la lectura respondía 500.
   *
   * FAC-01: si el pago ya está facturado, trae lo cobrado (`amountPaid`).
   */
  async execute(
    bookingId: string,
    actor: AuthenticatedUser,
  ): Promise<PaymentStateDto | null> {
    return this.em.transactional(async (tx) => {
      const booking = await this.access.loadForOperation(tx, bookingId, actor);
      const row = await this.bookingsRepo.findPaymentState(tx, booking.id);
      if (!row) return null;
      const billing = await this.billing.linkOf(tx, row);
      return {
        ...projectPaymentState(row),
        ...(billing ? amountsOf(billing) : {}),
      };
    });
  }
}
