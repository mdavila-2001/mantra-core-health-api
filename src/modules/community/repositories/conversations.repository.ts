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
   * La conversación directa que ya existe entre dos perfiles, si existe.
   *
   * ## El hueco que cierra
   *
   * `POST /community/conversations` era un *bootstrap*: creaba una conversación
   * nueva cada vez. Con un botón «Escribir al doctor» en la pantalla de la
   * cita, eso significa que la tercera vez que alguien lo pulsa tiene tres
   * hilos con la misma persona y sus mensajes repartidos entre los tres. No es
   * un caso borde: es lo que pasa la segunda vez.
   *
   * ## Por qué se resuelve con dos consultas y no con un `JOIN`
   *
   * Porque el modelo no tiene forma de preguntar «la conversación cuyos
   * participantes son exactamente estos dos»: los participantes viven en una
   * tabla aparte sin clave compuesta ni firma del conjunto. Se traen las
   * participaciones activas de cada uno y se intersecan — dos consultas
   * acotadas por perfil, no un recorrido de la tabla.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param perfilA - Uno de los dos perfiles.
   * @param perfilB - El otro.
   * @param directTypeConceptId - Concepto que marca una conversación directa.
   * @param activeStatusConceptId - Estado que cuenta como vivo.
   * @returns La conversación directa compartida, o `null`.
   */
  async findDirectBetween(
    em: EntityManager,
    perfilA: string,
    perfilB: string,
    directTypeConceptId: string,
    activeStatusConceptId: string,
  ): Promise<Conversations | null> {
    const [deA, deB] = await Promise.all([
      em.find(ConversationParticipants, {
        participantProfileId: perfilA,
        statusConceptId: activeStatusConceptId,
      }),
      em.find(ConversationParticipants, {
        participantProfileId: perfilB,
        statusConceptId: activeStatusConceptId,
      }),
    ]);

    const deBPorConversacion = new Set(
      deB.map((participacion) => participacion.conversationId),
    );
    const compartidas = deA
      .map((participacion) => participacion.conversationId)
      .filter((conversationId) => deBPorConversacion.has(conversationId));
    if (compartidas.length === 0) return null;

    // Sólo las directas: los dos pueden compartir además un grupo, y un grupo
    // no es el hilo al que lleva «Escribir al doctor».
    const candidatas = await em.find(
      Conversations,
      {
        id: { $in: compartidas },
        conversationTypeConceptId: directTypeConceptId,
        statusConceptId: activeStatusConceptId,
      },
      { orderBy: { lastMessageAt: 'DESC', id: 'DESC' } },
    );

    // Si hubiera más de una —creadas antes de que esto existiera—, gana la más
    // activa: es donde está la conversación que la gente reconoce.
    for (const conversacion of candidatas) {
      const participantes = await em.find(ConversationParticipants, {
        conversationId: conversacion.id,
      });
      // Exactamente los dos: una directa con un tercero adentro no es la
      // conversación privada que se está buscando.
      const perfiles = new Set(
        participantes.map(
          (participacion) => participacion.participantProfileId,
        ),
      );
      if (perfiles.size === 2 && perfiles.has(perfilA) && perfiles.has(perfilB))
        return conversacion;
    }
    return null;
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
   * **Los propios no cuentan.** Contaba todos los de la conversación, así que
   * quien escribía se sumaba a sí mismo un mensaje sin leer: con dos mensajes
   * —uno de cada lado— los dos participantes veían «2», y el que acababa de
   * escribir volvía a la bandeja con un globo azul avisándole de su propio
   * mensaje. Un mensaje sin leer es uno que te mandaron, por definición.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param conversationId - Conversación a contar.
   * @param readerProfileId - Quién lee: sus propios mensajes quedan fuera.
   * @param lastReadMessageId - Último mensaje que el participante marcó leído.
   * @returns Cantidad de mensajes sin leer.
   */
  async countUnread(
    em: EntityManager,
    conversationId: string,
    readerProfileId: string,
    lastReadMessageId: string | undefined,
  ): Promise<number> {
    const deOtros = {
      conversationId,
      deletedAt: null,
      senderProfileId: { $ne: readerProfileId },
    } as const;

    if (!lastReadMessageId) return em.count(DirectMessages, deOtros);

    const lastRead = await em.findOne(DirectMessages, {
      id: lastReadMessageId,
    });
    if (!lastRead?.sentAt) return em.count(DirectMessages, deOtros);

    return em.count(DirectMessages, {
      ...deOtros,
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
   * Un mensaje por id, para resolver hasta cuándo leyó el peer (doble check ✓✓).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador del mensaje.
   */
  findMessageById(
    em: EntityManager,
    id: string,
  ): Promise<DirectMessages | null> {
    return em.findOne(DirectMessages, { id });
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
