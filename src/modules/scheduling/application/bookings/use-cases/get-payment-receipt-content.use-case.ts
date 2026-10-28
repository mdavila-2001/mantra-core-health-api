import {
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../../../common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import {
  PAYMENT_RECEIPT_FILES_PORT,
  type PaymentReceiptFileContent,
  type PaymentReceiptFilesPort,
} from '../../ports/payment-receipt-files.port';
import { PAYMENT_RECEIPT_MIME_TYPES } from '../../../domain/booking/payment-receipt';
import { PaymentReceiptAccess } from '../support/payment-receipt-access';

/** Los bytes de un comprobante, para quien puede ver la cita. */
@Injectable()
export class GetPaymentReceiptContentUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly receipts: PaymentReceiptAccess,
    @Inject(PAYMENT_RECEIPT_FILES_PORT)
    private readonly files: PaymentReceiptFilesPort,
  ) {}

  /**
   * El archivo del comprobante.
   *
   * Existe porque `GET /common/files/:id/content` solo se lo da a quien lo
   * subió, y el que tiene que mirarlo es el médico. Se autoriza por la cita
   * —la misma regla que la lista— y recién entonces se sirven los bytes.
   */
  async execute(
    bookingId: string,
    receiptId: string,
    actor: AuthenticatedUser,
  ): Promise<PaymentReceiptFileContent> {
    const fileId = await this.em.transactional(async (tx) => {
      const booking = await this.receipts.loadForReading(tx, bookingId, actor);
      const receipt = await this.receipts.receiptOf(
        tx,
        booking.id,
        receiptId,
        false,
      );
      return receipt.fileId;
    });
    const content = await this.files.download(fileId);
    // El tipo se revisó al subirlo, pero lo que se sirve es la versión vigente
    // de hoy: se vuelve a exigir antes de mandarle bytes a un navegador.
    if (!PAYMENT_RECEIPT_MIME_TYPES.includes(content.mimeType)) {
      throw new PreconditionFailedException(
        'El archivo del comprobante ya no es de un formato que se pueda mostrar',
        { bookingId, receiptId },
      );
    }
    return content;
  }
}
