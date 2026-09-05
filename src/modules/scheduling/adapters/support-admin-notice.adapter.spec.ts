import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { SupportAdminNoticeAdapter } from './support-admin-notice.adapter';
import { SEED } from '../../../common';
import type { AgendaNotice } from '../ports/agenda-notice.port';

const aviso: AgendaNotice = {
  kind: 'BOOKING_STATE_CHANGED',
  recipient: { userId: 'user-medico' },
  tenantId: 'tenant-1',
  subject: 'Tenés una nueva solicitud de consulta',
  bodyText: 'Un paciente pidió turno para el lunes a las 09:00.',
  relatedResourceType: 'scheduling.appointment_bookings',
  relatedResourceId: 'booking-1',
  payload: { route: '/schedule?vista=citas' },
};

function build() {
  const em: any = {};
  em.fork = mockFn(() => em);
  em.findOne = mockFn().mockResolvedValue({ displayName: 'Ana Pérez' });

  const messaging = {
    createConversation: mockFn().mockResolvedValue({ id: 'conv-1' }),
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

    const resultado = await d.adapter.notify(aviso, 'user-medico');

    expect(resultado).toEqual({ chatDelivered: true });

    const [, dataSupportAdmin] = d.profiles.projectOrganization.mock.calls[0];
    expect(dataSupportAdmin.targetId).toBe(SEED.supportAdminUserId);
    expect(dataSupportAdmin.displayName).toBe(SEED.supportAdminDisplayName);

    const [, dataDestinatario] = d.profiles.projectOrganization.mock.calls[1];
    expect(dataDestinatario.targetId).toBe('user-medico');
    expect(dataDestinatario.displayName).toBe('Ana Pérez');

    const [dtoConversacion] = d.messaging.createConversation.mock.calls[0];
    expect(dtoConversacion.conversationType).toBe('DIRECT');
    expect(dtoConversacion.participantProfileIds).toEqual([
      'perfil-support-admin',
      'perfil-medico',
    ]);

    const [conversationId, dtoMensaje] = d.messaging.sendMessage.mock.calls[0];
    expect(conversationId).toBe('conv-1');
    expect(dtoMensaje.senderProfileId).toBe('perfil-support-admin');
    expect(dtoMensaje.bodyText).toBe(aviso.bodyText);
  });

  it('firma la conversación y el mensaje con la cuenta de SupportAdmin, no con el worker genérico', async () => {
    const d = build();

    await d.adapter.notify(aviso, 'user-medico');

    const [, actorConversacion] = d.messaging.createConversation.mock.calls[0];
    const [, , actorMensaje] = d.messaging.sendMessage.mock.calls[0];
    expect(actorConversacion.id).toBe(SEED.supportAdminUserId);
    expect(actorMensaje.id).toBe(SEED.supportAdminUserId);
  });

  it('un destinatario sin cuenta encontrada igual recibe una vitrina mínima, con un nombre genérico', async () => {
    const d = build();
    d.em.findOne.mockResolvedValue(null);

    await d.adapter.notify(aviso, 'user-medico');

    const [, dataDestinatario] = d.profiles.projectOrganization.mock.calls[1];
    expect(dataDestinatario.displayName).toBe('Usuario');
  });

  it('nunca lanza: un chat que no sale no puede tumbar la agenda', async () => {
    const d = build();
    d.messaging.createConversation.mockRejectedValue(new Error('caído'));

    const resultado = await d.adapter.notify(aviso, 'user-medico');

    expect(resultado.chatDelivered).toBe(false);
    expect(resultado.chatSkippedReason).toMatch(/no se pudo entregar/i);
    expect(d.logger.warn).toHaveBeenCalled();
  });
});
