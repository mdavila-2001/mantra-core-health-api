import {
  ConflictException,
  touch,
  type AuthenticatedUser,
} from '../../../../../common';
import { BookingChangeNotifier } from '../support/booking-change-notifier';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { PaymentReceiptAccess } from '../support/payment-receipt-access';
import {
  PaymentReceiptDto,
  RejectPaymentReceiptDto,
} from '../../../presentation/dto';
import { PinoLogger } from 'nestjs-pino';
import { SCHED } from '../../../domain/scheduling.concepts';

/** El médico rechaza un comprobante, con su motivo. */
@Injectable()
export class RejectPaymentReceiptUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly receipts: PaymentReceiptAccess,
    private readonly notifier: BookingChangeNotifier,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RejectPaymentReceiptUseCase.name);
  }

  /**
   * Rechaza el comprobante y guarda por qué, quién y cuándo.
   *
   * **No toca el estado de pago**: un comprobante que no sirve no dice que la
   * cita no se pagó, dice que esa prueba no alcanza. El paciente recibe el
   * motivo en el aviso y puede subir otro.
   *
   * @throws ResourceNotFoundException (404) si la cita o el comprobante no
   *   existen o son de otra agenda.
   * @throws ConflictException (409) si el comprobante ya se confirmó.
   */
  async execute(
    bookingId: string,
    receiptId: string,
    dto: RejectPaymentReceiptDto,
    actor: AuthenticatedUser,
  ): Promise<PaymentReceiptDto> {
    this.logger.info(
      {
        operation: 'scheduling.booking.payment-receipt.reject',
        bookingId,
        receiptId,
      },
      'Rejecting booking payment receipt',
    );

    const reason = dto.reason.trim();
    const receipt = await this.em.transactional(async (tx) => {
      const booking = await this.receipts.loadForReviewer(tx, bookingId, actor);
      const row = await this.receipts.receiptOf(
        tx,
        booking.id,
        receiptId,
        true,
      );

      if (row.reviewStatusConceptId === SCHED.RECEIPT_CONFIRMED) {
        throw new ConflictException(
          'Ese comprobante ya se confirmó: no se puede rechazar.',
          { bookingId, receiptId },
        );
      }

      const now = new Date();
      row.reviewStatusConceptId = SCHED.RECEIPT_REJECTED;
      row.reviewedByUserId = actor.id;
      row.reviewedAt = now;
      row.rejectionReason = reason;
      touch(row, actor.id);
      await tx.flush();

      const [projected] = await this.receipts.project(tx, [row]);
      return projected;
    });

    await this.notifier.notifyReceiptReviewed(
      bookingId,
      receiptId,
      false,
      reason,
    );
    return receipt;
  }
}
