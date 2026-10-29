import type { EntityManager } from '@mikro-orm/postgresql';
import type { CreateOwnSiteDto } from '../../../../common/dto/create-own-site.dto';

export interface OwnSiteOwnerInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly practitionerProfileId: string;
}

export interface ProvisionedOwnSiteSummary {
  readonly practiceId: string;
  readonly siteId: string;
}

/**
 * Alta del consultorio propio que el profesional declara al registrarse (P20):
 * el mismo caso de uso que `POST /practitioners/me/sites`, dentro de la
 * transacción del alta.
 */
export interface OwnSiteProvisioningPort {
  provision(
    tx: EntityManager,
    owner: OwnSiteOwnerInput,
    site: CreateOwnSiteDto,
    actorUserId: string,
  ): Promise<ProvisionedOwnSiteSummary>;
}

export const OWN_SITE_PROVISIONING_PORT = Symbol(
  'IAM_OWN_SITE_PROVISIONING_PORT',
);
