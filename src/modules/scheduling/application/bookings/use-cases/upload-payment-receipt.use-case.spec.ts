import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../../../common';
import { SCHED } from '../../../domain/scheduling.concepts';
import {
  BOOKING,
  FILE,
  TENANT,
  booking,
  buildReceipts,
  notTheirs,
  patient,
  practitioner,
} from '../payment-receipts.testing';

describe('UploadPaymentReceiptUseCase · el paciente sube su comprobante', () => {
  it('lo guarda pendiente, firmado por quien lo subió, y responde el comprobante', async () => {
    const d = buildReceipts();

    const res = await d.upload.execute(
      BOOKING,
      { fileId: FILE, amount: '150.00', note: 'Transferencia BNB' },
      patient,
    );

    expect(res.status).toBe('PENDING');
    expect(res.bookingId).toBe(BOOKING);
    expect(res.fileId).toBe(FILE);
    expect(res.amount).toBe('150.00');
    expect(res.mimeType).toBe('image/png');
    expect(res.uploadedBy).toEqual({
      userId: patient.id,
      displayName: 'Juan Paciente',
    });
    expect(res.reviewedBy).toBeNull();
    const [, saved] = d.tx.create.mock.calls[0];
    expect(saved).toMatchObject({
      tenantId: TENANT,
      appointmentBookingId: BOOKING,
      reviewStatusConceptId: SCHED.RECEIPT_PENDING,
      uploadedByUserId: patient.id,
    });
    expect(d.tx.persist).toHaveBeenCalledWith(saved);
    expect(d.files.assertAttachable).toHaveBeenCalledWith(d.tx, FILE, patient);
  });

  it('una cita ajena responde 404 y no guarda nada', async () => {
    const d = buildReceipts();
    notTheirs(d.representation);

    await expect(
      d.upload.execute(BOOKING, { fileId: FILE }, patient),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(d.tx.persist).not.toHaveBeenCalled();
  });

  it('un médico que además tiene el rol PATIENT no sube a la cita de otro paciente', async () => {
    // Para quien no tiene forma de paciente, `BookingAccess` no le pregunta a
    // la representación. Acá sí se pregunta siempre: si no, este actor
    // subiría comprobantes a cualquier cita.
    const d = buildReceipts();
    const dual = {
      ...practitioner,
      roles: ['PATIENT', 'PRACTITIONER'],
    };

    await expect(
      d.upload.execute(BOOKING, { fileId: FILE }, dual),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(d.representation.representsPatient).toHaveBeenCalled();
    expect(d.tx.persist).not.toHaveBeenCalled();
  });

  it('una cita que no existe responde 404', async () => {
    const d = buildReceipts();
    d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(null);

    await expect(
      d.upload.execute(BOOKING, { fileId: FILE }, patient),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('un archivo que no sirve (un .exe, uno de 6 MB) responde 422', async () => {
    const d = buildReceipts();
    d.files.assertAttachable.mockRejectedValue(
      new PreconditionFailedException('El comprobante supera los 5 MB'),
    );

    await expect(
      d.upload.execute(BOOKING, { fileId: FILE }, patient),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(d.tx.persist).not.toHaveBeenCalled();
  });

  it('una cita cancelada o rechazada responde 422', async () => {
    const d = buildReceipts();
    d.bookingsRepo.findBookingByIdForUpdate.mockResolvedValue(
      booking(CONCEPTS.BOOKING_CANCELLED),
    );

    await expect(
      d.upload.execute(BOOKING, { fileId: FILE }, patient),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(d.files.assertAttachable).not.toHaveBeenCalled();
  });

  it('una cita ya pagada responde 409', async () => {
    const d = buildReceipts();
    d.bookingsRepo.findPaymentStateForUpdate.mockResolvedValue({
      statusConceptId: SCHED.PAYMENT_PAID,
    });

    await expect(
      d.upload.execute(BOOKING, { fileId: FILE }, patient),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(d.tx.persist).not.toHaveBeenCalled();
  });

  it('avisa al médico una sola vez, después de la transacción', async () => {
    const d = buildReceipts();
    const order: string[] = [];
    d.em.transactional.mockImplementation(async (cb: any) => {
      const out = await cb(d.tx);
      order.push('commit');
      return out;
    });
    d.notices.emit.mockImplementation(async () => {
      order.push('emit');
      return { delivered: true };
    });

    const res = await d.upload.execute(BOOKING, { fileId: FILE }, patient);

    expect(d.notices.emit).toHaveBeenCalledTimes(1);
    expect(order).toEqual(['commit', 'emit']);
    const notice = d.notices.emit.mock.calls[0][0];
    expect(notice.kind).toBe('PAYMENT_RECEIPT_UPLOADED');
    expect(notice.recipient).toEqual({ userId: practitioner.id });
    expect(notice.payload.receiptId).toBe(res.id);
  });

  it('si el aviso falla, la subida igual responde', async () => {
    const d = buildReceipts();
    d.noticeRepo.describeBooking.mockRejectedValue(new Error('canal caído'));

    const res = await d.upload.execute(BOOKING, { fileId: FILE }, patient);

    expect(res.status).toBe('PENDING');
    expect(d.logger.warn).toHaveBeenCalled();
  });
});
