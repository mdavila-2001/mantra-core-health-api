import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createDeclaredCoverage } from '../../../insurance/application/services/declared-coverage';
import {
  CatalogRepository,
  CoverageRepository,
} from '../../../insurance/infrastructure/repositories';
import type {
  DeclaredCoverageInput,
  DeclaredCoveragePort,
} from '../../application/ports/declared-coverage.port';

/** Cobertura declarada en el alta, que anota `insurance`. */
@Injectable()
export class InsuranceDeclaredCoverageAdapter implements DeclaredCoveragePort {
  constructor(
    private readonly catalog: CatalogRepository,
    private readonly coverage: CoverageRepository,
  ) {}

  createDeclaredCoverage(tx: EntityManager, data: DeclaredCoverageInput) {
    return createDeclaredCoverage(
      { catalog: this.catalog, coverage: this.coverage },
      tx,
      data,
    );
  }
}
