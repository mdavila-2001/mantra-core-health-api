import { Injectable } from '@nestjs/common';
import type { EntityName, FilterQuery, QueryOrderMap } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  visibleWhere,
  type ScopeFilter,
  type VisibilityColumns,
} from '../domain/clinical-scope-visibility';
import { CLIN } from '../clinical.concepts';
import { EncounterParticipants, Encounters } from '../entities';

/** Encounters where clinical writing is still allowed. */
const OPEN_ENCOUNTER_STATUSES = [
  CLIN.ENCOUNTER_ARRIVED,
  CLIN.ENCOUNTER_IN_PROGRESS,
];

/** One section read under a SPECIALTIES scope. */
export interface ScopedPageSpec<T extends object> {
  readonly entity: EntityName<T>;
  /** Patient (and tenant) restriction every row must meet. */
  readonly base: Record<string, unknown>;
  readonly filter: ScopeFilter;
  readonly columns: VisibilityColumns;
  /** Clauses that make a row visible whatever its author (IPS sections). */
  readonly always?: readonly Record<string, unknown>[];
  readonly orderBy: Record<string, 'ASC' | 'DESC'>;
  readonly limit: number;
}

export interface ScopedPage<T> {
  readonly rows: T[];
  /** Rows of the patient the scope keeps out of `rows`. */
  readonly hidden: number;
}

/**
 * Reads a clinical section with the scope predicate in the SQL (not in memory),
 * counts what the scope hides so the client can tell «hidden» from «none», and
 * answers whether an encounter is an open one the practitioner takes part in.
 */
@Injectable()
export class ClinicalScopeRepository {
  async page<T extends object>(
    em: EntityManager,
    spec: ScopedPageSpec<T>,
  ): Promise<ScopedPage<T>> {
    const visible = {
      ...spec.base,
      ...visibleWhere(spec.filter, spec.columns, spec.always),
    } as unknown as FilterQuery<NoInfer<T>>;
    const [rows, shown, total] = await Promise.all([
      em.find(spec.entity, visible, {
        orderBy: spec.orderBy as unknown as QueryOrderMap<T>,
        limit: spec.limit,
      }),
      em.count(spec.entity, visible),
      em.count(spec.entity, spec.base as unknown as FilterQuery<NoInfer<T>>),
    ]);
    return { rows, hidden: Math.max(total - shown, 0) };
  }

  /** Encounters of the patient whose primary practitioner is in the list. */
  async findEncounterIds(
    em: EntityManager,
    patientProfileId: string,
    practitionerProfileIds: readonly string[],
  ): Promise<string[]> {
    if (practitionerProfileIds.length === 0) return [];
    const rows = await em.find(
      Encounters,
      {
        patientProfileId,
        primaryPractitionerId: { $in: [...practitionerProfileIds] },
      },
      { fields: ['id'] },
    );
    return rows.map((row) => row.id);
  }

  /** Is the encounter an open one of this patient led or attended by the practitioner? */
  async isOwnOpenEncounter(
    em: EntityManager,
    encounterId: string,
    patientProfileId: string,
    practitionerProfileId: string,
  ): Promise<boolean> {
    const encounter = await em.findOne(Encounters, {
      id: encounterId,
      patientProfileId,
      statusConceptId: { $in: OPEN_ENCOUNTER_STATUSES },
    });
    if (!encounter) return false;
    if (encounter.primaryPractitionerId === practitionerProfileId) return true;
    return this.participates(em, [encounter.id], practitionerProfileId);
  }

  /** Does the practitioner lead or attend any open encounter of the patient? */
  async hasOwnOpenEncounter(
    em: EntityManager,
    patientProfileId: string,
    practitionerProfileId: string,
  ): Promise<boolean> {
    const open = await em.find(
      Encounters,
      { patientProfileId, statusConceptId: { $in: OPEN_ENCOUNTER_STATUSES } },
      { fields: ['id', 'primaryPractitionerId'] },
    );
    if (open.some((e) => e.primaryPractitionerId === practitionerProfileId)) {
      return true;
    }
    return this.participates(
      em,
      open.map((e) => e.id),
      practitionerProfileId,
    );
  }

  private async participates(
    em: EntityManager,
    encounterIds: readonly string[],
    practitionerProfileId: string,
  ): Promise<boolean> {
    if (encounterIds.length === 0) return false;
    const count = await em.count(EncounterParticipants, {
      encounterId: { $in: [...encounterIds] },
      practitionerProfileId,
      statusConceptId: CLIN.PARTICIPANT_ACTIVE,
    });
    return count > 0;
  }
}
