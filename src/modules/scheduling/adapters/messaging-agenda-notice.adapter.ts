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
 * Emisor de avisos de agenda contra el canal in-app de mensajería (M35).
 *
 * ## Qué hace exactamente
 *
 * Por cada aviso: resuelve la cuenta del destinatario, crea la
 * `notification_request` —que es donde se evalúan consentimiento, preferencia
 * por categoría y horas de silencio— y registra la entrega, que para el canal
 * in-app **es** escribir la fila de la bandeja. No hay proveedor externo ni
 * stub: la evidencia de que el aviso llegó es una fila real en
 * `messaging.in_app_notifications`, no un log.
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

    if (request.suppressed) {
      return {
        delivered: false,
        notificationRequestId: request.id,
        skippedReason:
          request.suppressionReason ??
          'El destinatario no acepta este aviso por el canal in-app',
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

    return {
      delivered: delivery.inAppNotificationId !== undefined,
      notificationRequestId: request.id,
      ...(delivery.inAppNotificationId === undefined
        ? {}
        : { inAppNotificationId: delivery.inAppNotificationId }),
      ...(delivery.inAppNotificationId === undefined
        ? { skippedReason: 'La entrega no produjo bandeja in-app' }
        : {}),
    };
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
