import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { PreconditionFailedException } from '../../../../common';
import { PROF } from '../../profiles.concepts';
import { PractitionerAffiliationsRepository } from '../../infrastructure/repositories';
import {
  AFFILIATION_ORGANIZATIONS_PORT,
  type AffiliationOrganizationsPort,
} from '../ports/affiliation-organizations.port';
import {
  LINK_STATUS,
  ProfilesAffiliationsService,
} from './profiles-affiliations.service';

/** Un vínculo pedido desde el alta, y si hay que avisarle a la organización. */
export interface RegistrationAffiliation {
  readonly id: string;
  readonly practiceId: string;
  readonly practiceSiteId: string | null;
  readonly statusConceptId: string;
}

/**
 * Los vínculos con instituciones que el profesional declara **al registrarse**
 * (propietario, 2026-10-28: «falta la opción de seleccionar con qué
 * instituciones trabaja»).
 *
 * Es la misma fila que `POST /profiles/practitioners/me/affiliations` con
 * `practiceSiteId` —un `practitioner_affiliations` atado a la sede de la
 * organización—, con el mismo estado inicial (`initialState`): pendiente si la
 * organización tiene quién decida, declarado si no. Por eso el sello oficial
 * llega igual que siempre: cuando la organización lo aprueba en su bandeja
 * (`/tenants/{id}/practitioner-requests`).
 *
 * Lo que cambia es el momento: corre dentro de la transacción del alta, cuando
 * todavía no hay sesión. Por eso el estado se calcula **sin organizaciones
 * propias** —nadie aprueba su propio pedido el día que se registra— y el aviso a
 * la organización lo dispara quien llama, después de confirmar la transacción.
 */
@Injectable()
export class RegistrationAffiliationsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia, para el aviso posterior al alta.
   * @param organizations - Del slug público a la sede que recibe el pedido.
   * @param affiliationsRepo - Escritura de `practitioner_affiliations`.
   * @param affiliations - Estado inicial del vínculo y aviso a la organización.
   * @param logger - Logger estructurado; sólo ids.
   */
  constructor(
    private readonly em: EntityManager,
    @Inject(AFFILIATION_ORGANIZATIONS_PORT)
    private readonly organizations: AffiliationOrganizationsPort,
    private readonly affiliationsRepo: PractitionerAffiliationsRepository,
    private readonly affiliations: ProfilesAffiliationsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RegistrationAffiliationsService.name);
  }

  /**
   * Crea un vínculo por cada organización nombrada, dentro de `tx`.
   *
   * @param tx - Transacción del alta.
   * @param input - El profesional recién creado, los slugs públicos elegidos y quién escribe.
   * @returns Los vínculos creados, en el orden pedido.
   * @throws PreconditionFailedException si algún slug no nombra una organización pública activa.
   */
  async requestWithin(
    tx: EntityManager,
    input: {
      practitionerProfileId: string;
      organizationSlugs: readonly string[];
      actorUserId: string;
    },
  ): Promise<RegistrationAffiliation[]> {
    const slugs = [...new Set(input.organizationSlugs.map((s) => s.trim()))];
    if (slugs.length === 0) return [];

    const found = await this.organizations.findPublicOrganizations(tx, slugs);
    const unknown = slugs.filter((slug) => !found.some((o) => o.slug === slug));
    if (unknown.length > 0) {
      // Antes de escribir nada: un alta que se queda con la mitad de las
      // instituciones elegidas es peor que un error que dice cuál falló.
      throw new PreconditionFailedException(
        'Alguna de las instituciones elegidas ya no está disponible',
        { institutionSlugs: unknown },
      );
    }

    const startDate = new Date();
    const created: RegistrationAffiliation[] = [];
    for (const slug of slugs) {
      const organization = found.find((o) => o.slug === slug)!;
      const statusConceptId =
        organization.siteId === null
          ? // Sin sede no hay bandeja donde pedirlo: queda declarado, sin sello.
            LINK_STATUS.DECLARADO
          : await this.affiliations.initialState(tx, organization.siteId, {
              tenantIds: [],
            });
      const row = this.affiliationsRepo.create(tx, {
        practitionerProfileId: input.practitionerProfileId,
        organizationName: organization.name,
        practiceSiteId: organization.siteId ?? undefined,
        affiliationTypeConceptId: PROF.AFFILIATION_TYPE_EMPLOYMENT,
        startDate,
        statusConceptId,
        actorUserId: input.actorUserId,
      });
      created.push({
        id: row.id,
        practiceId: organization.practiceId,
        practiceSiteId: organization.siteId,
        statusConceptId,
      });
    }
    await tx.flush();
    this.logger.info(
      {
        operation: 'profiles.affiliation.registration',
        practitionerProfileId: input.practitionerProfileId,
        count: created.length,
      },
      'Registration affiliations recorded',
    );
    return created;
  }

  /**
   * Avisa a cada organización que tiene un pedido pendiente. Va **después** de
   * confirmar el alta: un aviso de un pedido que se deshizo sería falso.
   *
   * Nunca lanza, como el aviso del alta suelta de vínculos.
   *
   * @param practitionerProfileId - Quién pide.
   * @param created - Lo que devolvió {@link requestWithin}.
   */
  async notifyPending(
    practitionerProfileId: string,
    created: readonly RegistrationAffiliation[],
  ): Promise<void> {
    for (const affiliation of created) {
      if (
        affiliation.statusConceptId !== LINK_STATUS.PENDIENTE ||
        affiliation.practiceSiteId === null
      ) {
        continue;
      }
      try {
        const site = await this.organizations.findSite(
          this.em.fork(),
          affiliation.practiceSiteId,
        );
        const tenantId = site?.managingTenantId;
        if (!tenantId) continue;
        await this.affiliations.orderNotify(
          tenantId,
          affiliation.id,
          practitionerProfileId,
        );
      } catch (error: unknown) {
        this.logger.warn(
          {
            operation: 'profiles.affiliation.registration.notify',
            affiliationId: affiliation.id,
            err: error,
          },
          'Could not notify organization about registration affiliation',
        );
      }
    }
  }
}
