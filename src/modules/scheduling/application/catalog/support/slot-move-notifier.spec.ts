import { jest } from '@jest/globals';
import { SlotMoveNotifier } from './slot-move-notifier';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const snapshot = {
  bookingId: 'b1',
  tenantId: 'tenant-1',
  patientProfileId: 'paciente-1',
  resourceId: 'recurso-1',
  slotId: 's1',
  startAt: new Date('2026-08-20T14:00:00.000Z'),
  resourceLabel: 'Dra. Rivas',
};

function build() {
  const em: any = {};
  em.fork = mockFn(() => em);
  em.transactional = mockFn((cb: any) => cb(em));
  const catalogRepo = {
    findBookingsOfSlots: mockFn().mockResolvedValue([
      { id: 'b1', patientProfileId: 'paciente-1' },
      { id: 'b2', patientProfileId: 'paciente-2' },
    ]),
  };
  const noticeRepo = {
    describeBooking: mockFn().mockResolvedValue(snapshot),
    findAccountForProfile: mockFn().mockResolvedValue('user-paciente'),
  };
  const notices = { emit: mockFn().mockResolvedValue({ delivered: true }) };
  const logger = { setContext: mockFn(), warn: mockFn() };
  const notifier = new SlotMoveNotifier(
    em,
    catalogRepo as any,
    noticeRepo as any,
    notices as any,
    logger as any,
  );
  return { notifier, em, noticeRepo, notices, logger };
}

describe('SlotMoveNotifier · transacción de la petición (RLS)', () => {
  it('lee las citas sobre la transacción de la petición y avisa a cada una en su savepoint', async () => {
    const d = build();

    const notified = await d.notifier.notifyOfMove(['s1', 's2'], 20);

    expect(notified).toBe(2);
    expect(d.em.fork).toHaveBeenCalledWith({ keepTransactionContext: true });
    expect(d.em.fork).not.toHaveBeenCalledWith();
    expect(d.em.transactional).toHaveBeenCalledTimes(2);
  });

  it('un fallo en el aviso de una cita no propaga ni frena a las demás', async () => {
    const d = build();
    d.noticeRepo.describeBooking
      .mockRejectedValueOnce(new Error('current transaction is aborted'))
      .mockResolvedValue(snapshot);

    const notified = await d.notifier.notifyOfMove(['s1'], 20);

    expect(notified).toBe(1);
    expect(d.logger.warn).toHaveBeenCalledTimes(1);
  });
});
