import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { PreconditionFailedException, runWithTenant } from '../../../common';
import { ResourceNotFoundException } from '../../../common';
import { InsuranceAnalyticsService } from './insurance-analytics.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 'tenant-a';
const CARRIER = { id: 'carrier-a', legalName: 'Aseguradora de prueba' };
const ACTOR_ADMIN = { id: 'user-a', roles: ['USER'] } as never;
const ACTOR_OPERATOR = { id: 'user-b', roles: ['INSURANCE_OPERATOR'] } as never;
const ACTOR_STAFF = { id: 'user-c', roles: ['USER'] } as never;

const BOB = { code: 'BOB', display: 'Boliviano' };

/** Fila de KPIs "todo en cero", como devolvería el repositorio sin reclamos. */
function emptyKpiRow() {
  return {
    total_claims: 0,
    other_currency_claims: 0,
    adjudicated_claims: 0,
    pending_claims: 0,
    total_billed: '0.00',
    total_approved: '0.00',
    total_copay: '0.00',
    total_denied: '0.00',
    active_affiliates: 0,
    period_months: '12.00',
    estimated_premiums: '0.00',
    coverages_without_premium: 0,
    approval_rate_percent: null,
    avg_monthly_per_capita: null,
    avg_annual_per_capita: null,
    loss_ratio_percent: null,
  };
}

