import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS, type AuthenticatedUser } from '../../../common';
import { MESSAGING_SEED } from '../../../common/seed/messaging-seed.service';
import { NotificationsService } from '../../messaging/services';
import { composeSupportReplyEmail } from '../domain/support-reply-email';
import { SupportInboxRepository } from '../repositories';

/** Tipo de recurso con el que la solicitud de correo queda atada al mensaje. */
export const SUPPORT_REPLY_EMAIL_RESOURCE = 'community.direct_messages';
/** Prioridad de entrega: un aviso administrativo, como un cambio de estado de cita. */
const EMAIL_PRIORITY = 4;

/** Largo máximo del mensaje de error que se escribe en el log. */
const LOGGED_MESSAGE_LENGTH = 160;

/**
 * Forma de un fallo que se puede escribir en el log: tipo, código y un mensaje
 * saneado. El error completo del driver puede traer la fila (dirección y texto
 * de la respuesta) en `detail`, los parámetros o el SQL ya interpolado.
 */
function describeFailure(error: unknown): {
  type: string;
  code?: string;
  message?: string;
} {
  if (!(error instanceof Error)) return { type: typeof error };
  const raw = (error as { code?: unknown }).code;
  const code =
    typeof raw === 'string' && /^[A-Za-z0-9_.-]{1,40}$/.test(raw)
      ? raw
      : undefined;
  const message = error.message
    .replace(/[^\s@]+@[^\s@]+/g, '[correo]')
    .replace(/\([^)]*\)/g, '(…)')
    .replace(/'[^']*'|"[^"]*"/g, '…')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, LOGGED_MESSAGE_LENGTH);
  return {
    type: error.constructor?.name ?? 'Error',
    ...(code ? { code } : {}),
    ...(message ? { message } : {}),
  };
}

/** Lo que hace falta para mandar por correo una respuesta ya guardada. */
export interface SupportReplyEmailInput {
  /** Mensaje ya guardado en la conversación. */
  readonly messageId: string;
  /** Conversación. */
  readonly conversationId: string;
  /** Organización del doctor: el correo queda atado a ella. */
  readonly tenantId: string;
  /** Perfil público del doctor, remitente del mensaje. */
  readonly doctorPublicProfileId: string;
  /** Nombre público del doctor: el remitente visible. */
  readonly doctorName: string;
  /** Persona de apoyo que escribió: queda en el registro, nunca en el correo. */
  readonly authoredByUserId: string;
  /** Delegación doctor ↔ persona con la que se autorizó. */
  readonly delegateAssignmentId?: string;
  /** Texto ya revisado (administrativo). */
  readonly bodyText: string;
  /** ¿El doctor dejó visible «respondido por su equipo»? */
  readonly disclosureShown: boolean;
}

/** Qué pasó con el correo. */
export interface SupportReplyEmailResult {
  /** ¿Quedó encolado para el worker de mensajería? */
  readonly queued: boolean;
  /** Solicitud de notificación (también existe si quedó suprimida: es la evidencia). */
  readonly requestId?: string;
  /** Por qué no salió, en lenguaje llano. */
  readonly skippedReason?: string;
}

/**
 * Canal de correo para responder en nombre del doctor (chat y correo).
 *
 * No envía: crea la solicitud de notificación contra el canal `EMAIL` de
 * mensajería (`notification_requests`), que es lo que ya usan los avisos de
 * agenda y la verificación de correo; quien entrega es el worker de mensajería,
 * contra el proveedor que haya en el entorno, fuera de toda transacción. Sin
 * proveedor configurado la solicitud queda pendiente en su tabla: no se simula
 * un envío.
 *
 * Reglas:
 *  - el remitente visible es el doctor (la dirección sigue siendo la de la
 *    plataforma) y la leyenda «Respondido por su equipo» sale solo si el doctor
 *    lo dejó visible (SHOW/HIDE);
 *  - el correo no nombra a la persona de apoyo, pero la solicitud conserva a la
 *    autora real (`authorized_by_user_id` y `payload_json`) y queda atada al
 *    mensaje que la originó;
 *  - la solicitud lleva la organización del doctor, y respeta las preferencias
 *    del paciente (opt-in y categoría `MESSAGES`): si las rechaza, queda
 *    suprimida y registrada;
 *  - el texto es el de la respuesta administrativa ya revisada: ni el cuerpo ni
 *    el pie llevan contenido clínico;
 *  - nunca lanza: el mensaje ya está guardado en la conversación.
 */
