import { jest } from '@jest/globals';
import { InsuranceAnalyticsRepository } from './insurance-analytics.repository';
import type { AnalyticsPeriod } from './insurance-analytics.repository';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const PERIOD: AnalyticsPeriod = {
  lo: new Date('2026-01-01T04:00:00.000Z'),
  hi: new Date('2026-04-01T04:00:00.000Z'),
  loDate: '2026-01-01',
  hiDate: '2026-03-31',
};

const CARRIER = 'carrier-a';
const REVERSED = 'concept-reversed';
const COVERAGE_ACTIVE = 'concept-coverage-active';
const DEPENDENT_ACTIVE = 'concept-dependent-active';
const IMM_COMPLETED = 'concept-imm-completed';
const BOB = 'concept-bob';

/** Doble de `EntityManager`: sólo hace falta `getConnection().execute`, como el
 * resto de las agregaciones SQL del repo (`ProcedureNomenclatureService`). */
function build(respuestas: unknown[][] = []) {
  const llamadas: { sql: string; params: unknown[] }[] = [];
  let i = 0;
  const execute = mockFn((sql: string, params: unknown[]) => {
    llamadas.push({ sql, params });
    return Promise.resolve(respuestas[i++] ?? []);
  });
  const em = { getConnection: () => ({ execute }) } as never;
  return { em, llamadas, repo: new InsuranceAnalyticsRepository() };
}

