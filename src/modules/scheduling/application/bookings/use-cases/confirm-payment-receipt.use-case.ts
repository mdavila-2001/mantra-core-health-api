import {
  ConflictException,
  PreconditionFailedException,
  touch,
  type AuthenticatedUser,
} from '../../../../../common';
import {
  BOOKING_HISTORY_PORT,
  type BookingHistoryPort,
} from '../../ports/booking-history.port';
import { BookingChangeNotifier } from '../support/booking-change-notifier';
import { ConfirmPaymentReceiptResponseDto } from '../../../presentation/dto';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { PaymentReceiptAccess } from '../support/payment-receipt-access';
import { PinoLogger } from 'nestjs-pino';
import { SCHED } from '../../../domain/scheduling.concepts';
import { STATES_WITHOUT_PAYMENT } from '../../../domain/booking/booking-states';
import { SchedulingBookingsRepository } from '../../../infrastructure/repositories';
import { projectPaymentState } from '../support/booking-projections';
import { writePaymentState } from '../support/payment-state-writer';

/** El médico confirma un comprobante: la cita queda pagada. */
@Injectable()
export class ConfirmPaymentReceiptUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly bookingsRepo: SchedulingBookingsRepository,
    private readonly receipts: PaymentReceiptAccess,
    @Inject(BOOKING_HISTORY_PORT)
    private readonly history: BookingHistoryPort,
    private readonly notifier: BookingChangeNotifier,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ConfirmPaymentReceiptUseCase.name);
  }

  /**
   * Confirma el comprobante y deja la cita pagada, en una sola transacción.
   *
   * **Confirmar uno basta**, sin sumar montos: es lo que pidió quien cobra. El
   * pago se escribe con la misma función que el `PUT payment-state` —fila con
   * `FOR UPDATE`, firma y `HISTORY_OP_PAYMENT_MARKED`—, y los otros
   * comprobantes pendientes de la cita quedan como están.
   *
   * Volver a confirmar uno ya confirmado no escribe nada y devuelve lo mismo.
   *
   * @throws ResourceNotFoundException (404) si la cita o el comprobante no
   *   existen o son de otra agenda.
   * @throws ConflictException (409) si el comprobante ya se rechazó.
   * @throws PreconditionFailedException (422) si la cita está cancelada o
   *   rechazada.
   */
  async execute(
    bookingId: string,
    receiptId: string,
    actor: AuthenticatedUser,
  ): Promise<ConfirmPaymentReceiptResponseDto> {
    this.logger.info(
      {
        operation: 'scheduling.booking.payment-receipt.confirm',
        bookingId,
        receiptId,
      },
      'Confirming booking payment receipt',
    );

    const { response, changed } = await this.em.transactional(async (tx) => {
      const booking = await this.receipts.loadForReviewer(tx, bookingId, actor);
      const receipt = await this.receipts.receiptOf(
        tx,
        booking.id,
        receiptId,
        true,
      );

      if (receipt.reviewStatusConceptId === SCHED.RECEIPT_REJECTED) {
        throw new ConflictException(
          'Ese comprobante ya se rechazó: no se puede confirmar.',
          { bookingId, receiptId },
        );
      }

      if (receipt.reviewStatusConceptId === SCHED.RECEIPT_CONFIRMED) {
        const payment = await this.bookingsRepo.findPaymentState(
          tx,
          booking.id,
        );
        const [projected] = await this.receipts.project(tx, [receipt]);
        if (payment) {
          return {
            response: {
              receipt: projected,
              paymentState: projectPaymentState(payment),
            },
            changed: false,
          };
        }
      }

      if (STATES_WITHOUT_PAYMENT.includes(booking.statusConceptId)) {
        throw new PreconditionFailedException(
          'Una cita cancelada o rechazada no lleva estado de pago: no hubo atención que cobrar.',
          { bookingId, statusConceptId: booking.statusConceptId },
        );
      }

      const now = new Date();
      receipt.reviewStatusConceptId = SCHED.RECEIPT_CONFIRMED;
      receipt.reviewedByUserId = actor.id;
      receipt.reviewedAt = now;
      touch(receipt, actor.id);

      const payment = await writePaymentState(
        tx,
        this.bookingsRepo,
        this.history,
        booking,
        { statusConceptId: SCHED.PAYMENT_PAID },
        actor,
      );
      await tx.flush();

      const [projected] = await this.receipts.project(tx, [receipt]);
      return {
        response: {
          receipt: projected,
          paymentState: projectPaymentState(payment),
        },
        changed: true,
      };
    });

    if (changed) {
      await this.notifier.notifyReceiptReviewed(bookingId, receiptId, true);
    }
    return response;
  }
}
