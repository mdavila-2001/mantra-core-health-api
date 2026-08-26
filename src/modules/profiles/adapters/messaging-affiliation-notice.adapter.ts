import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { SEED, type AuthenticatedUser } from '../../../common';
import { MESSAGING_SEED } from '../../../common/seed/messaging-seed.service';
import { NotificationsService } from '../../messaging/services';
import { PROF } from '../profiles.concepts';
import type {
  AffiliationNotice,
  AffiliationNoticeKind,
  AffiliationNoticePort,
  AffiliationNoticeResult,
} from '../ports/affiliation-notice.port';

/** Categoría de catálogo de cada aviso, para que la preferencia pueda nombrarla. */
const CATEGORIA: Readonly<Record<AffiliationNoticeKind, string>> = {
  AFFILIATION_APPROVED: PROF.NOTICE_AFFILIATION_APPROVED,
  AFFILIATION_REJECTED: PROF.NOTICE_AFFILIATION_REJECTED,
  AFFILIATION_REVOKED: PROF.NOTICE_AFFILIATION_REVOKED,
};

/**
 * Prioridad de entrega. Menor gana.
 *
 * La revocación va primero porque **cambia lo que el médico puede hacer ahora
 * mismo**: deja de poder aceptar turnos de esa organización, y si no se entera
 * lo descubre chocando contra un error en medio de la jornada. Aprobar y
 * rechazar cierran un trámite que él inició y que está esperando.
 */
const PRIORIDAD: Readonly<Record<AffiliationNoticeKind, number>> = {
  AFFILIATION_REVOKED: 2,
  AFFILIATION_APPROVED: 4,
  AFFILIATION_REJECTED: 4,
};

/**
 * Emisor de avisos del vínculo contra el canal in-app de mensajería (M35).
 *
 * Espeja `MessagingAgendaNoticeAdapter` de scheduling: mismo canal, misma
 * mecánica de solicitud + entrega, y la misma regla de que **emitir no rompe la
 * operación**. Una organización que aprueba un vínculo lo aprobó; que el aviso
 * no salga es un problema del aviso, no de la decisión.
 */
@Injectable()
export class MessagingAffiliationNoticeAdapter implements AffiliationNoticePort {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param notifications - Servicio de mensajería (M35).
   * @param logger - Registro estructurado.
   */
  constructor(
    private readonly notifications: NotificationsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MessagingAffiliationNoticeAdapter.name);
  }

  /**
   * Emite el aviso, y nunca lanza.
   *
   * Un fallo del canal vuelve como `{ delivered: false, skippedReason }` y se
   * registra. Dejar que una excepción de mensajería tumbara la aprobación
   * dejaría el vínculo a medio decidir por un problema de otro módulo.
   *
   * @param notice - El aviso a emitir.
   * @returns Si se entregó, y por qué no cuando corresponde.
   */
  async emit(notice: AffiliationNotice): Promise<AffiliationNoticeResult> {
    try {
      return await this.emitir(notice);
    } catch (error) {
      this.logger.warn(
        {
          operation: 'profiles.affiliation.notice',
          kind: notice.kind,
          affiliationId: notice.affiliationId,
          err: error,
        },
        'No se pudo emitir el aviso del vínculo',
      );
      return { delivered: false, skippedReason: 'El canal de avisos falló' };
    }
  }

  /**
   * El camino feliz, separado para que `emit` sea sólo la red de contención.
   *
   * @param notice - El aviso a emitir.
   * @returns Resultado de la entrega.
   */
  private async emitir(
    notice: AffiliationNotice,
  ): Promise<AffiliationNoticeResult> {
    const actor = this.actor(SEED.systemWorkerUserId);

    const request = await this.notifications.createRequest(
      {
        channelId: MESSAGING_SEED.inAppChannelId,
        recipientUserId: notice.recipientUserId,
        tenantId: notice.tenantId,
        categoryConceptId: CATEGORIA[notice.kind],
        priority: PRIORIDAD[notice.kind],
        payloadJson: {
          kind: notice.kind,
          subject: notice.subject,
          bodyText: notice.bodyText,
          // El destino navegable: la pantalla del historial laboral, que es
          // donde el vínculo se ve y donde el motivo se lee.
          route: '/account/my-profile',
          affiliationId: notice.affiliationId,
        },
        // Una decisión ocurre una vez; el rebote evita que un reintento del
        // llamador duplique la fila de la bandeja.
        debounceKey: `affiliation:${notice.affiliationId}:${notice.kind}`,
        relatedResourceType: 'profiles.practitioner_affiliations',
        relatedResourceId: notice.affiliationId,
      },
      actor,
    );

    if (request.suppressed) {
      return {
        delivered: false,
        skippedReason:
          request.suppressionReason ??
          'El destinatario no acepta este aviso por el canal in-app',
      };
    }
    if (request.debounced) {
      return { delivered: false, skippedReason: 'Ya había un aviso igual' };
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

    return { delivered: delivery.inAppNotificationId !== undefined };
  }

  /**
   * El actor de sistema con el que se escribe la notificación.
   *
   * @param userId - Cuenta de servicio.
   * @returns Un actor mínimo, que es lo que el servicio de mensajería pide.
   */
  private actor(userId: string): AuthenticatedUser {
    return { id: userId, roles: ['SYSTEM'] };
  }
}
