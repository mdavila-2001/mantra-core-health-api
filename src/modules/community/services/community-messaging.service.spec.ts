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
    findMessageInConversation: mockFn().mockResolvedValue(null),
  };
  const blocksRepo = { existsBetween: mockFn().mockResolvedValue(null) };
  // El aviso in-app del carril P1, doblado: enviar un mensaje se prueba acá,
  // avisarlo se prueba en su propio servicio.
  const messageNotifications = {
    mensajeNuevo: mockFn().mockResolvedValue(undefined),
  };
  // El gateway WS, doblado: se prueba que se llame, no lo que hace socket.io.
  const gateway = {
    emitMessage: mockFn(),
    emitRead: mockFn(),
    emitNewConversation: mockFn(),
    emitMessageUpdated: mockFn(),
    emitMessageDeleted: mockFn(),
    emitPinned: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  // F4: que el perfil con el que se escribe sea del actor. Por defecto lo es.
  const visibility = {
    assertActsAsProfile: mockFn().mockResolvedValue(undefined),
  };
  // F4.7 · la respuesta automática, doblada: enviar se prueba acá, contestar
  // solo se prueba en su propio servicio. Por defecto no contesta nadie, que
  // es el caso de todo perfil que no la configuró.
  const autoReply = {
    textoParaResponder: mockFn().mockResolvedValue(null),
  };
  const service = new CommunityMessagingService(
    em as any,
    conversationsRepo as any,
    blocksRepo as any,
    messageNotifications as any,
    gateway as any,
    autoReply as any,
    visibility as any,
    logger as any,
  );
  return {
    autoReply,
    service,
    tx,
    conversationsRepo,
    blocksRepo,
    messageNotifications,
    gateway,
    visibility,
  };
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
    expect(d.gateway.emitNewConversation).toHaveBeenCalledWith('conv1', [
      'p1',
      'p2',
    ]);
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
    // Reutilizada no es una novedad para nadie: nada que avisar por WS.
    expect(d.gateway.emitNewConversation).not.toHaveBeenCalled();
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
      // El empuje WS es aditivo a la notificación in-app, no un sustituto.
      expect(d.gateway.emitMessage).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'msg1', conversationId: 'conv1' }),
        ['p2'],
      );
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
      expect(d.gateway.emitRead).toHaveBeenCalledWith({
        conversationId: 'conv1',
        profileId: 'p1',
        lastReadMessageId: 'msg9',
      });
    });
  });

  /* --- F4.4 · favorita, fijada, archivada ---------------------------------- */

  describe('updateParticipant (F4.4)', () => {
    const participante = () => ({
      id: 'part-1',
      isFavorite: false,
      isPinned: false,
      archivedAt: undefined as Date | undefined,
      updatedAt: new Date(),
    });

    it('cambia sólo lo que viene y devuelve cómo quedó', async () => {
      const d = build();
      const p = participante();
      d.conversationsRepo.findActiveParticipant.mockResolvedValue(p);

      const res = await d.service.updateParticipant(
        'conv1',
        { profileId: 'p1', isPinned: true },
        actor,
      );

      expect(res).toEqual({
        conversationId: 'conv1',
        isFavorite: false,
        isPinned: true,
        archivedAt: null,
      });
      expect(d.visibility.assertActsAsProfile).toHaveBeenCalledWith(
        expect.anything(),
        'p1',
        actor,
      );
      expect(d.tx.flush).toHaveBeenCalled();
    });

    it('archivar quita el favorito; desarchivar limpia la fecha', async () => {
      const d = build();
      const p = { ...participante(), isFavorite: true };
      d.conversationsRepo.findActiveParticipant.mockResolvedValue(p);

      const archivada = await d.service.updateParticipant(
        'conv1',
        { profileId: 'p1', archived: true },
        actor,
      );
      expect(archivada.isFavorite).toBe(false);
      expect(archivada.archivedAt).toBeInstanceOf(Date);

      const devuelta = await d.service.updateParticipant(
        'conv1',
        { profileId: 'p1', archived: false },
        actor,
      );
      expect(devuelta.archivedAt).toBeNull();
    });

    it('404 si no es participante activo', async () => {
      const d = build();
      d.conversationsRepo.findActiveParticipant.mockResolvedValue(null);
      await expect(
        d.service.updateParticipant('conv1', { profileId: 'p1' }, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  /* --- F4.5 · editar y borrar ---------------------------------------------- */

  describe('editMessage / deleteMessage (F4.5)', () => {
    /**
     * Un mensaje recién enviado.
     *
     * `sentAt` va en el molde y no en cada prueba porque **todo mensaje que
     * aceptó el servidor lo tiene**: es lo que le pone `sendMessage` al
     * confirmarlo, y es contra eso que se mide la ventana de edición.
     */
    const mensaje = (extra: Record<string, unknown> = {}): any => ({
      id: 'm1',
      conversationId: 'conv1',
      senderProfileId: 'p1',
      contentTypeConceptId: 'ct',
      bodyText: 'hola',
      isEdited: false,
      sentAt: new Date(),
      updatedAt: new Date(),
      ...extra,
    });

    /** Hace `minutos` que se mandó. */
    const haceMinutos = (minutos: number): Date =>
      new Date(Date.now() - minutos * 60_000);

    it('edita un mensaje propio, lo marca editado y lo empuja actualizado', async () => {
      const d = build();
      d.conversationsRepo.findActiveParticipant.mockResolvedValue({
        id: 'part',
      });
      d.conversationsRepo.findMessageInConversation.mockResolvedValue(
        mensaje(),
      );
      d.conversationsRepo.findParticipants.mockResolvedValue([
        { participantProfileId: 'p1' },
        { participantProfileId: 'p2' },
      ]);

      const res = await d.service.editMessage(
        'conv1',
        'm1',
        { senderProfileId: 'p1', bodyText: 'hola (corregido)' },
        actor,
      );

      expect(res).toMatchObject({
        id: 'm1',
        bodyText: 'hola (corregido)',
        isEdited: true,
      });
      expect(d.gateway.emitMessageUpdated).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'm1', isEdited: true }),
        ['p2'],
      );
    });

    it('no deja editar pasados los cinco minutos', async () => {
      // La barrera es el servidor, no la pantalla: el cliente deja de ofrecer
      // «Editar» al vencer la ventana, pero un `PATCH` a mano llega igual.
      const d = build();
      d.conversationsRepo.findActiveParticipant.mockResolvedValue({
        id: 'part',
      });
      d.conversationsRepo.findMessageInConversation.mockResolvedValue(
        mensaje({ sentAt: haceMinutos(6) }),
      );

      await expect(
        d.service.editMessage(
          'conv1',
          'm1',
          { senderProfileId: 'p1', bodyText: 'tarde' },
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      // Y no se empuja nada: no hubo edición que contar.
      expect(d.gateway.emitMessageUpdated).not.toHaveBeenCalled();
    });

    it('deja editar dentro de la ventana', async () => {
      const d = build();
      d.conversationsRepo.findActiveParticipant.mockResolvedValue({
        id: 'part',
      });
      d.conversationsRepo.findMessageInConversation.mockResolvedValue(
        mensaje({ sentAt: haceMinutos(4) }),
      );
      d.conversationsRepo.findParticipants.mockResolvedValue([
        { participantProfileId: 'p1' },
        { participantProfileId: 'p2' },
      ]);

      await expect(
        d.service.editMessage(
          'conv1',
          'm1',
          { senderProfileId: 'p1', bodyText: 'a tiempo' },
          actor,
        ),
      ).resolves.toMatchObject({ bodyText: 'a tiempo', isEdited: true });
    });

    it('un mensaje sin marca de envío no se edita', async () => {
      // Sin `sent_at` no hay plazo que medir, y darlo por bueno dejaría la
      // ventana abierta para siempre justo en el caso raro.
      const d = build();
      d.conversationsRepo.findActiveParticipant.mockResolvedValue({
        id: 'part',
      });
      d.conversationsRepo.findMessageInConversation.mockResolvedValue(
        mensaje({ sentAt: null }),
      );

      await expect(
        d.service.editMessage(
          'conv1',
          'm1',
          { senderProfileId: 'p1', bodyText: 'x' },
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('la ventana no estorba al borrado: un mensaje viejo se elimina igual', async () => {
      // Editar y eliminar son cosas distintas. Reescribir lo que el otro leyó
      // tiene plazo; retirarlo, no — y la bitácora del mensaje sobrevive porque
      // el borrado es lógico.
      const d = build();
      const m = mensaje({ sentAt: haceMinutos(600) });
      d.conversationsRepo.findActiveParticipant.mockResolvedValue({
        id: 'part',
      });
      d.conversationsRepo.findMessageInConversation.mockResolvedValue(m);
      d.conversationsRepo.findConversationById.mockResolvedValue({
        id: 'conv1',
        pinnedMessageId: null,
        updatedAt: new Date(),
      });
      d.conversationsRepo.findParticipants.mockResolvedValue([
        { participantProfileId: 'p1' },
        { participantProfileId: 'p2' },
      ]);

      await expect(
        d.service.deleteMessage('conv1', 'm1', 'p1', actor),
      ).resolves.toBeDefined();
    });

    it('sólo el autor edita o elimina', async () => {
      const d = build();
      d.conversationsRepo.findActiveParticipant.mockResolvedValue({
        id: 'part',
      });
      d.conversationsRepo.findMessageInConversation.mockResolvedValue(
        mensaje({ senderProfileId: 'p-otro' }),
      );

      await expect(
        d.service.editMessage(
          'conv1',
          'm1',
          { senderProfileId: 'p1', bodyText: 'x' },
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      await expect(
        d.service.deleteMessage('conv1', 'm1', 'p1', actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('un mensaje de otro hilo no existe, aunque el id sea real', async () => {
      const d = build();
      d.conversationsRepo.findActiveParticipant.mockResolvedValue({
        id: 'part',
      });
      d.conversationsRepo.findMessageInConversation.mockResolvedValue(null);

      await expect(
        d.service.editMessage(
          'conv1',
          'm-ajeno',
          { senderProfileId: 'p1', bodyText: 'x' },
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('elimina de forma lógica, suelta el fijado si era ése y avisa las dos cosas', async () => {
      const d = build();
      const m = mensaje();
      const conversation = {
        id: 'conv1',
        pinnedMessageId: 'm1',
        updatedAt: new Date(),
      };
      d.conversationsRepo.findActiveParticipant.mockResolvedValue({
        id: 'part',
      });
      d.conversationsRepo.findMessageInConversation.mockResolvedValue(m);
      d.conversationsRepo.findConversationById.mockResolvedValue(conversation);
      d.conversationsRepo.findParticipants.mockResolvedValue([
        { participantProfileId: 'p1' },
        { participantProfileId: 'p2' },
      ]);

      const res = await d.service.deleteMessage('conv1', 'm1', 'p1', actor);

      expect(m.deletedAt).toBeInstanceOf(Date);
      // El texto se conserva en la fila: quien lo enmascara es la lectura.
      expect(m.bodyText).toBe('hola');
      expect(conversation.pinnedMessageId).toBeUndefined();
      expect(res).toEqual({
        conversationId: 'conv1',
        messageId: 'm1',
        deletedAt: m.deletedAt,
      });
      expect(d.gateway.emitMessageDeleted).toHaveBeenCalledWith(
        { conversationId: 'conv1', messageId: 'm1', deletedAt: m.deletedAt },
        ['p2'],
      );
      expect(d.gateway.emitPinned).toHaveBeenCalledWith(
        { conversationId: 'conv1', pinnedMessageId: null },
        ['p2'],
      );
    });

    it('no se edita lo ya eliminado', async () => {
      const d = build();
      d.conversationsRepo.findActiveParticipant.mockResolvedValue({
        id: 'part',
      });
      d.conversationsRepo.findMessageInConversation.mockResolvedValue(
        mensaje({ deletedAt: new Date() }),
      );
      await expect(
        d.service.editMessage(
          'conv1',
          'm1',
          { senderProfileId: 'p1', bodyText: 'x' },
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  /* --- F4.6 · fijar ---------------------------------------------------------- */

  describe('pinMessage / unpinMessage (F4.6)', () => {
    it('fija un mensaje del hilo, aunque no sea propio, y avisa', async () => {
      const d = build();
      const conversation = { id: 'conv1', updatedAt: new Date() } as any;
      d.conversationsRepo.findActiveParticipant.mockResolvedValue({
        id: 'part',
      });
      d.conversationsRepo.findConversationById.mockResolvedValue(conversation);
      d.conversationsRepo.findMessageInConversation.mockResolvedValue({
        id: 'm7',
        senderProfileId: 'p-otro',
      });
      d.conversationsRepo.findParticipants.mockResolvedValue([
        { participantProfileId: 'p1' },
        { participantProfileId: 'p2' },
      ]);

      const res = await d.service.pinMessage(
        'conv1',
        { profileId: 'p1', messageId: 'm7' },
        actor,
      );

      expect(conversation.pinnedMessageId).toBe('m7');
      expect(res).toEqual({ conversationId: 'conv1', pinnedMessageId: 'm7' });
      expect(d.gateway.emitPinned).toHaveBeenCalledWith(
        { conversationId: 'conv1', pinnedMessageId: 'm7' },
        ['p2'],
      );
    });

    it('no fija un mensaje eliminado ni uno de otro hilo', async () => {
      const d = build();
      d.conversationsRepo.findActiveParticipant.mockResolvedValue({
        id: 'part',
      });
      d.conversationsRepo.findConversationById.mockResolvedValue({
        id: 'conv1',
      });
      d.conversationsRepo.findMessageInConversation.mockResolvedValue({
        id: 'm7',
        deletedAt: new Date(),
      });
      await expect(
        d.service.pinMessage(
          'conv1',
          { profileId: 'p1', messageId: 'm7' },
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('soltar deja pinnedMessageId en null', async () => {
      const d = build();
      const conversation = {
        id: 'conv1',
        pinnedMessageId: 'm7',
        updatedAt: new Date(),
      };
      d.conversationsRepo.findActiveParticipant.mockResolvedValue({
        id: 'part',
      });
      d.conversationsRepo.findConversationById.mockResolvedValue(conversation);

      const res = await d.service.unpinMessage('conv1', 'p1', actor);

      expect(conversation.pinnedMessageId).toBeUndefined();
      expect(res).toEqual({ conversationId: 'conv1', pinnedMessageId: null });
    });
  });
});
