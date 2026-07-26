import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  Conversations,
  ConversationParticipants,
  DirectMessages,
  MessageReceipts,
} from '../entities';
import { createdBy } from '../../../common';

export interface CreateConversationData {
  tenantId?: string;
  conversationTypeConceptId: string;
  groupId?: string;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateParticipantData {
  conversationId: string;
  participantProfileId: string;
  roleConceptId: string;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateMessageData {
  conversationId: string;
  senderProfileId: string;
  replyToMessageId?: string;
  contentTypeConceptId: string;
  bodyText?: string;
  attachmentFileId?: string;
  statusConceptId: string;
  sentAt: Date;
  actorUserId?: string;
}

/**
 * Acceso a datos de mensajería: conversaciones, participantes, mensajes directos
 * y recibos (append-only).
 */
@Injectable()
export class ConversationsRepository {
  findConversationById(em: EntityManager, id: string): Promise<Conversations | null> {
    return em.findOne(Conversations, { id });
  }

  createConversation(em: EntityManager, data: CreateConversationData): Conversations {
    return em.create(
      Conversations,
      {
        tenantId: data.tenantId,
        conversationTypeConceptId: data.conversationTypeConceptId,
        groupId: data.groupId,
        messageCount: 0,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  createParticipant(em: EntityManager, data: CreateParticipantData): ConversationParticipants {
    return em.create(
      ConversationParticipants,
      {
        conversationId: data.conversationId,
        participantProfileId: data.participantProfileId,
        roleConceptId: data.roleConceptId,
        joinedAt: new Date(),
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findActiveParticipant(
    em: EntityManager,
    conversationId: string,
    participantProfileId: string,
    activeStatusConceptId: string,
  ): Promise<ConversationParticipants | null> {
    return em.findOne(ConversationParticipants, {
      conversationId,
      participantProfileId,
      statusConceptId: activeStatusConceptId,
    });
  }

  findParticipants(
    em: EntityManager,
    conversationId: string,
  ): Promise<ConversationParticipants[]> {
    return em.find(ConversationParticipants, { conversationId });
  }

  createMessage(em: EntityManager, data: CreateMessageData): DirectMessages {
    return em.create(
      DirectMessages,
      {
        conversationId: data.conversationId,
        senderProfileId: data.senderProfileId,
        replyToMessageId: data.replyToMessageId,
        contentTypeConceptId: data.contentTypeConceptId,
        bodyText: data.bodyText,
        attachmentFileId: data.attachmentFileId,
        isEdited: false,
        statusConceptId: data.statusConceptId,
        sentAt: data.sentAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findLastMessage(em: EntityManager, conversationId: string): Promise<DirectMessages | null> {
    return em.findOne(DirectMessages, { conversationId }, { orderBy: { sentAt: 'desc' } });
  }

  createReceipt(
    em: EntityManager,
    data: {
      directMessageId: string;
      recipientProfileId: string;
      receiptTypeConceptId: string;
      occurredAt?: Date;
      recordedByUserId?: string;
    },
  ): MessageReceipts {
    return em.create(
      MessageReceipts,
      {
        directMessageId: data.directMessageId,
        recipientProfileId: data.recipientProfileId,
        receiptTypeConceptId: data.receiptTypeConceptId,
        occurredAt: data.occurredAt ?? new Date(),
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }
}
