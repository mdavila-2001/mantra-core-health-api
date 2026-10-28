import type {
  AppointmentBookings,
  AppointmentPaymentReceipts,
} from '../../../entities';
import {
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../../../common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { BookingAccess } from './booking-access';
import {
  PAYMENT_RECEIPT_FILES_PORT,
  type PaymentReceiptFileInfo,
  type PaymentReceiptFilesPort,
} from '../../ports/payment-receipt-files.port';
import { PAYMENT_RECEIPT_CONCEPT_STATUS } from '../../../domain/booking/payment-receipt';
import { PaymentReceiptDto } from '../../../presentation/dto';
import {
  SchedulingBookingsRepository,
  SchedulingPaymentReceiptsRepository,
} from '../../../infrastructure/repositories';
import { isPatientActor } from '../../../domain/booking/agenda-actors';

/**
 * Quién llega a los comprobantes de una cita, y cómo se leen.
 *
 * ## Por qué 404 y no 403
 *
 * Una cita ajena responde **404**, igual que una que no existe: decirle a
 * quien no tiene que verla «existe, pero no es tuya» ya es contarle algo. Las
 * comprobaciones de fondo son las de siempre —{@link BookingAccess}—, y acá
 * solo se traduce su `403`.
 */
@Injectable()
export class PaymentReceiptAccess {
  constructor(
    private readonly bookingsRepo: SchedulingBookingsRepository,
    private readonly receiptsRepo: SchedulingPaymentReceiptsRepository,
    private readonly access: BookingAccess,
    @Inject(PAYMENT_RECEIPT_FILES_PORT)
    private readonly files: PaymentReceiptFilesPort,
  ) {}

  /**
   * La cita de un paciente, bloqueada: solo su titular o quien lo representa.
   *
   * @throws ResourceNotFoundException si no existe o no es suya.
   */
  async loadForPatient(
    tx: EntityManager,
    bookingId: string,
    actor: AuthenticatedUser,
  ): Promise<AppointmentBookings> {
    const booking = await this.bookingsRepo.findBookingByIdForUpdate(
      tx,
      bookingId,
    );
    if (!booking) throw notFound(bookingId);
    await this.hideForbidden(bookingId, () =>
      this.access.assertMayActForPatient(booking.patientProfileId, actor, tx),
    );
    return booking;
  }

  /**
   * La cita para revisarla: el médico de esa agenda o quien opera cualquiera.
   *
   * @throws ResourceNotFoundException si no existe o es de otra agenda.
   */
  loadForReviewer(
    tx: EntityManager,
    bookingId: string,
    actor: AuthenticatedUser,
  ): Promise<AppointmentBookings> {
    return this.hideForbidden(bookingId, () =>
      this.access.loadForOperation(tx, bookingId, actor),
    );
  }

  /**
   * La cita para leer sus comprobantes: el paciente por su lado, el prestador
   * por el suyo.
   */
  loadForReading(
    em: EntityManager,
    bookingId: string,
    actor: AuthenticatedUser,
  ): Promise<AppointmentBookings> {
    return isPatientActor(actor)
      ? this.loadForPatient(em, bookingId, actor)
      : this.loadForReviewer(em, bookingId, actor);
  }

  /**
   * Un comprobante de esa cita.
   *
   * @throws ResourceNotFoundException si no existe o es de otra cita.
   */
  async receiptOf(
    em: EntityManager,
    bookingId: string,
    receiptId: string,
    forUpdate: boolean,
  ): Promise<AppointmentPaymentReceipts> {
    const receipt = forUpdate
      ? await this.receiptsRepo.findOfBookingForUpdate(em, bookingId, receiptId)
      : await this.receiptsRepo.findOfBooking(em, bookingId, receiptId);
    if (!receipt) {
      throw new ResourceNotFoundException('Comprobante no encontrado', {
        bookingId,
        receiptId,
      });
    }
    return receipt;
  }

  /** Los comprobantes tal como salen por la API, con archivo y nombres. */
  async project(
    em: EntityManager,
    rows: readonly AppointmentPaymentReceipts[],
  ): Promise<PaymentReceiptDto[]> {
    const files = await this.files.describe(
      em,
      rows.map((row) => row.fileId),
    );
    const names = await this.receiptsRepo.findUserDisplayNames(
      em,
      rows.flatMap((row) =>
        row.reviewedByUserId == null
          ? [row.uploadedByUserId]
          : [row.uploadedByUserId, row.reviewedByUserId],
      ),
    );
    return rows.map((row) => toReceiptDto(row, files.get(row.fileId), names));
  }

  private async hideForbidden<T>(
    bookingId: string,
    check: () => Promise<T>,
  ): Promise<T> {
    try {
      return await check();
    } catch (error: unknown) {
      if (error instanceof ForbiddenException) throw notFound(bookingId);
      throw error;
    }
  }
}

function notFound(bookingId: string): ResourceNotFoundException {
  return new ResourceNotFoundException('Cita no encontrada', { bookingId });
}

/** Un comprobante como DTO. */
function toReceiptDto(
  row: AppointmentPaymentReceipts,
  file: PaymentReceiptFileInfo | undefined,
  names: ReadonlyMap<string, string>,
): PaymentReceiptDto {
  const actorOf = (userId: string) => ({
    userId,
    displayName: names.get(userId) ?? 'Usuario',
  });
  return {
    id: row.id,
    bookingId: row.appointmentBookingId,
    fileId: row.fileId,
    mimeType: file?.mimeType ?? 'application/octet-stream',
    originalName: file?.originalName ?? null,
    amount: row.amount ?? null,
    paidAt: row.paidAt?.toISOString() ?? null,
    note: row.note ?? null,
    uploadedAt: row.uploadedAt.toISOString(),
    uploadedBy: actorOf(row.uploadedByUserId),
    status: PAYMENT_RECEIPT_CONCEPT_STATUS[row.reviewStatusConceptId],
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    reviewedBy:
      row.reviewedByUserId == null ? null : actorOf(row.reviewedByUserId),
    rejectionReason: row.rejectionReason ?? null,
  };
}
