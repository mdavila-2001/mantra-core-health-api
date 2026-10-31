import type { EntityManager } from '@mikro-orm/postgresql';

/** Dónde dice trabajar el profesional al registrarse. */
export interface WorkplaceRequestsInput {
  readonly practitionerProfileId: string;
  /** Slugs públicos de organizaciones de la plataforma. */
  readonly institutionSlugs: readonly string[];
  /** Aseguradoras del catálogo público. */
  readonly insurerCarrierIds: readonly string[];
  readonly actorUserId: string;
}

/** Un vínculo con institución recién pedido. */
export interface RequestedAffiliation {
  readonly id: string;
  readonly practiceId: string;
  readonly practiceSiteId: string | null;
  readonly statusConceptId: string;
}

/** Lo que quedó pedido, para la respuesta y para avisar después del alta. */
export interface WorkplaceRequestsResult {
  readonly affiliations: readonly RequestedAffiliation[];
  readonly insurerRequestIds: readonly string[];
}

/**
 * Las instituciones (`profiles`) y aseguradoras (`insurance`) con las que el
 * profesional dice trabajar, pedidas dentro de la transacción del alta. Cada
 * una nace pendiente hasta que la otra parte la confirme: ésa es la marca
 * oficial que después ve en «Mis verificaciones».
 */
export interface WorkplaceRequestsPort {
  request(
    tx: EntityManager,
    input: WorkplaceRequestsInput,
  ): Promise<WorkplaceRequestsResult>;
  /** Avisa a las organizaciones; se llama con el alta ya confirmada y nunca lanza. */
  notify(
    practitionerProfileId: string,
    affiliations: readonly RequestedAffiliation[],
  ): Promise<void>;
}

export const WORKPLACE_REQUESTS_PORT = Symbol('IAM_WORKPLACE_REQUESTS_PORT');
