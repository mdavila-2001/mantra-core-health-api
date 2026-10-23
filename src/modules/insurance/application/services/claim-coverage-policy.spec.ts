import { PreconditionFailedException } from '../../../../common';
import {
  InsurancePlanBenefits,
  PriorAuthorizationDeterminations,
  PriorAuthorizationItems,
  PriorAuthorizationRequests,
} from '../../entities';
import { INS } from '../../domain/insurance.concepts';
import {
  CLAIM_COVERAGE_REASON,
  ClaimCoveragePolicy,
  type ClaimToEvaluate,
} from './claim-coverage-policy';

/**
 * Cobro a la aseguradora contrastado con el plan (carril 16, REQ-16-023 a 025;
 * casos adversariales de la puerta P0, REQ-16-035).
 */

const PLAN = 'plan-1';
const OTHER_PLAN = 'plan-2';
const COVERAGE = 'coverage-1';
const CONSULT = 'service-consult';
const SURGERY = 'service-surgery';
const PA = 'pa-1';
const ITEM = 'pa-item-1';
const NOW = new Date('2026-10-23T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;

type Row = Record<string, unknown>;

/**
 * Base en memoria que entiende sólo los operadores que la regla usa: igualdad
 * (incluido `null`), `$lte`, `$gte` y `$or`. Así el filtro de vigencia y de
 * estado se prueba de verdad, no se da por bueno.
 */
function memoryEm(tables: Map<unknown, Row[]>) {
  const matches = (row: Row, filter: Row): boolean =>
    Object.entries(filter).every(([key, expected]) => {
      if (key === '$or') {
        return (expected as Row[]).some((branch) => matches(row, branch));
      }
      const actual = row[key];
      if (expected === null) return actual == null;
      if (
        expected &&
        typeof expected === 'object' &&
        !(expected instanceof Date)
      ) {
        const op = expected as { $lte?: Date; $gte?: Date };
        if (actual == null) return false;
        if (op.$lte && (actual as Date).getTime() > op.$lte.getTime())
          return false;
        if (op.$gte && (actual as Date).getTime() < op.$gte.getTime())
          return false;
        return true;
      }
      return actual === expected;
    });
  const query = (entity: unknown, filter: Row) =>
    (tables.get(entity) ?? []).filter((row) => matches(row, filter));
  return {
    find: async (entity: unknown, filter: Row) => query(entity, filter),
    findOne: async (
      entity: unknown,
      filter: Row,
      options?: { orderBy?: Record<string, 'desc' | 'asc'> },
    ) => {
      const rows = query(entity, filter);
      const order = options?.orderBy && Object.entries(options.orderBy)[0];
      if (order) {
        const [field, dir] = order;
        rows.sort((a, b) =>
          dir === 'desc'
            ? (b[field] as number) - (a[field] as number)
            : (a[field] as number) - (b[field] as number),
        );
      }
      return rows[0] ?? null;
    },
  };
}

function benefit(overrides: Row = {}): Row {
  return {
    id: 'benefit-consult',
    insurancePlanId: PLAN,
    serviceConceptId: CONSULT,
    statusConceptId: INS.BENEFIT_ACTIVE,
    effectiveFrom: new Date(NOW.getTime() - 30 * DAY),
    effectiveTo: null,
    coveragePercent: '80',
    copayAmount: '50.00',
    requiresPriorAuthorization: false,
    ...overrides,
  };
}

const surgeryBenefit = (overrides: Row = {}) =>
  benefit({
    id: 'benefit-surgery',
    serviceConceptId: SURGERY,
    coveragePercent: '90',
    copayAmount: null,
    requiresPriorAuthorization: true,
    ...overrides,
  });

const paRequest = (overrides: Row = {}): Row => ({
  id: PA,
  patientCoverageId: COVERAGE,
  serviceRequestId: null,
  inventoryReservationId: null,
  ...overrides,
});

const paItem = (overrides: Row = {}): Row => ({
  id: ITEM,
  priorAuthorizationRequestId: PA,
  serviceConceptId: SURGERY,
  ...overrides,
});

const determination = (overrides: Row = {}): Row => ({
  id: 'det-1',
  priorAuthorizationRequestId: PA,
  priorAuthorizationItemId: ITEM,
  determinationVersion: 1,
  decisionConceptId: INS.DECISION_APPROVED,
  approvedAmount: null,
  validFrom: null,
  validTo: null,
  ...overrides,
});

function setup(rows: {
  benefits?: Row[];
  requests?: Row[];
  items?: Row[];
  determinations?: Row[];
}) {
  const tables = new Map<unknown, Row[]>([
    [InsurancePlanBenefits, rows.benefits ?? [benefit()]],
    [PriorAuthorizationRequests, rows.requests ?? []],
    [PriorAuthorizationItems, rows.items ?? []],
    [PriorAuthorizationDeterminations, rows.determinations ?? []],
  ]);
  return { policy: new ClaimCoveragePolicy(), em: memoryEm(tables) as never };
}

function claim(overrides: Partial<ClaimToEvaluate> = {}): ClaimToEvaluate {
  return {
    planId: PLAN,
    patientCoverageId: COVERAGE,
    lines: [
      { lineSequence: 1, serviceConceptId: CONSULT, billedAmount: '500.00' },
    ],
    at: NOW,
    ...overrides,
  };
}

const surgeryClaim = (overrides: Partial<ClaimToEvaluate> = {}) =>
  claim({
    priorAuthorizationRequestId: PA,
    lines: [
      { lineSequence: 1, serviceConceptId: SURGERY, billedAmount: '1000.00' },
    ],
    ...overrides,
  });

async function rejectionOf(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(PreconditionFailedException);
    const response = (error as PreconditionFailedException).getResponse() as {
      details?: { reason?: string };
    };
    return (
      response.details?.reason ??
      (error as { details?: { reason?: string } }).details?.reason
    );
  }
  throw new Error('se esperaba un rechazo y el cobro pasó');
}

