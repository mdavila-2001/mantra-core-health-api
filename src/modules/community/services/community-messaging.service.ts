import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  STICKER_PACK_FILE_IDS,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { AttachableFileService } from '../../common/services';
import {
  ConversationsRepository,
  BlocksRepository,
  PublicProfilesRepository,
} from '../repositories';
import { CommunityMessageNotificationsService } from './community-message-notifications.service';
// Import directo del archivo (no del barrel `../gateways`): rompe el ciclo
// barrel↔barrel con `CommunityMessagingGateway`, que a su vez necesita
// `CommunityVisibilityService` de este mismo paquete `services/`.
import { CommunityMessagingGateway } from '../gateways/community-messaging.gateway';
// Directo y no por el barrel, por el mismo ciclo que el gateway.
import { CommunityVisibilityService } from './community-visibility.service';
import { CommunityChatAutoReplyService } from './community-chat-auto-reply.service';
import { COMM } from '../community.concepts';
import { CommunityErrorReason } from '../community.error-reasons';
import {
  CreateConversationDto,
  SendMessageDto,
  MarkReadDto,
  IdResponseDto,
  MessageResponseDto,
  ReadReceiptResponseDto,
  UpdateParticipantDto,
  EditMessageDto,
  PinMessageDto,
  ParticipantPreferencesDto,
  DirectMessageDto,
  DeletedMessageResponseDto,
  PinnedMessageResponseDto,
} from '../dto';
import type { DirectMessages } from '../entities';

/**
 * Cuánto tiempo después de enviarlo se puede editar un mensaje (F4.5).
 *
 * Cinco minutos: lo que alcanza para corregir una dosis mal tecleada y no para
 * reescribir una indicación que la otra persona ya leyó y siguió.
 *
 * El cliente aplica la misma regla para no ofrecer un botón que va a fallar,
 * pero la barrera es ésta: una pantalla no autoriza nada.
 */
