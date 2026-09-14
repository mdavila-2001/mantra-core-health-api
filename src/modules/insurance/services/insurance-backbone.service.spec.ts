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

describe('InsuranceBackboneService.updateContactChannels (subtarea 2.3)', () => {
  it('persiste los tres canales y marca la aseguradora como tocada', async () => {
    const { service, repo } = build();

    const resultado = await runWithTenant(TENANT_ID, () =>
      service.updateContactChannels(
        'carrier-a',
        {
          whatsappNumber: '+59171548278',
          callCenterPhone: '800-10-6060',
          supportEmail: 'siniestros@aseguradora.com.bo',
        } as never,
        ACTOR,
      ),
    );

    expect(resultado).toEqual({
      id: 'carrier-a',
      whatsappNumber: '+59171548278',
      callCenterPhone: '800-10-6060',
      supportEmail: 'siniestros@aseguradora.com.bo',
    });
    expect(repo.findCarrierByTenantId).toHaveBeenCalled();
  });

  it('rechaza con 404 cuando el :id no es el carrier del tenant activo', async () => {
    const { service } = build();

    await expect(
      runWithTenant(TENANT_ID, () =>
        service.updateContactChannels(
          'carrier-ajeno',
          {
            whatsappNumber: null,
            callCenterPhone: null,
            supportEmail: null,
          } as never,
          ACTOR,
        ),
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('propaga 403 antes de leer el carrier si el actor no puede administrar', async () => {
    const { service, tenantAdministration } = build();
    tenantAdministration.assertCanAdminister.mockRejectedValue(
      new ForbiddenException('no autorizado'),
    );

    await expect(
      runWithTenant(TENANT_ID, () =>
        service.updateContactChannels(
          'carrier-a',
          {
            whatsappNumber: null,
            callCenterPhone: null,
            supportEmail: null,
          } as never,
          ACTOR,
        ),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('null en los tres borra los canales ya cargados', async () => {
    const { service, repo } = build();
    (repo.findCarrierByTenantId as any).mockResolvedValue({
      id: 'carrier-a',
      whatsappNumber: '+59171548278',
      callCenterPhone: '800-10-6060',
      supportEmail: 'siniestros@aseguradora.com.bo',
    });

    const resultado = await runWithTenant(TENANT_ID, () =>
      service.updateContactChannels(
        'carrier-a',
        {
          whatsappNumber: null,
          callCenterPhone: null,
          supportEmail: null,
        } as never,
        ACTOR,
      ),
    );

    expect(resultado).toEqual({
      id: 'carrier-a',
      whatsappNumber: null,
      callCenterPhone: null,
      supportEmail: null,
    });
  });
});

describe('InsuranceBackboneService.updatePlanPremium (subtarea 3.1, v4.2.14)', () => {
  it('persiste la prima de lista mensual y actualiza auditoría', async () => {
    const { service, repo, tx } = build();
    const plan = {
      id: 'plan-a',
      monthlyPremiumAmount: undefined,
      updatedAt: new Date('2020-01-01'),
      updatedByUserId: 'old-user',
    };
    (repo.findPlanForCarrier as any).mockResolvedValue(plan);

    const resultado = await runWithTenant(TENANT_ID, () =>
      service.updatePlanPremium(
        'plan-a',
        { monthlyPremiumAmount: '350.00' } as never,
        ACTOR,
      ),
    );

    expect(repo.findPlanForCarrier).toHaveBeenCalledWith(
      tx,
      'plan-a',
      'carrier-a',
    );
    expect(plan.monthlyPremiumAmount).toBe('350.00');
    expect(plan.updatedByUserId).toBe('user-a');
    expect(resultado).toEqual({ id: 'plan-a', monthlyPremiumAmount: '350.00' });
  });

  it('null quita la prima declarada', async () => {
    const { service, repo } = build();
    (repo.findPlanForCarrier as any).mockResolvedValue({
      id: 'plan-a',
      monthlyPremiumAmount: '350.00',
    });

    const resultado = await runWithTenant(TENANT_ID, () =>
      service.updatePlanPremium(
        'plan-a',
        { monthlyPremiumAmount: null } as never,
        ACTOR,
      ),
    );

    expect(resultado).toEqual({ id: 'plan-a', monthlyPremiumAmount: null });
  });

  it('rechaza con 404 un plan ajeno al carrier del tenant activo', async () => {
    const { service, repo } = build();
    (repo.findPlanForCarrier as any).mockResolvedValue(null);

    await expect(
      runWithTenant(TENANT_ID, () =>
        service.updatePlanPremium(
          'plan-foreign',
          { monthlyPremiumAmount: '350.00' } as never,
          ACTOR,
        ),
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('propaga 403 antes de consultar el plan si el actor no administra el tenant', async () => {
    const { service, repo, tenantAdministration } = build();
    tenantAdministration.assertCanAdminister.mockRejectedValue(
      new ForbiddenException(),
    );

    await expect(
      runWithTenant(TENANT_ID, () =>
        service.updatePlanPremium(
          'plan-a',
          { monthlyPremiumAmount: '350.00' } as never,
          ACTOR,
        ),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repo.findPlanForCarrier).not.toHaveBeenCalled();
  });
});
