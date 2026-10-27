import { jest } from '@jest/globals';
import {
  ClaimDisputes,
  InsuranceClaimLines,
  PatientCoverages,
} from '../../entities';
import { INS } from '../../domain/insurance.concepts';
import {
  BREAKDOWN_CLAIM_LIMIT,
  PatientChargeBreakdownService,
  minusDecimals,
  sumDecimals,
} from './patient-charge-breakdown.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const SERVICE_CONCEPT = 'concept-consulta';
const CURRENCY_CONCEPT = 'concept-bob';

function claim(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    patientCoverageId: `coverage-${id}`,
    currencyConceptId: CURRENCY_CONCEPT,
    priorAuthorizationRequestId: null,
    serviceRequestId: null,
    inventoryReservationId: null,
    submittedAt: new Date('2026-10-01T10:00:00.000Z'),
    ...overrides,
  } as any;
}

function line(claimId: string, sequence: number, overrides = {}) {
  return {
    id: `line-${claimId}-${sequence}`,
    insuranceClaimId: claimId,
    lineSequence: sequence,
    serviceConceptId: SERVICE_CONCEPT,
    billedAmount: '500.00',
    patientResponsibilityAmount: null,
    ...overrides,
  };
}

/** Una cotización con beneficio: 90 % de cobertura, sin copago. */
const COVERED = {
  lineSequence: 1,
  benefitId: 'benefit-1',
  coveragePercent: '90',
  copayAmount: '0.00',
  deductibleAmount: null,
  requiresPriorAuthorization: false,
  priorAuthorizationStatus: 'NOT_REQUIRED',
  patientAmount: '50.00',
  insurerAmount: '450.00',
  reason: null,
  message: null,
};

/** Una cotización sin beneficio en el plan. */
const NOT_COVERED = {
  lineSequence: 1,
  benefitId: null,
  coveragePercent: null,
  copayAmount: null,
  deductibleAmount: null,
  requiresPriorAuthorization: false,
  priorAuthorizationStatus: null,
  patientAmount: null,
  insurerAmount: null,
  reason: 'SERVICE_NOT_COVERED',
  message: 'El plan no cubre este servicio',
};

function build(
  options: {
    lines?: any[];
    disputes?: any[];
    quote?: (...args: any[]) => unknown;
  } = {},
) {
  const em: any = {
    find: mockFn((entity: unknown) => {
      if (entity === PatientCoverages) {
        return Promise.resolve([]);
      }
      if (entity === InsuranceClaimLines)
        return Promise.resolve(options.lines ?? []);
      if (entity === ClaimDisputes)
        return Promise.resolve(options.disputes ?? []);
      throw new Error('Consulta inesperada');
    }),
  };
  const policy = {
    quoteLine: mockFn(options.quote ?? (() => Promise.resolve(COVERED))),
  };
  const claimReadRepo = {
    findConceptsByIds: mockFn(() =>
      Promise.resolve([
        { id: SERVICE_CONCEPT, code: 'CONSULTA', display: 'Consulta general' },
        { id: CURRENCY_CONCEPT, code: 'BOB', display: 'Boliviano' },
      ]),
    ),
  };
  const service = new PatientChargeBreakdownService(
    policy as never,
    claimReadRepo as never,
  );
  return { em, policy, claimReadRepo, service };
}

/** Hace que cada cobertura `coverage-<id>` pertenezca al plan `plan-1`. */
function withCoverages(d: ReturnType<typeof build>, claims: any[]) {
  const original = d.em.find.getMockImplementation() as (e: unknown) => unknown;
  d.em.find.mockImplementation((entity: unknown, ...rest: unknown[]) =>
    entity === PatientCoverages
      ? Promise.resolve(
          claims.map((c) => ({
            id: c.patientCoverageId,
            insurancePlanId: 'plan-1',
          })),
        )
      : (original as (...a: unknown[]) => unknown)(entity, ...rest),
  );
}

