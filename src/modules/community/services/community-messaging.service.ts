import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { ConversationsRepository, BlocksRepository } from '../repositories';
import { COMM } from '../community.concepts';
import {
  CreateConversationDto,
  SendMessageDto,
  MarkReadDto,
  IdResponseDto,
  MessageResponseDto,
  ReadReceiptResponseDto,
} from '../dto';

/**
 * Mensajería social: crea conversaciones con participantes (bootstrap), envía
 * mensajes directos (UC-19-06) y marca mensajes como leídos vía recibos
 * (UC-19-07). Verifica participación activa y ausencia de bloqueo antes de enviar.
 */
@Injectable()
export class CommunityMessagingService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param conversationsRepo - Valor de conversations repo requerido por la operación.
   * @param blocksRepo - Valor de blocks repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly conversationsRepo: ConversationsRepository,
    private readonly blocksRepo: BlocksRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommunityMessagingService.name);
  }

  /** Bootstrap: crea una conversación y da de alta a sus participantes. */
  async createConversation(
    dto: CreateConversationDto,
    actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    return this.em.transactional(async (tx) => {
      const conversation = this.conversationsRepo.createConversation(tx, {
        conversationTypeConceptId:
          dto.conversationType === 'GROUP'
            ? COMM.CONVERSATION_GROUP
            : COMM.CONVERSATION_DIRECT,
        groupId: dto.groupId,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      for (const profileId of dto.participantProfileIds) {
        this.conversationsRepo.createParticipant(tx, {
          conversationId: conversation.id,
          participantProfileId: profileId,
          roleConceptId: COMM.PARTICIPANT_ROLE_MEMBER,
          statusConceptId: CONCEPTS.STATE_ACTIVE,
          actorUserId: actor.id,
        });
      }
      await tx.flush();
      return { id: conversation.id };
    });
  }

  /** UC-19-06: envía un mensaje directo; actualiza contadores de la conversación. */
  async sendMessage(
    conversationId: string,
    dto: SendMessageDto,
    actor: AuthenticatedUser,
  ): Promise<MessageResponseDto> {
    this.logger.info(
      { operation: 'community.message.send', conversationId },
      'Sending direct message',
    );
    return this.em.transactional(async (tx) => {
      const conversation = await this.conversationsRepo.findConversationById(
        tx,
        conversationId,
      );
      if (!conversation)
        throw new ResourceNotFoundException('Conversación no encontrada', {
          conversationId,
        });

      const sender = await this.conversationsRepo.findActiveParticipant(
        tx,
        conversationId,
        dto.senderProfileId,
        CONCEPTS.STATE_ACTIVE,
      );
      if (!sender) {
        throw new PreconditionFailedException(
          'El remitente no es participante activo',
          {
            conversationId,
            senderProfileId: dto.senderProfileId,
          },
        );
      }

      // No permitir DM si existe bloqueo con cualquier otro participante.
      const participants = await this.conversationsRepo.findParticipants(
        tx,
        conversationId,
      );
      for (const p of participants) {
        if (p.participantProfileId === dto.senderProfileId) continue;
        const blocked = await this.blocksRepo.existsBetween(
          tx,
          dto.senderProfileId,
          p.participantProfileId,
          CONCEPTS.STATE_ACTIVE,
        );
        if (blocked) {
          throw new PreconditionFailedException(
            'Existe un bloqueo entre los participantes',
            {
              conversationId,
            },
          );
        }
      }

      const now = new Date();
      const message = this.conversationsRepo.createMessage(tx, {
        conversationId,
        senderProfileId: dto.senderProfileId,
        replyToMessageId: dto.replyToMessageId,
        contentTypeConceptId:
          dto.contentType === 'MEDIA'
            ? COMM.MESSAGE_CONTENT_MEDIA
            : COMM.MESSAGE_CONTENT_TEXT,
        bodyText: dto.bodyText,
        attachmentFileId: dto.attachmentFileId,
        statusConceptId: COMM.MESSAGE_SENT,
        sentAt: now,
        actorUserId: actor.id,
      });

      conversation.messageCount = (conversation.messageCount ?? 0) + 1;
      conversation.lastMessageAt = now;
      touch(conversation, actor.id);
      await tx.flush();

      // Recibos de entregado para el resto de participantes (append-only).
      for (const p of participants) {
        if (p.participantProfileId === dto.senderProfileId) continue;
        this.conversationsRepo.createReceipt(tx, {
          directMessageId: message.id,
          recipientProfileId: p.participantProfileId,
          receiptTypeConceptId: COMM.RECEIPT_DELIVERED,
          recordedByUserId: actor.id,
        });
      }

      return { id: message.id, conversationId, sentAt: now };
    });
  }

  /** UC-19-07: marca la conversación como leída para un participante. */
  async markRead(
    conversationId: string,
    dto: MarkReadDto,
    actor: AuthenticatedUser,
  ): Promise<ReadReceiptResponseDto> {
    return this.em.transactional(async (tx) => {
      const conversation = await this.conversationsRepo.findConversationById(
        tx,
        conversationId,
      );
      if (!conversation)
        throw new ResourceNotFoundException('Conversación no encontrada', {
          conversationId,
        });

      const participant = await this.conversationsRepo.findActiveParticipant(
        tx,
        conversationId,
        dto.recipientProfileId,
        CONCEPTS.STATE_ACTIVE,
      );
      if (!participant) {
        throw new PreconditionFailedException(
          'El perfil no es participante activo',
          {
            conversationId,
            recipientProfileId: dto.recipientProfileId,
          },
        );
      }

      let messageId = dto.upToMessageId;
      if (!messageId) {
        const last = await this.conversationsRepo.findLastMessage(
          tx,
          conversationId,
        );
        messageId = last?.id;
      }
      if (!messageId) {
        return { receiptsRecorded: 0, lastReadMessageId: null };
      }

      this.conversationsRepo.createReceipt(tx, {
        directMessageId: messageId,
        recipientProfileId: dto.recipientProfileId,
        receiptTypeConceptId: COMM.RECEIPT_READ,
        recordedByUserId: actor.id,
      });
      participant.lastReadMessageId = messageId;
      touch(participant, actor.id);
      await tx.flush();

      return { receiptsRecorded: 1, lastReadMessageId: messageId };
    });
  }
}
