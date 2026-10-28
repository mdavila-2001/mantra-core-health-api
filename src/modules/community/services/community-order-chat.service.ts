import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../common';
import { PublicProfilesRepository } from '../repositories';
import { COMM } from '../community.concepts';
import { CommunityErrorReason } from '../community.error-reasons';
import { CommunityMessagingService } from './community-messaging.service';
import { CommunityOrganizationStaffService } from './community-organization-staff.service';
import type { PublicProfiles } from '../entities';

/** Cómo un contexto de negocio nombra a la organización con la que se habla. */
export interface OrganizationShowcaseRef {
  /** Clave del llamador (p. ej. el id de la farmacia) para devolver el mapa. */
  readonly key: string;
  /** Tenant de la organización: su vitrina tiene `target_id = tenant_id`. */
  readonly tenantId: string;
  /** La vitrina que el contexto ya enlazó, si la enlazó. */
  readonly publicProfileId?: string | null;
}

/** La vitrina con la que se puede hablar. */
export interface OrganizationShowcase {
  readonly profileId: string;
  readonly slug: string;
}

/** Quién pide abrir el hilo de un hecho que une a paciente y organización. */
export interface OrderConversationRequest {
  /** La organización (su vitrina). */
  readonly organization: Omit<OrganizationShowcaseRef, 'key'>;
  /** Cuenta del paciente titular del hecho (pedido). */
  readonly patientUserId: string;
  /** Desde qué lado se abre: el paciente o el personal de la organización. */
  readonly openedBy: 'PATIENT' | 'ORGANIZATION_STAFF';
}

/** El hilo abierto o reutilizado. */
export interface OrderConversation {
  readonly conversationId: string;
  readonly organizationProfileId: string;
}

/**
 * El hilo directo entre un paciente y la vitrina de una organización (una
 * farmacia), abierto desde un hecho que ya los une: un pedido.
 *
 * Es el análogo de {@link CommunityBookingChatService} para el pedido de
 * farmacia, con la misma regla de fondo: **no crea ni publica la vitrina del
 * paciente**. Si el paciente no tiene perfil comunitario (aunque sea privado),
 * responde 422 `PATIENT_CHAT_PROFILE_MISSING` y no escribe nada.
 *
 * Usa el canal de sistema ({@link CommunityMessagingService.createSystemDirectConversation}),
 * que admite un perfil de paciente privado y deja iniciar al personal como la
 * farmacia. El rol `SYSTEM` se concede sólo a esa llamada; quién puede actuar
 * con cada perfil lo sigue decidiendo la regla de mensajería
 * (`CommunityVisibilityService.assertActsAsMessagingProfile`). Bloqueos,
 * idempotencia (`findDirectBetween`) y el aviso de conversación nueva son los
 * de siempre.
 */