describe('PatientChargeBreakdownService (carril 16, REQ-16-031 y 032)', () => {
  it('sin solicitudes no lee nada', async () => {
    const d = build();
    expect((await d.service.read(d.em, [])).size).toBe(0);
    expect(d.em.find).not.toHaveBeenCalled();
  });

  it('arma el desglose con el reparto del servidor y el nombre del servicio', async () => {
    const claims = [claim('c1')];
    const d = build({ lines: [line('c1', 1)] });
    withCoverages(d, claims);
    const result = await d.service.read(d.em, claims);
    const breakdown = result.get('c1')!.breakdown!;
    expect(breakdown).toEqual({
      currencyCode: 'BOB',
      patientTotal: '50.00',
      insurerTotal: '450.00',
      lines: [
        {
          key: 'line-c1-1',
          service: 'Consulta general',
          billedAmount: '500.00',
          coveragePercent: '90',
          copayAmount: '0.00',
          patientAmount: '50.00',
          insurerAmount: '450.00',
          chargeKind: 'INSURED_SHARE',
          authorizationStatus: 'NOT_REQUIRED',
        },
      ],
    });
  });

  it('cotiza con la fecha de envío del reclamo y el plan de su cobertura', async () => {
    const claims = [claim('c1')];
    const d = build({ lines: [line('c1', 1)] });
    withCoverages(d, claims);
    await d.service.read(d.em, claims);
    const [, toEvaluate] = d.policy.quoteLine.mock.calls[0]!;
    expect(toEvaluate).toMatchObject({
      planId: 'plan-1',
      patientCoverageId: 'coverage-c1',
      at: new Date('2026-10-01T10:00:00.000Z'),
    });
  });

  it('un servicio sin beneficio es un cobro particular: la persona paga el total', async () => {
    const claims = [claim('c1')];
    const d = build({
      lines: [line('c1', 1)],
      quote: () => Promise.resolve(NOT_COVERED),
    });
    withCoverages(d, claims);
    const breakdown = (await d.service.read(d.em, claims)).get(
      'c1',
    )!.breakdown!;
    expect(breakdown.lines[0]).toMatchObject({
      chargeKind: 'PRIVATE_FULL',
      patientAmount: '500.00',
      insurerAmount: '0.00',
      coveragePercent: '0',
      authorizationStatus: null,
    });
    expect(breakdown.patientTotal).toBe('500.00');
    expect(breakdown.insurerTotal).toBe('0.00');
  });

  it('si el beneficio ya no existe pero el reclamo guardó la parte del paciente, usa la guardada', async () => {
    const claims = [claim('c1')];
    const d = build({
      lines: [line('c1', 1, { patientResponsibilityAmount: '140.00' })],
      quote: () => Promise.resolve(NOT_COVERED),
    });
    withCoverages(d, claims);
    const row = (await d.service.read(d.em, claims)).get('c1')!.breakdown!
      .lines[0]!;
    expect(row).toMatchObject({
      chargeKind: 'INSURED_SHARE',
      patientAmount: '140.00',
      insurerAmount: '360.00',
    });
  });

  it('suma los totales con aritmética decimal exacta', async () => {
    const claims = [claim('c1')];
    const d = build({
      lines: [
        line('c1', 1, { billedAmount: '0.10' }),
        line('c1', 2, { billedAmount: '0.20' }),
      ],
      quote: (_em: unknown, _claim: unknown, l: { billedAmount: string }) =>
        Promise.resolve({
          ...COVERED,
          patientAmount: l.billedAmount,
          insurerAmount: '0.00',
        }),
    });
    withCoverages(d, claims);
    const breakdown = (await d.service.read(d.em, claims)).get(
      'c1',
    )!.breakdown!;
    expect(breakdown.patientTotal).toBe('0.30');
  });

  it('una solicitud sin líneas, o sin cobertura conocida, queda sin desglose', async () => {
    const claims = [claim('c-sin-lineas'), claim('c-sin-cobertura')];
    const d = build({ lines: [line('c-sin-cobertura', 1)] });
    // Solo la primera tiene cobertura.
    d.em.find.mockImplementation((entity: unknown) => {
      if (entity === PatientCoverages)
        return Promise.resolve([
          { id: 'coverage-c-sin-lineas', insurancePlanId: 'plan-1' },
        ]);
      if (entity === InsuranceClaimLines)
        return Promise.resolve([line('c-sin-cobertura', 1)]);
      return Promise.resolve([]);
    });
    const result = await d.service.read(d.em, claims);
    expect(result.get('c-sin-lineas')!.breakdown).toBeNull();
    expect(result.get('c-sin-cobertura')!.breakdown).toBeNull();
    expect(d.policy.quoteLine).not.toHaveBeenCalled();
  });

  it(`solo las ${BREAKDOWN_CLAIM_LIMIT} más recientes llevan desglose`, async () => {
    const claims = Array.from({ length: BREAKDOWN_CLAIM_LIMIT + 2 }, (_, i) =>
      claim(`c${i}`),
    );
    const d = build({ lines: claims.map((c) => line(c.id, 1)) });
    withCoverages(d, claims);
    const result = await d.service.read(d.em, claims);
    expect(result.get('c0')!.breakdown).not.toBeNull();
    expect(
      result.get(`c${BREAKDOWN_CLAIM_LIMIT - 1}`)!.breakdown,
    ).not.toBeNull();
    expect(result.get(`c${BREAKDOWN_CLAIM_LIMIT}`)!.breakdown).toBeNull();
    expect(d.policy.quoteLine).toHaveBeenCalledTimes(BREAKDOWN_CLAIM_LIMIT);
  });

  describe('objeción del paciente', () => {
    function dispute(overrides: Record<string, unknown> = {}) {
      return {
        id: 'dispute-1',
        insuranceClaimId: 'c1',
        disputeReasonConceptId: INS.DISPUTE_REASON_CHARGE_AMOUNT,
        statusConceptId: INS.DISPUTE_OPEN,
        submittedAt: new Date('2026-10-02T09:00:00.000Z'),
        createdAt: new Date('2026-10-02T09:00:00.000Z'),
        ...overrides,
      };
    }

    it('trae el motivo cerrado, cuándo la presentó y que sigue abierta', async () => {
      const claims = [claim('c1')];
      const d = build({ disputes: [dispute()] });
      const result = await d.service.read(d.em, claims);
      expect(result.get('c1')!.patientObjection).toEqual({
        id: 'dispute-1',
        reason: 'AMOUNT_DIFFERS',
        submittedAt: '2026-10-02T09:00:00.000Z',
        status: 'OPEN',
      });
    });

    it.each([
      [INS.DISPUTE_REASON_SERVICE_NOT_RECEIVED, 'SERVICE_NOT_RECEIVED'],
      [INS.DISPUTE_REASON_NOT_INFORMED, 'NOT_INFORMED'],
    ])('traduce el motivo guardado %s', async (concept, expected) => {
      const d = build({
        disputes: [dispute({ disputeReasonConceptId: concept })],
      });
      const result = await d.service.read(d.em, [claim('c1')]);
      expect(result.get('c1')!.patientObjection!.reason).toBe(expected);
    });

    it('una disputa que no está abierta se muestra como resuelta', async () => {
      const d = build({
        disputes: [dispute({ statusConceptId: 'otro-estado' })],
      });
      const result = await d.service.read(d.em, [claim('c1')]);
      expect(result.get('c1')!.patientObjection!.status).toBe('RESOLVED');
    });

    it('con varias, muestra la más reciente', async () => {
      const d = build({
        disputes: [
          dispute({ id: 'nueva' }),
          dispute({
            id: 'vieja',
            submittedAt: new Date('2026-09-01T00:00:00.000Z'),
          }),
        ],
      });
      const result = await d.service.read(d.em, [claim('c1')]);
      expect(result.get('c1')!.patientObjection!.id).toBe('nueva');
    });

    it('un motivo desconocido no se inventa: sin objeción', async () => {
      const d = build({
        disputes: [dispute({ disputeReasonConceptId: 'motivo-ajeno' })],
      });
      const result = await d.service.read(d.em, [claim('c1')]);
      expect(result.get('c1')!.patientObjection).toBeNull();
    });

    it('sin disputa, la objeción es null', async () => {
      const d = build();
      const result = await d.service.read(d.em, [claim('c1')]);
      expect(result.get('c1')!.patientObjection).toBeNull();
    });
  });
});

describe('aritmética decimal exacta del desglose', () => {
  it.each([
    ['500.00', '140.00', '360.00'],
    ['0.30', '0.10', '0.20'],
    ['10', '0.5', '9.50'],
    ['1.005', '0.005', '1.000'],
    ['5.00', '8.00', '-3.00'],
  ])('%s − %s = %s', (a, b, expected) => {
    expect(minusDecimals(a, b)).toBe(expected);
  });

  it.each([
    [['0.10', '0.20'], '0.30'],
    [[], '0.00'],
    [['1.005', '2'], '3.005'],
  ])('suma %j = %s', (values, expected) => {
    expect(sumDecimals(values as string[])).toBe(expected);
  });
});
