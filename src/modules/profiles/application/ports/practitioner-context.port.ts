import type { EntityManager } from '@mikro-orm/postgresql';

export interface PractitionerActivityCounts {
  encounters: number;
  medicationRequests: number;
  clinicalNotes: number;
  documents: number;
}

/**
 * Las cifras de un profesional que la guía usa para ordenar: su actividad y
 * la nota de sus pacientes. Son las mismas que publica su ficha.
 */
export interface PractitionerDirectoryStats {
  activity: PractitionerActivityCounts;
  /** Media de las reseñas publicadas, o `null` si nadie lo calificó. */
  ratingAverage: number | null;
  ratingCount: number;
}

export interface PractitionerContextPort {
  onboardingContext(
    em: EntityManager,
    profileId: string,
  ): Promise<{
    resources: Array<{ id: string }>;
    slotCount: number;
  }>;
  activity(
    em: EntityManager,
    userId: string,
  ): Promise<PractitionerActivityCounts>;
  /**
   * Las cifras de una página entera de la guía, en lote.
   *
   * @returns Mapa `profileId → cifras`; quien no tiene cuenta ni reseñas no
   *   aparece, y se lee como ceros.
   */
  directoryStats(
    em: EntityManager,
    profileIds: readonly string[],
  ): Promise<Map<string, PractitionerDirectoryStats>>;
  hasAuthorizationHistory(
    em: EntityManager,
    authorizationId: string,
  ): Promise<boolean>;
  hasOpenIdentityCase(em: EntityManager, licenseId: string): Promise<boolean>;
  ensurePractitionerRole(
    em: EntityManager,
    userId: string,
    actorUserId: string,
  ): Promise<boolean>;
  managingTenantId(em: EntityManager, siteId: string): Promise<string | null>;
}

export const PRACTITIONER_CONTEXT_PORT = Symbol('PRACTITIONER_CONTEXT_PORT');
