import type { EntityManager } from '@mikro-orm/postgresql';
import { CLIN } from '../clinical.concepts';
import type { ScopeFilter } from '../domain/clinical-scope-visibility';
import {
  CareEpisodes,
  Conditions,
  Encounters,
  MedicationRequests,
  Observations,
  type AllergyIntolerances,
} from '../entities';
import type { AllergyIntolerancesRepository } from '../repositories';
import type { ClinicalScopeRepository } from '../repositories/clinical-scope.repository';

/** Rows of the six summary sections, plus what a scope kept out of them. */
export interface SummaryRows {
  conditions: Conditions[];
  allergies: AllergyIntolerances[];
  medicationRequests: MedicationRequests[];
  observations: Observations[];
  encounters: Encounters[];
  careEpisodes: CareEpisodes[];
  /** Section → rows hidden by the scope. Absent when nothing was filtered. */
  hiddenByScope?: Record<string, number>;
}

/**
 * IPS sections that are always visible whatever the scope (Pablo's rule):
 * every allergy, active conditions (active, recurrence, relapse) and active
 * medication requests. Everything else follows the responsible practitioner.
 */
const ACTIVE_CONDITION_STATUSES = [
  CLIN.CONDITION_ACTIVE,
  CLIN.CONDITION_RECURRENCE,
  CLIN.CONDITION_RELAPSE,
];

/**
 * Loads the summary sections under a SPECIALTIES scope, filtering in SQL so the
 * `limit` and `truncated` the caller computes stay truthful.
 */
export async function loadScopedSummaryRows(
  em: EntityManager,
  repo: ClinicalScopeRepository,
  allergiesRepo: AllergyIntolerancesRepository,
  patientProfileId: string,
  over: number,
  filter: ScopeFilter,
): Promise<SummaryRows> {
  const base = { patientProfileId };
  const [
    conditions,
    medications,
    observations,
    encounters,
    episodes,
    allergies,
  ] = await Promise.all([
    repo.page(em, {
      entity: Conditions,
      base,
      filter,
      columns: { user: 'recordedByUserId', encounter: 'encounterId' },
      always: [{ clinicalStatusConceptId: { $in: ACTIVE_CONDITION_STATUSES } }],
      orderBy: { createdAt: 'DESC' },
      limit: over,
    }),
    repo.page(em, {
      entity: MedicationRequests,
      base,
      filter,
      columns: { profile: 'prescriberProfileId', encounter: 'encounterId' },
      always: [{ statusConceptId: CLIN.MEDICATION_REQUEST_ACTIVE }],
      orderBy: { createdAt: 'DESC' },
      limit: over,
    }),
    repo.page(em, {
      entity: Observations,
      base,
      filter,
      columns: { user: 'recordedByUserId', encounter: 'encounterId' },
      orderBy: { effectiveStartAt: 'DESC' },
      limit: over,
    }),
    repo.page(em, {
      entity: Encounters,
      base,
      filter,
      columns: { profile: 'primaryPractitionerId' },
      orderBy: { startAt: 'DESC' },
      limit: over,
    }),
    repo.page(em, {
      entity: CareEpisodes,
      base,
      filter,
      columns: { profile: 'responsiblePractitionerId' },
      orderBy: { startAt: 'DESC', createdAt: 'DESC' },
      limit: over,
    }),
    allergiesRepo.findByPatient(em, patientProfileId, over),
  ]);
  return {
    conditions: conditions.rows,
    allergies,
    medicationRequests: medications.rows,
    observations: observations.rows,
    encounters: encounters.rows,
    careEpisodes: episodes.rows,
    hiddenByScope: {
      conditions: conditions.hidden,
      medicationRequests: medications.hidden,
      observations: observations.hidden,
      encounters: encounters.hidden,
      careEpisodes: episodes.hidden,
    },
  };
}
