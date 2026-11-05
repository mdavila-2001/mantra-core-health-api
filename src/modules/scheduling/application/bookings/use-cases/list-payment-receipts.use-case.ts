import type { AuthenticatedUser } from '../../../../../common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { PaymentReceiptAccess } from '../support/payment-receipt-access';
import { PaymentReceiptDto } from '../../../presentation/dto';
import { SchedulingPaymentReceiptsRepository } from '../../../infrastructure/repositories';

/** Los comprobantes de pago de una cita. */
@Injectable()
export class ListPaymentReceiptsUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly receiptsRepo: SchedulingPaymentReceiptsRepository,
    private readonly receipts: PaymentReceiptAccess,
  ) {}

  /**
   * Los comprobantes de la cita, del más reciente al más viejo.
   *
   * Los ve el paciente de la cita y, del lado del prestador, el médico de esa
   * agenda o quien opera cualquiera. Cualquier otro recibe 404.
   */
  async execute(
    bookingId: string,
    actor: AuthenticatedUser,
  ): Promise<PaymentReceiptDto[]> {
    return this.em.transactional(async (tx) => {
      const booking = await this.receipts.loadForReading(tx, bookingId, actor);
      const rows = await this.receiptsRepo.findForBooking(tx, booking.id);
      return this.receipts.project(tx, rows);
    });
  }
}
