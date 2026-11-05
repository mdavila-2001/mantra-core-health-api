import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  ConflictException,
  ResourceNotFoundException,
} from '../../../../../common';
import { RejectPaymentReceiptDto } from '../../../presentation/dto';
import { SCHED } from '../../../domain/scheduling.concepts';
import {
  BOOKING,
  PATIENT_PROFILE,
  RECEIPT,
  buildReceipts,
  otherPractitioner,
  practitioner,
  receipt,
} from '../payment-receipts.testing';

const REASON = 'No se lee el monto en la foto';

describe('RejectPaymentReceiptUseCase · rechazar un comprobante', () => {
  it('sin motivo, el cuerpo no valida (400)', async () => {
    const errors = await validate(plainToInstance(RejectPaymentReceiptDto, {}));
    expect(errors.map((e) => e.property)).toContain('reason');
  });

  it('con un motivo de 2 caracteres, el cuerpo no valida (400)', async () => {
    const errors = await validate(
      plainToInstance(RejectPaymentReceiptDto, { reason: 'no' }),
    );
    expect(errors.map((e) => e.property)).toContain('reason');
  });

  it('guarda el motivo, quién y cuándo, y no toca el estado de pago', async () => {
    const d = buildReceipts();
    const row = receipt();
    d.receiptsRepo.findOfBookingForUpdate.mockResolvedValue(row);

    const res = await d.reject.execute(
      BOOKING,
      RECEIPT,
      { reason: REASON },
      practitioner,
    );

    expect(res.status).toBe('REJECTED');
    expect(res.rejectionReason).toBe(REASON);
    expect(row.reviewStatusConceptId).toBe(SCHED.RECEIPT_REJECTED);
    expect(row.reviewedByUserId).toBe(practitioner.id);
    expect(row.reviewedAt).toBeInstanceOf(Date);
    expect(d.bookingsRepo.findPaymentStateForUpdate).not.toHaveBeenCalled();
    expect(d.history.append).not.toHaveBeenCalled();
  });

  it('un comprobante ya confirmado responde 409', async () => {
    const d = buildReceipts();
    d.receiptsRepo.findOfBookingForUpdate.mockResolvedValue(
      receipt(SCHED.RECEIPT_CONFIRMED),
    );

    await expect(
      d.reject.execute(BOOKING, RECEIPT, { reason: REASON }, practitioner),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('otro médico recibe 404', async () => {
    const d = buildReceipts();

    await expect(
      d.reject.execute(BOOKING, RECEIPT, { reason: REASON }, otherPractitioner),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('el aviso al paciente lleva el motivo', async () => {
    const d = buildReceipts();

    await d.reject.execute(BOOKING, RECEIPT, { reason: REASON }, practitioner);

    expect(d.notices.emit).toHaveBeenCalledTimes(1);
    const notice = d.notices.emit.mock.calls[0][0];
    expect(notice.kind).toBe('PAYMENT_RECEIPT_REVIEWED');
    expect(notice.recipient).toEqual({ patientProfileId: PATIENT_PROFILE });
    expect(notice.bodyText).toContain(REASON);
    expect(notice.payload.change).toBe('PAYMENT_RECEIPT_REJECTED');
  });
});
