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
  };
  const visibility = {
    assertOwnProfile: mockFn().mockResolvedValue(undefined),
    isBlockedBetween: mockFn().mockResolvedValue(false),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new CommunityMessagingReadService(
    em as any,
    conversationsRepo as any,
    visibility as any,
    logger as any,
  );
  return { service, conversationsRepo, visibility };
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
  });
});