describe('ClaimCoveragePolicy', () => {
  describe('reparto calculado por el servidor', () => {
    it('500 Bs, copago 50, 80 % → paciente 140 y aseguradora 360', async () => {
      const { policy, em } = setup({});
      const [line] = await policy.evaluate(em, claim());
      expect(line).toMatchObject({
        lineSequence: 1,
        benefitId: 'benefit-consult',
        coveragePercent: '80',
        copayAmount: '50.00',
        requiresPriorAuthorization: false,
        patientAmount: '140.00',
        insurerAmount: '360.00',
      });
    });

    it('acepta la parte del paciente si coincide aunque cambie la escala', async () => {
      const { policy, em } = setup({});
      const [line] = await policy.evaluate(
        em,
        claim({
          lines: [
            {
              lineSequence: 1,
              serviceConceptId: CONSULT,
              billedAmount: '500.00',
              patientResponsibilityAmount: '140',
            },
          ],
        }),
      );
      expect(line.patientAmount).toBe('140.00');
    });

    it('rechaza una parte del paciente inflada por el cliente', async () => {
      const { policy, em } = setup({});
      const reason = await rejectionOf(
        policy.evaluate(
          em,
          claim({
            lines: [
              {
                lineSequence: 1,
                serviceConceptId: CONSULT,
                billedAmount: '500.00',
                patientResponsibilityAmount: '300.00',
              },
            ],
          }),
        ),
      );
      expect(reason).toBe(CLAIM_COVERAGE_REASON.PATIENT_SHARE_MISMATCH);
    });

    it('rechaza también una parte del paciente rebajada', async () => {
      const { policy, em } = setup({});
      const reason = await rejectionOf(
        policy.evaluate(
          em,
          claim({
            lines: [
              {
                lineSequence: 1,
                serviceConceptId: CONSULT,
                billedAmount: '500.00',
                patientResponsibilityAmount: '0.00',
              },
            ],
          }),
        ),
      );
      expect(reason).toBe(CLAIM_COVERAGE_REASON.PATIENT_SHARE_MISMATCH);
    });
  });

  describe('qué cubre el plan', () => {
    it('una línea sin servicio no se puede contrastar', async () => {
      const { policy, em } = setup({});
      const reason = await rejectionOf(
        policy.evaluate(
          em,
          claim({ lines: [{ lineSequence: 1, billedAmount: '100.00' }] }),
        ),
      );
      expect(reason).toBe(CLAIM_COVERAGE_REASON.SERVICE_REQUIRED);
    });

    it('un servicio que el plan no cubre no se cobra a la aseguradora', async () => {
      const { policy, em } = setup({ benefits: [] });
      expect(await rejectionOf(policy.evaluate(em, claim()))).toBe(
        CLAIM_COVERAGE_REASON.SERVICE_NOT_COVERED,
      );
    });

    it.each([
      ['de otro plan', { insurancePlanId: OTHER_PLAN }],
      ['inactivo', { statusConceptId: 'otro-estado' }],
      ['vencido', { effectiveTo: new Date(NOW.getTime() - DAY) }],
      ['que todavía no rige', { effectiveFrom: new Date(NOW.getTime() + DAY) }],
    ])('un beneficio %s no cubre', async (_case, overrides) => {
      const { policy, em } = setup({ benefits: [benefit(overrides)] });
      expect(await rejectionOf(policy.evaluate(em, claim()))).toBe(
        CLAIM_COVERAGE_REASON.SERVICE_NOT_COVERED,
      );
    });

    it('un beneficio que vence hoy todavía cubre', async () => {
      const { policy, em } = setup({
        benefits: [benefit({ effectiveTo: NOW })],
      });
      await expect(policy.evaluate(em, claim())).resolves.toHaveLength(1);
    });

    it('dos beneficios vigentes para el mismo servicio no se eligen a ojo', async () => {
      const { policy, em } = setup({
        benefits: [benefit(), benefit({ id: 'benefit-consult-2' })],
      });
      expect(await rejectionOf(policy.evaluate(em, claim()))).toBe(
        CLAIM_COVERAGE_REASON.BENEFIT_AMBIGUOUS,
      );
    });

    it('un beneficio sin porcentaje ni copago no se adivina', async () => {
      const { policy, em } = setup({
        benefits: [benefit({ coveragePercent: null, copayAmount: null })],
      });
      expect(await rejectionOf(policy.evaluate(em, claim()))).toBe(
        CLAIM_COVERAGE_REASON.BENEFIT_WITHOUT_TERMS,
      );
    });

    it('un monto inválido se rechaza', async () => {
      const { policy, em } = setup({});
      const reason = await rejectionOf(
        policy.evaluate(
          em,
          claim({
            lines: [
              {
                lineSequence: 1,
                serviceConceptId: CONSULT,
                billedAmount: '-10',
              },
            ],
          }),
        ),
      );
      expect(reason).toBe(CLAIM_COVERAGE_REASON.INVALID_AMOUNT);
    });
  });

  describe('aprobación previa', () => {
    const withSurgery = (rows: Parameters<typeof setup>[0]) =>
      setup({ benefits: [surgeryBenefit()], ...rows });

    it('aprobada: pasa y reparte 90 %', async () => {
      const { policy, em } = withSurgery({
        requests: [paRequest()],
        items: [paItem()],
        determinations: [determination()],
      });
      const [line] = await policy.evaluate(em, surgeryClaim());
      expect(line).toMatchObject({
        requiresPriorAuthorization: true,
        patientAmount: '100.00',
        insurerAmount: '900.00',
      });
    });

    it('exigida y ausente', async () => {
      const { policy, em } = withSurgery({});
      expect(
        await rejectionOf(
          policy.evaluate(
            em,
            surgeryClaim({ priorAuthorizationRequestId: null }),
          ),
        ),
      ).toBe(CLAIM_COVERAGE_REASON.PRIOR_AUTH_REQUIRED);
    });

    it.each([
      ['de otra cobertura', { patientCoverageId: 'coverage-de-otro-paciente' }],
      ['de otro pedido', { serviceRequestId: 'otro-pedido' }],
    ])('una aprobación %s no sirve (IDOR)', async (_case, overrides) => {
      const { policy, em } = withSurgery({
        requests: [paRequest(overrides)],
        items: [paItem()],
        determinations: [determination()],
      });
      expect(await rejectionOf(policy.evaluate(em, surgeryClaim()))).toBe(
        CLAIM_COVERAGE_REASON.PRIOR_AUTH_MISMATCH,
      );
    });

    it('una aprobación inexistente no sirve', async () => {
      const { policy, em } = withSurgery({ requests: [] });
      expect(await rejectionOf(policy.evaluate(em, surgeryClaim()))).toBe(
        CLAIM_COVERAGE_REASON.PRIOR_AUTH_MISMATCH,
      );
    });

    it('una aprobación de otro servicio no cubre éste', async () => {
      const { policy, em } = withSurgery({
        requests: [paRequest()],
        items: [paItem({ serviceConceptId: CONSULT })],
        determinations: [determination()],
      });
      expect(await rejectionOf(policy.evaluate(em, surgeryClaim()))).toBe(
        CLAIM_COVERAGE_REASON.PRIOR_AUTH_MISMATCH,
      );
    });

    it('pendiente: sin decisión de la aseguradora', async () => {
      const { policy, em } = withSurgery({
        requests: [paRequest()],
        items: [paItem()],
        determinations: [],
      });
      expect(await rejectionOf(policy.evaluate(em, surgeryClaim()))).toBe(
        CLAIM_COVERAGE_REASON.PRIOR_AUTH_PENDING,
      );
    });

    it('denegada', async () => {
      const { policy, em } = withSurgery({
        requests: [paRequest()],
        items: [paItem()],
        determinations: [
          determination({ decisionConceptId: INS.DECISION_DENIED }),
        ],
      });
      expect(await rejectionOf(policy.evaluate(em, surgeryClaim()))).toBe(
        CLAIM_COVERAGE_REASON.PRIOR_AUTH_DENIED,
      );
    });

    it('manda la última versión de la decisión: aprobada y después denegada', async () => {
      const { policy, em } = withSurgery({
        requests: [paRequest()],
        items: [paItem()],
        determinations: [
          determination({ determinationVersion: 1 }),
          determination({
            id: 'det-2',
            determinationVersion: 2,
            decisionConceptId: INS.DECISION_DENIED,
          }),
        ],
      });
      expect(await rejectionOf(policy.evaluate(em, surgeryClaim()))).toBe(
        CLAIM_COVERAGE_REASON.PRIOR_AUTH_DENIED,
      );
    });

    it('una decisión sobre el pedido entero vale si no hay una por ítem', async () => {
      const { policy, em } = withSurgery({
        requests: [paRequest()],
        items: [paItem()],
        determinations: [determination({ priorAuthorizationItemId: null })],
      });
      await expect(policy.evaluate(em, surgeryClaim())).resolves.toHaveLength(
        1,
      );
    });

    it.each([
      ['vencida', { validTo: new Date(NOW.getTime() - DAY) }],
      ['que todavía no rige', { validFrom: new Date(NOW.getTime() + DAY) }],
    ])('%s', async (_case, overrides) => {
      const { policy, em } = withSurgery({
        requests: [paRequest()],
        items: [paItem()],
        determinations: [determination(overrides)],
      });
      expect(await rejectionOf(policy.evaluate(em, surgeryClaim()))).toBe(
        CLAIM_COVERAGE_REASON.PRIOR_AUTH_EXPIRED,
      );
    });

    it('parcial: no se puede cobrar más de lo aprobado', async () => {
      const { policy, em } = withSurgery({
        requests: [paRequest()],
        items: [paItem()],
        determinations: [
          determination({
            decisionConceptId: INS.DECISION_PARTIAL,
            approvedAmount: '800.00',
          }),
        ],
      });
      expect(await rejectionOf(policy.evaluate(em, surgeryClaim()))).toBe(
        CLAIM_COVERAGE_REASON.PRIOR_AUTH_AMOUNT_EXCEEDED,
      );
    });

    it('parcial: hasta lo aprobado, pasa', async () => {
      const { policy, em } = withSurgery({
        requests: [paRequest()],
        items: [paItem()],
        determinations: [
          determination({
            decisionConceptId: INS.DECISION_PARTIAL,
            approvedAmount: '1000',
          }),
        ],
      });
      await expect(policy.evaluate(em, surgeryClaim())).resolves.toHaveLength(
        1,
      );
    });

    it('un servicio sin aprobación exigida no la pide', async () => {
      const { policy, em } = setup({});
      await expect(
        policy.evaluate(em, claim({ priorAuthorizationRequestId: null })),
      ).resolves.toHaveLength(1);
    });
  });
});
