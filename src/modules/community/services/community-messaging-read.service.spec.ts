import { jest } from '@jest/globals';

// Loose-typed mock factory: runtime 'jest' pero sin los tipos estrictos Mock<never>.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CommunityMessagingReadService } from './community-messaging-read.service';
import { ResourceNotFoundException } from '../../../common';
import { COMM } from '../community.concepts';

const actor = { id: 'user-1', roles: ['USER'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const em = { fork: mockFn(() => ({})) };
  const conversationsRepo = {
    listActiveParticipationsOf: mockFn().mockResolvedValue([]),
    listConversationsByIds: mockFn().mockResolvedValue([]),
    findLastMessage: mockFn().mockResolvedValue(null),
    countUnread: mockFn().mockResolvedValue(0),
    findActiveParticipant: mockFn().mockResolvedValue({ id: 'part-1' }),
    findParticipants: mockFn().mockResolvedValue([]),
    listMessagesPage: mockFn().mockResolvedValue([]),
    // Por defecto no hay conversación (o no es DIRECT): el doble check queda
    // en `null`, que es lo que ven las pruebas que no lo ejercitan.
    findConversationById: mockFn().mockResolvedValue(null),
    findMessageById: mockFn().mockResolvedValue(null),
  };
  // Carril P2: la bandeja nombra al otro lado. Por defecto no hay perfiles
  // que resolver, que es lo que ven las pruebas que no miran los nombres.
  const profilesRepo = { listByIds: mockFn().mockResolvedValue([]) };
  const visibility = {
    assertOwnProfile: mockFn().mockResolvedValue(undefined),
    isBlockedBetween: mockFn().mockResolvedValue(false),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new CommunityMessagingReadService(
    em as any,
    conversationsRepo as any,
    profilesRepo as any,
    visibility as any,
    logger as any,
  );
  return { service, conversationsRepo, profilesRepo, visibility };
}

describe('CommunityMessagingReadService', () => {
  describe('listConversations', () => {
    it('arma la bandeja con vista previa y no leídos', async () => {
      const d = build();
      d.conversationsRepo.listActiveParticipationsOf.mockResolvedValue([
        { conversationId: 'c-1', lastReadMessageId: 'm-0' },
      ]);
      d.conversationsRepo.listConversationsByIds.mockResolvedValue([
        { id: 'c-1', conversationTypeConceptId: 'ct' },
      ]);
      d.conversationsRepo.findLastMessage.mockResolvedValue({
        id: 'm-9',
        senderProfileId: 'p-2',
        bodyText: 'hola',
      });
      d.conversationsRepo.countUnread.mockResolvedValue(3);

      const res = await d.service.listConversations('p-1', actor, 20);

      expect(res.items[0].lastMessage?.bodyText).toBe('hola');
      expect(res.items[0].unreadCount).toBe(3);
    });

    it('cuenta los no leídos de los OTROS, no los propios', async () => {
      // Contaba todos los mensajes de la conversación, así que quien escribía
      // se sumaba a sí mismo: con uno de cada lado, los dos veían «2» y el que
      // acababa de escribir volvía a la bandeja con un aviso de su propio
      // mensaje. Lo que fija esta prueba es que el lector viaja hasta el
      // repositorio, que es lo único que le permite excluirse.
      const d = build();
      d.conversationsRepo.listActiveParticipationsOf.mockResolvedValue([
        { conversationId: 'c-1', lastReadMessageId: 'm-0' },
      ]);
      d.conversationsRepo.listConversationsByIds.mockResolvedValue([
        { id: 'c-1', conversationTypeConceptId: 'ct' },
      ]);

      await d.service.listConversations('p-1', actor, 20);

      expect(d.conversationsRepo.countUnread).toHaveBeenCalledWith(
        expect.anything(),
        'c-1',
        'p-1',
        'm-0',
      );
    });

    it('exige ser el titular del perfil', async () => {
      const d = build();
      d.visibility.assertOwnProfile.mockRejectedValue(new Error('prohibido'));
      await expect(
        d.service.listConversations('p-ajeno', actor, 20),
      ).rejects.toThrow('prohibido');
    });
  });

  describe('listMessages', () => {
    it('404 si el actor no participa de la conversación', async () => {
      const d = build();
      d.conversationsRepo.findActiveParticipant.mockResolvedValue(null);

      await expect(
        d.service.listMessages('c-1', 'p-1', actor, { limit: 10 }),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('404 si media un bloqueo con el otro participante', async () => {
      const d = build();
      d.conversationsRepo.findParticipants.mockResolvedValue([
        { participantProfileId: 'p-1' },
        { participantProfileId: 'p-2' },
      ]);
      d.visibility.isBlockedBetween.mockResolvedValue(true);

      await expect(
        d.service.listMessages('c-1', 'p-1', actor, { limit: 10 }),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.conversationsRepo.listMessagesPage).not.toHaveBeenCalled();
    });

    it('devuelve la página descendente con su cursor', async () => {
      const d = build();
      const sentAt = new Date('2026-08-01T10:00:00Z');
      d.conversationsRepo.listMessagesPage.mockResolvedValue([
        {
          id: 'm-2',
          conversationId: 'c-1',
          senderProfileId: 'p-2',
          contentTypeConceptId: 'ct',
          sentAt,
        },
        {
          id: 'm-1',
          conversationId: 'c-1',
          senderProfileId: 'p-1',
          contentTypeConceptId: 'ct',
          sentAt,
        },
      ]);

      const res = await d.service.listMessages('c-1', 'p-1', actor, {
        limit: 1,
      });

      expect(res.items).toHaveLength(1);
      expect(res.items[0].id).toBe('m-2');
      expect(res.nextCursor).not.toBeNull();
    });

    /* --- Doble check ✓✓: hasta dónde leyó el peer -------------------------- */

    it('resuelve peerReadUpTo en una directa cuando el peer ya marcó leído', async () => {
      const d = build();
      d.conversationsRepo.findConversationById.mockResolvedValue({
        id: 'c-1',
        conversationTypeConceptId: COMM.CONVERSATION_DIRECT,
      });
      d.conversationsRepo.findParticipants.mockResolvedValue([
        { participantProfileId: 'p-1' },
        { participantProfileId: 'p-2', lastReadMessageId: 'm-5' },
      ]);
      const leidoHasta = new Date('2026-08-01T12:00:00Z');
      d.conversationsRepo.findMessageById.mockResolvedValue({
        id: 'm-5',
        sentAt: leidoHasta,
      });

      const res = await d.service.listMessages('c-1', 'p-1', actor, {
        limit: 10,
      });

      expect(res.peerReadUpTo).toEqual(leidoHasta);
    });

    it('peerReadUpTo es null en un grupo (no hay "el otro lado")', async () => {
      const d = build();
      d.conversationsRepo.findConversationById.mockResolvedValue({
        id: 'c-1',
        conversationTypeConceptId: COMM.CONVERSATION_GROUP,
      });

      const res = await d.service.listMessages('c-1', 'p-1', actor, {
        limit: 10,
      });

      expect(res.peerReadUpTo).toBeNull();
      expect(d.conversationsRepo.findMessageById).not.toHaveBeenCalled();
    });
  });
});
