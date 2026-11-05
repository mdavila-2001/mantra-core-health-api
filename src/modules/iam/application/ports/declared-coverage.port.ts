import type { EntityManager } from '@mikro-orm/postgresql';

/** El seguro que el paciente declara al registrarse. */
export interface DeclaredCoverageInput {
  readonly patientProfileId: string;
  readonly insurancePlanId: string;
  readonly expectedSector: 'private' | 'public';
  readonly coverageOrder: number;
  readonly memberIdentifier: string;
  readonly actorUserId: string;
}

/** Anota la cobertura declarada en el alta (`insurance`). */
export interface DeclaredCoveragePort {
  createDeclaredCoverage(
    tx: EntityManager,
    data: DeclaredCoverageInput,
  ): Promise<boolean>;
}

export const DECLARED_COVERAGE_PORT = Symbol('IAM_DECLARED_COVERAGE_PORT');