export const EDIT_WINDOW_MS = 5 * 60_000;

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
   * @param messageNotifications - Aviso in-app del carril P1.
   * @param gateway - Empuje en tiempo real por WebSocket.
   * @param autoReply - La respuesta automática por inactividad (F4.7).
   * @param visibility - Que el perfil con el que se escribe sea del actor.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly conversationsRepo: ConversationsRepository,
    private readonly blocksRepo: BlocksRepository,
    private readonly profilesRepo: PublicProfilesRepository,
    private readonly messageNotifications: CommunityMessageNotificationsService,
    private readonly gateway: CommunityMessagingGateway,
    private readonly autoReply: CommunityChatAutoReplyService,
    private readonly visibility: CommunityVisibilityService,
    private readonly attachableFiles: AttachableFileService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommunityMessagingService.name);
  }

  /**
   * Abre la conversación con esas personas: la que ya existe, o una nueva.
   *
   * ## Por qué dejó de crear siempre (carril P2)
   *
   * Era un *bootstrap* y creaba una conversación nueva en cada llamada. Con un
   * botón «Escribir al doctor» en la pantalla de la cita eso significa que la
   * tercera vez que alguien lo pulsa tiene tres hilos con la misma persona y
   * sus mensajes repartidos entre los tres. No es un caso borde: pasa la
   * segunda vez.
   *
   * Este bootstrap sólo abre conversaciones directas de dos participantes.
   * Los grupos pasan por su flujo específico, que valida grupo y membresía;
   * aceptar UUID arbitrarios acá permitiría saltarse esas reglas.
   *
   * Es aditivo para quien ya la usaba: devuelve un id de conversación en la
   * que los participantes pedidos participan, que es lo que el contrato
   * prometía.
   */
  async createConversation(
    dto: CreateConversationDto,
    actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    if ((dto.conversationType as string | undefined) === 'GROUP') {
      throw new PreconditionFailedException(
        'Las conversaciones grupales se crean desde el flujo de grupos',
        {},
      );
    }
    return this.createDirectConversation(dto, actor, true);
  }

  /**
   * Canal interno para avisos transaccionales de la plataforma.
   *
   * A diferencia del buscador público, puede dirigirse a un perfil privado:
   * una preferencia de directorio no impide recibir un aviso de agenda. No se
   * expone en ningún controlador y exige el rol interno firmado `SYSTEM`.
   */
  async createSystemDirectConversation(
    dto: CreateConversationDto,
    actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    if (!actor.roles.includes('SYSTEM')) {
      throw new ForbiddenException('Canal reservado al sistema');
    }
    return this.createDirectConversation(dto, actor, false);
  }

  private async createDirectConversation(
    dto: CreateConversationDto,
    actor: AuthenticatedUser,
    requirePublicRecipient: boolean,
  ): Promise<IdResponseDto> {
    const result = await this.em.transactional(async (tx) => {
      const [initiatorProfileId] = dto.participantProfileIds;
      await this.visibility.assertActsAsProfile(tx, initiatorProfileId, actor);

      const participantIds = new Set(dto.participantProfileIds);
      if (participantIds.size !== dto.participantProfileIds.length) {
        throw new PreconditionFailedException(
          'Los participantes de una conversación deben ser distintos',
          {},
        );
      }

      if (dto.participantProfileIds.length !== 2) {
        throw new PreconditionFailedException(
          'Una conversación directa requiere exactamente dos participantes',
          {},
        );
      }

      const [profileA, profileB] = dto.participantProfileIds;
      const recipient = await this.profilesRepo.findById(tx, profileB);
      const eligibleRecipient =
        recipient?.statusConceptId === CONCEPTS.STATE_ACTIVE &&
        (!requirePublicRecipient ||
          recipient.visibilityConceptId === COMM.PROFILE_VISIBILITY_PUBLIC) &&
        [COMM.PROFILE_TARGET_USER, COMM.PROFILE_TARGET_PRACTITIONER].includes(
          recipient.targetTypeConceptId,
        );
      if (!eligibleRecipient) {
        throw new PreconditionFailedException(
          'La persona no está disponible para iniciar una conversación',
          {},
        );
      }

      const blocked = await this.blocksRepo.existsBetween(
        tx,
        profileA,
        profileB,
        CONCEPTS.STATE_ACTIVE,
      );
      if (blocked) {
        throw new PreconditionFailedException(
          'No se puede iniciar una conversación entre perfiles bloqueados',
          {},
        );
      }

      const existing = await this.conversationsRepo.findDirectBetween(
        tx,
        profileA,
        profileB,
        COMM.CONVERSATION_DIRECT,
        CONCEPTS.STATE_ACTIVE,
      );
      if (existing) return { id: existing.id, creada: false };

      const conversation = this.conversationsRepo.createConversation(tx, {
        conversationTypeConceptId: COMM.CONVERSATION_DIRECT,
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
      return { id: conversation.id, creada: true };
    });

    // Fuera de la transacción y sólo si de verdad nació una conversación: la
    // reutilizada no es una novedad para nadie, avisarla sería un badge de
    // «conversación nueva» sobre un hilo que ya conocían.
    if (result.creada) {
      this.gateway.emitNewConversation(result.id, dto.participantProfileIds);
    }

    return { id: result.id };
  }

  /** UC-19-06: envía un mensaje directo; actualiza contadores de la conversación. */
  async sendMessage(
    conversationId: string,
    dto: SendMessageDto,
    actor: AuthenticatedUser,
  ): Promise<MessageResponseDto> {
    return this.send(conversationId, dto, actor.id, true, actor);
  }

  /**
   * El envío de verdad.
   *
   * Separado de `sendMessage` por dos cosas que la API pública no tiene por qué
   * conocer: **quién queda como autor de la fila** —un `userId` y no un actor,
   * porque la respuesta automática la manda el sistema en nombre de alguien que
   * no tiene sesión abierta— y **si evaluar el contestador**, que es lo que
   * impide que dos ausentes se contesten en bucle.
   *
   * @param conversationId - La conversación.
   * @param dto - Quién escribe y qué.
   * @param actorUserId - Qué usuario queda como autor de la fila, si alguno.
   * @param evaluateAutomaticResponse - `false` para el propio mensaje
   *   automático: no se contesta a un contestador.
   */
  private async send(
    conversationId: string,
    dto: SendMessageDto,
    actorUserId: string | undefined,
    evaluateAutomaticResponse: boolean,
    authorizingActor?: AuthenticatedUser,
  ): Promise<MessageResponseDto> {
    this.logger.info(
      { operation: 'community.message.send', conversationId },
      'Sending direct message',
    );
    const sent = await this.em.transactional(async (tx) => {
      if (authorizingActor) {
        await this.visibility.assertActsAsProfile(
          tx,
          dto.senderProfileId,
          authorizingActor,
        );
      }
      const conversation = await this.conversationsRepo.findConversationById(
        tx,
        conversationId,
      );
      if (!conversation)
        throw new ResourceNotFoundException(
          'Conversación no encontrada',
          {
            conversationId,
          },
          CommunityErrorReason.CONVERSATION_NOT_FOUND,
        );

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
          CommunityErrorReason.SENDER_NOT_ACTIVE_PARTICIPANT,
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
            CommunityErrorReason.BLOCKED_BETWEEN_PARTICIPANTS,
          );
        }
      }

      // FT-32-R12 · sin actor que lo autorice, no se adjunta. Falla cerrado.
      //
      // La condición natural era `if (attachmentFileId && authorizingActor)`, y
      // con ella un envío **sin** actor se saltaba la validación entera en
      // silencio. Hoy no es explotable —el único camino sin actor es la
      // respuesta automática por inactividad, que manda `{ senderProfileId,
      // bodyText }` y nunca adjunta—, pero la forma del fallo es la peligrosa:
      // el día que cualquier camino sin sesión llevara un adjunto, el hueco no
      // daría un error, daría acceso. Como la lectura de un adjunto se autoriza
      // por participar en la conversación, asociar un archivo es justo lo que
      // hay que custodiar, y éste es el único punto donde nace ese vínculo.
      //
      // El rechazo va acá y la comprobación de derecho sigue entera en
      // `assertAttachmentCanBeAssociated`: esto no es una segunda validación de
      // propiedad, es la guarda que garantiza que aquélla siempre se ejecute.
      if (dto.attachmentFileId) {
        if (!authorizingActor) {
          this.logger.warn(
            {
              operation: 'community.message.attachment.associate',
              conversationId,
              attachmentFileId: dto.attachmentFileId,
            },
            'Refused an attachment on a message sent without an authorizing actor',
          );
          throw new PreconditionFailedException(
            'No se puede adjuntar un archivo sin un actor que lo autorice',
            { attachmentFileId: dto.attachmentFileId },
          );
        }
        await this.assertAttachmentCanBeAssociated(
          tx,
          dto.senderProfileId,
          dto.attachmentFileId,
          authorizingActor,
        );
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
        actorUserId: actorUserId,
      });

      conversation.messageCount = (conversation.messageCount ?? 0) + 1;
      conversation.lastMessageAt = now;
      touch(conversation, actorUserId);
      await tx.flush();

      // Recibos de entregado para el resto de participantes (append-only).
      for (const p of participants) {
        if (p.participantProfileId === dto.senderProfileId) continue;
        this.conversationsRepo.createReceipt(tx, {
          directMessageId: message.id,
          recipientProfileId: p.participantProfileId,
          receiptTypeConceptId: COMM.RECEIPT_DELIVERED,
          recordedByUserId: actorUserId,
        });
      }

      return {
        id: message.id,
        conversationId,
        senderProfileId: message.senderProfileId,
        replyToMessageId: message.replyToMessageId ?? null,
        contentTypeConceptId: message.contentTypeConceptId,
        bodyText: message.bodyText ?? null,
        attachmentFileId: message.attachmentFileId ?? null,
        isEdited: false,
        sentAt: now,
        // Los destinatarios viajan fuera del DTO para no tener que releerlos
        // después del commit: ya se recorrieron acá para los recibos.
        destinatarios: participants
          .map((p) => p.participantProfileId)
          .filter((profileId) => profileId !== dto.senderProfileId),
      };
    });

    // Carril P2 → P1 · «tenés un mensaje nuevo».
    //
    // Después del commit y no dentro: el mensaje ya está guardado cuando esto
    // corre, así que ningún problema de la campana puede hacerlo desaparecer.
    // `mensajeNuevo` no lanza.
    await this.messageNotifications.newMessage(
      conversationId,
      dto.senderProfileId,
      sent.destinatarios,
      actorUserId,
    );

    // Empuje en vivo por WS — mismo criterio que la notificación: después del
    // commit, y `emitMessage` no lanza. Se arma el payload explícito (sin
    // `destinatarios`, que es un detalle interno de este método) para no
    // filtrar por WS un campo que el contrato REST tampoco expone.
    this.gateway.emitMessage(
      {
        id: sent.id,
        conversationId: sent.conversationId,
        senderProfileId: sent.senderProfileId,
        replyToMessageId: sent.replyToMessageId,
        contentTypeConceptId: sent.contentTypeConceptId,
        bodyText: sent.bodyText,
        attachmentFileId: sent.attachmentFileId,
        isEdited: sent.isEdited,
        sentAt: sent.sentAt,
      },
      sent.destinatarios,
    );

    // F4.7 · La respuesta automática de quien recibió, si corresponde.
    //
    // Después del commit y en su propia transacción: el mensaje de la persona
    // ya está guardado y entregado, así que nada de lo que pase acá puede
    // hacerlo desaparecer. Y no lanza — que el contestador falle no puede
    // convertir un envío correcto en un error para quien escribió.
    //
    // **No se evalúa el contestador del mensaje automático.** Es la condición
    // que corta el bucle: con dos personas ausentes y las dos con respuesta
    // automática encendida, cada aviso dispararía el del otro para siempre.
    if (evaluateAutomaticResponse) {
      await this.responderOnly(conversationId, sent.destinatarios);
    }

    return {
      id: sent.id,
      conversationId: sent.conversationId,
      sentAt: sent.sentAt,
    };
  }

  /** Autoriza archivo propio o reenvío desde un contexto ya visible. */
  private async assertAttachmentCanBeAssociated(
    tx: EntityManager,
    senderProfileId: string,
    fileId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const options = {
      operation: 'community.message.attachment.associate',
      // AG-17: el pack de stickers del producto no es de ningún remitente —es
      // del sistema— así que cualquier participante puede adjuntarlo. Un
      // fileId ajeno a este catálogo cerrado sigue exigiendo dueño, igual que
      // antes.
      allowIfFileIdIn: STICKER_PACK_FILE_IDS,
    };
    try {
      await this.attachableFiles.assertUsableBy(tx, fileId, actor, options);
      return;
    } catch (error) {
      if (!(error instanceof ForbiddenException)) throw error;
    }

    const sources =
      await this.conversationsRepo.findLiveMessagesByAttachmentFileId(
        tx,
        fileId,
      );
    for (const source of sources) {
      const participant = await this.conversationsRepo.findActiveParticipant(
        tx,
        source.conversationId,
        senderProfileId,
        CONCEPTS.STATE_ACTIVE,
      );
      if (!participant) continue;

      const sourceParticipants = await this.conversationsRepo.findParticipants(
        tx,
        source.conversationId,
      );
      let blocked = false;
      for (const sourceParticipant of sourceParticipants) {
        if (sourceParticipant.participantProfileId === senderProfileId)
          continue;
        if (
          await this.blocksRepo.existsBetween(
            tx,
            senderProfileId,
            sourceParticipant.participantProfileId,
            CONCEPTS.STATE_ACTIVE,
          )
        ) {
          blocked = true;
          break;
        }
      }
      if (blocked) continue;

      await this.attachableFiles.assertUsableForAuthorizedContext(
        tx,
        fileId,
        options,
      );
      return;
    }

    throw new ResourceNotFoundException('Archivo adjunto no encontrado', {
      fileId,
    });
  }

  /**
   * Contesta por cada destinatario que tenga la respuesta automática activa.
   *
   * ## Por qué el mensaje sale como suyo y no como un aviso del sistema
   *
   * Porque es suyo: lo escribió y lo configuró. Un mensaje de sistema no se
   * podría responder ni citar, y quien recibe «no estoy disponible» muchas
   * veces quiere contestar a eso mismo.
   *
   * ## Por qué el actor es el del envío original
   *
   * No hay sesión del titular —justamente, está ausente—. El perfil que firma
   * el mensaje es el suyo (`senderProfileId`), y `created_by_user_id` queda con
   * el usuario que disparó la cadena, que es la traza real de por qué existe esa
   * fila. Registrarlo como si el titular hubiera estado sería peor: diría que
   * alguien escribió cuando no estaba.
   *
   * @param conversationId - Dónde llegó el mensaje.
   * @param senderProfileId - Quién escribió, para no contestarse a sí mismo.
   * @param recipients - A quiénes les llegó.
   */
  private async responderOnly(
    conversationId: string,
    recipients: readonly string[],
  ): Promise<void> {
    for (const recipient of recipients) {
      try {
        // La evaluación y la marca del descanso van en una transacción, y el
        // envío en otra: si el envío falla, la marca se revierte con ella y el
        // próximo mensaje vuelve a intentarlo en vez de quedar en silencio.
        const text = await this.em.transactional((tx) =>
          this.autoReply.textForResponder(tx, conversationId, recipient),
        );
        if (text === null) {
          continue;
        }
        // Sin `actorUserId`: `created_by_user_id` queda nulo a propósito. Nadie
        // apretó enviar —el titular está ausente, que es la razón de que exista
        // este mensaje—, y anotar un usuario diría que sí lo hizo. El mensaje
        // igual es suyo: lo firma su perfil, que es lo que ve la otra persona.
        await this.send(
          conversationId,
          { senderProfileId: recipient, bodyText: text },
          undefined,
          false,
        );
      } catch (error) {
        this.logger.warn(
          {
            operation: 'community.message.auto-reply',
            conversationId,
            destinatario: recipient,
            err: error,
          },
          'No se pudo mandar la respuesta automática',
        );
      }
    }
  }

  /** UC-19-07: marca la conversación como leída para un participante. */
  async markRead(
    conversationId: string,
    dto: MarkReadDto,
    actor: AuthenticatedUser,
  ): Promise<ReadReceiptResponseDto> {
    const result = await this.em.transactional(async (tx) => {
      // El lector sale del cuerpo, así que se prueba contra la sesión: sin
      // esto cualquiera podía dejar «leído» un hilo ajeno a nombre de otro.
      await this.visibility.assertActsAsProfile(
        tx,
        dto.recipientProfileId,
        actor,
      );

      const conversation = await this.conversationsRepo.findConversationById(
        tx,
        conversationId,
      );
      if (!conversation)
        throw new ResourceNotFoundException(
          'Conversación no encontrada',
          {
            conversationId,
          },
          CommunityErrorReason.CONVERSATION_NOT_FOUND,
        );

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
          CommunityErrorReason.RECIPIENT_NOT_ACTIVE_PARTICIPANT,
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

    if (result.lastReadMessageId) {
      this.gateway.emitRead({
        conversationId,
        profileId: dto.recipientProfileId,
        lastReadMessageId: result.lastReadMessageId,
      });
    }

    return result;
  }

  /* --- F4.4 · lo que un participante marca de su lado ---------------------- */

  /**
   * Favorita, fijada o archivada, **para este participante**. Cada campo es
   * opcional y sólo cambia lo que viene. Archivar quita el favorito.
   *
   * Reemplaza el `localStorage` que el frente usaba mientras no había
   * columnas: lo marcado ahora sobrevive a cambiar de máquina.
   */
  async updateParticipant(
    conversationId: string,
    dto: UpdateParticipantDto,
    actor: AuthenticatedUser,
  ): Promise<ParticipantPreferencesDto> {
    return this.em.transactional(async (tx) => {
      await this.visibility.assertActsAsProfile(tx, dto.profileId, actor);
      const participant = await this.activeOrNotFoundParticipant(
        tx,
        conversationId,
        dto.profileId,
      );

      if (dto.isFavorite !== undefined) participant.isFavorite = dto.isFavorite;
      if (dto.isPinned !== undefined) participant.isPinned = dto.isPinned;
      if (dto.archived !== undefined) {
        if (dto.archived) {
          participant.archivedAt ??= new Date();
          participant.isFavorite = false;
        } else {
          participant.archivedAt = undefined;
        }
      }
      touch(participant, actor.id);
      await tx.flush();

      return {
        conversationId,
        isFavorite: participant.isFavorite,
        isPinned: participant.isPinned,
        archivedAt: participant.archivedAt ?? null,
      };
    });
  }

  /* --- F4.5 · editar y borrar ---------------------------------------------- */

  /**
   * Cambia el texto de un mensaje **propio** y lo marca editado. Un mensaje
   * eliminado no se edita: ya no tiene texto que cambiar.
   */
  async editMessage(
    conversationId: string,
    messageId: string,
    dto: EditMessageDto,
    actor: AuthenticatedUser,
  ): Promise<DirectMessageDto> {
    const result = await this.em.transactional(async (tx) => {
      await this.visibility.assertActsAsProfile(tx, dto.senderProfileId, actor);
      await this.activeOrNotFoundParticipant(
        tx,
        conversationId,
        dto.senderProfileId,
      );
      const message = await this.ownLiveMessage(
        tx,
        conversationId,
        messageId,
        dto.senderProfileId,
      );
      this.assertEditionWindowInside(message, conversationId, messageId);

      message.bodyText = dto.bodyText;
      message.isEdited = true;
      touch(message, actor.id);
      await tx.flush();

      return {
        dto: this.toDto(message),
        destinatarios: await this.otherParticipants(
          tx,
          conversationId,
          dto.senderProfileId,
        ),
      };
    });

    this.gateway.emitMessageUpdated(result.dto, result.destinatarios);
    return result.dto;
  }

  /**
   * Elimina un mensaje **propio**, de forma lógica: la fila queda con
   * `deletedAt` y la lectura la devuelve sin cuerpo, para que el hilo diga
   * «Se eliminó este mensaje» en su lugar. Si era el fijado, se suelta.
   */
  async deleteMessage(
    conversationId: string,
    messageId: string,
    profileId: string,
    actor: AuthenticatedUser,
  ): Promise<DeletedMessageResponseDto> {
    const result = await this.em.transactional(async (tx) => {
      await this.visibility.assertActsAsProfile(tx, profileId, actor);
      await this.activeOrNotFoundParticipant(tx, conversationId, profileId);
      const message = await this.ownLiveMessage(
        tx,
        conversationId,
        messageId,
        profileId,
      );

      const now = new Date();
      message.deletedAt = now;
      touch(message, actor.id);

      const conversation = await this.conversationsRepo.findConversationById(
        tx,
        conversationId,
      );
      let wasReleased = false;
      if (conversation?.pinnedMessageId === messageId) {
        conversation.pinnedMessageId = undefined;
        touch(conversation, actor.id);
        wasReleased = true;
      }
      await tx.flush();

      return {
        deletedAt: now,
        seSolto: wasReleased,
        destinatarios: await this.otherParticipants(
          tx,
          conversationId,
          profileId,
        ),
      };
    });

    this.gateway.emitMessageDeleted(
      { conversationId, messageId, deletedAt: result.deletedAt },
      result.destinatarios,
    );
    if (result.seSolto) {
      this.gateway.emitPinned(
        { conversationId, pinnedMessageId: null },
        result.destinatarios,
      );
    }
    return { conversationId, messageId, deletedAt: result.deletedAt };
  }

  /* --- F4.6 · fijar ---------------------------------------------------------- */

  /**
   * Fija un mensaje en la barra superior del hilo. Uno a la vez: fijar otro
   * reemplaza al anterior. Cualquier participante activo puede fijar —es de
   * la conversación, no del autor— y no hace falta que el mensaje sea propio.
   */
  async pinMessage(
    conversationId: string,
    dto: PinMessageDto,
    actor: AuthenticatedUser,
  ): Promise<PinnedMessageResponseDto> {
    const recipients = await this.em.transactional(async (tx) => {
      await this.visibility.assertActsAsProfile(tx, dto.profileId, actor);
      await this.activeOrNotFoundParticipant(tx, conversationId, dto.profileId);
      const conversation = await this.conversationsRepo.findConversationById(
        tx,
        conversationId,
      );
      if (!conversation)
        throw new ResourceNotFoundException('Conversación no encontrada', {
          conversationId,
        });
      const message = await this.conversationsRepo.findMessageInConversation(
        tx,
        conversationId,
        dto.messageId,
      );
      if (!message || message.deletedAt)
        throw new ResourceNotFoundException('Mensaje no encontrado', {
          conversationId,
          messageId: dto.messageId,
        });

      conversation.pinnedMessageId = dto.messageId;
      touch(conversation, actor.id);
      await tx.flush();
      return this.otherParticipants(tx, conversationId, dto.profileId);
    });

    this.gateway.emitPinned(
      { conversationId, pinnedMessageId: dto.messageId },
      recipients,
    );
    return { conversationId, pinnedMessageId: dto.messageId };
  }

  /** Suelta el mensaje fijado. Soltar cuando no hay ninguno no es un error. */
  async unpinMessage(
    conversationId: string,
    profileId: string,
    actor: AuthenticatedUser,
  ): Promise<PinnedMessageResponseDto> {
    const recipients = await this.em.transactional(async (tx) => {
      await this.visibility.assertActsAsProfile(tx, profileId, actor);
      await this.activeOrNotFoundParticipant(tx, conversationId, profileId);
      const conversation = await this.conversationsRepo.findConversationById(
        tx,
        conversationId,
      );
      if (!conversation)
        throw new ResourceNotFoundException('Conversación no encontrada', {
          conversationId,
        });
      conversation.pinnedMessageId = undefined;
      touch(conversation, actor.id);
      await tx.flush();
      return this.otherParticipants(tx, conversationId, profileId);
    });

    this.gateway.emitPinned(
      { conversationId, pinnedMessageId: null },
      recipients,
    );
    return { conversationId, pinnedMessageId: null };
  }

  /* --- comunes ----------------------------------------------------------------- */

  /**
   * El participante activo, o 404. 404 y no 403 (igual que la lectura):
   * confirmar que la conversación existe ya diría con quién habla otro.
   */
  private async activeOrNotFoundParticipant(
    em: EntityManager,
    conversationId: string,
    profileId: string,
  ) {
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
    return participant;
  }

  /** Un mensaje de este hilo, escrito por este perfil y no eliminado. */
  /**
   * Rechaza la edición de un mensaje que ya salió de la ventana.
   *
   * ## Por qué existe
   *
   * Editar sin plazo deja reescribir para siempre lo que la otra persona ya
   * leyó —y en un chat clínico eso es una indicación médica que cambia debajo
   * de quien la recibió—. El cliente ya no ofrece «Editar» pasada la ventana,
   * pero **una pantalla no es una barrera**: la regla tiene que estar donde se
   * decide, que es acá.
   *
   * ## Contra `sent_at`, no contra el reloj de quien edita
   *
   * `sent_at` lo puso el servidor al aceptar el mensaje. Medir contra la hora
   * que mande el cliente dejaría la ventana en manos de su reloj.
   *
   * Un mensaje **sin** `sent_at` no se edita: sin marca de envío no hay plazo
   * que medir, y dar por buena la edición sería abrir la ventana para siempre
   * justo en el caso raro.
   */
  private assertEditionWindowInside(
    message: DirectMessages,
    conversationId: string,
    messageId: string,
  ): void {
    const sent = message.sentAt;
    if (!sent) {
      throw new PreconditionFailedException(
        'El mensaje no tiene marca de envío: no se puede editar',
        { conversationId, messageId },
      );
    }
    const elapsed = Date.now() - sent.getTime();
    if (elapsed > EDIT_WINDOW_MS) {
      throw new PreconditionFailedException(
        'Pasaron más de 5 minutos: el mensaje ya no se puede editar',
        {
          conversationId,
          messageId,
          ventanaMinutos: EDIT_WINDOW_MS / 60_000,
        },
      );
    }
  }

  private async ownLiveMessage(
    em: EntityManager,
    conversationId: string,
    messageId: string,
    profileId: string,
  ): Promise<DirectMessages> {
    const message = await this.conversationsRepo.findMessageInConversation(
      em,
      conversationId,
      messageId,
    );
    if (!message)
      throw new ResourceNotFoundException('Mensaje no encontrado', {
        conversationId,
        messageId,
      });
    if (message.senderProfileId !== profileId)
      throw new PreconditionFailedException(
        'Sólo el autor puede editar o eliminar su mensaje',
        { conversationId, messageId },
      );
    if (message.deletedAt)
      throw new PreconditionFailedException('El mensaje ya fue eliminado', {
        conversationId,
        messageId,
      });
    return message;
  }

  private async otherParticipants(
    em: EntityManager,
    conversationId: string,
    profileId: string,
  ): Promise<string[]> {
    const participants = await this.conversationsRepo.findParticipants(
      em,
      conversationId,
    );
    return participants
      .map((p) => p.participantProfileId)
      .filter((other) => other !== profileId);
  }

  private toDto(message: DirectMessages): DirectMessageDto {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderProfileId: message.senderProfileId,
      replyToMessageId: message.replyToMessageId ?? null,
      contentTypeConceptId: message.contentTypeConceptId,
      bodyText: message.bodyText ?? null,
      attachmentFileId: message.attachmentFileId ?? null,
      isEdited: message.isEdited ?? null,
      deletedAt: message.deletedAt ?? null,
      sentAt: message.sentAt ?? null,
    };
  }
}
