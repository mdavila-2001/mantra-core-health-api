import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../../common';
import { InsurancePlanBenefits, PatientCoverages } from '../../entities';
import { INS } from '../../domain/insurance.concepts';
import { ClaimCoveragePolicy } from './claim-coverage-policy';
import { ClaimsService } from './claims.service';

/**
 * El reclamo directo del consultorio guarda la parte del paciente que calcula
 * el servidor, nunca la del cliente (carril 16, REQ-16-025).
 */

const fn = () => jest.fn<(...args: any[]) => any>();
const TENANT = '11111111-1111-4111-8111-111111111111';
const PLAN = 'plan-1';
const CONSULT = 'service-consult';

function build(
  benefits: Record<string, unknown>[],
  practiceIds: string[] = ['practice-1'],
  coveragePlan: string = PLAN,
) {
  const createdLines: Record<string, unknown>[] = [];
  const tx = {
    flush: fn().mockResolvedValue(undefined),
    // La política relee la cobertura del cobro (PatientCoverages) y exige que
    // sea del plan.
    findOne: fn().mockImplementation(async (entity: unknown) =>
      entity === PatientCoverages
        ? { id: 'coverage-1', insurancePlanId: coveragePlan }
        : null,
    ),
    find: fn().mockImplementation(async (entity: unknown) =>
      entity === InsurancePlanBenefits ? benefits : [],
    ),
  };
  const em = { transactional: (work: (t: unknown) => unknown) => work(tx) };
  const repo = {
    findByIdempotency: fn().mockResolvedValue(null),
    createClaim: fn().mockImplementation((_tx, data) => ({
      id: 'claim-1',
      createdAt: new Date(),
      ...data,
    })),
    createLine: fn().mockImplementation((_tx, data) => {
      createdLines.push(data);
      return { id: `line-${createdLines.length}`, ...data };
    }),
  };
  const coverage = {
    findCoverage: fn().mockResolvedValue({
      id: 'coverage-1',
      insurancePlanId: PLAN,
    }),
  };
  const catalog = {
    findPlanForCarrier: fn().mockResolvedValue({
      id: PLAN,
      currencyConceptId: 'BOB',
    }),
  };
  const practiceLookup = {
    findActivePracticeIdsForTenant: fn().mockResolvedValue(practiceIds),
  };
  const service = new ClaimsService(
    em as never,
    repo as never,
    coverage as never,
    catalog as never,
    practiceLookup as never,
    { setContext: fn(), info: fn() } as never,
    {} as never,
    {} as never,
    new ClaimCoveragePolicy(),
  );
  // El alta se presenta dentro del tenant, como lo deja el interceptor.
  const submit = (dto: never) =>
    runWithTenant(TENANT, () => service.submitClaim(dto, billing));
  return {
    service,
    submit,
    createdLines,
    repo,
    coverage,
    catalog,
    tx,
    practiceLookup,
  };
}

const billing = { id: 'user-billing', roles: ['BILLING'] } as never;

const activeBenefit = {
  id: 'benefit-1',
  insurancePlanId: PLAN,
  serviceConceptId: CONSULT,
  statusConceptId: INS.BENEFIT_ACTIVE,
  effectiveFrom: new Date('2026-01-01'),
  effectiveTo: null,
  coveragePercent: '80',
  copayAmount: '50.00',
  requiresPriorAuthorization: false,
};

const claimDto = (patientResponsibilityAmount?: string) =>
  ({
    insuranceCarrierId: 'carrier-1',
    patientCoverageId: 'coverage-1',
    billingProviderEntityId: 'practice-1',
    claimIdentifier: 'CLM-1',
    lines: [
      {
        lineSequence: 1,
        serviceConceptId: CONSULT,
        billedAmount: '500.00',
        ...(patientResponsibilityAmount ? { patientResponsibilityAmount } : {}),
      },
    ],
  }) as never;

