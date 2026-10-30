import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS, SEED, type AuthenticatedUser } from '../../../../common';
import { MESSAGING_SEED } from '../../../../common/seed/messaging-seed.service';
import { ContactPoints } from '../../../common/entities';
import { NotificationsService } from '../../../messaging/services';
import { NOTIFICATION_CATEGORY_CONCEPT } from '../../../messaging/notifications.contract';
import { PersonAccountLinksRepository } from '../repositories';
import {
  isCriticalAdmissionNotice,
  type AdmissionNotice,
  type AdmissionNoticeKind,
  type AdmissionNoticePort,
  type AdmissionNoticeResult,
} from '../../application/ports/admission-notice.port';

/** Título corto, lo que se lee en la campana sin abrir nada. */
const SUBJECT: Readonly<Record<AdmissionNoticeKind, string>> = {
  RECEIVED: 'Recibimos su solicitud de verificación',
  INFO_REQUIRED: 'Necesitamos más información para verificar su cuenta',
  VERIFIED: 'Su cuenta fue verificada',
  REJECTED: 'Hay novedades en su solicitud de verificación',
  SUSPENDED: 'Hay novedades en su verificación',
  REINSTATED: 'Su verificación fue restablecida',
  EXPIRED: 'Su verificación venció',
  ABANDONED: 'Su solicitud de verificación se cerró por falta de respuesta',
  WITHDRAWN: 'Retiró su solicitud de verificación',
};

/** La categoría `ADMISSION`: lo que el destinatario puede silenciar (salvo lo crítico). */
const CATEGORY = NOTIFICATION_CATEGORY_CONCEPT.ADMISSION;

/** Menor número, más urgente: lo que cambia lo que puede hacer va primero. */
const PRIORITY: Readonly<Record<AdmissionNoticeKind, number>> = {
  SUSPENDED: 2,
  EXPIRED: 2,
  INFO_REQUIRED: 3,
  VERIFIED: 4,
  REJECTED: 4,
  REINSTATED: 4,
  ABANDONED: 5,
  RECEIVED: 5,
  WITHDRAWN: 5,
};

/**
 * Emisor de avisos de admisión contra mensajería (M35): bandeja in-app y, si el
 * médico dejó un correo, un correo.
 *
 * Espeja `MessagingAffiliationNoticeAdapter`: `debounceKey` por admisión y
 * estado, y la regla de que emitir no rompe la operación. El cuerpo no lleva el
 * motivo ni datos personales: el motivo se lee, autenticado, en
 * `GET /profiles/practitioners/me/admission`.
 */
@Injectable()
export class MessagingAdmissionNoticeAdapter implements AdmissionNoticePort {
  /**
   * @param notifications - Servicio de mensajería (M35).
   * @param em - Para resolver la cuenta y el correo del profesional.
   * @param accountLinks - Vínculo persona ↔ cuenta.
   * @param logger - Registro estructurado.
   */
  constructor(
    private readonly notifications: NotificationsService,
    private readonly em: EntityManager,
    private readonly accountLinks: PersonAccountLinksRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MessagingAdmissionNoticeAdapter.name);
  }

  /** Emite el aviso y nunca lanza. */
  async emit(notice: AdmissionNotice): Promise<AdmissionNoticeResult> {
    try {
      return await this.issue(notice);
    } catch (error) {
      this.logger.warn(
        {
          operation: 'profiles.admission.notice',
          kind: notice.kind,
          admissionId: notice.admissionId,
          err: error,
        },
        'No se pudo emitir el aviso de la admisión',
      );
      return { delivered: false, skippedReason: 'El canal de avisos falló' };
    }
  }

  private async issue(notice: AdmissionNotice): Promise<AdmissionNoticeResult> {
    const em = this.em.fork();
    const link = await this.accountLinks.findActiveByPerson(
      em,
      notice.practitionerProfileId,
    );
    if (!link) {
      return {
        delivered: false,
        skippedReason: 'El profesional no tiene cuenta vinculada',
      };
    }
    const actor: AuthenticatedUser = {
      id: SEED.systemWorkerUserId,
      roles: ['SYSTEM'],
    };
    const bodyText =
      'Hay novedades en su verificación. Ingrese a su cuenta para ver el detalle.';
    const debounceKey = `admission:${notice.admissionId}:${notice.statusCode}`;

    const request = await this.notifications.createRequest(
      {
        channelId: MESSAGING_SEED.inAppChannelId,
        recipientUserId: link.userId,
        tenantId: SEED.tenantId,
        categoryConceptId: CATEGORY,
        priority: PRIORITY[notice.kind],
        payloadJson: {
          kind: `ADMISSION_${notice.kind}`,
          subject: SUBJECT[notice.kind],
          bodyText,
          route: '/account/my-profile',
          admissionId: notice.admissionId,
        },
        debounceKey,
        relatedResourceType: 'profiles.practitioner_admissions',
        relatedResourceId: notice.admissionId,
      },
      actor,
      { mandatory: isCriticalAdmissionNotice(notice.kind) },
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
        subject: SUBJECT[notice.kind],
        bodyText,
      },
      actor,
    );

    await this.enqueueEmail(
      em,
      notice,
      link.userId,
      debounceKey,
      bodyText,
      actor,
    );
    return { delivered: delivery.inAppNotificationId !== undefined };
  }

  /** El correo es un complemento: si no hay dirección o el canal falla, no pasa nada. */
  private async enqueueEmail(
    em: EntityManager,
    notice: AdmissionNotice,
    userId: string,
    debounceKey: string,
    bodyText: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    try {
      const contacts = await em.find(ContactPoints, {
        ownerId: notice.practitionerProfileId,
        systemConceptId: CONCEPTS.CONTACT_EMAIL,
      });
      const address =
        contacts.find((c) => c.useConceptId === CONCEPTS.CONTACT_USE_WORK)
          ?.value ?? contacts[0]?.value;
      if (!address) return;
      await this.notifications.createRequest(
        {
          channelId: MESSAGING_SEED.emailChannelId,
          recipientUserId: userId,
          recipientAddress: address,
          tenantId: SEED.tenantId,
          categoryConceptId: CATEGORY,
          priority: PRIORITY[notice.kind],
          payloadJson: { subject: SUBJECT[notice.kind], bodyText },
          debounceKey: `${debounceKey}:email`,
          relatedResourceType: 'profiles.practitioner_admissions',
          relatedResourceId: notice.admissionId,
        },
        actor,
        { mandatory: isCriticalAdmissionNotice(notice.kind) },
      );
    } catch (error) {
      this.logger.warn(
        {
          operation: 'profiles.admission.notice.email',
          admissionId: notice.admissionId,
          err: error,
        },
        'No se pudo encolar el correo de la admisión',
      );
    }
  }
}
