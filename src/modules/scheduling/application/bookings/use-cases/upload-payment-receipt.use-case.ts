import { AppointmentPaymentReceipts } from '../../../entities';
import {
  ConflictException,
  PreconditionFailedException,
  createdBy,
  type AuthenticatedUser,
} from '../../../../../common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import {
  PAYMENT_RECEIPT_FILES_PORT,
  type PaymentReceiptFilesPort,
} from '../../ports/payment-receipt-files.port';
import {
  PaymentReceiptDto,
  UploadPaymentReceiptDto,
} from '../../../presentation/dto';
import { BookingChangeNotifier } from '../support/booking-change-notifier';
import { PaymentReceiptAccess } from '../support/payment-receipt-access';
import { PinoLogger } from 'nestjs-pino';
import { SCHED } from '../../../domain/scheduling.concepts';
import { STATES_WITHOUT_PAYMENT } from '../../../domain/booking/booking-states';
import { SchedulingBookingsRepository } from '../../../infrastructure/repositories';
import { randomUUID } from 'node:crypto';

/** El paciente sube el comprobante de lo que pagó por su cita. */
@Injectable()
export class UploadPaymentReceiptUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly bookingsRepo: SchedulingBookingsRepository,
    private readonly receipts: PaymentReceiptAccess,
    @Inject(PAYMENT_RECEIPT_FILES_PORT)
    private readonly files: PaymentReceiptFilesPort,
    private readonly notifier: BookingChangeNotifier,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(UploadPaymentReceiptUseCase.name);
  }

  /**
   * Guarda el comprobante, pendiente de revisión, y le avisa al médico.
   *
   * El paciente **no** marca su cita como pagada: sube la prueba y quien cobra
   * la revisa. Por eso el `PUT payment-state` le sigue cerrado.
   *
   * @param bookingId - La cita que se pagó.
   * @param dto - El archivo y, si quiere, monto, fecha y nota.
   * @param actor - El paciente o quien lo representa.
   * @returns El comprobante tal como quedó, pendiente.
   * @throws ResourceNotFoundException (404) si la cita no existe o no es suya.
   * @throws PreconditionFailedException (422) si el archivo no sirve o la cita
   *   está cancelada o rechazada.
   * @throws ConflictException (409) si la cita ya está pagada.
   */
  async execute(
    bookingId: string,
    dto: UploadPaymentReceiptDto,
    actor: AuthenticatedUser,
  ): Promise<PaymentReceiptDto> {
    this.logger.info(
      { operation: 'scheduling.booking.payment-receipt.upload', bookingId },
      'Uploading booking payment receipt',
    );

    const receipt = await this.em.transactional(async (tx) => {
      const booking = await this.receipts.loadForPatient(tx, bookingId, actor);

      if (STATES_WITHOUT_PAYMENT.includes(booking.statusConceptId)) {
        throw new PreconditionFailedException(
          'Una cita cancelada o rechazada no lleva pago: no hay comprobante que subir.',
          { bookingId, statusConceptId: booking.statusConceptId },
        );
      }
      const payment = await this.bookingsRepo.findPaymentStateForUpdate(
        tx,
        booking.id,
      );
      if (payment?.statusConceptId === SCHED.PAYMENT_PAID) {
        throw new ConflictException(
          'La cita ya está pagada: no hace falta otro comprobante.',
          { bookingId },
        );
      }

      await this.files.assertAttachable(tx, dto.fileId, actor);

      const now = new Date();
      const row = tx.create(AppointmentPaymentReceipts, {
        id: randomUUID(),
        tenantId: booking.tenantId,
        appointmentBookingId: booking.id,
        fileId: dto.fileId,
        amount: dto.amount,
        paidAt: dto.paidAt === undefined ? undefined : new Date(dto.paidAt),
        note: dto.note,
        uploadedByUserId: actor.id,
        uploadedAt: now,
        reviewStatusConceptId: SCHED.RECEIPT_PENDING,
        ...createdBy(actor.id, now),
        rowVersion: 1,
      });
      tx.persist(row);
      await tx.flush();

      const [projected] = await this.receipts.project(tx, [row]);
      return projected;
    });

    await this.notifier.notifyReceiptUploaded(bookingId, receipt.id);
    return receipt;
  }
}
