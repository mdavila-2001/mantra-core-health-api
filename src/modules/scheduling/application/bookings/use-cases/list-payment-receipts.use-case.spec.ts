import { ResourceNotFoundException } from '../../../../../common';
import { SCHED } from '../../../domain/scheduling.concepts';
import {
  BOOKING,
  RECEIPT,
  buildReceipts,
  notTheirs,
  otherPractitioner,
  patient,
  practitioner,
  receipt,
} from '../payment-receipts.testing';

describe('ListPaymentReceiptsUseCase · quién ve los comprobantes de una cita', () => {
  it('el paciente ve los de su cita', async () => {
    const d = buildReceipts();
    d.receiptsRepo.findForBooking.mockResolvedValue([receipt()]);

    const res = await d.list.execute(BOOKING, patient);

    expect(res.map((r) => r.id)).toEqual([RECEIPT]);
    expect(d.representation.representsPatient).toHaveBeenCalled();
  });

  it('un paciente con una cita ajena recibe 404', async () => {
    const d = buildReceipts();
    notTheirs(d.representation);

    await expect(d.list.execute(BOOKING, patient)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });

  it('el médico de la agenda los ve', async () => {
    const d = buildReceipts();
    d.receiptsRepo.findForBooking.mockResolvedValue([receipt()]);

    const res = await d.list.execute(BOOKING, practitioner);

    expect(res).toHaveLength(1);
    expect(d.catalogRepo.findResourceById).toHaveBeenCalled();
  });

  it('otro médico recibe 404, no 403', async () => {
    const d = buildReceipts();

    await expect(
      d.list.execute(BOOKING, otherPractitioner),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(d.receiptsRepo.findForBooking).not.toHaveBeenCalled();
  });

  it('vienen del más reciente al más viejo, tal como los ordena el repositorio', async () => {
    const d = buildReceipts();
    const newest = receipt(SCHED.RECEIPT_PENDING, {
      id: 'r-new',
      uploadedAt: new Date('2026-10-27T18:00:00Z'),
    });
    const oldest = receipt(SCHED.RECEIPT_REJECTED, {
      id: 'r-old',
      uploadedAt: new Date('2026-10-26T18:00:00Z'),
      reviewedByUserId: practitioner.id,
      reviewedAt: new Date('2026-10-26T19:00:00Z'),
      rejectionReason: 'No se lee el monto',
    });
    d.receiptsRepo.findForBooking.mockResolvedValue([newest, oldest]);

    const res = await d.list.execute(BOOKING, practitioner);

    expect(res.map((r) => r.id)).toEqual(['r-new', 'r-old']);
    expect(res[1]).toMatchObject({
      status: 'REJECTED',
      rejectionReason: 'No se lee el monto',
      reviewedBy: { userId: practitioner.id, displayName: 'Dra. Ana Pérez' },
    });
  });
});
