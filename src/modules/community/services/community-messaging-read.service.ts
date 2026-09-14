import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  decodeKeysetCursor,
  encodeKeysetCursor,
  type AuthenticatedUser,
} from '../../../common';
import {
  ConversationsRepository,
  PublicProfilesRepository,
} from '../repositories';
import { FileUploadService } from '../../common/services';
import { CommunityVisibilityService } from './community-visibility.service';
import { CommunityPresenceService } from './community-presence.service';
import { COMM } from '../community.concepts';
import type { FileContentDto } from '../../common/dto';
import type {
  ConversationListItemDto,
  ConversationPageDto,
  ConversationPresenceDto,
  DirectMessageDto,
  DirectMessagePageDto,
} from '../dto';
import type {
  ConversationParticipants,
  Conversations,
  DirectMessages,
} from '../entities';

/**
 * Tope de conversaciones que se resuelven de una vez para armar la bandeja.
 *
 * El cursor de `listConversations` (F4.3) pagina **dentro** de este recorte:
 * la bandeja se arma resolviendo peers, último mensaje y no leídos por
 * conversación, y hacerlo para quinientas conversaciones por página sería
 * quinientas veces tres consultas. Cien conversaciones activas son más de
 * las que cualquier persona usa; pasada esa cantidad, las más quietas quedan
 * fuera y se anota como límite conocido.
 */
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
   * @param presence - Quién está en línea (F4.2).
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly conversationsRepo: ConversationsRepository,
    private readonly profilesRepo: PublicProfilesRepository,
    private readonly visibility: CommunityVisibilityService,
    private readonly presence: CommunityPresenceService,
    private readonly files: FileUploadService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommunityMessagingReadService.name);
  }

  /**
   * El contenido de un adjunto de conversación, para un participante activo
   * (5.1 · FT-32-R02).
   *
   * ## Por qué existe
   *
   * `FileUploadService.download()` autoriza por **propiedad**: sólo quien subió
   * el archivo, o un rol de revisión. En una conversación eso es exactamente el
   * revés de lo que hace falta — el que necesita abrir el adjunto es **el que
   * lo recibió**, que por definición no lo subió. Hasta ahora el hilo pedía los
   * bytes por la ruta genérica, se llevaba un 403 y la burbuja mostraba
   * «Archivo no disponible» para todo adjunto ajeno.
   *
   * ## Qué autoriza, y en qué orden
   *
   * Lo mismo que autoriza **leer el mensaje**: que el perfil sea del actor
   * (`assertOwnProfile`) y que sea **participante activo** de una conversación
   * donde ese archivo viaje en un mensaje **vivo**. Ni más ni menos: no se
   * inventa una clasificación de archivo, no se mira la sensibilidad ni la
   * categoría, y no se concede nada a quien no esté en la conversación.
   *
   * El orden importa: primero se comprueban perfil y participación activa;
   * después la consulta inversa por `attachment_file_id` demuestra que el
   * archivo pertenece a un mensaje vivo de **esa misma** conversación.
   *
   * ## Por qué 404 y nunca 403
   *
   * Un 403 confirmaría que el archivo existe. Quien enumera uuids ajenos
   * recibe el mismo «no encontrado» tanto si el id no existe como si existe
   * pero es de una conversación en la que no está — la misma regla que ya usan
   * `listMessages` («confirmar que la conversación existe ya diría con quién
   * habla el otro») y `getCommentMedia`.
   *
   * @param conversationId - Conversación contextual que contiene el adjunto.
   * @param fileId - Adjunto pedido (`common.files`).
   * @param profileId - Perfil con el que el actor dice participar.
   * @param actor - Sesión que pide los bytes.
   * @returns Bytes y tipo MIME para servir por HTTP.
   * @throws ResourceNotFoundException para cualquier combinación inexistente,
   *   ajena, huérfana o removida — el mismo 404 en todos esos casos.
   */
  async getAttachmentContent(
    conversationId: string,
    fileId: string,
    profileId: string,
    actor: AuthenticatedUser,
  ): Promise<FileContentDto> {
    const em = this.em.fork();
    try {
      await this.visibility.assertOwnProfile(em, profileId, actor);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw this.attachmentNotFound(fileId);
      }
      throw error;
    }

    const participant = await this.conversationsRepo.findActiveParticipant(
      em,
      conversationId,
      profileId,
      CONCEPTS.STATE_ACTIVE,
    );
    if (!participant) throw this.attachmentNotFound(fileId);

    try {
      await this.assertNoBlockWithPeers(em, conversationId, profileId);
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw this.attachmentNotFound(fileId);
      }
      throw error;
    }

    const mensajes =
      await this.conversationsRepo.findLiveMessagesByAttachmentFileId(
        em,
        fileId,
      );

    if (
      !mensajes.some((mensaje) => mensaje.conversationId === conversationId)
    ) {
      this.logger.warn(
        {
          operation: 'community.conversation.attachment',
          conversationId,
          fileId,
          profileId,
          actorId: actor.id,
        },
        'Refused a conversation attachment the reader does not participate in',
      );
      throw this.attachmentNotFound(fileId);
    }

    try {
      return await this.files.downloadForAuthorizedContext(
        fileId,
        'community.conversation.attachment',
      );
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof PreconditionFailedException
      ) {
        throw this.attachmentNotFound(fileId);
      }
      throw error;
    }
  }

  /**
   * Bandeja de un perfil, con vista previa, no leídos y lo que marcó de su
   * lado (favorita, fijada, archivada). Exige ser el titular.
   *
   * ## Orden (F4.3 y F4.4)
   *
   * Fijadas primero, después por último mensaje — el orden de cualquier
   * bandeja de chat. Las archivadas **viajan igual**, con `archivedAt`: es el
   * cliente quien las separa en su carpeta, y mandarlas aparte obligaría a
   * dos llamadas para pintar una pantalla.
   *
   * ## `q` y `cursor`
   *
   * `q` recorta por nombre del otro lado o por texto del último mensaje, sin
   * distinguir mayúsculas ni acentos. El cursor apunta a la última
   * conversación entregada dentro de ese mismo recorte.
   *
   * @param profileId - Perfil dueño de la bandeja.
   * @param actor - Quien pide la lectura.
   * @param options - Tope, cursor y filtro de texto.
   * @returns Conversaciones activas, de la más reciente a la más quieta.
   */
  async listConversations(
    profileId: string,
    actor: AuthenticatedUser,
    options: {
      /** Tope de conversaciones por página. */
      limit: number;
      /** Cursor opaco de la página anterior. */
      cursor?: string;
      /** Texto a buscar en el nombre del otro lado o en el último mensaje. */
      q?: string;
    },
  ): Promise<ConversationPageDto> {
    const em = this.em.fork();
    await this.visibility.assertOwnProfile(em, profileId, actor);

    const participations =
      await this.conversationsRepo.listActiveParticipationsOf(
        em,
        profileId,
        CONCEPTS.STATE_ACTIVE,
        CONVERSATIONS_PER_INBOX,
      );
    const conversations = await this.conversationsRepo.listConversationsByIds(
      em,
      participations.map((participation) => participation.conversationId),
    );
    const participacionPorConversacion = new Map(
      participations.map((participation) => [
        participation.conversationId,
        participation,
      ]),
    );

    // Los participantes de todas las conversaciones de la página, y sus
    // perfiles, en **dos** consultas: una por fila multiplicaría la bandeja de
    // alguien con cincuenta hilos por cincuenta.
    const participantesPorConversacion = new Map<
      string,
      ConversationParticipants[]
    >();
    await Promise.all(
      conversations.map(async (conversation) => {
        const participantes = await this.conversationsRepo.findParticipants(
          em,
          conversation.id,
        );
        participantesPorConversacion.set(
          conversation.id,
          participantes.filter(
            (participante) => participante.participantProfileId !== profileId,
          ),
        );
      }),
    );
    const perfiles = await this.profilesRepo.listByIds(em, [
      ...new Set(
        [...participantesPorConversacion.values()]
          .flat()
          .map((participante) => participante.participantProfileId),
      ),
    ]);
    const nombrePorPerfil = new Map(
      perfiles.map((perfil) => [perfil.id, perfil.displayName]),
    );
    const avatarPorPerfil = new Map(
      perfiles.map((perfil) => [perfil.id, this.fileUrl(perfil.avatarFileId)]),
    );

    const todas: ConversationListItemDto[] = await Promise.all(
      conversations.map(async (conversation) => {
        const propia = participacionPorConversacion.get(conversation.id);
        const otros = participantesPorConversacion.get(conversation.id) ?? [];
        const [lastMessage, unreadCount] = await Promise.all([
          this.conversationsRepo.findLastMessage(em, conversation.id),
          this.conversationsRepo.countUnread(
            em,
            conversation.id,
            profileId,
            propia?.lastReadMessageId,
          ),
        ]);
        return {
          peers: otros.map((otro) => ({
            profileId: otro.participantProfileId,
            displayName: nombrePorPerfil.get(otro.participantProfileId) ?? null,
            avatarUrl: avatarPorPerfil.get(otro.participantProfileId) ?? null,
          })),
          id: conversation.id,
          conversationTypeConceptId: conversation.conversationTypeConceptId,
          groupId: conversation.groupId ?? null,
          lastMessageAt: conversation.lastMessageAt ?? null,
          messageCount: conversation.messageCount ?? null,
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                senderProfileId: lastMessage.senderProfileId,
                bodyText: lastMessage.deletedAt
                  ? null
                  : (lastMessage.bodyText ?? null),
                contentTypeConceptId: lastMessage.contentTypeConceptId,
                attachmentFileId: lastMessage.deletedAt
                  ? null
                  : (lastMessage.attachmentFileId ?? null),
                deletedAt: lastMessage.deletedAt ?? null,
                sentAt: lastMessage.sentAt ?? null,
              }
            : null,
          unreadCount,
          lastMessageReadByPeer: this.leidoPorElOtro(
            conversation,
            lastMessage,
            profileId,
            otros,
          ),
          isFavorite: propia?.isFavorite ?? false,
          isPinned: propia?.isPinned ?? false,
          archivedAt: propia?.archivedAt ?? null,
          pinnedMessageId: conversation.pinnedMessageId ?? null,
        };
      }),
    );

    // Fijadas primero; dentro de cada grupo se conserva el orden por último
    // mensaje que ya trae `listConversationsByIds`.
    const ordenadas = [
      ...todas.filter((item) => item.isPinned),
      ...todas.filter((item) => !item.isPinned),
    ];

    const q = normalizar(options.q ?? '');
    const recortadas =
      q === ''
        ? ordenadas
        : ordenadas.filter(
            (item) =>
              item.peers.some((peer) =>
                normalizar(peer.displayName ?? '').includes(q),
              ) || normalizar(item.lastMessage?.bodyText ?? '').includes(q),
          );

    const despuesDe = options.cursor
      ? decodeKeysetCursor(options.cursor)
      : undefined;
    const desde =
      typeof despuesDe?.id === 'string'
        ? recortadas.findIndex((item) => item.id === despuesDe.id) + 1
        : 0;
    const page = recortadas.slice(desde, desde + options.limit);
    const hasMore = desde + options.limit < recortadas.length;
    const last = page.at(-1);

    return {
      items: page,
      count: page.length,
      limit: options.limit,
      nextCursor: hasMore && last ? encodeKeysetCursor({ id: last.id }) : null,
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
    const conversation = await this.conversationsRepo.findConversationById(
      em,
      conversationId,
    );
    const peerReadUpTo = await this.resolvePeerReadUpTo(
      em,
      conversation,
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

    // El fijado viaja completo sólo en la primera página: es lo que la barra
    // de arriba necesita al abrir, y repetirlo en cada página de historia
    // sería mandar el mismo mensaje treinta veces.
    const pinnedMessage =
      !options.cursor && conversation?.pinnedMessageId
        ? await this.conversationsRepo.findMessageById(
            em,
            conversation.pinnedMessageId,
          )
        : null;

    return {
      items: page.map((message) => this.aDto(message)),
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
      ...(options.cursor
        ? {}
        : {
            pinnedMessage:
              pinnedMessage && !pinnedMessage.deletedAt
                ? this.aDto(pinnedMessage)
                : null,
          }),
    };
  }

  /**
   * Presencia de los demás participantes de una conversación (F4.2). Exige
   * participar: la presencia de alguien es para quien conversa con él, no
   * para cualquiera que conozca su id.
   *
   * @param conversationId - Conversación abierta.
   * @param profileId - Perfil que mira.
   * @param actor - Quien pide la lectura.
   * @returns En línea o última vez, por cada uno de los otros.
   */
  async conversationPresence(
    conversationId: string,
    profileId: string,
    actor: AuthenticatedUser,
  ): Promise<ConversationPresenceDto> {
    const em = this.em.fork();
    await this.visibility.assertOwnProfile(em, profileId, actor);

    const participant = await this.conversationsRepo.findActiveParticipant(
      em,
      conversationId,
      profileId,
      CONCEPTS.STATE_ACTIVE,
    );
    if (!participant)
      throw new ResourceNotFoundException('Conversación no encontrada', {
        conversationId,
      });

    const participants = await this.conversationsRepo.findParticipants(
      em,
      conversationId,
    );
    const otros = participants
      .map((participante) => participante.participantProfileId)
      .filter((otro) => otro !== profileId);

    return {
      conversationId,
      peers: await this.presence.presenciaDe(otros),
    };
  }

  /**
   * Un mensaje como viaja al cliente. Uno eliminado va **sin** cuerpo ni
   * adjunto pero con su lugar: el hilo pinta «Se eliminó este mensaje» y las
   * citas que apuntaban a él siguen sabiendo a qué apuntaban.
   */
  private aDto(message: DirectMessages): DirectMessageDto {
    const eliminado =
      message.deletedAt !== undefined && message.deletedAt !== null;
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderProfileId: message.senderProfileId,
      replyToMessageId: message.replyToMessageId ?? null,
      contentTypeConceptId: message.contentTypeConceptId,
      bodyText: eliminado ? null : (message.bodyText ?? null),
      attachmentFileId: eliminado ? null : (message.attachmentFileId ?? null),
      isEdited: message.isEdited ?? null,
      deletedAt: message.deletedAt ?? null,
      sentAt: message.sentAt ?? null,
    };
  }

  /**
   * Si el otro lado ya leyó el último mensaje, para el doble tilde de la
   * bandeja (F4.3). Sólo tiene respuesta cuando la conversación es directa y
   * el último mensaje es propio; en cualquier otro caso es `null`, que el
   * cliente pinta como «no se sabe» y no como «no leído».
   *
   * Se compara por identidad y no por fecha para no volver a la base por
   * cada fila: `markRead` sin `upToMessageId` deja `lastReadMessageId` en el
   * último, que es lo que pasa cada vez que alguien abre el hilo.
   */
  private leidoPorElOtro(
    conversation: Conversations,
    lastMessage: DirectMessages | null,
    profileId: string,
    otros: ConversationParticipants[],
  ): boolean | null {
    if (
      conversation.conversationTypeConceptId !== COMM.CONVERSATION_DIRECT ||
      !lastMessage ||
      lastMessage.senderProfileId !== profileId ||
      otros.length !== 1
    ) {
      return null;
    }
    return otros[0].lastReadMessageId === lastMessage.id;
  }

  /**
   * Hasta qué `sentAt` leyó el otro lado, sólo tiene sentido en una directa.
   *
   * Un grupo no tiene "el otro lado" — son varios—, así que ahí siempre da
   * `null`. `null` también cuando el peer todavía no marcó nada como leído.
   */
  private async resolvePeerReadUpTo(
    em: EntityManager,
    conversation: Conversations | null,
    profileId: string,
  ): Promise<Date | null> {
    if (conversation?.conversationTypeConceptId !== COMM.CONVERSATION_DIRECT) {
      return null;
    }

    const participants = await this.conversationsRepo.findParticipants(
      em,
      conversation.id,
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

  /** Respuesta uniforme para archivo inexistente, ajeno, huérfano o removido. */
  private attachmentNotFound(fileId: string): ResourceNotFoundException {
    return new ResourceNotFoundException('Archivo adjunto no encontrado', {
      fileId,
    });
  }

  /**
   * URL pública de un archivo, o `null`. Misma ruta y misma regla que la ficha
   * pública (`community-public.service`): nunca el identificador del archivo.
   */
  private fileUrl(fileId?: string): string | null {
    return fileId ? `/public/media/${fileId}` : null;
  }
}

/** Minúsculas y sin acentos, para que «Quispe» encuentre a «quíspe». */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
