import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import type { Server, Socket } from 'socket.io';
import { CONCEPTS, WsJwtGuard, type AuthenticatedUser } from '../../../common';
import { ConversationsRepository } from '../repositories';
// Import directo del archivo, no del barrel `../services`: ese barrel también
// re-exporta `community-messaging.service.ts`, que importa este gateway — el
// barrel cierra un ciclo que deja `CommunityVisibilityService` `undefined` en
// tiempo de ejecución (Nest lo reporta como "dependencia en el índice [3]").
import { CommunityVisibilityService } from '../services/community-visibility.service';
import { CommunityPresenceService } from '../services/community-presence.service';

/** Un mensaje directo, tal como lo devuelve la lectura REST (`DirectMessageDto`). */
export interface GatewayMessagePayload {
  id: string;
  conversationId: string;
  senderProfileId: string;
  replyToMessageId?: string | null;
  contentTypeConceptId: string;
  bodyText?: string | null;
  attachmentFileId?: string | null;
  isEdited?: boolean | null;
  deletedAt?: Date | null;
  sentAt?: Date | null;
}

/** Lo que viaja al marcar como leído. */
export interface GatewayReadPayload {
  conversationId: string;
  profileId: string;
  lastReadMessageId: string;
}

/** Lo que viaja cuando `createConversation` crea (no reutiliza). */
export interface GatewayNewConversationPayload {
  conversationId: string;
  peerProfileId: string;
}

/** `conversation:typing` — alguien está escribiendo (o dejó de hacerlo). F4.1. */
export interface GatewayTypingPayload {
  conversationId: string;
  profileId: string;
  typing: boolean;
}

/** `profile:presence` — alguien entró o salió de la mensajería. F4.2. */
export interface GatewayPresencePayload {
  profileId: string;
  online: boolean;
  lastSeenAt: Date | null;
}

/** `conversation:message:deleted` — un mensaje se eliminó. F4.5. */
export interface GatewayMessageDeletedPayload {
  conversationId: string;
  messageId: string;
  deletedAt: Date;
}

/** `conversation:pinned` — cambió el mensaje fijado. F4.6. */
export interface GatewayPinnedPayload {
  conversationId: string;
  pinnedMessageId: string | null;
}

/** `client.data` de un socket ya autenticado en este gateway. */
interface GatewaySocketData {
  user?: AuthenticatedUser;
  /** Con qué perfiles se unió este socket (bandeja o hilo), para la presencia. */
  profileIds?: Set<string>;
}

/** Tope de conversaciones a las que se avisa un cambio de presencia. */
const CONVERSACIONES_POR_PRESENCIA = 100;

/**
 * Empuje en tiempo real de la mensajería directa de `community`.
 *
 * Enviar, editar, borrar, fijar y marcar leído siguen siendo REST puro
 * (`CommunityMessagingController`); este gateway no acepta `message:send` a
 * propósito, para no tener una segunda copia de la validación de bloqueos y
 * participación que ya vive en `CommunityMessagingService`. Ver
 * `community-messaging.service.ts`, que llama a `emit*` después de cada commit.
 *
 * Lo único que **sí** acepta del cliente son dos cosas que no se persisten
 * (F4.1 y F4.2 del plan del chat):
 * - `typing` — se reemite a la sala del hilo como `conversation:typing`.
 * - `presence:ping` — renueva el «en línea» de los perfiles del socket.
 * La presencia nace sola con `join:inbox` y muere con la desconexión.
 *
 * Dos salas por perfil:
 * - `conversation:{id}` — el hilo abierto.
 * - `profile:{id}` — la bandeja, para que el badge de no-leídos se actualice
 *   aunque el hilo no esté abierto.
 */
