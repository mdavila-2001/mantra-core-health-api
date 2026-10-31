import { jest } from '@jest/globals';
import { CommunityBookingChatService } from './community-booking-chat.service';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const ANA = { id: 'user-ana', roles: ['SUPPORT_STAFF'] } as any;
const datos = {
  profesional: { userId: 'user-perez', practitionerProfileId: 'prof-perez' },
  pacienteUserId: 'user-paciente',
  texto: 'Su cita con el Dr. Pérez quedó confirmada.',
};

/** Construye el servicio con vitrinas y mensajería en doble. */
function build() {
  const em = { fork: mockFn().mockReturnValue({}) };
  const profilesRepo = {
    findByTarget: mockFn().mockImplementation(
      async (_em: unknown, t: string) =>
        t === 'prof-perez'
          ? { id: 'p-doc' }
          : t === 'user-paciente'
            ? { id: 'p-pac' }
            : null,
    ),
  };
  const messaging = {
    createSystemDirectConversation: mockFn().mockResolvedValue({ id: 'conv1' }),
    sendAgendaMessage: mockFn().mockResolvedValue({ id: 'msg1' }),
  };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };
  const service = new CommunityBookingChatService(
    em as any,
    profilesRepo as any,
    messaging as any,
    logger as any,
  );
  return { service, profilesRepo, messaging, logger };
}

describe('CommunityBookingChatService.enviarConfirmacion', () => {
  it('escribe con el perfil del profesional de la cita aunque quien actúa sea personal de apoyo', async () => {
    const d = build();
    await expect(d.service.enviarConfirmacion(datos, ANA)).resolves.toBe(true);
    expect(d.messaging.createSystemDirectConversation).toHaveBeenCalledWith(
      {
        conversationType: 'DIRECT',
        participantProfileIds: ['p-doc', 'p-pac'],
      },
      expect.objectContaining({ roles: ['SUPPORT_STAFF', 'SYSTEM'] }),
    );
    expect(d.messaging.sendAgendaMessage).toHaveBeenCalledWith(
      'conv1',
      { senderProfileId: 'p-doc', bodyText: datos.texto },
      ANA,
    );
  });

  it('sin vitrina pública de alguna de las partes no escribe y lo registra', async () => {
    const d = build();
    d.profilesRepo.findByTarget.mockResolvedValue(null);
    await expect(d.service.enviarConfirmacion(datos, ANA)).resolves.toBe(false);
    expect(d.messaging.sendAgendaMessage).not.toHaveBeenCalled();
    expect(d.logger.info).toHaveBeenCalled();
  });

  it('un fallo al escribir se propaga con su causa: el error no se traga', async () => {
    const d = build();
    const boom = new Error('el hilo rechazó el mensaje');
    d.messaging.sendAgendaMessage.mockRejectedValue(boom);
    await expect(d.service.enviarConfirmacion(datos, ANA)).rejects.toBe(boom);
  });
});
