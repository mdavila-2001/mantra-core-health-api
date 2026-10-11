import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createDeclaredCoverage } from '../../../insurance/services/declared-coverage';
import { DeclaredCoveragesReader } from '../../../insurance/services/declared-coverages-reader';
import {
  CatalogRepository,
  CoverageRepository,
} from '../../../insurance/repositories';
import type { PatientCoveragesPort } from '../../application/ports/patient-coverages.port';

@Injectable()
export class PatientCoveragesAdapter implements PatientCoveragesPort {
  constructor(
    private readonly catalog: CatalogRepository,
    private readonly coverage: CoverageRepository,
    private readonly reader: DeclaredCoveragesReader,
  ) {}

  read<T>(em: EntityManager, patientProfileId: string): Promise<T[]> {
    return this.reader.read(em, patientProfileId) as Promise<T[]>;
  }

  async isDeclared(em: EntityManager, patientProfileId: string, order: number) {
    return Boolean(
      await this.coverage.findActiveByPatientAndOrder(
        em,
        patientProfileId,
        order,
      ),
    );
  }

  async create(
    em: EntityManager,
    input: Parameters<PatientCoveragesPort['create']>[1],
  ) {
    await createDeclaredCoverage(
      { catalog: this.catalog, coverage: this.coverage },
      em,
      input,
    );
  }
}
