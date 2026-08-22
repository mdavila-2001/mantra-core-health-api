import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
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

/** `client.data` de un socket ya autenticado en este gateway. */
interface GatewaySocketData {
  user?: AuthenticatedUser;
}

/**
 * Empuje en tiempo real de la mensajería directa de `community`.
 *
 * Sólo empuja — servidor a cliente. Enviar y marcar leído siguen siendo REST
 * puro (`CommunityMessagingController`); este gateway no acepta `message:send`
 * a propósito, para no tener una segunda copia de la validación de bloqueos y
 * participación que ya vive en `CommunityMessagingService`. Ver
 * `community-messaging.service.ts`, que llama a `emitMessage`/`emitRead`/
 * `emitNewConversation` después de cada commit.
 *
 * Dos salas por perfil:
 * - `conversation:{id}` — el hilo abierto.
 * - `profile:{id}` — la bandeja, para que el badge de no-leídos se actualice
 *   aunque el hilo no esté abierto.
 */
@Injectable()
@WebSocketGateway({ cors: { origin: false } })
export class CommunityMessagingGateway implements OnGatewayConnection {
  @WebSocketServer()
  private readonly server!: Server;

  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia (se hace `fork()` por operación).
   * @param wsAuth - Verifica el token del handshake.
   * @param conversationsRepo - Participación activa, para `join:conversation`.
   * @param visibility - Titularidad del perfil declarado, para las dos uniones.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly wsAuth: WsJwtGuard,
    private readonly conversationsRepo: ConversationsRepository,
    private readonly visibility: CommunityVisibilityService,
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
  }

  @SubscribeMessage('leave:conversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId?: string },
  ): Promise<void> {
    if (!body?.conversationId) return;
    await client.leave(this.salaDeConversacion(body.conversationId));
  }

  /** Llamado por `CommunityMessagingService.sendMessage` tras el commit. */
  emitMessage(
    message: GatewayMessagePayload,
    recipientProfileIds: string[],
  ): void {
    try {
      const salas = [
        this.salaDeConversacion(message.conversationId),
        ...recipientProfileIds.map((id) => this.salaDePerfil(id)),
      ];
      this.server.to(salas).emit('conversation:message', message);
    } catch (error) {
      this.logger.warn(
        { operation: 'community.gateway.emitMessage', err: error },
        'No se pudo empujar el mensaje por WS; el REST ya lo guardó',
      );
    }
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
