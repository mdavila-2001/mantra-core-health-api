import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../../../common';
import { SCHED } from '../../../domain/scheduling.concepts';
import {
  BOOKING,
  RECEIPT,
  booking,
  buildReceipts,
  otherPractitioner,
  patient,
  practitioner,
  receipt,
} from '../payment-receipts.testing';

describe('ConfirmPaymentReceiptUseCase · confirmar uno basta', () => {
  it('el comprobante queda confirmado y la cita pagada, en una sola transacción con FOR UPDATE', async () => {
    const d = buildReceipts();
    const row = receipt();
    d.receiptsRepo.findOfBookingForUpdate.mockResolvedValue(row);

    const res = await d.confirm.execute(BOOKING, RECEIPT, practitioner);

    expect(d.em.transactional).toHaveBeenCalledTimes(1);
    // FOR UPDATE: la cita, el comprobante y la fila de pago.
    expect(d.bookingsRepo.findBookingByIdForUpdate).toHaveBeenCalledWith(
      d.tx,
      BOOKING,
    );
    expect(d.receiptsRepo.findOfBookingForUpdate).toHaveBeenCalledWith(
      d.tx,
      BOOKING,
      RECEIPT,
    );
    expect(d.bookingsRepo.findPaymentStateForUpdate).toHaveBeenCalledWith(
      d.tx,
      BOOKING,
    );
    expect(row.reviewStatusConceptId).toBe(SCHED.RECEIPT_CONFIRMED);
    expect(row.reviewedByUserId).toBe(practitioner.id);
    expect(res.receipt.status).toBe('CONFIRMED');
    expect(res.paymentState.state).toBe('PAID');
    expect(res.paymentState.markedByUserId).toBe(practitioner.id);
  });

  it('deja un HISTORY_OP_PAYMENT_MARKED en el historial de la cita', async () => {
    const d = buildReceipts();

    await d.confirm.execute(BOOKING, RECEIPT, practitioner);

    expect(d.history.append).toHaveBeenCalledTimes(1);
    const [, bookingId, entry] = d.history.append.mock.calls[0];
    expect(bookingId).toBe(BOOKING);
    expect(entry.operationConceptId).toBe(SCHED.HISTORY_OP_PAYMENT_MARKED);
    expect(entry.dataSnapshot.toPaymentConceptId).toBe(SCHED.PAYMENT_PAID);
  });

  it('conserva la marca de seguro que ya tenía la fila de pago', async () => {
    const d = buildReceipts();
    const payment = {
      statusConceptId: SCHED.PAYMENT_PARTIALLY_PAID,
      insuranceUsed: true,
      markedByUserId: 'someone',
      markedAt: new Date(),
    };
    d.bookingsRepo.findPaymentStateForUpdate.mockResolvedValue(payment);

    const res = await d.confirm.execute(BOOKING, RECEIPT, practitioner);

    expect(res.paymentState.state).toBe('PAID');
    expect(res.paymentState.insuranceUsed).toBe(true);
  });

  it('confirmar dos veces responde 200 y no escribe nada nuevo', async () => {
    const d = buildReceipts();
    d.receiptsRepo.findOfBookingForUpdate.mockResolvedValue(
      receipt(SCHED.RECEIPT_CONFIRMED, {
        reviewedByUserId: practitioner.id,
        reviewedAt: new Date('2026-10-27T16:00:00Z'),
      }),
    );
    d.bookingsRepo.findPaymentState.mockResolvedValue({
      statusConceptId: SCHED.PAYMENT_PAID,
      insuranceUsed: false,
      markedByUserId: practitioner.id,
      markedAt: new Date('2026-10-27T16:00:00Z'),
    });

    const res = await d.confirm.execute(BOOKING, RECEIPT, practitioner);

    expect(res.receipt.status).toBe('CONFIRMED');
    expect(res.paymentState.state).toBe('PAID');
    expect(d.history.append).not.toHaveBeenCalled();
    expect(d.tx.flush).not.toHaveBeenCalled();
    expect(d.tx.persist).not.toHaveBeenCalled();
    expect(d.notices.emit).not.toHaveBeenCalled();
  });

  it('un comprobante ya rechazado responde 409', async () => {
    const d = buildReceipts();
    d.receiptsRepo.findOfBookingForUpdate.mockResolvedValue(
      receipt(SCHED.RECEIPT_REJECTED),
    );

    await expect(
      d.confirm.execute(BOOKING, RECEIPT, practitioner),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(d.history.append).not.toHaveBeenCalled();
  });

  it('los otros comprobantes pendientes de la cita no se tocan', async () => {
    const d = buildReceipts();

    await d.confirm.execute(BOOKING, RECEIPT, practitioner);

    // Solo se cargó y se marcó el que se confirma: no hay una escritura en
    // lote sobre los demás.
    expect(d.receiptsRepo.findOfBookingForUpdate).toHaveBeenCalledTimes(1);
    expect(d.receiptsRepo.findForBooking).not.toHaveBeenCalled();
  });

  it('una cita cancelada o rechazada responde 422', async () => {
    const d = buildReceipts();
    d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(
      booking(CONCEPTS.BOOKING_CANCELLED),
    );

    await expect(
      d.confirm.execute(BOOKING, RECEIPT, practitioner),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('otro médico recibe 404', async () => {
    const d = buildReceipts();

    await expect(
      d.confirm.execute(BOOKING, RECEIPT, otherPractitioner),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('el paciente no puede confirmar su propio comprobante', async () => {
    // El `@Roles` del endpoint ya lo deja afuera; si igual llegara, la regla
    // del prestador («solo quien atiende en esa agenda») lo rechaza.
    const d = buildReceipts();

    await expect(
      d.confirm.execute(BOOKING, RECEIPT, patient),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('avisa al paciente que se confirmó, después de la transacción', async () => {
    const d = buildReceipts();

    await d.confirm.execute(BOOKING, RECEIPT, practitioner);

    expect(d.notices.emit).toHaveBeenCalledTimes(1);
    const notice = d.notices.emit.mock.calls[0][0];
    expect(notice.kind).toBe('PAYMENT_RECEIPT_REVIEWED');
    expect(notice.payload.change).toBe('PAYMENT_RECEIPT_CONFIRMED');
  });
});
