import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS, SEED, type AuthenticatedUser } from '../../../common';
import { MESSAGING_SEED } from '../../../common/seed/messaging-seed.service';
import {
  PersonAccountLinks,
  PersonProfiles,
  Persons,
} from '../../profiles/entities';
import { NotificationsService } from '../../messaging/services';
import { PROF } from '../../profiles/profiles.concepts';
import { Tenants } from '../../directory/entities';
import { ServiceCatalog } from '../../billing/entities';
import { PublicProfiles } from '../../community/entities';
import { COMM } from '../../community/community.concepts';
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

/**
 * La ruta del portal con la ficha pública de la organización (`/o/:slug`; la
 * API la sirve en `GET o/:slug` de `CommunityPublicController`), donde la
 * paciente ve sus servicios y reserva.
 */
export function referredOrganizationRoute(slug: string): string {
  return `/o/${slug}`;
}

/**
 * El tipo de recurso del aviso de una derivación a una organización; el id es
 * el tenant destino. La campana no puede armar `/o/:slug` desde ese id: la
 * ruta va en `payloadJson.route`. Sólo se manda cuando hay ficha pública.
 */
export const REFERRED_ORGANIZATION_RESOURCE = 'ORGANIZATION_PROFILE';

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
 * Una derivación a una **organización** (tenant destino sin profesional)
 * también avisa: «Su médico le derivó a {organización}», con el servicio si lo
 * hay, y enlace a la ficha pública de la organización sólo si tiene una
 * pública y activa (la misma regla con la que `GET o/:slug` la sirve). Sin
 * ficha, el aviso sale sin enlace. No lleva el motivo (texto libre del médico):
 * la paciente lo lee en «Mis derivaciones». Si el tenant destino no existe o no
 * está activo, no hay aviso.
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
      if (referral === null) return false;
      const targetProfileId = referral.targetProfileId ?? null;
      const targetTenantId = referral.targetTenantId ?? null;
      if (targetProfileId === null && targetTenantId === null) return false;

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

      const referrer =
        referral.referringProfileId === undefined ||
        referral.referringProfileId === null
          ? null
          : await this.displayNameOf(em, referral.referringProfileId);
      const notice =
        targetProfileId !== null
          ? await this.practitionerNotice(
              em,
              targetProfileId,
              referrer,
              referral.reasonText,
            )
          : await this.organizationNotice(
              em,
              targetTenantId as string,
              referral.targetServiceCatalogId ?? null,
            );
      if (notice === null) return false;
      const { subject, bodyText } = notice;
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
            ...(notice.route === null ? {} : { route: notice.route }),
            referralId,
          },
          // El destino del aviso es la ficha del profesional (o de la
          // organización) donde la paciente reserva. La derivación misma viaja
          // en el payload. Sin ficha a la que llevar, el aviso no lleva destino.
          ...(notice.resource === null
            ? {}
            : {
                relatedResourceType: notice.resource.type,
                relatedResourceId: notice.resource.id,
              }),
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

  /** El aviso de siempre: su médico le recomienda a un profesional. */
  private async practitionerNotice(
    em: EntityManager,
    targetProfileId: string,
    referrer: string | null,
    reason: string | undefined | null,
  ): Promise<Notice> {
    const target = await this.displayNameOf(em, targetProfileId);
    const who = referrer === null ? 'Su médico' : referrer;
    const to = target === null ? 'otro profesional' : target;
    return {
      subject: 'Su médico le recomienda otra consulta',
      bodyText:
        `${who} le recomienda consultar con ${to}.${reasonSentence(reason)} ` +
        'Puede ver su ficha y reservar una cita desde su portal.',
      route: recommendedPractitionerRoute(targetProfileId),
      resource: {
        type: RECOMMENDED_PRACTITIONER_RESOURCE,
        id: targetProfileId,
      },
    };
  }

  /**
   * El aviso de una derivación a una organización: «Su médico le derivó a
   * {organización}», con el servicio si lo hay. El enlace sale sólo si la
   * organización tiene ficha pública activa.
   *
   * No lleva el motivo: es texto libre del médico (dato de salud) y la paciente
   * lo lee en «Mis derivaciones», a la que llega por `referralId`.
   *
   * @returns `null` si el tenant destino no existe o no está activo: no se
   *   manda a la paciente a una organización que no la puede atender.
   */
  private async organizationNotice(
    em: EntityManager,
    targetTenantId: string,
    targetServiceCatalogId: string | null,
  ): Promise<Notice | null> {
    const tenant = await em.findOne(Tenants, { id: targetTenantId });
    if (!tenant || tenant.statusConceptId !== CONCEPTS.TENANT_ACTIVE) {
      return null;
    }
    const trade = tenant.tradeName?.trim();
    const organization = trade ? trade : (tenant.legalName ?? null);
    const service =
      targetServiceCatalogId === null
        ? null
        : await em.findOne(ServiceCatalog, { id: targetServiceCatalogId });
    const serviceName = service?.name?.trim() ? service.name.trim() : null;
    const profile = await em.findOne(PublicProfiles, {
      targetId: targetTenantId,
      targetTypeConceptId: COMM.PROFILE_TARGET_ORGANIZATION,
      visibilityConceptId: COMM.PROFILE_VISIBILITY_PUBLIC,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    });
    const route = profile?.slug
      ? referredOrganizationRoute(profile.slug)
      : null;

    const to = organization === null ? 'otra organización' : organization;
    const what = serviceName === null ? '' : ` para ${serviceName}`;
    return {
      subject: `Su médico le derivó a ${to}`,
      bodyText:
        endWithPeriod(`Su médico le derivó a ${to}${what}`) +
        (route === null
          ? ''
          : ' Puede ver su ficha y reservar una cita desde su portal.'),
      route,
      resource:
        route === null
          ? null
          : { type: REFERRED_ORGANIZATION_RESOURCE, id: targetTenantId },
    };
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

/** Lo que la campana muestra y adónde lleva. */
interface Notice {
  subject: string;
  bodyText: string;
  /** Ruta del portal, o `null` si no hay a dónde llevar. */
  route: string | null;
  /** Destino de la campana (`relatedResource*`), o `null` sin enlace. */
  resource: { type: string; id: string } | null;
}

/** « Motivo: …» con su punto, o nada si el médico no escribió motivo. */
function reasonSentence(reason: string | undefined | null): string {
  return reason === undefined || reason === null || reason.trim() === ''
    ? ''
    : ` Motivo: ${endWithPeriod(reason.trim())}`;
}

/**
 * Cierra la frase: el motivo lo escribe el médico y casi nunca lleva punto,
 * y lo que sigue en el aviso empieza otra oración («Puede ver su ficha…»).
 */
function endWithPeriod(text: string): string {
  return /[.!?…]$/.test(text) ? text : `${text}.`;
}
