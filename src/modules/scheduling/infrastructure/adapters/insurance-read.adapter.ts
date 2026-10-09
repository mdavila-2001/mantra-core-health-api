import { Injectable } from '@nestjs/common';
import { ClaimReadRepository } from '../../../insurance/repositories/claim-read.repository';
import { CoverageRepository } from '../../../insurance/repositories/coverage.repository';
import type {
  InsuranceClaimSummary,
  InsuranceReadPort,
} from '../../application/ports/insurance-read.port';
import type { UnitOfWork } from '../../application/ports/unit-of-work';

/** Implementa las lecturas de seguros sobre los repositorios de `insurance`. */
@Injectable()
export class InsuranceReadAdapter implements InsuranceReadPort {
  constructor(
    private readonly coverages: CoverageRepository,
    private readonly claims: ClaimReadRepository,
  ) {}

  findActiveCarriersByPatients(
    uow: UnitOfWork,
    patientProfileIds: readonly string[],
  ): Promise<Map<string, string>> {
    return this.coverages.findActiveCarriersByPatients(uow, patientProfileIds);
  }

  findClaimSummariesByEncounterIds(
    uow: UnitOfWork,
    encounterIds: readonly string[],
  ): Promise<InsuranceClaimSummary[]> {
    return this.claims.findSummariesByEncounterIds(uow, encounterIds);
  }
}