@Injectable()
export class CommunityOrderChatService {
  constructor(
    private readonly em: EntityManager,
    private readonly profilesRepo: PublicProfilesRepository,
    private readonly messaging: CommunityMessagingService,
    private readonly organizationStaff: CommunityOrganizationStaffService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommunityOrderChatService.name);
  }

  /**
   * Las vitrinas con las que se puede hablar, en lote: de organización,
   * activas, públicas y de un tenant activo y verificado. Las que no cumplen
   * no aparecen en el mapa.
   *
   * @param em - Contexto de persistencia.
   * @param refs - Organizaciones a resolver.
   * @returns Mapa `key → vitrina`.
   */
  async findOrganizationShowcases(
    em: EntityManager,
    refs: readonly OrganizationShowcaseRef[],
  ): Promise<Map<string, OrganizationShowcase>> {
    const result = new Map<string, OrganizationShowcase>();
    if (refs.length === 0) return result;

    const linkedIds = [
      ...new Set(
        refs
          .map((ref) => ref.publicProfileId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const tenantIds = [...new Set(refs.map((ref) => ref.tenantId))];
    const [linked, byTarget, verifiedTenants] = await Promise.all([
      this.profilesRepo.listByIds(em, linkedIds),
      this.profilesRepo.listByTargetIds(em, tenantIds),
      this.organizationStaff.verifiedActiveTenantIds(em, tenantIds),
    ]);
    const linkedById = new Map(linked.map((p) => [p.id, p]));
    const targetById = new Map(byTarget.map((p) => [p.targetId, p]));

    for (const ref of refs) {
      // La vitrina enlazada manda, pero sólo si es de esa misma organización:
      // un enlace roto no puede llevar el chat a la vitrina de otra.
      const fromLink = ref.publicProfileId
        ? linkedById.get(ref.publicProfileId)
        : undefined;
      const profile =
        fromLink?.targetId === ref.tenantId
          ? fromLink
          : targetById.get(ref.tenantId);
      if (
        profile &&
        this.isReachable(profile) &&
        verifiedTenants.has(profile.targetId)
      ) {
        result.set(ref.key, { profileId: profile.id, slug: profile.slug });
      }
    }
    return result;
  }

  /**
   * Abre o reutiliza el hilo paciente ↔ vitrina de la organización.
   *
   * La autorización sobre el **hecho** (que el actor sea el titular del pedido o
   * personal de su farmacia) la hace el llamador. Acá se exige además que el
   * actor pueda escribir con el perfil con el que inicia: el titular con el
   * suyo; el personal, con la vitrina por su membresía activa.
   *
   * @throws PreconditionFailedException (422) con
   *   `ORGANIZATION_CHAT_PROFILE_UNAVAILABLE` o `PATIENT_CHAT_PROFILE_MISSING`,
   *   o la de un bloqueo entre los perfiles.
   * @throws ForbiddenException si el actor no puede actuar con su perfil.
   */
  async openOrderConversation(
    request: OrderConversationRequest,
    actor: AuthenticatedUser,
  ): Promise<OrderConversation> {
    const em = this.em.fork();
    const showcases = await this.findOrganizationShowcases(em, [
      { key: 'organization', ...request.organization },
    ]);
    const organization = showcases.get('organization');
    if (!organization) {
      throw new PreconditionFailedException(
        'La farmacia no tiene una vitrina activa con la que conversar',
        { tenantId: request.organization.tenantId },
        CommunityErrorReason.ORGANIZATION_CHAT_PROFILE_UNAVAILABLE,
      );
    }

    const patientProfile = await this.profilesRepo.findByTarget(
      em,
      request.patientUserId,
    );
    if (
      !patientProfile ||
      patientProfile.statusConceptId !== CONCEPTS.STATE_ACTIVE ||
      this.organizationStaff.isOrganizationProfile(patientProfile)
    ) {
      // No se crea: hacerlo publicaría (o al menos daría de alta) a un
      // paciente en la red sin que lo haya decidido.
      throw new PreconditionFailedException(
        'El paciente todavía no tiene un perfil con el que conversar',
        {},
        CommunityErrorReason.PATIENT_CHAT_PROFILE_MISSING,
      );
    }

    const participantProfileIds =
      request.openedBy === 'PATIENT'
        ? [patientProfile.id, organization.profileId]
        : [organization.profileId, patientProfile.id];

    const thread = await this.messaging.createSystemDirectConversation(
      { conversationType: 'DIRECT', participantProfileIds },
      { ...actor, roles: [...actor.roles, 'SYSTEM'] },
    );

    this.logger.info(
      {
        operation: 'community.order-chat.open',
        conversationId: thread.id,
        organizationProfileId: organization.profileId,
        openedBy: request.openedBy,
      },
      'Order conversation opened or reused',
    );
    return {
      conversationId: thread.id,
      organizationProfileId: organization.profileId,
    };
  }

  /** Vitrina de organización activa y pública. */
  private isReachable(profile: PublicProfiles): boolean {
    return (
      this.organizationStaff.isOrganizationProfile(profile) &&
      profile.statusConceptId === CONCEPTS.STATE_ACTIVE &&
      profile.visibilityConceptId === COMM.PROFILE_VISIBILITY_PUBLIC
    );
  }
}