function build() {
  const execute = mockFn().mockResolvedValue([BOB]);
  const fork = { getConnection: mockFn(() => ({ execute })) };
  const em = { fork: mockFn(() => fork) };
  const catalogRepo = {
    findCarrierByTenantId: mockFn().mockResolvedValue(CARRIER),
    findPlanForCarrier: mockFn().mockResolvedValue({ id: 'plan-a' }),
  };
  const analyticsRepo = {
    dominantCurrency: mockFn().mockResolvedValue('currency-bob'),
    kpis: mockFn().mockResolvedValue(emptyKpiRow()),
    monthlyTrends: mockFn().mockResolvedValue([]),
    topMedications: mockFn().mockResolvedValue([]),
    specialties: mockFn().mockResolvedValue([]),
    prevalentPathologies: mockFn().mockResolvedValue([]),
    immunization: mockFn().mockResolvedValue({
      vaccinated: 0,
      total: 0,
      rate_percent: null,
    }),
  };
  const tenantAdministration = {
    canAdminister: mockFn().mockResolvedValue(true),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new InsuranceAnalyticsService(
    em as never,
    catalogRepo as never,
    analyticsRepo as never,
    tenantAdministration as never,
    logger as never,
  );
  return { service, catalogRepo, analyticsRepo, tenantAdministration, execute };
}

describe('InsuranceAnalyticsService.getLossRatioAnalytics (subtarea 3.1, v4.2.14)', () => {
  it('exige tenant activo', async () => {
    const { service } = build();
    await expect(
      service.getLossRatioAnalytics({}, ACTOR_ADMIN),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('404 cuando el tenant activo no tiene aseguradora', async () => {
    const { service, catalogRepo } = build();
    catalogRepo.findCarrierByTenantId.mockResolvedValue(null);

    await expect(
      runWithTenant(TENANT, () =>
        service.getLossRatioAnalytics({}, ACTOR_ADMIN),
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('403 sin membresía administradora ni rol de analítica', async () => {
    const { service, tenantAdministration } = build();
    tenantAdministration.canAdminister.mockResolvedValue(false);

    await expect(
      runWithTenant(TENANT, () =>
        service.getLossRatioAnalytics({}, ACTOR_STAFF),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('200 para INSURANCE_OPERATOR aunque no administre el tenant', async () => {
    const { service, tenantAdministration } = build();
    tenantAdministration.canAdminister.mockResolvedValue(false);

    const result = await runWithTenant(TENANT, () =>
      service.getLossRatioAnalytics({}, ACTOR_OPERATOR),
    );
    expect(result.carrierId).toBe('carrier-a');
  });

  it('404 cuando planId no pertenece al carrier del tenant activo', async () => {
    const { service, catalogRepo } = build();
    catalogRepo.findPlanForCarrier.mockResolvedValue(null);

    await expect(
      runWithTenant(TENANT, () =>
        service.getLossRatioAnalytics({ planId: 'plan-foreign' }, ACTOR_ADMIN),
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('422 cuando startDate es posterior a endDate', async () => {
    const { service } = build();

    await expect(
      runWithTenant(TENANT, () =>
        service.getLossRatioAnalytics(
          { startDate: '2026-06-01', endDate: '2026-01-01' },
          ACTOR_ADMIN,
        ),
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('el rango llega exacto al repositorio, incluido el default de 12 meses', async () => {
    const { service, analyticsRepo } = build();

    await runWithTenant(TENANT, () =>
      service.getLossRatioAnalytics(
        { startDate: '2026-01-01', endDate: '2026-03-31' },
        ACTOR_ADMIN,
      ),
    );

    const period = (analyticsRepo.kpis.mock.calls[0] as any[])[2];
    expect(period.loDate).toBe('2026-01-01');
    expect(period.hiDate).toBe('2026-03-31');
    expect(period.lo.toISOString()).toBe('2026-01-01T04:00:00.000Z');
    // hi es EXCLUSIVE: medianoche del día siguiente al fin del periodo.
    expect(period.hi.toISOString()).toBe('2026-04-01T04:00:00.000Z');
  });

  it('sin reclamos: ceros y tasas null, nunca NaN ni "0.00" donde el denominador es 0', async () => {
    const { service } = build();

    const result = await runWithTenant(TENANT, () =>
      service.getLossRatioAnalytics({}, ACTOR_ADMIN),
    );

    expect(result.kpis.totalClaimsCount).toBe(0);
    expect(result.kpis.totalBilledAmount).toBe('0.00');
    expect(result.kpis.approvalRatePercent).toBeNull();
    expect(result.kpis.averageMonthlyPerCapitaExpense).toBeNull();
    expect(result.kpis.averageAnnualPerCapitaExpense).toBeNull();
    expect(result.kpis.lossRatioPercent).toBeNull();
    expect(result.immunization.vaccinationRatePercent).toBeNull();
    expect(Number.isNaN(Number(result.kpis.totalBilledAmount))).toBe(false);
  });

  it('lossRatioPercent, per cápita y tasa de aprobación son exactamente lo que devuelve el repositorio (sin recalcular en JS)', async () => {
    const { service, analyticsRepo } = build();
    analyticsRepo.kpis.mockResolvedValue({
      ...emptyKpiRow(),
      total_claims: 4,
      adjudicated_claims: 3,
      pending_claims: 1,
      total_billed: '5060.63',
      total_approved: '2265.50',
      active_affiliates: 3,
      period_months: '12.03',
      estimated_premiums: '3610.00',
      approval_rate_percent: '51.02',
      avg_monthly_per_capita: '62.77',
      avg_annual_per_capita: '753.24',
      loss_ratio_percent: '62.76',
    });

    const result = await runWithTenant(TENANT, () =>
      service.getLossRatioAnalytics({}, ACTOR_ADMIN),
    );

    expect(result.kpis.lossRatioPercent).toBe('62.76');
    expect(result.kpis.approvalRatePercent).toBe('51.02');
    expect(result.kpis.averageMonthlyPerCapitaExpense).toBe('62.77');
    expect(result.kpis.averageAnnualPerCapitaExpense).toBe('753.24');
    expect(result.kpis.estimatedPremiumsTotal).toBe('3610.00');
    expect(result.kpis.pendingClaimsCount).toBe(1);
  });

  it('especialidad sin nombre queda como null y sin gasto (el reclamo no enlaza al encuentro)', async () => {
    const { service, analyticsRepo } = build();
    analyticsRepo.specialties.mockResolvedValue([
      {
        specialty_code: 'SIN_ESPECIALIDAD',
        specialty_name: 'Sin especialidad registrada',
        consultations: 2,
      },
      {
        specialty_code: 'MED_GEN',
        specialty_name: 'Medicina General',
        consultations: 5,
      },
    ]);

    const result = await runWithTenant(TENANT, () =>
      service.getLossRatioAnalytics({}, ACTOR_ADMIN),
    );

    expect(result.specialties[0]).toEqual({
      specialtyCode: null,
      specialtyName: 'Sin especialidad registrada',
      consultationsCount: 2,
      totalExpenseAmount: null,
    });
    expect(result.specialties[1]?.specialtyCode).toBe('MED_GEN');
    expect(result.specialties[1]?.totalExpenseAmount).toBeNull();
  });
});