describe('InsuranceAnalyticsRepository (subtarea 3.1, v4.2.14)', () => {
  it('dominantCurrency: acota por carrier, rango y estado ≠ revertido; null sin filas', async () => {
    const { em, llamadas, repo } = build([[]]);

    const result = await repo.dominantCurrency(
      em,
      CARRIER,
      PERIOD,
      REVERSED,
      BOB,
    );

    expect(result).toBeNull();
    expect(llamadas[0]!.sql).toContain('insurance.insurance_claims c');
    expect(llamadas[0]!.sql).toContain('c.insurance_carrier_id = ?');
    expect(llamadas[0]!.sql).toContain('c.status_concept_id <> ?');
    expect(llamadas[0]!.params).toEqual([
      CARRIER,
      PERIOD.lo,
      PERIOD.hi,
      REVERSED,
      null,
      null,
      BOB,
    ]);
  });

  it('dominantCurrency: devuelve la moneda de la primera fila (ya ordenada por conteo)', async () => {
    const { em, repo } = build([[{ currency_concept_id: BOB, n: '4' }]]);

    const result = await repo.dominantCurrency(
      em,
      CARRIER,
      PERIOD,
      REVERSED,
      BOB,
    );

    expect(result).toBe(BOB);
  });

  it('kpis: una sola consulta con las CTEs de reclamos, afiliados, meses y primas', async () => {
    const { em, llamadas, repo } = build([
      [
        {
          total_claims: 4,
          other_currency_claims: 0,
          adjudicated_claims: 3,
          pending_claims: 1,
          total_billed: '5060.63',
          total_approved: '2265.50',
          total_copay: '330.00',
          total_denied: '2175.13',
          active_affiliates: 3,
          period_months: '12.03',
          estimated_premiums: '3610.00',
          coverages_without_premium: 0,
          approval_rate_percent: '51.02',
          avg_monthly_per_capita: '62.77',
          avg_annual_per_capita: '753.24',
          loss_ratio_percent: '62.76',
        },
      ],
    ]);

    const result = await repo.kpis(
      em,
      CARRIER,
      PERIOD,
      REVERSED,
      COVERAGE_ACTIVE,
      DEPENDENT_ACTIVE,
      BOB,
    );

    expect(result.total_claims).toBe(4);
    expect(result.loss_ratio_percent).toBe('62.76');
    const sql = llamadas[0]!.sql;
    expect(sql).toContain('WITH claims AS');
    expect(sql).toContain('DISTINCT ON (v.insurance_claim_id)');
    expect(sql).toContain('generate_series(');
    expect(sql).toContain('premium_by_month AS');
    expect(sql).toContain(
      'CASE WHEN ct.adjudicated_claims = 0 OR ct.total_billed_adjudicated_n = 0 THEN NULL',
    );
    // Nunca se filtra un carrier ajeno: el primer parámetro es siempre el carrier pedido.
    expect(llamadas[0]!.params[0]).toBe(CARRIER);
  });

  it('monthlyTrends: un mes por fila, agrupado en La Paz', async () => {
    const { em, llamadas, repo } = build([
      [
        {
          period: '2026-03',
          billed_amount: '100.00',
          approved_amount: '80.00',
          claims_count: 1,
        },
      ],
    ]);

    const result = await repo.monthlyTrends(em, CARRIER, PERIOD, REVERSED, BOB);

    expect(result).toHaveLength(1);
    expect(llamadas[0]!.sql).toContain("AT TIME ZONE 'America/La_Paz'");
    expect(llamadas[0]!.sql).toContain('generate_series(');
  });

  it('topMedications: sólo vía medication_dispensation_line_id (inventory_reservation_line_id ausente en esta base)', async () => {
    const { em, llamadas, repo } = build([[]]);

    await repo.topMedications(em, CARRIER, PERIOD, REVERSED);

    const sql = llamadas[0]!.sql;
    expect(sql).toContain('medication_dispensation_lines mdl');
    expect(sql).toContain('l.medication_dispensation_line_id IS NOT NULL');
    expect(sql).not.toContain('inventory_reservation_line_id');
    expect(sql).toContain('LIMIT 10');
  });

  it('specialties: encuentros de la población afiliada, con LATERAL para no duplicar por especialidad', async () => {
    const { em, llamadas, repo } = build([[]]);

    await repo.specialties(
      em,
      CARRIER,
      PERIOD,
      COVERAGE_ACTIVE,
      DEPENDENT_ACTIVE,
    );

    const sql = llamadas[0]!.sql;
    expect(sql).toContain('clinical.encounters e');
    expect(sql).toContain('LEFT JOIN LATERAL');
    expect(sql).toContain('ps.is_primary IS TRUE');
    expect(sql).toContain("coalesce(specialty_code, 'SIN_ESPECIALIDAD')");
  });

  it('prevalentPathologies: sólo code system icd10cm, top 10 por casos', async () => {
    const { em, llamadas, repo } = build([[]]);

    await repo.prevalentPathologies(
      em,
      CARRIER,
      PERIOD,
      COVERAGE_ACTIVE,
      DEPENDENT_ACTIVE,
    );

    const sql = llamadas[0]!.sql;
    expect(sql).toContain("cs.internal_code = 'icd10cm'");
    expect(sql).toContain('coalesce(cd.onset_at, cd.created_at)');
    expect(sql).toContain('LIMIT 10');
  });

  it('immunization: tasa calculada en SQL, null sin afiliados (nunca NaN)', async () => {
    const { em, llamadas, repo } = build([
      [{ vaccinated: 2, total: 3, rate_percent: '66.67' }],
    ]);

    const result = await repo.immunization(
      em,
      CARRIER,
      PERIOD,
      COVERAGE_ACTIVE,
      DEPENDENT_ACTIVE,
      IMM_COMPLETED,
    );

    expect(result).toEqual({ vaccinated: 2, total: 3, rate_percent: '66.67' });
    expect(llamadas[0]!.sql).toContain(
      'CASE WHEN (SELECT count(*) FROM affiliates) = 0 THEN NULL',
    );
  });

  it('todas las consultas de afiliados aceptan planId null para no filtrar por plan', async () => {
    const { em, llamadas, repo } = build([[]]);

    await repo.immunization(
      em,
      CARRIER,
      { ...PERIOD, planId: 'plan-a' },
      COVERAGE_ACTIVE,
      DEPENDENT_ACTIVE,
      IMM_COMPLETED,
    );

    expect(llamadas[0]!.params).toContain('plan-a');
  });
});
