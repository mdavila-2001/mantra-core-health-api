import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CommunityMessagingService } from './community-messaging.service';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'admin-1', roles: [] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const conversationsRepo = {
    findConversationById: mockFn(),
    createConversation: mockFn(),
    createParticipant: mockFn(),
    findActiveParticipant: mockFn(),
    findParticipants: mockFn().mockResolvedValue([]),
    createMessage: mockFn(),
    findLastMessage: mockFn(),
    createReceipt: mockFn(),
    // Carril P2: por defecto no hay conversación directa previa, que es el
    // caso de la primera vez. Las pruebas que prueban la reutilización la
    // devuelven explícitamente.
    findDirectBetween: mockFn().mockResolvedValue(null),
  };
  const blocksRepo = { existsBetween: mockFn().mockResolvedValue(null) };
  // El aviso in-app del carril P1, doblado: enviar un mensaje se prueba acá,
  // avisarlo se prueba en su propio servicio.
  const messageNotifications = {
    mensajeNuevo: mockFn().mockResolvedValue(undefined),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new CommunityMessagingService(
    em as any,
    conversationsRepo as any,
    blocksRepo as any,
    messageNotifications as any,
    logger as any,
  );
  return { service, tx, conversationsRepo, blocksRepo, messageNotifications };
}

describe('CommunityMessagingService', () => {
  it('creates a conversation with its participants', async () => {
    const d = build();
    d.conversationsRepo.createConversation.mockReturnValue({ id: 'conv1' });
    const res = await d.service.createConversation(
      { participantProfileIds: ['p1', 'p2'] },
      actor,
    );
    expect(res).toEqual({ id: 'conv1' });
    expect(d.conversationsRepo.createParticipant).toHaveBeenCalledTimes(2);
  });

  /* --- Carril P2 · la conversación directa deja de duplicarse ------------- */

  it('devuelve la conversación directa que ya existe en vez de crear otra', async () => {
    const d = build();
    d.conversationsRepo.findDirectBetween.mockResolvedValue({
      id: 'conv-vieja',
    });

    const res = await d.service.createConversation(
      { participantProfileIds: ['p1', 'p2'] },
      actor,
    );

    // Sin esto, la tercera vez que alguien pulsa «Escribir al doctor» tiene
    // tres hilos con la misma persona y los mensajes repartidos entre los tres.
    expect(res).toEqual({ id: 'conv-vieja' });
    expect(d.conversationsRepo.createConversation).not.toHaveBeenCalled();
    expect(d.conversationsRepo.createParticipant).not.toHaveBeenCalled();
  });

  it('no reutiliza nada cuando es un grupo: dos foros del mismo equipo son dos foros', async () => {
    const d = build();
    d.conversationsRepo.createConversation.mockReturnValue({
      id: 'conv-nueva',
    });

    await d.service.createConversation(
      { participantProfileIds: ['p1', 'p2'], conversationType: 'GROUP' },
      actor,
    );

    expect(d.conversationsRepo.findDirectBetween).not.toHaveBeenCalled();
    expect(d.conversationsRepo.createConversation).toHaveBeenCalled();
  });

  it('tampoco reutiliza con más de dos participantes', async () => {
    const d = build();
    d.conversationsRepo.createConversation.mockReturnValue({
      id: 'conv-nueva',
    });

    await d.service.createConversation(
      { participantProfileIds: ['p1', 'p2', 'p3'] },
      actor,
    );

    expect(d.conversationsRepo.findDirectBetween).not.toHaveBeenCalled();
  });

  describe('sendMessage (UC-19-06)', () => {
    it('throws when the conversation does not exist', async () => {
      const d = build();
      d.conversationsRepo.findConversationById.mockResolvedValue(null);
      await expect(
        d.service.sendMessage(
          'missing',
          { senderProfileId: 'p1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects a sender that is not an active participant', async () => {
      const d = build();
      d.conversationsRepo.findConversationById.mockResolvedValue({
        id: 'conv1',
        messageCount: 0,
        updatedAt: new Date(),
      });
      d.conversationsRepo.findActiveParticipant.mockResolvedValue(null);
      await expect(
        d.service.sendMessage('conv1', { senderProfileId: 'p1' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects when a block exists between participants', async () => {
      const d = build();
      d.conversationsRepo.findConversationById.mockResolvedValue({
        id: 'conv1',
        messageCount: 0,
        updatedAt: new Date(),
      });
      d.conversationsRepo.findActiveParticipant.mockResolvedValue({
        id: 'part1',
      });
      d.conversationsRepo.findParticipants.mockResolvedValue([
        { participantProfileId: 'p1' },
        { participantProfileId: 'p2' },
      ]);
      d.blocksRepo.existsBetween.mockResolvedValue({ id: 'blk1' });
      await expect(
        d.service.sendMessage(
          'conv1',
          { senderProfileId: 'p1', bodyText: 'hi' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('sends the message and bumps the conversation counters', async () => {
      const d = build();
      const conversation = {
        id: 'conv1',
        messageCount: 4,
        updatedAt: new Date(),
      };
      d.conversationsRepo.findConversationById.mockResolvedValue(conversation);
      d.conversationsRepo.findActiveParticipant.mockResolvedValue({
        id: 'part1',
      });
      d.conversationsRepo.findParticipants.mockResolvedValue([
        { participantProfileId: 'p1' },
        { participantProfileId: 'p2' },
      ]);
      d.conversationsRepo.createMessage.mockReturnValue({ id: 'msg1' });
      const res = await d.service.sendMessage(
        'conv1',
        { senderProfileId: 'p1', bodyText: 'hi' },
        actor,
      );
      expect(res.id).toBe('msg1');
      expect(conversation.messageCount).toBe(5);
      expect(d.conversationsRepo.createReceipt).toHaveBeenCalled();
    });
  });

  describe('markRead (UC-19-07)', () => {
    it('records a read receipt for the last message', async () => {
      const d = build();
      d.conversationsRepo.findConversationById.mockResolvedValue({
        id: 'conv1',
      });
      const participant = {
        id: 'part1',
        lastReadMessageId: undefined as string | undefined,
        updatedAt: new Date(),
      };
      d.conversationsRepo.findActiveParticipant.mockResolvedValue(participant);
      d.conversationsRepo.findLastMessage.mockResolvedValue({ id: 'msg9' });
      const res = await d.service.markRead(
        'conv1',
        { recipientProfileId: 'p1' },
        actor,
      );
      expect(res).toEqual({ receiptsRecorded: 1, lastReadMessageId: 'msg9' });
      expect(participant.lastReadMessageId).toBe('msg9');
    });
  });
});
