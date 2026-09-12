import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { InsuranceBackboneService } from './insurance-backbone.service';

const fn = jest.fn as unknown as (impl?: (...args: any[]) => any) => any;
const TENANT_ID = 'tenant-a';
const ACTOR = { id: 'user-a', roles: ['USER'] } as never;

function build() {
  const tx = { flush: fn().mockResolvedValue(undefined) };
  const em = { transactional: fn((work) => work(tx)) };
  const repo = {
    findCarrierByTenantId: fn().mockResolvedValue({ id: 'carrier-a' }),
    findProductForCarrier: fn().mockResolvedValue({ id: 'product-a' }),
    findPlanForCarrier: fn().mockResolvedValue({ id: 'plan-a' }),
    findBenefitForPlanAndCarrier: fn().mockResolvedValue(null),
    createPlan: fn().mockReturnValue({ id: 'plan-new' }),
    createBenefit: fn().mockReturnValue({ id: 'benefit-new' }),
  };
  const tenantAdministration = {
    assertCanAdminister: fn().mockResolvedValue(undefined),
  };
  const logger = { setContext: fn(), info: fn() };
  const service = new InsuranceBackboneService(
    em as never,
    repo as never,
    tenantAdministration as never,
    logger as never,
  );
  return { service, repo, tenantAdministration, tx };
}

describe('InsuranceBackboneService (administración del catálogo)', () => {
  it('exige tenant activo antes de una mutación administrativa', async () => {
    const { service } = build();

    await expect(
      service.createPlan('product-a', { planCode: 'P', name: 'Plan' }, ACTOR),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('crea un plan sólo después de autorizar y resolver el producto del carrier', async () => {
    const { service, repo, tenantAdministration, tx } = build();

    const result = await runWithTenant(TENANT_ID, () =>
      service.createPlan(
        'product-a',
        {
          planCode: 'ORO',
          name: 'Plan Oro',
          effectiveFrom: '2026-01-01',
          effectiveTo: '2026-12-31',
        },
        ACTOR,
      ),
    );

    expect(tenantAdministration.assertCanAdminister).toHaveBeenCalledWith(
      tx,
      TENANT_ID,
      ACTOR,
    );
    expect(repo.findProductForCarrier).toHaveBeenCalledWith(
      tx,
      'product-a',
      'carrier-a',
    );
    expect(repo.createPlan).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        insuranceProductId: 'product-a',
        effectiveTo: new Date('2026-12-31'),
        actorUserId: 'user-a',
      }),
    );
    expect(result).toEqual({ id: 'plan-new' });
  });

  it('propaga 403 para staff antes de consultar recursos', async () => {
    const { service, repo, tenantAdministration } = build();
    tenantAdministration.assertCanAdminister.mockRejectedValue(
      new ForbiddenException(),
    );

    await expect(
      runWithTenant(TENANT_ID, () =>
        service.createBenefit(
          'plan-a',
          { benefitCategoryConceptId: 'category-a' },
          ACTOR,
        ),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repo.findPlanForCarrier).not.toHaveBeenCalled();
  });

  it('devuelve 404 para planes ajenos al carrier del tenant', async () => {
    const { service, repo } = build();
    repo.findPlanForCarrier.mockResolvedValue(null);

    await expect(
      runWithTenant(TENANT_ID, () =>
        service.createBenefit(
          'plan-foreign',
          { benefitCategoryConceptId: 'category-a' },
          ACTOR,
        ),
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(repo.createBenefit).not.toHaveBeenCalled();
  });

  it('reemplaza importes, acepta null y actualiza auditoría', async () => {
    const { service, repo, tx } = build();
    const benefit = {
      coveragePercent: '50.00',
      copayAmount: '10.00',
      deductibleAmount: '20.00',
      annualLimitAmount: '500.00',
      updatedAt: new Date('2020-01-01'),
      updatedByUserId: 'old-user',
    };
    repo.findBenefitForPlanAndCarrier.mockResolvedValue(benefit);

    await runWithTenant(TENANT_ID, () =>
      service.updateBenefit(
        'plan-a',
        'benefit-a',
        {
          coveragePercent: '80.00',
          copayAmount: null,
          deductibleAmount: '100.00',
          annualLimitAmount: null,
        },
        ACTOR,
      ),
    );

    expect(repo.findBenefitForPlanAndCarrier).toHaveBeenCalledWith(
      tx,
      'plan-a',
      'benefit-a',
      'carrier-a',
    );
    expect(benefit).toEqual(
      expect.objectContaining({
        coveragePercent: '80.00',
        copayAmount: null,
        deductibleAmount: '100.00',
        annualLimitAmount: null,
        updatedByUserId: 'user-a',
      }),
    );
    expect(benefit.updatedAt.getTime()).toBeGreaterThan(
      new Date('2020-01-01').getTime(),
    );
  });

  it('preserva JSON desconocido y borra la exclusión cuando recibe null', async () => {
    const { service, repo } = build();
    const benefit = {
      requiresPriorAuthorization: false,
      eligibilityRuleJson: {
        legacyKey: { untouched: true },
        exclusionNotes: 'Anterior',
      },
      updatedAt: new Date('2020-01-01'),
    };
    repo.findBenefitForPlanAndCarrier.mockResolvedValue(benefit);

    await runWithTenant(TENANT_ID, () =>
      service.updateBenefitRules(
        'plan-a',
        'benefit-a',
        {
          requiresPriorAuthorization: true,
          requiredDocuments: ['FIRMA_MEDICO', 'ORDEN_MEDICA'],
          exclusionNotes: null,
        },
        ACTOR,
      ),
    );

    expect(benefit.requiresPriorAuthorization).toBe(true);
    expect(benefit.eligibilityRuleJson).toEqual({
      legacyKey: { untouched: true },
      requiredDocuments: ['FIRMA_MEDICO', 'ORDEN_MEDICA'],
    });
  });
});
