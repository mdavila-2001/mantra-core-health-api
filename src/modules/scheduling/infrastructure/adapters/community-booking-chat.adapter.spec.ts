import { jest } from '@jest/globals';
import { CommunityBookingChatAdapter } from './community-booking-chat.adapter';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const actor = { id: 'user-medico', roles: ['PRACTITIONER'] } as any;

function build() {
  const em: any = {};
  em.fork = mockFn(() => em);
  em.transactional = mockFn((cb: any) => cb(em));
  const noticeRepo = {
    describeBooking: mockFn().mockResolvedValue({
      bookingId: 'booking-1',
      patientProfileId: 'paciente-1',
      resourceId: 'recurso-1',
      resourceLabel: 'Dra. Rivas',
      startAt: new Date('2026-08-20T14:00:00.000Z'),
    }),
    findAccountForProfile: mockFn().mockResolvedValue('user-paciente'),
    findResourceAccount: mockFn().mockResolvedValue('user-medico'),
  };
  const chat = { enviarConfirmacion: mockFn().mockResolvedValue(true) };
  const logger = { setContext: mockFn(), warn: mockFn() };
  const adapter = new CommunityBookingChatAdapter(
    em,
    noticeRepo as any,
    chat as any,
    logger as any,
  );
  return { adapter, em, noticeRepo, chat, logger };
}

describe('CommunityBookingChatAdapter · transacción de la petición (RLS)', () => {
  it('resuelve las cuentas en un savepoint de la petición y deja el mensaje en el chat', async () => {
    const d = build();

    const sent = await d.adapter.announceAcceptance('booking-1', actor);

    expect(sent).toBe(true);
    expect(d.em.fork).toHaveBeenCalledWith({ keepTransactionContext: true });
    expect(d.em.transactional).toHaveBeenCalledTimes(1);
    expect(d.chat.enviarConfirmacion).toHaveBeenCalledTimes(1);
  });

  it('un fallo dentro del aviso no propaga: devuelve false y se registra', async () => {
    const d = build();
    d.noticeRepo.describeBooking.mockRejectedValue(
      new Error('current transaction is aborted'),
    );

    await expect(
      d.adapter.announceAcceptance('booking-1', actor),
    ).resolves.toBe(false);
    expect(d.logger.warn).toHaveBeenCalled();
  });

  it('si el savepoint mismo falla (rollback), tampoco propaga', async () => {
    const d = build();
    d.em.transactional.mockRejectedValue(new Error('rollback to savepoint'));

    await expect(
      d.adapter.announceAcceptance('booking-1', actor),
    ).resolves.toBe(false);
  });
});
