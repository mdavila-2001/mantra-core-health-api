import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS, SEED, type AuthenticatedUser } from '../../../common';
import { MESSAGING_SEED } from '../../../common/seed/messaging-seed.service';
import { NotificationsService } from '../../messaging/services';
import { SCHED } from '../scheduling.concepts';
import { SchedulingNoticeRepository } from '../repositories/scheduling-notice.repository';
import type {
  AgendaNotice,
  AgendaNoticeKind,
  AgendaNoticePort,
  AgendaNoticeResult,
} from '../ports/agenda-notice.port';

/** Categoría de catálogo de cada aviso, para que la preferencia pueda nombrarla. */
const CATEGORIA: Readonly<Record<AgendaNoticeKind, string>> = {
  SLOT_RELEASED: SCHED.NOTICE_SLOT_RELEASED,
  PRACTITIONER_DELAY: SCHED.NOTICE_PRACTITIONER_DELAY,
  APPOINTMENT_REMINDER: SCHED.NOTICE_APPOINTMENT_REMINDER,
  BOOKING_STATE_CHANGED: SCHED.NOTICE_BOOKING_STATE_CHANGED,
};

/**
 * Prioridad de entrega. Menor gana (lo declara el DTO de mensajería).
 *
 * Un cupo que se liberó caduca —lo toma otro— y una demora se sabe mientras la
 * persona todavía está viniendo: esos dos van antes que un recordatorio de
 * mañana. No es una preferencia estética: es el orden en que el worker vacía la
 * cola cuando hay atraso.
 */
const PRIORIDAD: Readonly<Record<AgendaNoticeKind, number>> = {
  SLOT_RELEASED: 2,
  PRACTITIONER_DELAY: 2,
  BOOKING_STATE_CHANGED: 4,
  APPOINTMENT_REMINDER: 6,
};

/**
 * Sufijo de la clave de rebote del canal correo.
 *
 * **Sin esto el correo no sale nunca.** `createRequest` colapsa las repetidas
 * buscando por `debounceKey` **a secas** —`findLiveRequestByDebounceKey` no
 * filtra por canal—, así que la solicitud de correo con la misma clave que la
 * in-app se rebota contra ella y devuelve `debounced: true` sin crear fila.
 *
 * Namespacear por canal conserva las dos propiedades que se quieren a la vez:
 * dos avisos iguales siguen colapsando dentro de su canal, y el correo deja de
 * competir con la campana por la misma clave.
 */
const REBOTE_CORREO = ':email';

/**
 * Emisor de avisos de agenda contra los canales de mensajería (M35).
 *
 * ## Qué hace exactamente
 *
 * Por cada aviso: resuelve la cuenta del destinatario y emite por **cada canal
 * habilitado** para esa persona y esa categoría.
 *
 * - **In-app**: crea la `notification_request` —que es donde se evalúan
 *   consentimiento, preferencia por categoría y horas de silencio— y registra
 *   la entrega, que para este canal **es** escribir la fila de la bandeja. No
 *   hay proveedor externo ni stub: la evidencia de que el aviso llegó es una
 *   fila real en `messaging.in_app_notifications`, no un log.
 * - **Correo**: crea la solicitud contra `CHANNEL_TYPE_EMAIL` con la dirección
 *   del destinatario y **no** la entrega acá. El envío lo hace el worker de
 *   mensajería (`notification-delivery.job`) contra el proveedor real —Gmail
 *   API— fuera de toda transacción. Es el mismo camino que ya usa el correo de
 *   verificación de `iam`.
 *
 * ## Por qué el correo va después y en su propio `try`
 *
 * Porque el in-app es el canal que la agenda ya daba por cierto. Un fallo del
 * correo —sin dirección declarada, preferencia en contra, mensajería caída— no
 * puede cambiar lo que `emit` devuelve en `delivered`, que es lo que los cuatro
 * puntos de emisión leen. El correo se informa aparte (`emailRequestId`,
 * `emailSkippedReason`) y nunca degrada el resultado del in-app.
 *
 * ## Qué NO viaja por correo
 *
 * El cuerpo del correo es el mismo texto que la campana, y ese texto **no lleva
 * datos clínicos**: los cuatro redactores de `notices/agenda-notices.ts` sólo
 * componen quién, cuándo, cuánto se demora y el motivo administrativo de un
 * cambio —el `reasonText` obligatorio de mover y cancelar—. El motivo de
 * **consulta** no aparece en ninguno de los cuatro, y no debe agregarse: un
 * correo es un canal que el destinatario no controla.
 *
 * ## Por qué no lanza nunca
 *
 * Porque emitir no puede romper la agenda (regla 1 del puerto). Un paciente sin
 * cuenta de portal, una preferencia en contra o un canal mal configurado son
 * resultados del aviso, no fallos de la cancelación que lo originó. Todos
 * vuelven como `{ delivered: false, skippedReason }` y quedan en el log con su
 * causa.
 *
 * ## Qué cambia cuando llegue P1
 *
 * Sólo este archivo. El puerto y los cuatro puntos de emisión ya están escritos
 * contra la forma que P1 va a publicar; sustituir el proveedor de
 * `AGENDA_NOTICE_PORT` en `scheduling.module.ts` por un adaptador que delegue en
 * su servicio deja el resto del carril intacto.
 */
