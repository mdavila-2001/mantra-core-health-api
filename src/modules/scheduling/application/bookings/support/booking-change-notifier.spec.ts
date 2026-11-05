import { jest } from '@jest/globals';
import { BookingChangeNotifier } from './booking-change-notifier';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const booking = {
  bookingId: 'booking-1',
  tenantId: 'tenant-1',
  patientProfileId: 'paciente-1',
  resourceId: 'recurso-1',
  slotId: 'slot-1',
  startAt: new Date('2026-08-20T14:00:00.000Z'),
  resourceLabel: 'Dra. Rivas',
};

function build() {
  const em: any = {};
  em.fork = mockFn(() => em);
  // Savepoint of the request transaction: the callback receives the same double.
  em.transactional = mockFn((cb: any) => cb(em));
  const noticeRepo = {
    describeBooking: mockFn().mockResolvedValue(booking),
    findResourceAccount: mockFn().mockResolvedValue('user-medico'),
    findDisplayNameForProfile: mockFn().mockResolvedValue('Ana Pérez'),
  };
  const notices = {
    emit: mockFn().mockResolvedValue({ delivered: true }),
    emitMany: mockFn().mockResolvedValue([]),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const notifier = new BookingChangeNotifier(
    em,
    noticeRepo as any,
    notices as any,
    { announceAcceptance: mockFn() } as any,
    logger as any,
  );
  return { notifier, em, noticeRepo, notices, logger };
}

describe('BookingChangeNotifier · transacción de la petición (RLS)', () => {
  it('notifyRequest lee sobre la transacción de la petición', async () => {
    const d = build();

    await d.notifier.notifyRequest('booking-1');

    expect(d.em.fork).toHaveBeenCalledWith({ keepTransactionContext: true });
    expect(d.em.fork).not.toHaveBeenCalledWith();
  });

  it('notifyChange lee sobre la transacción de la petición', async () => {
    const d = build();

    await d.notifier.notifyChange(
      'booking-1',
      'ACCEPTED' as any,
      undefined,
      'PROVIDER' as any,
    );

    expect(d.em.fork).toHaveBeenCalledWith({ keepTransactionContext: true });
    expect(d.em.fork).not.toHaveBeenCalledWith();
  });

  it('el aviso de comprobante subido corre en un savepoint y emite el aviso', async () => {
    const d = build();

    await d.notifier.notifyReceiptUploaded('booking-1', 'receipt-1');

    expect(d.em.fork).toHaveBeenCalledWith({ keepTransactionContext: true });
    expect(d.em.transactional).toHaveBeenCalledTimes(1);
    expect(d.notices.emit).toHaveBeenCalledTimes(1);
  });

  it('el aviso de comprobante revisado corre en un savepoint y emite el aviso', async () => {
    const d = build();

    await d.notifier.notifyReceiptReviewed('booking-1', 'receipt-1', true);

    expect(d.em.fork).toHaveBeenCalledWith({ keepTransactionContext: true });
    expect(d.em.transactional).toHaveBeenCalledTimes(1);
    expect(d.notices.emit).toHaveBeenCalledTimes(1);
  });

  it('un fallo dentro del aviso de comprobante no propaga: se registra', async () => {
    const d = build();
    d.noticeRepo.describeBooking.mockRejectedValue(
      new Error('current transaction is aborted'),
    );

    await expect(
      d.notifier.notifyReceiptUploaded('booking-1', 'receipt-1'),
    ).resolves.toBeUndefined();
    await expect(
      d.notifier.notifyReceiptReviewed('booking-1', 'receipt-1', false, 'x'),
    ).resolves.toBeUndefined();

    expect(d.logger.warn).toHaveBeenCalledTimes(2);
    expect(d.notices.emit).not.toHaveBeenCalled();
  });

  it('si el savepoint mismo falla (rollback), el error tampoco sube', async () => {
    const d = build();
    d.em.transactional.mockRejectedValue(new Error('rollback to savepoint'));

    await expect(
      d.notifier.notifyReceiptReviewed('booking-1', 'receipt-1', true),
    ).resolves.toBeUndefined();
    expect(d.logger.warn).toHaveBeenCalledTimes(1);
  });
});
