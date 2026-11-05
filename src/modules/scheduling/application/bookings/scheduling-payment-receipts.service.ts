import type { AuthenticatedUser } from '../../../../common';
import { ConfirmPaymentReceiptUseCase } from './use-cases/confirm-payment-receipt.use-case';
import {
  ConfirmPaymentReceiptResponseDto,
  PaymentReceiptDto,
  RejectPaymentReceiptDto,
  UploadPaymentReceiptDto,
} from '../../presentation/dto';
import { GetPaymentReceiptContentUseCase } from './use-cases/get-payment-receipt-content.use-case';
import { Injectable } from '@nestjs/common';
import { ListPaymentReceiptsUseCase } from './use-cases/list-payment-receipts.use-case';
import type { PaymentReceiptFileContent } from '../ports/payment-receipt-files.port';
import { RejectPaymentReceiptUseCase } from './use-cases/reject-payment-receipt.use-case';
import { UploadPaymentReceiptUseCase } from './use-cases/upload-payment-receipt.use-case';

/**
 * Fachada de los comprobantes de pago de una cita: el paciente los sube y el
 * prestador los revisa. Delega cada operación en su caso de uso.
 */
@Injectable()
export class SchedulingPaymentReceiptsService {
  constructor(
    private readonly uploadUseCase: UploadPaymentReceiptUseCase,
    private readonly listUseCase: ListPaymentReceiptsUseCase,
    private readonly contentUseCase: GetPaymentReceiptContentUseCase,
    private readonly confirmUseCase: ConfirmPaymentReceiptUseCase,
    private readonly rejectUseCase: RejectPaymentReceiptUseCase,
  ) {}

  upload(
    bookingId: string,
    dto: UploadPaymentReceiptDto,
    actor: AuthenticatedUser,
  ): Promise<PaymentReceiptDto> {
    return this.uploadUseCase.execute(bookingId, dto, actor);
  }

  list(
    bookingId: string,
    actor: AuthenticatedUser,
  ): Promise<PaymentReceiptDto[]> {
    return this.listUseCase.execute(bookingId, actor);
  }

  content(
    bookingId: string,
    receiptId: string,
    actor: AuthenticatedUser,
  ): Promise<PaymentReceiptFileContent> {
    return this.contentUseCase.execute(bookingId, receiptId, actor);
  }

  confirm(
    bookingId: string,
    receiptId: string,
    actor: AuthenticatedUser,
  ): Promise<ConfirmPaymentReceiptResponseDto> {
    return this.confirmUseCase.execute(bookingId, receiptId, actor);
  }

  reject(
    bookingId: string,
    receiptId: string,
    dto: RejectPaymentReceiptDto,
    actor: AuthenticatedUser,
  ): Promise<PaymentReceiptDto> {
    return this.rejectUseCase.execute(bookingId, receiptId, dto, actor);
  }
}