@Injectable()
export class MessagingAgendaNoticeAdapter implements AgendaNoticePort {
  constructor(
    private readonly em: EntityManager,
    private readonly notifications: NotificationsService,
    private readonly noticeRepo: SchedulingNoticeRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MessagingAgendaNoticeAdapter.name);
  }

  /** Emite un aviso; nunca lanza. */
  async emit(notice: AgendaNotice): Promise<AgendaNoticeResult> {
    try {
      return await this.entregar(notice);
    } catch (error: unknown) {
      // Un aviso que no sale no puede tumbar la operación que lo originó: la
      // cita ya está cancelada/promovida/confirmada y esa transacción cerró.
      this.logger.error(
        {
          operation: 'scheduling.notice.emit',
          kind: notice.kind,
          relatedResourceId: notice.relatedResourceId,
          err: error,
        },
        'No se pudo emitir el aviso de agenda',
      );
      return {
        delivered: false,
        skippedReason:
          'La emisión del aviso falló; la operación no se revierte',
      };
    }
  }

  /**
   * Emite un lote.
   *
   * En serie y no en paralelo: son escrituras contra la misma base y el lote lo
   * produce un worker que no tiene prisa. Lanzarlas juntas sólo adelantaría la
   * saturación del pool de conexiones.
   */
  async emitMany(
    notices: readonly AgendaNotice[],
  ): Promise<AgendaNoticeResult[]> {
    const resultados: AgendaNoticeResult[] = [];
    for (const notice of notices) {
      resultados.push(await this.emit(notice));
    }
    return resultados;
  }

  /** El camino feliz, separado para que {@link emit} sea sólo la red de seguridad. */
  private async entregar(notice: AgendaNotice): Promise<AgendaNoticeResult> {
    const recipientUserId = await this.resolverDestinatario(notice);
    if (recipientUserId === null) {
      this.logger.info(
        {
          operation: 'scheduling.notice.emit',
          kind: notice.kind,
          patientProfileId: notice.recipient.patientProfileId,
        },
        'Aviso sin destinatario con cuenta de portal',
      );
      return {
        delivered: false,
        skippedReason: 'El destinatario no tiene cuenta de portal',
      };
    }

    const actor = this.actor(notice.actorUserId ?? SEED.systemWorkerUserId);

    const request = await this.notifications.createRequest(
      {
        channelId: MESSAGING_SEED.inAppChannelId,
        recipientUserId,
        ...(notice.tenantId === undefined ? {} : { tenantId: notice.tenantId }),
        categoryConceptId: CATEGORIA[notice.kind],
        priority: PRIORIDAD[notice.kind],
        payloadJson: {
          kind: notice.kind,
          subject: notice.subject,
          bodyText: notice.bodyText,
          ...(notice.payload ?? {}),
        },
        ...(notice.debounceKey === undefined
          ? {}
          : { debounceKey: notice.debounceKey }),
        relatedResourceType: notice.relatedResourceType,
        ...(notice.relatedResourceId === undefined
          ? {}
          : { relatedResourceId: notice.relatedResourceId }),
      },
      actor,
    );

    // La preferencia se guarda por (usuario, canal, categoría): que la campana
    // esté silenciada no dice nada del correo. Por eso estos dos caminos
    // igualmente intentan el correo en vez de cortar la emisión entera.
    if (request.suppressed) {
      return {
        delivered: false,
        notificationRequestId: request.id,
        skippedReason:
          request.suppressionReason ??
          'El destinatario no acepta este aviso por el canal in-app',
        ...(await this.encolarCorreo(notice, recipientUserId, actor)),
      };
    }

    // Rebotada: ya hay una solicitud viva con la misma clave. Entregarla otra
    // vez duplicaría la fila de la bandeja, que es exactamente lo que el rebote
    // existe para evitar.
    if (request.debounced) {
      return {
        delivered: false,
        notificationRequestId: request.id,
        skippedReason: 'Ya había un aviso igual sin entregar',
        ...(await this.encolarCorreo(notice, recipientUserId, actor)),
      };
    }

    const delivery = await this.notifications.deliverNotification(
      request.id,
      {
        outcome: 'SENT',
        providerChannelConfigId: MESSAGING_SEED.inAppChannelConfigId,
        subject: notice.subject,
        bodyText: notice.bodyText,
      },
      actor,
    );

    const correo = await this.encolarCorreo(notice, recipientUserId, actor);

    return {
      delivered: delivery.inAppNotificationId !== undefined,
      notificationRequestId: request.id,
      ...(delivery.inAppNotificationId === undefined
        ? {}
        : { inAppNotificationId: delivery.inAppNotificationId }),
      ...(delivery.inAppNotificationId === undefined
        ? { skippedReason: 'La entrega no produjo bandeja in-app' }
        : {}),
      ...correo,
    };
  }

  /**
   * Encola el mismo aviso por correo, si el destinatario tiene dirección.
   *
   * No entrega: sólo crea la solicitud. Quien la despacha es el worker de
   * mensajería contra el proveedor real, fuera de esta transacción y de
   * cualquier ventana de lock —que es justamente lo que el puerto exige y lo
   * que el correo de verificación de `iam` ya hace—.
   *
   * Atrapa todo por su cuenta: el in-app ya se entregó cuando esto corre, y un
   * fallo de acá no puede volverlo atrás ni cambiar lo que `emit` devuelve.
   *
   * @param notice - El aviso, con el texto ya redactado.
   * @param recipientUserId - Cuenta destinataria, ya resuelta para el in-app.
   * @param actor - Con quién se firma la solicitud.
   */
  private async encolarCorreo(
    notice: AgendaNotice,
    recipientUserId: string,
    actor: AuthenticatedUser,
  ): Promise<
    Pick<AgendaNoticeResult, 'emailRequestId' | 'emailSkippedReason'>
  > {
    try {
      const direccion = await this.noticeRepo.findEmailForUser(
        this.em.fork(),
        recipientUserId,
      );
      if (direccion === null) {
        return { emailSkippedReason: 'La cuenta no declaró correo' };
      }

      const request = await this.notifications.createRequest(
        {
          channelId: MESSAGING_SEED.emailChannelId,
          recipientUserId,
          recipientAddress: direccion,
          ...(notice.tenantId === undefined
            ? {}
            : { tenantId: notice.tenantId }),
          categoryConceptId: CATEGORIA[notice.kind],
          priority: PRIORIDAD[notice.kind],
          payloadJson: {
            kind: notice.kind,
            subject: notice.subject,
            bodyText: notice.bodyText,
            ...(notice.payload ?? {}),
          },
          ...(notice.debounceKey === undefined
            ? {}
            : { debounceKey: `${notice.debounceKey}${REBOTE_CORREO}` }),
          relatedResourceType: notice.relatedResourceType,
          ...(notice.relatedResourceId === undefined
            ? {}
            : { relatedResourceId: notice.relatedResourceId }),
        },
        actor,
      );

      if (request.suppressed) {
        return {
          emailRequestId: request.id,
          emailSkippedReason:
            request.suppressionReason ??
            'El destinatario no acepta este aviso por correo',
        };
      }
      if (request.debounced) {
        return {
          emailRequestId: request.id,
          emailSkippedReason: 'Ya había un correo igual sin enviar',
        };
      }
      return { emailRequestId: request.id };
    } catch (error: unknown) {
      this.logger.warn(
        {
          operation: 'scheduling.notice.email',
          kind: notice.kind,
          relatedResourceId: notice.relatedResourceId,
          err: error,
        },
        'No se pudo encolar el correo del aviso; el in-app ya se entregó',
      );
      return { emailSkippedReason: 'No se pudo encolar el correo' };
    }
  }

  /** La cuenta a la que va el aviso, venga dada o haya que deducirla del perfil. */
  private async resolverDestinatario(
    notice: AgendaNotice,
  ): Promise<string | null> {
    if (notice.recipient.userId !== undefined) return notice.recipient.userId;
    if (notice.recipient.patientProfileId === undefined) return null;
    return this.noticeRepo.findAccountForProfile(
      this.em.fork(),
      notice.recipient.patientProfileId,
    );
  }

  /**
   * El actor con el que se firma la solicitud.
   *
   * Mensajería exige uno —`authorized_by_user_id` es NOT NULL— y en las
   * emisiones que dispara un worker no hay persona detrás: se firma con la
   * cuenta de servicio, que existe en `iam.users` precisamente para esto.
   */
  private actor(userId: string): AuthenticatedUser {
    return { id: userId, roles: ['SYSTEM'] };
  }
}

/** Estado con el que nace un aviso in-app. Re-exportado para las pruebas. */
export const AVISO_NO_LEIDO = CONCEPTS.INAPP_UNREAD;
