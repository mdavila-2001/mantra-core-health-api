import { jest } from '@jest/globals';
import { PostgreSqlPlatform } from '@mikro-orm/postgresql';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { DeclaredCoveragesReader } from './declared-coverages-reader';
import { INS } from '../insurance.concepts';
import { PHARM } from '../../pharmacy/pharmacy.concepts';
import { CONCEPTS } from '../../../common';

/**
 * Extraído de `ProfilesPatientsService.leerCoberturas` (subtarea B.3): estos
 * tres casos ya existían ahí, verificando el mismo SQL que la clase que
 * reemplazó a ese método privado. Se mueven acá porque `leerCoberturas` ahora
 * es una delegación de una línea (`profiles-patients.service.spec.ts` sólo
 * comprueba que delega).
 */
describe('DeclaredCoveragesReader', () => {
  function build() {
    const execute = mockFn().mockResolvedValue([]);
    const em = { getConnection: mockFn().mockReturnValue({ execute }) };
    const reader = new DeclaredCoveragesReader();
    return { reader, em, execute };
  }

  it.each(['', 'insurance:'])(
    'reads policies and benefits in batches with catalog prefix %s preserving exact amounts and validity',
    async (prefix) => {
      const { reader, em } = build();
      const execute = mockFn(async (sql: string) => {
        if (sql.includes('from insurance.patient_coverages'))
          return ['coverage-a', 'coverage-b'].map((id, index) => ({
            coverage_id: id,
            carrier_id: 'carrier',
            carrier_name: 'Andina',
            plan_name: 'Integral',
            insurance_plan_id: 'plan',
            coverage_order: index + 1,
            policy_identifier: `POL-${index}`,
            member_identifier: 'DECLARED',
            verification_status_concept_id: INS.VERIFY_PENDING,
            status_code: `${prefix}COVERAGE_ACTIVE`,
            status_concept_id: INS.COVERAGE_ACTIVE,
            status_display: 'Activa',
            plan_status_concept_id: INS.PLAN_ACTIVE,
            effective_from: '2020-01-01',
            effective_to: '2099-12-31',
            currency_code: prefix ? 'pharmacy:CURRENCY_USD' : 'USD',
            currency_concept_id: prefix
              ? PHARM.CURRENCY_USD
              : CONCEPTS.CURRENCY_USD,
            whatsapp_number: null,
            call_center_phone: '800-10-6060',
          }));
        if (sql.includes('from insurance.insurance_plan_benefits'))
          return [
            {
              id: 'general',
              insurance_plan_id: 'plan',
              category_name: 'Consulta',
              status_code: `${prefix}BENEFIT_ACTIVE`,
              status_concept_id: INS.BENEFIT_ACTIVE,
              coverage_percent: '80.50',
              copay_amount: '0.00',
              deductible_amount: null,
              effective_from: '2020-01-01',
            },
            {
              id: 'specific',
              insurance_plan_id: 'plan',
              category_name: 'Consulta',
              service_concept_id: 'service',
              service_name: 'Seguimiento',
              status_code: `${prefix}BENEFIT_ACTIVE`,
              status_concept_id: INS.BENEFIT_ACTIVE,
              coverage_percent: null,
              copay_amount: null,
              deductible_amount: '120.00',
              effective_from: '2100-01-01',
            },
          ];
        return [];
      });
      em.getConnection.mockReturnValue({ execute });

      const coverages = await reader.read(em as any, 'pat-1');

      expect(coverages.map((coverage) => coverage.id)).toEqual([
        'coverage-a',
        'coverage-b',
      ]);
      expect(coverages[0]).toMatchObject({
        planId: 'plan',
        statusCode: `${prefix}COVERAGE_ACTIVE`,
        validityStatus: 'CURRENT',
        coverageOrder: 1,
        currencyCode: 'USD',
        carrierCallCenterPhone: '800-10-6060',
        verified: false,
      });
      expect(coverages[0].carrierWhatsappNumber).toBeUndefined();
      expect(coverages[0].benefits[0]).toMatchObject({
        id: 'general',
        statusCode: `${prefix}BENEFIT_ACTIVE`,
        validityStatus: 'CURRENT',
        coveragePercent: '80.50',
        copayAmount: '0.00',
      });
      expect(coverages[0].benefits[0].deductibleAmount).toBeUndefined();
      expect(coverages[0].benefits[1]).toMatchObject({
        id: 'specific',
        validityStatus: 'UPCOMING',
        serviceConceptId: 'service',
        deductibleAmount: '120.00',
      });
      expect(coverages[0].benefits[1].coveragePercent).toBeUndefined();
      const benefitReads = execute.mock.calls.filter(([sql]: [string]) =>
        sql.includes('from insurance.insurance_plan_benefits'),
      );
      expect(benefitReads).toHaveLength(1);
      expect(benefitReads[0][1]).toEqual(['plan']);
    },
  );

  it.each([
    {
      label: 'several policies sharing one plan',
      planIds: [
        '11111111-1111-4111-8111-111111111111',
        '11111111-1111-4111-8111-111111111111',
      ],
      predicate:
        "where b.insurance_plan_id in ('11111111-1111-4111-8111-111111111111')",
    },
    {
      label: 'several policies with different plans',
      planIds: [
        '11111111-1111-4111-8111-111111111111',
        '22222222-2222-4222-8222-222222222222',
        '11111111-1111-4111-8111-111111111111',
      ],
      predicate:
        "where b.insurance_plan_id in ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222')",
    },
  ])(
    'renders a valid PostgreSQL benefit batch for $label',
    async ({ planIds, predicate }) => {
      const { reader, em } = build();
      const platform = new PostgreSqlPlatform();
      const benefitQueries: string[] = [];
      const execute = mockFn(async (sql: string, bindings: unknown[] = []) => {
        if (sql.includes('from insurance.patient_coverages')) {
          return planIds.map((planId, index) => ({
            coverage_id: `coverage-${index}`,
            insurance_plan_id: planId,
            carrier_id: 'carrier',
            carrier_name: 'Andina',
            plan_name: 'Integral',
          }));
        }
        if (sql.includes('from insurance.insurance_plan_benefits')) {
          benefitQueries.push(platform.formatQuery(sql, bindings));
        }
        return [];
      });
      em.getConnection.mockReturnValue({ execute });

      const coverages = await reader.read(em as any, 'pat-1');

      expect(coverages).toHaveLength(planIds.length);
      expect(benefitQueries).toHaveLength(1);
      expect(benefitQueries[0]).toContain(predicate);
    },
  );

  it('sin coberturas declaradas, devuelve una lista vacía sin pedir beneficios', async () => {
    const { reader, em, execute } = build();

    const coverages = await reader.read(em as any, 'pat-sin-seguro');

    expect(coverages).toEqual([]);
    expect(execute).toHaveBeenCalledTimes(1);
  });
});
