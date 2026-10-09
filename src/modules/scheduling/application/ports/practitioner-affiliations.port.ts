/**
 * Estado de un vínculo profesional ↔ sede, ya clasificado por quien lo conoce
 * (contexto `profiles`). La agenda no sabe qué concepto de terminología hay
 * detrás: sólo decide con esta clasificación.
 */
export type AffiliationStatus =
  'APPROVED' | 'DECLARED' | 'PENDING' | 'REJECTED' | 'REVOKED' | 'OTHER';

/** Un vínculo del profesional con una sede de atención. */
export interface PractitionerAffiliationFact {
  readonly practiceSiteId: string;
  readonly status: AffiliationStatus;
}

/**
 * Vínculos de un profesional con las organizaciones donde atiende (contextos
 * `profiles` y `practice`).
 */
export interface PractitionerAffiliationsPort {
  /** Sus vínculos que declaran sede; los que no la declaran no se devuelven. */
  findOfPractitioner(
    practitionerProfileId: string,
  ): Promise<PractitionerAffiliationFact[]>;

  /** Mapa `sede → organización` que la gobierna. */
  tenantsOfSites(siteIds: readonly string[]): Promise<Map<string, string>>;
}

/** Token de inyección de los vínculos del profesional. */
export const PRACTITIONER_AFFILIATIONS_PORT = Symbol(
  'PRACTITIONER_AFFILIATIONS_PORT',
);