@Injectable()
@WebSocketGateway({ cors: { origin: false } })
export class CommunityMessagingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private readonly server!: Server;

  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia (se hace `fork()` por operación).
   * @param wsAuth - Verifica el token del handshake.
   * @param conversationsRepo - Participación activa, para `join:conversation`.
   * @param visibility - Titularidad del perfil declarado, para las dos uniones.
   * @param presence - Quién está en línea (Redis).
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly wsAuth: WsJwtGuard,
    private readonly conversationsRepo: ConversationsRepository,
    private readonly visibility: CommunityVisibilityService,
    private readonly presence: CommunityPresenceService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommunityMessagingGateway.name);
  }

  /**
   * Autentica al conectar. Un socket sin token válido nunca llega a poder
   * unirse a nada — se corta acá, no en cada mensaje.
   */
  handleConnection(client: Socket): void {
    try {
      const user = this.wsAuth.authenticate(client);
      (client.data as GatewaySocketData).user = user;
    } catch {
      client.disconnect(true);
    }
  }

  /**
   * Al desconectar, los perfiles de este socket que no tengan **otro** socket
   * vivo pasan a desconectados (F4.2). Dos pestañas abiertas son un solo
   * «en línea»: cerrar una no lo apaga.
   */
  async handleDisconnect(client: Socket): Promise<void> {
    const perfiles = (client.data as GatewaySocketData).profileIds;
    if (!perfiles || perfiles.size === 0) return;
    for (const profileId of perfiles) {
      if (this.socketsEnSala(this.salaDePerfil(profileId)) > 0) continue;
      const lastSeenAt = await this.presence.marcarDesconectado(profileId);
      await this.emitirPresencia({ profileId, online: false, lastSeenAt });
    }
  }

  @SubscribeMessage('join:inbox')
  async handleJoinInbox(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { profileId?: string },
  ): Promise<void> {
    const user = this.usuarioDe(client);
    if (!user || !body?.profileId) return;

    const em = this.em.fork();
    try {
      await this.visibility.assertOwnProfile(em, body.profileId, user);
    } catch {
      client.emit('error', { code: 'NOT_OWN_PROFILE', event: 'join:inbox' });
      return;
    }
    await client.join(this.salaDePerfil(body.profileId));
    this.recordarPerfil(client, body.profileId);

    // Entrar a la bandeja es estar en línea. Se avisa sólo cuando de verdad
    // cambió: renovar una presencia que ya existía no es noticia para nadie.
    const recienLlegado = await this.presence.marcarEnLinea(body.profileId);
    if (recienLlegado) {
      await this.emitirPresencia({
        profileId: body.profileId,
        online: true,
        lastSeenAt: new Date(),
      });
    }
  }

  @SubscribeMessage('join:conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId?: string; profileId?: string },
  ): Promise<void> {
    const user = this.usuarioDe(client);
    if (!user || !body?.conversationId || !body?.profileId) return;

    const em = this.em.fork();
    try {
      await this.visibility.assertOwnProfile(em, body.profileId, user);
    } catch {
      client.emit('error', {
        code: 'NOT_OWN_PROFILE',
        event: 'join:conversation',
      });
      return;
    }

    const participant = await this.conversationsRepo.findActiveParticipant(
      em,
      body.conversationId,
      body.profileId,
      CONCEPTS.STATE_ACTIVE,
    );
    if (!participant) {
      client.emit('error', {
        code: 'NOT_A_PARTICIPANT',
        event: 'join:conversation',
      });
      return;
    }

    await client.join(this.salaDeConversacion(body.conversationId));
    this.recordarPerfil(client, body.profileId);
  }

  @SubscribeMessage('leave:conversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId?: string; profileId?: string },
  ): Promise<void> {
    if (!body?.conversationId) return;
    await client.leave(this.salaDeConversacion(body.conversationId));
    // Salir del hilo es dejar de escribir en él, aunque el cliente no lo diga.
    if (body.profileId && this.perfilDelSocket(client, body.profileId)) {
      client
        .to(this.salaDeConversacion(body.conversationId))
        .emit('conversation:typing', {
          conversationId: body.conversationId,
          profileId: body.profileId,
          typing: false,
        } satisfies GatewayTypingPayload);
    }
  }

  /**
   * F4.1 · «escribiendo…». Sin persistencia: se reemite a los demás del hilo
   * y nada más. Sólo desde un socket que ya se unió a ese hilo con ese
   * perfil — no se vuelve a la base por cada tecla.
   */
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: { conversationId?: string; profileId?: string; typing?: boolean },
  ): void {
    if (!body?.conversationId || !body?.profileId) return;
    const sala = this.salaDeConversacion(body.conversationId);
    if (!client.rooms.has(sala)) return;
    if (!this.perfilDelSocket(client, body.profileId)) return;

    const payload: GatewayTypingPayload = {
      conversationId: body.conversationId,
      profileId: body.profileId,
      typing: body.typing !== false,
    };
    client.to(sala).emit('conversation:typing', payload);
  }

  /**
   * F4.2 · Renueva el «en línea» de los perfiles de este socket. El cliente
   * lo manda cada 25 s; sin él, la presencia caduca en 60 s.
   */
  @SubscribeMessage('presence:ping')
  async handlePresencePing(@ConnectedSocket() client: Socket): Promise<void> {
    const perfiles = (client.data as GatewaySocketData).profileIds;
    if (!perfiles) return;
    for (const profileId of perfiles) {
      const volvio = await this.presence.marcarEnLinea(profileId);
      // Si había caducado (Redis reinició, o el ping llegó tarde), el
      // renovar es volver a entrar, y hay que decirlo.
      if (volvio) {
        await this.emitirPresencia({
          profileId,
          online: true,
          lastSeenAt: new Date(),
        });
      }
    }
  }

  /** Llamado por `CommunityMessagingService.sendMessage` tras el commit. */
  emitMessage(
    message: GatewayMessagePayload,
    recipientProfileIds: string[],
  ): void {
    this.emitirA(
      'conversation:message',
      message,
      message.conversationId,
      recipientProfileIds,
    );
  }

  /** Llamado por `CommunityMessagingService.editMessage` tras el commit (F4.5). */
  emitMessageUpdated(
    message: GatewayMessagePayload,
    recipientProfileIds: string[],
  ): void {
    this.emitirA(
      'conversation:message:updated',
      message,
      message.conversationId,
      recipientProfileIds,
    );
  }

  /** Llamado por `CommunityMessagingService.deleteMessage` tras el commit (F4.5). */
  emitMessageDeleted(
    payload: GatewayMessageDeletedPayload,
    recipientProfileIds: string[],
  ): void {
    this.emitirA(
      'conversation:message:deleted',
      payload,
      payload.conversationId,
      recipientProfileIds,
    );
  }

  /** Llamado al fijar o soltar un mensaje (F4.6). */
  emitPinned(
    payload: GatewayPinnedPayload,
    recipientProfileIds: string[],
  ): void {
    this.emitirA(
      'conversation:pinned',
      payload,
      payload.conversationId,
      recipientProfileIds,
    );
  }

  /** Llamado por `CommunityMessagingService.markRead` tras el commit. */
  emitRead(payload: GatewayReadPayload): void {
    try {
      this.server
        .to(this.salaDeConversacion(payload.conversationId))
        .emit('conversation:read', payload);
    } catch (error) {
      this.logger.warn(
        { operation: 'community.gateway.emitRead', err: error },
        'No se pudo empujar el acuse de leído por WS',
      );
    }
  }

  /**
   * Llamado por `CommunityMessagingService.createConversation` sólo en la rama
   * que crea (no cuando reutiliza una directa existente).
   */
  emitNewConversation(
    conversationId: string,
    participantProfileIds: string[],
  ): void {
    try {
      for (const profileId of participantProfileIds) {
        const peerProfileId = participantProfileIds.find(
          (id) => id !== profileId,
        );
        const payload: GatewayNewConversationPayload = {
          conversationId,
          peerProfileId: peerProfileId ?? profileId,
        };
        this.server
          .to(this.salaDePerfil(profileId))
          .emit('conversation:new', payload);
      }
    } catch (error) {
      this.logger.warn(
        { operation: 'community.gateway.emitNewConversation', err: error },
        'No se pudo avisar la conversación nueva por WS',
      );
    }
  }

  /**
   * Avisa un cambio de presencia a las salas de las conversaciones en las
   * que participa el perfil: es donde se mira («en línea» bajo el nombre).
   * A quien no tiene ese hilo abierto no le sirve de nada.
   */
  private async emitirPresencia(
    payload: GatewayPresencePayload,
  ): Promise<void> {
    try {
      const em = this.em.fork();
      const participaciones =
        await this.conversationsRepo.listActiveParticipationsOf(
          em,
          payload.profileId,
          CONCEPTS.STATE_ACTIVE,
          CONVERSACIONES_POR_PRESENCIA,
        );
      const salas = participaciones.map((participacion) =>
        this.salaDeConversacion(participacion.conversationId),
      );
      if (salas.length === 0) return;
      this.server.to(salas).emit('profile:presence', payload);
    } catch (error) {
      this.logger.warn(
        { operation: 'community.gateway.emitPresence', err: error },
        'No se pudo avisar la presencia por WS',
      );
    }
  }

  /** A la sala del hilo y a la bandeja de cada destinatario; nunca lanza. */
  private emitirA(
    evento: string,
    payload: unknown,
    conversationId: string,
    recipientProfileIds: string[],
  ): void {
    try {
      const salas = [
        this.salaDeConversacion(conversationId),
        ...recipientProfileIds.map((id) => this.salaDePerfil(id)),
      ];
      this.server.to(salas).emit(evento, payload);
    } catch (error) {
      this.logger.warn(
        { operation: `community.gateway.${evento}`, err: error },
        'No se pudo empujar por WS; el REST ya lo guardó',
      );
    }
  }

  private recordarPerfil(client: Socket, profileId: string): void {
    const data = client.data as GatewaySocketData;
    data.profileIds ??= new Set<string>();
    data.profileIds.add(profileId);
  }

  private perfilDelSocket(client: Socket, profileId: string): boolean {
    return (
      (client.data as GatewaySocketData).profileIds?.has(profileId) ?? false
    );
  }

  private socketsEnSala(sala: string): number {
    return this.server.sockets.adapter.rooms.get(sala)?.size ?? 0;
  }

  private usuarioDe(client: Socket): AuthenticatedUser | undefined {
    return (client.data as GatewaySocketData).user;
  }

  private salaDeConversacion(conversationId: string): string {
    return `conversation:${conversationId}`;
  }

  private salaDePerfil(profileId: string): string {
    return `profile:${profileId}`;
  }
}
