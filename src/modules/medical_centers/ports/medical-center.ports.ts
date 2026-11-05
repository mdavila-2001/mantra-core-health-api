import type { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../common';

/** Un procedimiento que una sede ofrece con precio, con los datos de la sede. */
export interface SiteOfferRow {
  /** Organización dueña de la sede. */
  practiceId: string;
  /** Sede. */
  practiceSiteId: string;
  /** Nombre de la sede. */
  siteName: string;
  /** Dirección en una línea. */
  addressText: string | null;
  /** Ciudad de la dirección. */
  city: string | null;
  /** Latitud de la sede. */
  latitude: number | null;
  /** Longitud de la sede. */
  longitude: number | null;
  /** Procedimiento del nomenclador. */
  procedureConceptId: string;
  /** Nombre del procedimiento. */
  procedureDisplay: string;
  /** Especialidad del procedimiento en el nomenclador. */
  procedureSpecialty: string | null;
  /** Precio publicado por la sede. */
  price: number;
  /** Moneda del precio. */
  currencyConceptId: string;
}

/**
 * Lo que ofrecen las sedes.
 *
 * Una clase abstracta para servir de token de inyección. La implementación
 * devuelve **solo** sedes activas, de prácticas activas, con el servicio activo
 * y un ítem de catálogo activo con precio: lo que no tiene precio publicado no
 * aparece en la búsqueda.
 */
export abstract class MedicalCenterOffersPort {
  /**
   * Ofertas con precio de un lote de procedimientos.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param procedureConceptIds - Procedimientos pedidos. Con la lista vacía no consulta.
   */
  abstract findSiteOffers(
    em: EntityManager,
    procedureConceptIds: readonly string[],
  ): Promise<SiteOfferRow[]>;
}

/** Una orden de servicio del titular, con lo que la búsqueda necesita de ella. */
export interface OwnedServiceRequestRow {
  /** Orden. */
  id: string;
  /** Procedimiento pedido. */
  codeConceptId: string;
  /** Médico que pidió la orden. */
  requesterProfileId: string | null;
  /** Sede que el médico recomendó. */
  suggestedPracticeSiteId: string | null;
}

/** Las órdenes del titular y quién es el titular. */
export abstract class OwnServiceRequestsPort {
  /**
   * El perfil de paciente de la sesión.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param actor - Usuario autenticado.
   * @throws Si la cuenta no tiene un perfil de paciente.
   */
  abstract resolveOwnPatientProfileId(
    em: EntityManager,
    actor: AuthenticatedUser,
  ): Promise<string>;

  /**
   * Las órdenes pedidas que son del paciente. Las ajenas o inexistentes no figuran.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientProfileId - Titular.
   * @param serviceRequestIds - Órdenes pedidas.
   */
  abstract findOwned(
    em: EntityManager,
    patientProfileId: string,
    serviceRequestIds: readonly string[],
  ): Promise<OwnedServiceRequestRow[]>;
}

/** Dónde trabaja un médico, según sus afiliaciones. */
export abstract class PractitionerAffiliationsPort {
  /**
   * Sedes, entre las dadas, donde cada médico tiene afiliación `ACTIVE` y vigente
   * para alguno de los procedimientos dados.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practitionerProfileIds - Médicos consultados.
   * @param practiceSiteIds - Sedes del resultado.
   * @param procedureConceptIds - Procedimientos pedidos.
   * @returns Los pares (médico, sede) con afiliación activa.
   */
  abstract findActiveSites(
    em: EntityManager,
    practitionerProfileIds: readonly string[],
    practiceSiteIds: readonly string[],
    procedureConceptIds: readonly string[],
  ): Promise<{ practitionerProfileId: string; practiceSiteId: string }[]>;
}
