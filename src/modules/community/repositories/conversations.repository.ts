import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  Conversations,
  ConversationParticipants,
  DirectMessages,
  MessageReceipts,
} from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create conversation data.
 */
export interface CreateConversationData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Identificador asociado a conversation type concept.
   */
  conversationTypeConceptId: string;
  /**
   * Identificador asociado a group.
   */
  groupId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create participant data.
 */
export interface CreateParticipantData {
  /**
   * Identificador asociado a conversation.
   */
  conversationId: string;
  /**
   * Identificador asociado a participant profile.
   */
  participantProfileId: string;
  /**
   * Identificador asociado a role concept.
   */
  roleConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create message data.
 */
export interface CreateMessageData {
  /**
   * Identificador asociado a conversation.
   */
  conversationId: string;
  /**
   * Identificador asociado a sender profile.
   */
  senderProfileId: string;
  /**
   * Identificador asociado a reply to message.
   */
  replyToMessageId?: string;
  /**
   * Identificador asociado a content type concept.
   */
  contentTypeConceptId: string;
  /**
   * Valor de body text mantenido por la instancia.
   */
  bodyText?: string;
  /**
   * Identificador asociado a attachment file.
   */
  attachmentFileId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de sent at mantenido por la instancia.
   */
  sentAt: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos de mensajería: conversaciones, participantes, mensajes directos
 * y recibos (append-only).
 */
@Injectable()
export class ConversationsRepository {
  /**
   * Obtiene find conversation by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find conversation by id conforme al contrato `Promise<Conversations | null>`.
   */
  findConversationById(
    em: EntityManager,
    id: string,
  ): Promise<Conversations | null> {
    return em.findOne(Conversations, { id });
  }

  /**
   * Crea create conversation.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conversation conforme al contrato `Conversations`.
   */
  createConversation(
    em: EntityManager,
    data: CreateConversationData,
  ): Conversations {
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

  /**
   * Crea create participant.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create participant conforme al contrato `ConversationParticipants`.
   */
  createParticipant(
    em: EntityManager,
    data: CreateParticipantData,
  ): ConversationParticipants {
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

  /**
   * Obtiene find active participant.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param conversationId - Identificador de conversation.
   * @param participantProfileId - Identificador de participant profile.
   * @param activeStatusConceptId - Identificador de active status concept.
   * @returns Resultado de find active participant conforme al contrato `Promise<ConversationParticipants | null>`.
   */
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

  /**
   * Obtiene find participants.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param conversationId - Identificador de conversation.
   * @returns Resultado de find participants conforme al contrato `Promise<ConversationParticipants[]>`.
   */
  findParticipants(
    em: EntityManager,
    conversationId: string,
  ): Promise<ConversationParticipants[]> {
    return em.find(ConversationParticipants, { conversationId });
  }

  /**
   * Participaciones activas de un perfil, del último mensaje al primero.
   *
   * Es la primera mitad de la bandeja: da las conversaciones y, de paso, el
   * `last_read_message_id` con el que se cuentan los no leídos.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param participantProfileId - Perfil dueño de la bandeja.
   * @param activeStatusConceptId - Estado que cuenta como participación viva.
   * @param limit - Tope de conversaciones.
   * @returns Participaciones activas del perfil.
   */
  listActiveParticipationsOf(
    em: EntityManager,
    participantProfileId: string,
    activeStatusConceptId: string,
    limit: number,
  ): Promise<ConversationParticipants[]> {
    return em.find(
      ConversationParticipants,
      { participantProfileId, statusConceptId: activeStatusConceptId },
      { orderBy: { createdAt: 'DESC', id: 'DESC' }, limit },
    );
  }

  /**
   * Conversaciones por id, ordenadas por actividad.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ids - Conversaciones a traer.
   * @returns Conversaciones, de la más activa a la más quieta.
   */
  listConversationsByIds(
    em: EntityManager,
    ids: string[],
  ): Promise<Conversations[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(
      Conversations,
      { id: { $in: ids } },
      { orderBy: { lastMessageAt: 'DESC', id: 'DESC' } },
    );
  }

  /**
   * Mensajes de una conversación (UC-19-14, cara de lectura).
   *
   * Descendente porque una conversación se abre por el final; lo borrado no
   * viaja al cliente.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param conversationId - Conversación a leer.
   * @param after - Clave de continuación `(sentAt, id)`.
   * @param limit - Tope de mensajes.
   * @returns Página de mensajes, del más reciente al más antiguo.
   */
  listMessagesPage(
    em: EntityManager,
    conversationId: string,
    after: { sentAt: string; id: string } | undefined,
    limit: number,
  ): Promise<DirectMessages[]> {
    return em.find(
      DirectMessages,
      {
        conversationId,
        deletedAt: null,
        ...(after
          ? {
              $or: [
                { sentAt: { $lt: new Date(after.sentAt) } },
                { sentAt: new Date(after.sentAt), id: { $lt: after.id } },
              ],
            }
          : {}),
      },
      { orderBy: { sentAt: 'DESC', id: 'DESC' }, limit },
    );
  }

  /**
   * Cuenta los mensajes posteriores al último leído por el participante.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param conversationId - Conversación a contar.
   * @param lastReadMessageId - Último mensaje que el participante marcó leído.
   * @returns Cantidad de mensajes sin leer.
   */
  async countUnread(
    em: EntityManager,
    conversationId: string,
    lastReadMessageId: string | undefined,
  ): Promise<number> {
    if (!lastReadMessageId)
      return em.count(DirectMessages, { conversationId, deletedAt: null });

    const lastRead = await em.findOne(DirectMessages, {
      id: lastReadMessageId,
    });
    if (!lastRead?.sentAt)
      return em.count(DirectMessages, { conversationId, deletedAt: null });

    return em.count(DirectMessages, {
      conversationId,
      deletedAt: null,
      sentAt: { $gt: lastRead.sentAt },
    });
  }

  /**
   * Crea create message.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create message conforme al contrato `DirectMessages`.
   */
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

  /**
   * Obtiene find last message.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param conversationId - Identificador de conversation.
   * @returns Resultado de find last message conforme al contrato `Promise<DirectMessages | null>`.
   */
  findLastMessage(
    em: EntityManager,
    conversationId: string,
  ): Promise<DirectMessages | null> {
    return em.findOne(
      DirectMessages,
      { conversationId },
      { orderBy: { sentAt: 'desc' } },
    );
  }

  /**
   * Crea create receipt.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create receipt conforme al contrato `MessageReceipts`.
   */
  createReceipt(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a direct message.
       */
      directMessageId: string;
      /**
       * Identificador asociado a recipient profile.
       */
      recipientProfileId: string;
      /**
       * Identificador asociado a receipt type concept.
       */
      receiptTypeConceptId: string;
      /**
       * Valor de occurred at mantenido por la instancia.
       */
      occurredAt?: Date;
      /**
       * Identificador asociado a recorded by user.
       */
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
