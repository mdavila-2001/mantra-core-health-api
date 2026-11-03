import type { EntityManager } from '@mikro-orm/postgresql';

/** Minimal description of a prior diagnostic study used by insurance claims. */
export interface DuplicateStudyDescription {
  readonly reportId: string | null;
  readonly studyName: string;
  readonly performedAt: Date;
  readonly daysAgo: number;
  readonly providerName: string;
}

export interface DuplicateStudyDescriptionPort {
  describeByReportId(
    em: EntityManager,
    reportId: string,
    requesterTenantId: string,
    referenceDate: Date,
    includeConclusion: false,
  ): Promise<DuplicateStudyDescription | null>;
}

export const DUPLICATE_STUDY_DESCRIPTION_PORT = Symbol(
  'INSURANCE_DUPLICATE_STUDY_DESCRIPTION_PORT',
);