@Injectable()
export class CommunitySupportReplyEmailService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param repo - Acceso a datos de la bandeja (cuenta y dirección del paciente).
   * @param notifications - Mensajería multicanal.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: SupportInboxRepository,
    private readonly notifications: NotificationsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommunitySupportReplyEmailService.name);
  }

  /**
   * Encola la respuesta por correo al paciente de la conversación.
   *
   * @param input - Mensaje, doctor, autora real y texto.
   * @returns Si quedó encolado o por qué no.
   */
  async enqueue(
    input: SupportReplyEmailInput,
  ): Promise<SupportReplyEmailResult> {
    try {
      const reader = this.em.fork();
      const patient = await this.repo.patientAccountOf(
        reader,
        input.conversationId,
        input.doctorPublicProfileId,
      );
      if (!patient.userId) {
        return { queued: false, skippedReason: 'El paciente no tiene cuenta' };
      }
      const address = await this.repo.emailOfUser(reader, patient.userId);
      if (address === null) {
        // Solo ids: ni la dirección que el titular escribió sin verificar.
        this.logger.info(
          {
            operation: 'community.support_reply.email_skipped',
            conversationId: input.conversationId,
            messageId: input.messageId,
            reason: 'NO_VERIFIED_EMAIL',
          },
          'Respuesta sin correo: la cuenta no tiene una dirección verificada con credencial activa',
        );
        return {
          queued: false,
          skippedReason:
            'La cuenta del paciente no tiene un correo verificado con credencial activa',
        };
      }
      const tenantNames = await this.repo.tenantNames(reader, [input.tenantId]);
      const email = composeSupportReplyEmail({
        doctorName: input.doctorName,
        organizationName: tenantNames.get(input.tenantId),
        bodyText: input.bodyText,
        disclosureShown: input.disclosureShown,
      });
      const actor: AuthenticatedUser = {
        id: input.authoredByUserId,
        roles: ['SUPPORT_STAFF'],
      };
      const request = await this.notifications.createRequest(
        {
          channelId: MESSAGING_SEED.emailChannelId,
          recipientUserId: patient.userId,
          recipientAddress: address,
          tenantId: input.tenantId,
          categoryConceptId: CONCEPTS.NOTIF_CATEGORY_MESSAGES,
          priority: EMAIL_PRIORITY,
          payloadJson: {
            kind: 'SUPPORT_REPLY_ON_BEHALF',
            fromName: email.fromName,
            subject: email.subject,
            bodyText: email.bodyText,
            bodyHtml: email.bodyHtml,
            // Registro de la autora real: la lee la auditoría, no el proveedor.
            authoredByUserId: input.authoredByUserId,
            // El PERFIL PÚBLICO del doctor (`community.public_profiles`). No es el
            // id que guarda `direct_messages.on_behalf_of_profile_id`, que es el
            // del perfil profesional: por eso el nombre no es el de la columna.
            onBehalfOfPublicProfileId: input.doctorPublicProfileId,
            delegateAssignmentId: input.delegateAssignmentId ?? null,
            disclosureShown: input.disclosureShown,
            conversationId: input.conversationId,
          },
          // Una respuesta, un correo: reenviar el mismo mensaje no duplica.
          debounceKey: `support-reply:${input.messageId}:email`,
          relatedResourceType: SUPPORT_REPLY_EMAIL_RESOURCE,
          relatedResourceId: input.messageId,
        },
        actor,
      );
      if (request.suppressed) {
        return {
          queued: false,
          requestId: request.id,
          skippedReason:
            request.suppressionReason ??
            'El paciente no acepta este aviso por correo',
        };
      }
      if (request.debounced) {
        return {
          queued: false,
          requestId: request.id,
          skippedReason: 'Ya había un correo igual sin enviar',
        };
      }
      return { queued: true, requestId: request.id };
    } catch (error: unknown) {
      this.logger.warn(
        {
          operation: 'community.support_reply.email',
          conversationId: input.conversationId,
          messageId: input.messageId,
          err: describeFailure(error),
        },
        'No se pudo encolar la respuesta por correo; el chat ya la tiene',
      );
      return { queued: false, skippedReason: 'No se pudo encolar el correo' };
    }
  }
}
