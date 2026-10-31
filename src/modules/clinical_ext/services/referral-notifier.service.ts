import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { SEED, type AuthenticatedUser } from '../../../common';
import { MESSAGING_SEED } from '../../../common/seed/messaging-seed.service';
import {
  PersonAccountLinks,
  PersonProfiles,
  Persons,
} from '../../profiles/entities';
import { NotificationsService } from '../../messaging/services';
import { PROF } from '../../profiles/profiles.concepts';
import { CEXT } from '../clinical_ext.concepts';
import { Referrals } from '../entities';

/** La ruta del portal donde el paciente ve al profesional y reserva con él. */
export function recommendedPractitionerRoute(targetProfileId: string): string {
  return `/directory/${targetProfileId}`;
}

/**
 * El tipo de recurso con el que la campana del paciente abre la ficha del
 * profesional recomendado. El front lo traduce a `/directory/:id`
 * (`core/notifications/notification-routes.ts`).
 */
export const RECOMMENDED_PRACTITIONER_RESOURCE = 'PRACTITIONER_PROFILE';

/** Prioridad de entrega de la campana (menor gana); la de un aviso de cita. */
const NOTICE_PRIORITY = 4;

/**
 * Le avisa a la paciente que su médico le recomienda consultar con otro
 * profesional (pedido del propietario, 24/10/2026).
 *
 * ## Qué hace y qué no
 *
 * Crea la solicitud de notificación por la **campana** y la entrega; el aviso
 * lleva `route` hacia la ficha del profesional recomendado, que es donde la
 * paciente reserva —la misma reserva de siempre—. Corre **después** de que la
 * derivación quedó escrita y **jamás puede romperla**: un destinatario sin
 * cuenta de portal, o un fallo de mensajería, se registran y se tragan, igual
 * que los avisos de agenda. La derivación ya existe y se ve en «Mis
 * derivaciones».
 *
 * No hay aviso por correo ni por push todavía: cada canal nuevo es un adaptador
 * nuevo, no un `if` más acá.
 */
@Injectable()
export class ReferralNotifier {
  constructor(
    private readonly em: EntityManager,
    private readonly notifications: NotificationsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ReferralNotifier.name);
  }

  /** `true` si el aviso llegó a la campana de la paciente. */
  async notifyRecommended(referralId: string): Promise<boolean> {
    try {
      const em = this.em.fork();
      const referral = await em.findOne(Referrals, { id: referralId });
      if (
        referral === null ||
        referral.targetProfileId === undefined ||
        referral.targetProfileId === null
      ) {
        return false;
      }

      const recipientUserId = await this.accountOf(
        em,
        referral.patientProfileId,
      );
      if (recipientUserId === null) {
        this.logger.info(
          { operation: 'clinical_ext.referral.notice', referralId },
          'Derivación sin destinatario con cuenta de portal',
        );
        return false;
      }

      const target = await this.displayNameOf(em, referral.targetProfileId);
      const referrer =
        referral.referringProfileId === undefined ||
        referral.referringProfileId === null
          ? null
          : await this.displayNameOf(em, referral.referringProfileId);
      const subject = 'Su médico le recomienda otra consulta';
      const bodyText = this.bodyOf(referrer, target, referral.reasonText);
      const actor: AuthenticatedUser = {
        id: SEED.systemWorkerUserId,
        roles: ['SYSTEM'],
      };

      const request = await this.notifications.createRequest(
        {
          channelId: MESSAGING_SEED.inAppChannelId,
          recipientUserId,
          categoryConceptId: CEXT.NOTICE_REFERRAL_RECOMMENDED,
          priority: NOTICE_PRIORITY,
          payloadJson: {
            kind: 'REFERRAL_RECOMMENDED',
            subject,
            bodyText,
            route: recommendedPractitionerRoute(referral.targetProfileId),
            referralId,
          },
          // El destino del aviso es el profesional recomendado: la campana lo
          // abre en su ficha, donde la paciente reserva. La derivación misma
          // viaja en el payload.
          relatedResourceType: RECOMMENDED_PRACTITIONER_RESOURCE,
          relatedResourceId: referral.targetProfileId,
        },
        actor,
      );
      if (request.suppressed || request.debounced) return false;

      await this.notifications.deliverNotification(
        request.id,
        {
          outcome: 'SENT',
          providerChannelConfigId: MESSAGING_SEED.inAppChannelConfigId,
          subject,
          bodyText,
        },
        actor,
      );
      return true;
    } catch (error: unknown) {
      this.logger.warn(
        {
          operation: 'clinical_ext.referral.notice',
          referralId,
          // Sólo el tipo: el error completo puede arrastrar datos de la persona.
          errorName: error instanceof Error ? error.name : 'unknown',
        },
        'No se pudo avisar de la derivación; queda registrada igual',
      );
      return false;
    }
  }

  private bodyOf(
    referrer: string | null,
    target: string | null,
    reason: string | undefined | null,
  ): string {
    const who = referrer === null ? 'Su médico' : referrer;
    const to = target === null ? 'otro profesional' : target;
    const why =
      reason === undefined || reason === null || reason.trim() === ''
        ? ''
        : ` Motivo: ${endWithPeriod(reason.trim())}`;
    return (
      `${who} le recomienda consultar con ${to}.${why} ` +
      'Puede ver su ficha y reservar una cita desde su portal.'
    );
  }

  private async personIdOf(
    em: EntityManager,
    profileId: string,
  ): Promise<string | null> {
    const person = await em.findOne(Persons, { id: profileId });
    if (person) return person.id;
    const profile = await em.findOne(PersonProfiles, { id: profileId });
    return profile?.personId ?? null;
  }

  private async accountOf(
    em: EntityManager,
    profileId: string,
  ): Promise<string | null> {
    const personId = await this.personIdOf(em, profileId);
    if (personId === null) return null;
    const link = await em.findOne(PersonAccountLinks, {
      personId,
      statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
    });
    return link?.userId ?? null;
  }

  private async displayNameOf(
    em: EntityManager,
    profileId: string,
  ): Promise<string | null> {
    const personId = await this.personIdOf(em, profileId);
    if (personId === null) return null;
    const person = await em.findOne(Persons, { id: personId });
    if (!person) return null;
    const composed = [person.name, person.lastName]
      .filter((part): part is string => typeof part === 'string')
      .join(' ')
      .trim();
    return person.displayName ?? (composed === '' ? null : composed);
  }
}

/**
 * Cierra la frase: el motivo lo escribe el médico y casi nunca lleva punto,
 * y lo que sigue en el aviso empieza otra oración («Puede ver su ficha…»).
 */
function endWithPeriod(text: string): string {
  return /[.!?…]$/.test(text) ? text : `${text}.`;
}
