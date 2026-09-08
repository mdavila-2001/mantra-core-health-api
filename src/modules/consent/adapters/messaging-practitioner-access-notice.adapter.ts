import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { SEED, type AuthenticatedUser } from '../../../common';
import { MESSAGING_SEED } from '../../../common/seed/messaging-seed.service';
import { NotificationsService } from '../../messaging/services';
import { CONS } from '../consent.concepts';
import type {
  PractitionerAccessNotice,
  PractitionerAccessNoticeKind,
  PractitionerAccessNoticePort,
  PractitionerAccessNoticeResult,
} from '../ports/practitioner-access-notice.port';

const CATEGORIA: Readonly<Record<PractitionerAccessNoticeKind, string>> = {
  ACCESS_REQUESTED: CONS.NOTICE_ACCESS_REQUESTED,
  ACCESS_ACCEPTED: CONS.NOTICE_ACCESS_DECIDED,
  ACCESS_DECLINED: CONS.NOTICE_ACCESS_DECIDED,
};

/**
 * Emisor de avisos del vínculo médico-paciente contra el canal in-app (M35).
 *
 * Espeja `MessagingAffiliationNoticeAdapter`: mismo canal, misma mecánica de
 * solicitud + entrega, y la misma regla de que emitir no rompe la operación.
 */
@Injectable()
export class MessagingPractitionerAccessNoticeAdapter implements PractitionerAccessNoticePort {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MessagingPractitionerAccessNoticeAdapter.name);
  }

  async emit(
    notice: PractitionerAccessNotice,
  ): Promise<PractitionerAccessNoticeResult> {
    try {
      return await this.emitir(notice);
    } catch (error) {
      this.logger.warn(
        {
          operation: 'consent.practitioner-access.notice',
          kind: notice.kind,
          requestId: notice.requestId,
          err: error,
        },
        'No se pudo emitir el aviso del vínculo médico-paciente',
      );
      return { delivered: false, skippedReason: 'El canal de avisos falló' };
    }
  }

  private async emitir(
    notice: PractitionerAccessNotice,
  ): Promise<PractitionerAccessNoticeResult> {
    const actor: AuthenticatedUser = {
      id: SEED.systemWorkerUserId,
      roles: ['SYSTEM'],
    };

    const request = await this.notifications.createRequest(
      {
        channelId: MESSAGING_SEED.inAppChannelId,
        recipientUserId: notice.recipientUserId,
        tenantId: notice.tenantId ?? SEED.tenantId,
        categoryConceptId: CATEGORIA[notice.kind],
        priority: notice.kind === 'ACCESS_REQUESTED' ? 4 : 5,
        payloadJson: {
          kind: notice.kind,
          subject: notice.subject,
          bodyText: notice.bodyText,
          // El destino navegable: la bandeja de solicitudes de vínculo del
          // paciente (o, del lado del profesional, el archivo clínico donde
          // vuelve a buscarlo).
          route:
            notice.kind === 'ACCESS_REQUESTED'
              ? '/my-account/access-requests'
              : '/medical-records',
          requestId: notice.requestId,
        },
        debounceKey: `practitioner-access:${notice.requestId}:${notice.kind}`,
        relatedResourceType: 'consent.consents',
        relatedResourceId: notice.requestId,
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
}
