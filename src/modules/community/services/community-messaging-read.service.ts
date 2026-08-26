import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ResourceNotFoundException,
  decodeKeysetCursor,
  encodeKeysetCursor,
  type AuthenticatedUser,
} from '../../../common';
import {
  ConversationsRepository,
  PublicProfilesRepository,
} from '../repositories';
import { CommunityVisibilityService } from './community-visibility.service';
import { COMM } from '../community.concepts';
import type { ConversationPageDto, DirectMessagePageDto } from '../dto';

/** Tope de conversaciones que devuelve la bandeja de una vez. */
const CONVERSATIONS_PER_INBOX = 100;

/**
 * Cara de lectura de la mensajería directa (UC-19-14).
 *
 * La regla que gobierna todo acá es una sola: **se lee la conversación en la
 * que se participa**. No hay lectura por id suelto, ni siquiera para
 * administración, porque un mensaje directo entre dos personas no es contenido
 * público del sistema.
 */
@Injectable()
export class CommunityMessagingReadService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param conversationsRepo - Acceso a conversaciones, participantes y mensajes.
   * @param profilesRepo - Perfiles públicos, para nombrar el otro lado.
   * @param visibility - Reglas transversales de propiedad y bloqueo.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly conversationsRepo: ConversationsRepository,
    private readonly profilesRepo: PublicProfilesRepository,
    private readonly visibility: CommunityVisibilityService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommunityMessagingReadService.name);
  }

  /**
   * Bandeja de un perfil, con vista previa y no leídos. Exige ser el titular.
   *
   * @param profileId - Perfil dueño de la bandeja.
   * @param actor - Quien pide la lectura.
   * @param limit - Tope de conversaciones.
   * @returns Conversaciones activas, de la más reciente a la más quieta.
   */
  async listConversations(
    profileId: string,
    actor: AuthenticatedUser,
    limit: number,
  ): Promise<ConversationPageDto> {
    const em = this.em.fork();
    await this.visibility.assertOwnProfile(em, profileId, actor);

    const participations =
      await this.conversationsRepo.listActiveParticipationsOf(
        em,
        profileId,
        CONCEPTS.STATE_ACTIVE,
        Math.min(limit, CONVERSATIONS_PER_INBOX),
      );
    const conversations = await this.conversationsRepo.listConversationsByIds(
      em,
      participations.map((participation) => participation.conversationId),
    );
    const lastReadByConversation = new Map(
      participations.map((participation) => [
        participation.conversationId,
        participation.lastReadMessageId,
      ]),
    );

    // Los participantes de todas las conversaciones de la página, y sus
    // perfiles, en **dos** consultas: una por fila multiplicaría la bandeja de
    // alguien con cincuenta hilos por cincuenta.
    const participantesPorConversacion = new Map<string, string[]>();
    await Promise.all(
      conversations.map(async (conversation) => {
        const participantes = await this.conversationsRepo.findParticipants(
          em,
          conversation.id,
        );
        participantesPorConversacion.set(
          conversation.id,
          participantes
            .map((participante) => participante.participantProfileId)
            .filter((otro) => otro !== profileId),
        );
      }),
    );
    const perfiles = await this.profilesRepo.listByIds(em, [
      ...new Set([...participantesPorConversacion.values()].flat()),
    ]);
    const nombrePorPerfil = new Map(
      perfiles.map((perfil) => [perfil.id, perfil.displayName]),
    );
    const avatarPorPerfil = new Map(
      perfiles.map((perfil) => [perfil.id, this.fileUrl(perfil.avatarFileId)]),
    );

    const items = await Promise.all(
      conversations.map(async (conversation) => {
        const [lastMessage, unreadCount] = await Promise.all([
          this.conversationsRepo.findLastMessage(em, conversation.id),
          this.conversationsRepo.countUnread(
            em,
            conversation.id,
            profileId,
            lastReadByConversation.get(conversation.id),
          ),
        ]);
        return {
          peers: (participantesPorConversacion.get(conversation.id) ?? []).map(
            (otro) => ({
              profileId: otro,
              displayName: nombrePorPerfil.get(otro) ?? null,
              avatarUrl: avatarPorPerfil.get(otro) ?? null,
            }),
          ),
          id: conversation.id,
          conversationTypeConceptId: conversation.conversationTypeConceptId,
          groupId: conversation.groupId ?? null,
          lastMessageAt: conversation.lastMessageAt ?? null,
          messageCount: conversation.messageCount ?? null,
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                senderProfileId: lastMessage.senderProfileId,
                bodyText: lastMessage.bodyText ?? null,
                sentAt: lastMessage.sentAt ?? null,
              }
            : null,
          unreadCount,
        };
      }),
    );

    return {
      items,
      count: items.length,
      limit,
      nextCursor: null,
    };
  }

  /**
   * Mensajes de una conversación. Exige participar y no mediar bloqueo.
   *
   * @param conversationId - Conversación a leer.
   * @param profileId - Perfil lector.
   * @param actor - Quien pide la lectura.
   * @param options - Cursor y tope.
   * @returns Página de mensajes, del más reciente al más antiguo.
   * @throws ResourceNotFoundException si no participa o media un bloqueo.
   */
  async listMessages(
    conversationId: string,
    profileId: string,
    actor: AuthenticatedUser,
    options: {
      /** Cursor opaco de la página anterior. */
      cursor?: string;
      /** Tope de mensajes. */
      limit: number;
    },
  ): Promise<DirectMessagePageDto> {
    const em = this.em.fork();
    await this.visibility.assertOwnProfile(em, profileId, actor);

    const participant = await this.conversationsRepo.findActiveParticipant(
      em,
      conversationId,
      profileId,
      CONCEPTS.STATE_ACTIVE,
    );
    // 404 y no 403: confirmar que la conversación existe ya diría con quién
    // habla el otro.
    if (!participant)
      throw new ResourceNotFoundException('Conversación no encontrada', {
        conversationId,
      });

    await this.assertNoBlockWithPeers(em, conversationId, profileId);
    const peerReadUpTo = await this.resolvePeerReadUpTo(
      em,
      conversationId,
      profileId,
    );

    const after = options.cursor
      ? decodeKeysetCursor(options.cursor)
      : undefined;
    const afterKey =
      typeof after?.sentAt === 'string' && typeof after?.id === 'string'
        ? { sentAt: after.sentAt, id: after.id }
        : undefined;

    const rows = await this.conversationsRepo.listMessagesPage(
      em,
      conversationId,
      afterKey,
      options.limit + 1,
    );
    const hasMore = rows.length > options.limit;
    const page = hasMore ? rows.slice(0, options.limit) : rows;
    const last = page.at(-1);

    return {
      items: page.map((message) => ({
        id: message.id,
        conversationId: message.conversationId,
        senderProfileId: message.senderProfileId,
        replyToMessageId: message.replyToMessageId ?? null,
        contentTypeConceptId: message.contentTypeConceptId,
        bodyText: message.bodyText ?? null,
        attachmentFileId: message.attachmentFileId ?? null,
        isEdited: message.isEdited ?? null,
        sentAt: message.sentAt ?? null,
      })),
      count: page.length,
      limit: options.limit,
      nextCursor:
        hasMore && last?.sentAt
          ? encodeKeysetCursor({
              sentAt: last.sentAt.toISOString(),
              id: last.id,
            })
          : null,
      peerReadUpTo,
    };
  }

  /**
   * Hasta qué `sentAt` leyó el otro lado, sólo tiene sentido en una directa.
   *
   * Un grupo no tiene "el otro lado" — son varios—, así que ahí siempre da
   * `null`. `null` también cuando el peer todavía no marcó nada como leído.
   */
  private async resolvePeerReadUpTo(
    em: EntityManager,
    conversationId: string,
    profileId: string,
  ): Promise<Date | null> {
    const conversation = await this.conversationsRepo.findConversationById(
      em,
      conversationId,
    );
    if (conversation?.conversationTypeConceptId !== COMM.CONVERSATION_DIRECT) {
      return null;
    }

    const participants = await this.conversationsRepo.findParticipants(
      em,
      conversationId,
    );
    if (participants.length !== 2) return null;

    const peer = participants.find(
      (participant) => participant.participantProfileId !== profileId,
    );
    if (!peer?.lastReadMessageId) return null;

    const lastRead = await this.conversationsRepo.findMessageById(
      em,
      peer.lastReadMessageId,
    );
    return lastRead?.sentAt ?? null;
  }

  /**
   * Exige que no haya bloqueo con ningún otro participante.
   *
   * Se comprueba al leer y no sólo al escribir: si alguien bloquea a otro
   * después de haber conversado, la conversación tiene que dejar de abrirse —
   * si no, el bloqueo sólo impediría mensajes nuevos y el historial seguiría
   * ahí para las dos partes.
   */
  private async assertNoBlockWithPeers(
    em: EntityManager,
    conversationId: string,
    profileId: string,
  ): Promise<void> {
    const participants = await this.conversationsRepo.findParticipants(
      em,
      conversationId,
    );
    const peers = participants
      .map((participant) => participant.participantProfileId)
      .filter((participantProfileId) => participantProfileId !== profileId);

    for (const peer of peers) {
      if (await this.visibility.isBlockedBetween(em, profileId, peer))
        throw new ResourceNotFoundException('Conversación no encontrada', {
          conversationId,
        });
    }
  }

  /**
   * URL pública de un archivo, o `null`. Misma ruta y misma regla que la ficha
   * pública (`community-public.service`): nunca el identificador del archivo.
   */
  private fileUrl(fileId?: string): string | null {
    return fileId ? `/public/media/${fileId}` : null;
  }
}
