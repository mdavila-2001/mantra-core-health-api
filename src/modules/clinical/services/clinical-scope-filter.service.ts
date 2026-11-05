import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import type { ClinicalReadScope } from '../domain/clinical-read-scope';
import type { ScopeFilter } from '../domain/clinical-scope-visibility';
import {
  PersonAccountLinksRepository,
  PractitionerSpecialtiesRepository,
} from '../../profiles/infrastructure/repositories';
import { ClinicalScopeRepository } from '../repositories/clinical-scope.repository';

/**
 * Turns a SPECIALTIES scope into the practitioners, accounts and encounters
 * that the section queries filter by. The responsible practitioner's specialty
 * comes from `profiles.practitioner_specialties` (active rows only).
 */
@Injectable()
export class ClinicalScopeFilterService {
  constructor(
    private readonly specialtiesRepo: PractitionerSpecialtiesRepository,
    private readonly accountLinksRepo: PersonAccountLinksRepository,
    private readonly scopedRepo: ClinicalScopeRepository,
  ) {}

  /**
   * @returns `null` for a FULL scope (no filtering); otherwise the filter.
   *          An empty specialty list yields an empty filter: IPS only.
   */
  async build(
    em: EntityManager,
    patientProfileId: string,
    scope: ClinicalReadScope,
  ): Promise<ScopeFilter | null> {
    if (scope.kind === 'FULL') return null;
    const profileIds = await this.specialtiesRepo.findProfileIdsBySpecialties(
      em,
      scope.specialtyConceptIds,
    );
    if (profileIds.length === 0) {
      return { profileIds, userIds: [], encounterIds: [] };
    }
    const [userIds, encounterIds] = await Promise.all([
      this.accountLinksRepo.findActiveUserIdsByPersons(em, profileIds),
      this.scopedRepo.findEncounterIds(em, patientProfileId, profileIds),
    ]);
    return { profileIds, userIds, encounterIds };
  }
}