describe('ClaimsService — cobro directo contrastado con el plan', () => {
  it('sin parte del paciente declarada, guarda la calculada (140 de 500)', async () => {
    const { submit, createdLines } = build([activeBenefit]);
    await submit(claimDto());
    expect(createdLines).toHaveLength(1);
    expect(createdLines[0]).toMatchObject({
      billedAmount: '500.00',
      patientResponsibilityAmount: '140.00',
    });
  });

  it('una parte del paciente inflada se rechaza y no se crea nada', async () => {
    const { submit, repo } = build([activeBenefit]);
    await expect(submit(claimDto('300.00'))).rejects.toBeInstanceOf(
      PreconditionFailedException,
    );
    expect(repo.createClaim).not.toHaveBeenCalled();
  });

  it('un servicio que el plan no cubre no llega a crear el reclamo', async () => {
    const { submit, repo } = build([]);
    await expect(submit(claimDto())).rejects.toBeInstanceOf(
      PreconditionFailedException,
    );
    expect(repo.createClaim).not.toHaveBeenCalled();
  });
});

describe('ClaimsService — la cobertura del cobro es del plan', () => {
  it('una cobertura que no es del plan contra el que se reparte se rechaza y no se crea nada', async () => {
    const { submit, repo } = build([activeBenefit], undefined, 'plan-ajeno');
    await expect(submit(claimDto())).rejects.toMatchObject({
      details: { reason: 'COVERAGE_PLAN_MISMATCH' },
    });
    expect(repo.createClaim).not.toHaveBeenCalled();
  });
});

describe('ClaimsService — alcance del alta legacy (INS-01)', () => {
  const foreignPractice = {
    ...(claimDto() as any),
    billingProviderEntityId: 'practice-t2',
  };

  it('una práctica facturadora de otro tenant se rechaza con 403 y no se crea nada', async () => {
    const d = build([activeBenefit]);
    await expect(d.submit(foreignPractice as never)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(d.coverage.findCoverage).not.toHaveBeenCalled();
    expect(d.repo.createClaim).not.toHaveBeenCalled();
    expect(d.repo.createLine).not.toHaveBeenCalled();
  });

  it('una práctica ajena y una inexistente responden con el mismo cuerpo', async () => {
    const foreign = build([activeBenefit]);
    const missing = build([activeBenefit], []);
    const a: any = await foreign
      .submit(foreignPractice as never)
      .catch((e: unknown) => e);
    const b: any = await missing
      .submit(foreignPractice as never)
      .catch((e: unknown) => e);
    expect(a).toBeInstanceOf(ForbiddenException);
    expect(a.getStatus()).toBe(b.getStatus());
    expect(a.getResponse()).toEqual(b.getResponse());
  });

  it('la práctica facturadora se resuelve contra el tenant del contexto', async () => {
    const d = build([activeBenefit]);
    await d.submit(claimDto());
    expect(
      d.practiceLookup.findActivePracticeIdsForTenant,
    ).toHaveBeenCalledWith(TENANT);
  });

  it('sin rol de facturación se rechaza antes de consultar prácticas', async () => {
    const d = build([activeBenefit]);
    await expect(
      runWithTenant(TENANT, () =>
        d.service.submitClaim(claimDto(), {
          id: 'u',
          roles: ['PATIENT'],
        } as never),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(
      d.practiceLookup.findActivePracticeIdsForTenant,
    ).not.toHaveBeenCalled();
    expect(d.repo.createClaim).not.toHaveBeenCalled();
  });

  it('sin tenant en el contexto se rechaza (412) y no se crea nada', async () => {
    const d = build([activeBenefit]);
    await expect(
      d.service.submitClaim(claimDto(), billing),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(d.repo.createClaim).not.toHaveBeenCalled();
  });

  it('una cobertura cuyo plan no es de la aseguradora indicada se rechaza sin crear el reclamo', async () => {
    const d = build([activeBenefit]);
    d.catalog.findPlanForCarrier.mockResolvedValue(null);
    await expect(d.submit(claimDto())).rejects.toBeInstanceOf(
      PreconditionFailedException,
    );
    expect(d.repo.createClaim).not.toHaveBeenCalled();
  });

  it('una cobertura inexistente se rechaza sin crear el reclamo', async () => {
    const d = build([activeBenefit]);
    d.coverage.findCoverage.mockResolvedValue(null);
    await expect(d.submit(claimDto())).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
    expect(d.repo.createClaim).not.toHaveBeenCalled();
  });
});
