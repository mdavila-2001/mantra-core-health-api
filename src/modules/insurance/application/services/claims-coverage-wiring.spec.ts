import { jest } from '@jest/globals';
import { PreconditionFailedException } from '../../../../common';
import { InsurancePlanBenefits } from '../../entities';
import { INS } from '../../domain/insurance.concepts';
import { ClaimCoveragePolicy } from './claim-coverage-policy';
import { ClaimsService } from './claims.service';

/**
 * El reclamo directo del consultorio guarda la parte del paciente que calcula
 * el servidor, nunca la del cliente (carril 16, REQ-16-025).
 */

const fn = () => jest.fn<(...args: any[]) => any>();
const PLAN = 'plan-1';
const CONSULT = 'service-consult';

function build(benefits: Record<string, unknown>[]) {
  const createdLines: Record<string, unknown>[] = [];
  const tx = {
    flush: fn().mockResolvedValue(undefined),
    findOne: fn().mockResolvedValue(null),
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
  const service = new ClaimsService(
    em as never,
    repo as never,
    coverage as never,
    catalog as never,
    {} as never,
    { setContext: fn(), info: fn() } as never,
    {} as never,
    {} as never,
    new ClaimCoveragePolicy(),
  );
  return { service, createdLines, repo };
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
    const { service, createdLines } = build([activeBenefit]);
    await service.submitClaim(claimDto(), billing);
    expect(createdLines).toHaveLength(1);
    expect(createdLines[0]).toMatchObject({
      billedAmount: '500.00',
      patientResponsibilityAmount: '140.00',
    });
  });

  it('una parte del paciente inflada se rechaza y no se crea nada', async () => {
    const { service, repo } = build([activeBenefit]);
    await expect(
      service.submitClaim(claimDto('300.00'), billing),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(repo.createClaim).not.toHaveBeenCalled();
  });

  it('un servicio que el plan no cubre no llega a crear el reclamo', async () => {
    const { service, repo } = build([]);
    await expect(
      service.submitClaim(claimDto(), billing),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(repo.createClaim).not.toHaveBeenCalled();
  });
});
