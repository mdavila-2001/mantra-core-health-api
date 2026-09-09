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
  // F4.2: la presencia se dobla; por defecto nadie está en línea.
  const presence = {
    presenciaDe: mockFn((ids: string[]) =>
      Promise.resolve(
        ids.map((profileId) => ({
          profileId,
          online: false,
          lastSeenAt: null,
        })),
      ),
    ),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new CommunityMessagingReadService(
    em as any,
    conversationsRepo as any,
    profilesRepo as any,
    visibility as any,
    presence as any,
    logger as any,
  );
  return { service, conversationsRepo, profilesRepo, visibility, presence };
}

/** Una bandeja de tres conversaciones, para las pruebas de F4.3/F4.4. */
function conTresConversaciones(d: ReturnType<typeof build>) {
  d.conversationsRepo.listActiveParticipationsOf.mockResolvedValue([
    {
      conversationId: 'c-1',
      lastReadMessageId: 'm-1',
      isFavorite: true,
      isPinned: false,
      archivedAt: null,
    },
    {
      conversationId: 'c-2',
      lastReadMessageId: 'm-2',
      isFavorite: false,
      isPinned: true,
      archivedAt: null,
    },
    {
      conversationId: 'c-3',
      lastReadMessageId: 'm-3',
      isFavorite: false,
      isPinned: false,
      archivedAt: new Date('2026-09-01T00:00:00Z'),
    },
  ]);
  // Ya ordenadas por último mensaje, como las devuelve el repositorio.
  d.conversationsRepo.listConversationsByIds.mockResolvedValue([
    { id: 'c-1', conversationTypeConceptId: COMM.CONVERSATION_DIRECT },
    { id: 'c-2', conversationTypeConceptId: COMM.CONVERSATION_DIRECT },
    {
      id: 'c-3',
      conversationTypeConceptId: COMM.CONVERSATION_DIRECT,
      pinnedMessageId: 'm-pin',
    },
  ]);
  d.conversationsRepo.findParticipants.mockImplementation(
    (_em: unknown, conversationId: string) =>
      Promise.resolve([
        { participantProfileId: 'p-1' },
        {
          participantProfileId: `peer-${conversationId}`,
          lastReadMessageId: `m-${conversationId.slice(-1)}`,
        },
      ]),
  );
  d.profilesRepo.listByIds.mockResolvedValue([
    { id: 'peer-c-1', displayName: 'Andrea Peña' },
    { id: 'peer-c-2', displayName: 'Marisol Quispe' },
    { id: 'peer-c-3', displayName: 'Ender Rosales' },
  ]);
  d.conversationsRepo.findLastMessage.mockImplementation(
    (_em: unknown, conversationId: string) =>
      Promise.resolve({
        id: `m-${conversationId.slice(-1)}`,
        senderProfileId:
          conversationId === 'c-1' ? 'p-1' : `peer-${conversationId}`,
        bodyText: conversationId === 'c-2' ? 'receta lista' : 'hola',
        contentTypeConceptId: 'ct-text',
      }),
  );
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

      const res = await d.service.listConversations('p-1', actor, {
        limit: 20,
      });

      expect(res.items[0].lastMessage?.bodyText).toBe('hola');
      expect(res.items[0].unreadCount).toBe(3);
    });

    it('trae el avatar del otro lado, por la misma ruta que la ficha pública', async () => {
      const d = build();
      d.conversationsRepo.listActiveParticipationsOf.mockResolvedValue([
        { conversationId: 'c-1', lastReadMessageId: 'm-0' },
      ]);
      d.conversationsRepo.listConversationsByIds.mockResolvedValue([
        { id: 'c-1', conversationTypeConceptId: 'ct' },
      ]);
      d.conversationsRepo.findParticipants.mockResolvedValue([
        { participantProfileId: 'p-1' },
        { participantProfileId: 'p-2' },
      ]);
      d.profilesRepo.listByIds.mockResolvedValue([
        { id: 'p-2', displayName: 'Andrea Peña', avatarFileId: 'file-9' },
      ]);

      const res = await d.service.listConversations('p-1', actor, {
        limit: 20,
      });

      expect(res.items[0].peers).toEqual([
        {
          profileId: 'p-2',
          displayName: 'Andrea Peña',
          avatarUrl: '/public/media/file-9',
        },
      ]);
    });

    it('sin avatar el peer viaja con avatarUrl en null, no ausente', async () => {
      const d = build();
      d.conversationsRepo.listActiveParticipationsOf.mockResolvedValue([
        { conversationId: 'c-1', lastReadMessageId: 'm-0' },
      ]);
      d.conversationsRepo.listConversationsByIds.mockResolvedValue([
        { id: 'c-1', conversationTypeConceptId: 'ct' },
      ]);
      d.conversationsRepo.findParticipants.mockResolvedValue([
        { participantProfileId: 'p-1' },
        { participantProfileId: 'p-2' },
      ]);
      d.profilesRepo.listByIds.mockResolvedValue([
        { id: 'p-2', displayName: 'Andrea Peña' },
      ]);

      const res = await d.service.listConversations('p-1', actor, {
        limit: 20,
      });

      expect(res.items[0].peers[0].avatarUrl).toBeNull();
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

      await d.service.listConversations('p-1', actor, { limit: 20 });

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
        d.service.listConversations('p-ajeno', actor, { limit: 20 }),
      ).rejects.toThrow('prohibido');
    });

    /* --- F4.3 / F4.4 -------------------------------------------------------- */

    it('las fijadas van primero y cada fila trae lo que el actor marcó', async () => {
      const d = build();
      conTresConversaciones(d);

      const res = await d.service.listConversations('p-1', actor, {
        limit: 20,
      });

      expect(res.items.map((item) => item.id)).toEqual(['c-2', 'c-1', 'c-3']);
      expect(res.items[1]).toMatchObject({
        id: 'c-1',
        isFavorite: true,
        isPinned: false,
        archivedAt: null,
      });
      // La archivada viaja igual, con su fecha: el cliente la separa.
      expect(res.items[2].archivedAt).toEqual(new Date('2026-09-01T00:00:00Z'));
      expect(res.items[2].pinnedMessageId).toBe('m-pin');
      expect(res.nextCursor).toBeNull();
    });

    it('la vista previa dice de qué tipo era el último mensaje', async () => {
      const d = build();
      conTresConversaciones(d);
      d.conversationsRepo.findLastMessage.mockResolvedValue({
        id: 'm-9',
        senderProfileId: 'peer-c-1',
        bodyText: null,
        contentTypeConceptId: 'ct-media',
        attachmentFileId: 'file-1',
      });

      const res = await d.service.listConversations('p-1', actor, {
        limit: 20,
      });

      expect(res.items[0].lastMessage).toMatchObject({
        contentTypeConceptId: 'ct-media',
        attachmentFileId: 'file-1',
      });
    });

    it('dice si el otro leyó el último mensaje sólo cuando es propio y directo', async () => {
      const d = build();
      conTresConversaciones(d);

      const res = await d.service.listConversations('p-1', actor, {
        limit: 20,
      });
      const porId = new Map(res.items.map((item) => [item.id, item]));

      // c-1: último propio y el peer tiene lastReadMessageId = m-1 → leído.
      expect(porId.get('c-1')?.lastMessageReadByPeer).toBe(true);
      // c-2: último ajeno → no aplica.
      expect(porId.get('c-2')?.lastMessageReadByPeer).toBeNull();
    });

    it('recorta por nombre del otro lado o por texto del último mensaje, sin acentos', async () => {
      const d = build();
      conTresConversaciones(d);

      const porNombre = await d.service.listConversations('p-1', actor, {
        limit: 20,
        q: 'PENA',
      });
      expect(porNombre.items.map((item) => item.id)).toEqual(['c-1']);

      const porTexto = await d.service.listConversations('p-1', actor, {
        limit: 20,
        q: 'receta',
      });
      expect(porTexto.items.map((item) => item.id)).toEqual(['c-2']);
    });

    it('pagina con cursor dentro del mismo recorte', async () => {
      const d = build();
      conTresConversaciones(d);

      const primera = await d.service.listConversations('p-1', actor, {
        limit: 2,
      });
      expect(primera.items.map((item) => item.id)).toEqual(['c-2', 'c-1']);
      expect(primera.nextCursor).not.toBeNull();

      const segunda = await d.service.listConversations('p-1', actor, {
        limit: 2,
        cursor: primera.nextCursor!,
      });
      expect(segunda.items.map((item) => item.id)).toEqual(['c-3']);
      expect(segunda.nextCursor).toBeNull();
    });
  });

  describe('conversationPresence (F4.2)', () => {
    it('pregunta la presencia de los otros, nunca la propia', async () => {
      const d = build();
      d.conversationsRepo.findParticipants.mockResolvedValue([
        { participantProfileId: 'p-1' },
        { participantProfileId: 'p-2' },
      ]);
      d.presence.presenciaDe.mockResolvedValue([
        { profileId: 'p-2', online: true, lastSeenAt: null },
      ]);

      const res = await d.service.conversationPresence('c-1', 'p-1', actor);

      expect(d.presence.presenciaDe).toHaveBeenCalledWith(['p-2']);
      expect(res.peers[0].online).toBe(true);
    });

    it('404 si no participa', async () => {
      const d = build();
      d.conversationsRepo.findActiveParticipant.mockResolvedValue(null);
      await expect(
        d.service.conversationPresence('c-1', 'p-1', actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('mensajes eliminados y fijado (F4.5 / F4.6)', () => {
    it('un mensaje eliminado viaja sin cuerpo ni adjunto, con deletedAt', async () => {
      const d = build();
      d.conversationsRepo.listMessagesPage.mockResolvedValue([
        {
          id: 'm-1',
          conversationId: 'c-1',
          senderProfileId: 'p-2',
          contentTypeConceptId: 'ct',
          bodyText: 'esto no debería verse',
          attachmentFileId: 'file-1',
          deletedAt: new Date('2026-09-09T10:00:00Z'),
          sentAt: new Date('2026-09-09T09:00:00Z'),
        },
      ]);

      const res = await d.service.listMessages('c-1', 'p-1', actor, {
        limit: 10,
      });

      expect(res.items[0]).toMatchObject({
        id: 'm-1',
        bodyText: null,
        attachmentFileId: null,
        deletedAt: new Date('2026-09-09T10:00:00Z'),
      });
    });

    it('la primera página trae el mensaje fijado completo; las siguientes no', async () => {
      const d = build();
      d.conversationsRepo.findConversationById.mockResolvedValue({
        id: 'c-1',
        conversationTypeConceptId: 'ct-group',
        pinnedMessageId: 'm-pin',
      });
      d.conversationsRepo.findMessageById.mockResolvedValue({
        id: 'm-pin',
        conversationId: 'c-1',
        senderProfileId: 'p-2',
        contentTypeConceptId: 'ct',
        bodyText: 'Turno: martes 10:00',
      });

      const primera = await d.service.listMessages('c-1', 'p-1', actor, {
        limit: 10,
      });
      expect(primera.pinnedMessage?.bodyText).toBe('Turno: martes 10:00');

      const siguiente = await d.service.listMessages('c-1', 'p-1', actor, {
        limit: 10,
        cursor:
          'eyJzZW50QXQiOiIyMDI2LTA5LTA5VDA5OjAwOjAwLjAwMFoiLCJpZCI6Im0tMSJ9',
      });
      expect(siguiente.pinnedMessage).toBeUndefined();
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
