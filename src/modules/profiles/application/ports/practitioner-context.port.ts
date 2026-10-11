import type { EntityManager } from '@mikro-orm/postgresql';

export interface PractitionerActivityCounts {
  encounters: number;
  medicationRequests: number;
  clinicalNotes: number;
  documents: number;
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
