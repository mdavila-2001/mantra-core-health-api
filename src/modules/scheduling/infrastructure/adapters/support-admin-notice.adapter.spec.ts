import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { SupportAdminNoticeAdapter } from './support-admin-notice.adapter';
import { SEED } from '../../../../common';
import type { AgendaNotice } from '../../application/ports/agenda-notice.port';

const notice: AgendaNotice = {
  kind: 'BOOKING_STATE_CHANGED',
  recipient: { userId: 'user-medico' },
  tenantId: 'tenant-1',
  subject: 'Tiene una nueva solicitud de consulta',
  bodyText: 'Un paciente pidió cita para el lunes a las 09:00.',
  relatedResourceType: 'scheduling.appointment_bookings',
  relatedResourceId: 'booking-1',
  payload: { route: '/schedule?vista=citas', bookingId: 'booking-1' },
};

function build() {
  const em: any = {};
  em.fork = mockFn(() => em);
  // The adapter writes inside a savepoint of the request transaction.
  em.transactional = mockFn((cb: any) => cb(em));
  em.findOne = mockFn().mockResolvedValue({ displayName: 'Ana Pérez' });

  const messaging = {
    createSystemDirectConversation: mockFn().mockResolvedValue({
      id: 'conv-1',
    }),
    sendMessage: mockFn().mockResolvedValue({ id: 'msg-1' }),
  };
  const profiles = {
    projectOrganization: mockFn().mockResolvedValue('perfil-support-admin'),
  };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };

  const adapter = new SupportAdminNoticeAdapter(
    em as any,
    messaging as any,
    profiles as any,
    logger as any,
  );
  return { adapter, em, messaging, profiles, logger };
}

describe('SupportAdminNoticeAdapter (TAREA-15, P-15-1)', () => {
  it('crea (o reusa) la vitrina de SupportAdmin y la del destinatario, y abre la conversación entre las dos', async () => {
    const d = build();
    d.profiles.projectOrganization
      .mockResolvedValueOnce('perfil-support-admin')
      .mockResolvedValueOnce('perfil-medico');

    const result = await d.adapter.notify(notice, 'user-medico');

    expect(result).toEqual({ chatDelivered: true });

    const [, dataSupportAdmin] = d.profiles.projectOrganization.mock.calls[0];
    expect(dataSupportAdmin.targetId).toBe(SEED.supportAdminUserId);
    expect(dataSupportAdmin.displayName).toBe(SEED.supportAdminDisplayName);

    const [, recipientData] = d.profiles.projectOrganization.mock.calls[1];
    expect(recipientData.targetId).toBe('user-medico');
    expect(recipientData.displayName).toBe('Ana Pérez');

    const [conversationDto] =
      d.messaging.createSystemDirectConversation.mock.calls[0];
    expect(conversationDto.participantProfileIds).toEqual([
      'perfil-support-admin',
      'perfil-medico',
    ]);

    const [conversationId, messageDto] = d.messaging.sendMessage.mock.calls[0];
    expect(conversationId).toBe('conv-1');
    expect(messageDto.senderProfileId).toBe('perfil-support-admin');
    // La versión de chat: el cuerpo del aviso, con encabezado y enlace a la cita.
    expect(messageDto.bodyText).toContain(notice.bodyText);
    expect(messageDto.bodyText).toMatch(
      /\/schedule\?vista=citas&turno=booking-1$/,
    );
  });

  it('firma la conversación y el mensaje con la cuenta de SupportAdmin, no con el worker genérico', async () => {
    const d = build();

    await d.adapter.notify(notice, 'user-medico');

    const [, conversationActor] =
      d.messaging.createSystemDirectConversation.mock.calls[0];
    const [, , messageActor] = d.messaging.sendMessage.mock.calls[0];
    expect(conversationActor.id).toBe(SEED.supportAdminUserId);
    expect(messageActor.id).toBe(SEED.supportAdminUserId);
  });

  it('un destinatario sin cuenta encontrada igual recibe una vitrina mínima, con un nombre genérico', async () => {
    const d = build();
    d.em.findOne.mockResolvedValue(null);

    await d.adapter.notify(notice, 'user-medico');

    const [, recipientData] = d.profiles.projectOrganization.mock.calls[1];
    expect(recipientData.displayName).toBe('Usuario');
  });

  it('nunca lanza: un chat que no sale no puede tumbar la agenda', async () => {
    const d = build();
    d.messaging.createSystemDirectConversation.mockRejectedValue(
      new Error('caído'),
    );

    const result = await d.adapter.notify(notice, 'user-medico');

    expect(result.chatDelivered).toBe(false);
    expect(result.chatSkippedReason).toMatch(/no se pudo entregar/i);
    expect(d.logger.warn).toHaveBeenCalled();
    // The swallowing `catch` sits outside the savepoint, so the rollback of a
    // failed notice leaves the request transaction usable.
    expect(d.em.fork).toHaveBeenCalledWith({ keepTransactionContext: true });
    expect(d.em.transactional).toHaveBeenCalledTimes(1);
  });

  it('un fallo SQL dentro del savepoint tampoco sube: lo traga el catch de afuera', async () => {
    const d = build();
    d.em.transactional.mockRejectedValue(
      new Error('current transaction is aborted'),
    );

    const result = await d.adapter.notify(notice, 'user-medico');

    expect(result.chatDelivered).toBe(false);
    expect(d.logger.warn).toHaveBeenCalled();
  });
});
