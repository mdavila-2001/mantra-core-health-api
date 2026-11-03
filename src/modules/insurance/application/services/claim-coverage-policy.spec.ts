import { PreconditionFailedException } from '../../../../common';
import {
  InsuranceClaimLines,
  InsuranceClaims,
  InsurancePlanBenefits,
  PatientCoverages,
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
        const op = expected as {
          $lte?: Date;
          $gte?: Date;
          $ne?: unknown;
          $in?: unknown[];
        };
        if ('$ne' in op) return actual !== op.$ne;
        if ('$in' in op) return (op.$in ?? []).includes(actual);
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
    locks: [] as unknown[],
    findOne: async function (
      this: { locks: unknown[] },
      entity: unknown,
      filter: Row,
      options?: {
        orderBy?: Record<string, 'desc' | 'asc'>;
        lockMode?: unknown;
      },
    ) {
      if (options?.lockMode !== undefined) this.locks.push(entity);
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
  coverages?: Row[];
  benefits?: Row[];
  requests?: Row[];
  items?: Row[];
  determinations?: Row[];
  claims?: Row[];
  claimLines?: Row[];
}) {
  const tables = new Map<unknown, Row[]>([
    [
      PatientCoverages,
      rows.coverages ?? [{ id: COVERAGE, insurancePlanId: PLAN }],
    ],
    [InsurancePlanBenefits, rows.benefits ?? [benefit()]],
    [PriorAuthorizationRequests, rows.requests ?? []],
    [PriorAuthorizationItems, rows.items ?? []],
    [PriorAuthorizationDeterminations, rows.determinations ?? []],
    [InsuranceClaims, rows.claims ?? []],
    [InsuranceClaimLines, rows.claimLines ?? []],
  ]);
  const memory = memoryEm(tables);
  return { policy: new ClaimCoveragePolicy(), em: memory as never, memory };
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

  describe('la cobertura es del plan del cobro', () => {
    it.each([
      [
        'la cobertura es de otro plan',
        [{ id: COVERAGE, insurancePlanId: OTHER_PLAN }],
      ],
      ['la cobertura no existe', []],
      [
        'la cobertura es de otro paciente y no la de este cobro',
        [{ id: 'coverage-ajena', insurancePlanId: PLAN }],
      ],
    ])(
      '%s: 422 COVERAGE_PLAN_MISMATCH y no se calcula nada',
      async (_name, coverages) => {
        const { policy, em } = setup({ coverages });
        expect(await rejectionOf(policy.evaluate(em, claim()))).toBe(
          CLAIM_COVERAGE_REASON.COVERAGE_PLAN_MISMATCH,
        );
      },
    );

    it('el desajuste se rechaza antes que el servicio no cubierto', async () => {
      const { policy, em } = setup({
        coverages: [{ id: COVERAGE, insurancePlanId: OTHER_PLAN }],
        benefits: [],
      });
      expect(await rejectionOf(policy.evaluate(em, claim()))).toBe(
        CLAIM_COVERAGE_REASON.COVERAGE_PLAN_MISMATCH,
      );
    });

    it('con el par plan/cobertura correcto reparte igual que antes', async () => {
      const { policy, em } = setup({});
      const [line] = await policy.evaluate(em, claim());
      expect(line).toMatchObject({
        patientAmount: '140.00',
        insurerAmount: '360.00',
      });
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

    describe('el tope aprobado es acumulado (revisión de seguridad)', () => {
      const partial800 = () => [
        determination({
          decisionConceptId: INS.DECISION_PARTIAL,
          approvedAmount: '1000.00',
        }),
      ];

      it('dos líneas del mismo servicio no se reparten un tope que juntas superan', async () => {
        const { policy, em } = withSurgery({
          requests: [paRequest()],
          items: [paItem()],
          determinations: partial800(),
        });
        const reason = await rejectionOf(
          policy.evaluate(
            em,
            surgeryClaim({
              lines: [
                {
                  lineSequence: 1,
                  serviceConceptId: SURGERY,
                  billedAmount: '600.00',
                },
                {
                  lineSequence: 2,
                  serviceConceptId: SURGERY,
                  billedAmount: '600.00',
                },
              ],
            }),
          ),
        );
        expect(reason).toBe(CLAIM_COVERAGE_REASON.PRIOR_AUTH_AMOUNT_EXCEEDED);
      });

      it('descuenta lo ya cobrado con la misma aprobación en otro reclamo', async () => {
        const { policy, em } = withSurgery({
          requests: [paRequest()],
          items: [paItem()],
          determinations: partial800(),
          claims: [
            {
              id: 'claim-anterior',
              priorAuthorizationRequestId: PA,
              statusConceptId: INS.CLAIM_SUBMITTED,
            },
          ],
          claimLines: [
            {
              insuranceClaimId: 'claim-anterior',
              serviceConceptId: SURGERY,
              billedAmount: '600.00',
            },
          ],
        });
        const reason = await rejectionOf(
          policy.evaluate(
            em,
            surgeryClaim({
              lines: [
                {
                  lineSequence: 1,
                  serviceConceptId: SURGERY,
                  billedAmount: '500.00',
                },
              ],
            }),
          ),
        );
        expect(reason).toBe(CLAIM_COVERAGE_REASON.PRIOR_AUTH_AMOUNT_EXCEEDED);
      });

      it('un reclamo revertido no consume el tope', async () => {
        const { policy, em } = withSurgery({
          requests: [paRequest()],
          items: [paItem()],
          determinations: partial800(),
          claims: [
            {
              id: 'claim-revertido',
              priorAuthorizationRequestId: PA,
              statusConceptId: INS.CLAIM_REVERSED,
            },
          ],
          claimLines: [
            {
              insuranceClaimId: 'claim-revertido',
              serviceConceptId: SURGERY,
              billedAmount: '900.00',
            },
          ],
        });
        await expect(
          policy.evaluate(
            em,
            surgeryClaim({
              lines: [
                {
                  lineSequence: 1,
                  serviceConceptId: SURGERY,
                  billedAmount: '1000.00',
                },
              ],
            }),
          ),
        ).resolves.toHaveLength(1);
      });

      it('lo cobrado antes más lo nuevo, hasta el tope exacto, pasa', async () => {
        const { policy, em } = withSurgery({
          requests: [paRequest()],
          items: [paItem()],
          determinations: partial800(),
          claims: [
            {
              id: 'claim-anterior',
              priorAuthorizationRequestId: PA,
              statusConceptId: INS.CLAIM_SUBMITTED,
            },
          ],
          claimLines: [
            {
              insuranceClaimId: 'claim-anterior',
              serviceConceptId: SURGERY,
              billedAmount: '600.00',
            },
          ],
        });
        await expect(
          policy.evaluate(
            em,
            surgeryClaim({
              lines: [
                {
                  lineSequence: 1,
                  serviceConceptId: SURGERY,
                  billedAmount: '400.00',
                },
              ],
            }),
          ),
        ).resolves.toHaveLength(1);
      });

      it('una decisión de pedido es un solo saldo para todos sus servicios', async () => {
        const IMAGING = 'service-imaging';
        const { policy, em } = setup({
          benefits: [
            surgeryBenefit(),
            surgeryBenefit({
              id: 'benefit-imaging',
              serviceConceptId: IMAGING,
            }),
          ],
          requests: [paRequest()],
          items: [
            paItem(),
            paItem({ id: 'pa-item-2', serviceConceptId: IMAGING }),
          ],
          determinations: [
            determination({
              priorAuthorizationItemId: null,
              decisionConceptId: INS.DECISION_PARTIAL,
              approvedAmount: '1000.00',
            }),
          ],
        });
        const reason = await rejectionOf(
          policy.evaluate(
            em,
            surgeryClaim({
              lines: [
                {
                  lineSequence: 1,
                  serviceConceptId: SURGERY,
                  billedAmount: '600.00',
                },
                {
                  lineSequence: 2,
                  serviceConceptId: IMAGING,
                  billedAmount: '600.00',
                },
              ],
            }),
          ),
        );
        expect(reason).toBe(CLAIM_COVERAGE_REASON.PRIOR_AUTH_AMOUNT_EXCEEDED);
      });

      it('una decisión de pedido descuenta lo cobrado antes en otro servicio', async () => {
        const IMAGING = 'service-imaging';
        const { policy, em } = setup({
          benefits: [surgeryBenefit()],
          requests: [paRequest()],
          items: [paItem()],
          determinations: [
            determination({
              priorAuthorizationItemId: null,
              decisionConceptId: INS.DECISION_PARTIAL,
              approvedAmount: '1000.00',
            }),
          ],
          claims: [
            {
              id: 'claim-imagen',
              priorAuthorizationRequestId: PA,
              statusConceptId: INS.CLAIM_SUBMITTED,
            },
          ],
          claimLines: [
            {
              insuranceClaimId: 'claim-imagen',
              serviceConceptId: IMAGING,
              billedAmount: '700.00',
            },
          ],
        });
        const reason = await rejectionOf(
          policy.evaluate(
            em,
            surgeryClaim({
              lines: [
                {
                  lineSequence: 1,
                  serviceConceptId: SURGERY,
                  billedAmount: '500.00',
                },
              ],
            }),
          ),
        );
        expect(reason).toBe(CLAIM_COVERAGE_REASON.PRIOR_AUTH_AMOUNT_EXCEEDED);
      });

      it('bloquea la fila de la aprobación mientras valida', async () => {
        const { policy, em, memory } = withSurgery({
          requests: [paRequest()],
          items: [paItem()],
          determinations: [determination()],
        });
        await policy.evaluate(em, surgeryClaim());
        expect(memory.locks).toContain(PriorAuthorizationRequests);
      });
    });

    it('un servicio sin aprobación exigida no la pide', async () => {
      const { policy, em } = setup({});
      await expect(
        policy.evaluate(em, claim({ priorAuthorizationRequestId: null })),
      ).resolves.toHaveLength(1);
    });
  });
});

/**
 * Cotización previa de una línea (carril 16, REQ-16-026): las mismas reglas que
 * `evaluate`, sin bloquear la aprobación previa y sin lanzar.
 */
describe('ClaimCoveragePolicy.quoteLine', () => {
  const quote = (
    ctx: ReturnType<typeof setup>,
    toQuote: ClaimToEvaluate,
    index = 0,
    shared = new Map<string, string>(),
  ) => ctx.policy.quoteLine(ctx.em, toQuote, toQuote.lines[index], shared);

  const withSurgery = (rows: Parameters<typeof setup>[0]) =>
    setup({ benefits: [surgeryBenefit()], ...rows });
  const approvedSurgery = (extra: Row = {}) =>
    withSurgery({
      requests: [paRequest()],
      items: [paItem()],
      determinations: [determination(extra)],
    });

  describe('correcto', () => {
    it('500 Bs, copago 50, 80 % → paciente 140 y aseguradora 360', async () => {
      const ctx = setup({});
      expect(await quote(ctx, claim())).toEqual({
        lineSequence: 1,
        benefitId: 'benefit-consult',
        coveragePercent: '80',
        copayAmount: '50.00',
        deductibleAmount: null,
        requiresPriorAuthorization: false,
        priorAuthorizationStatus: 'NOT_REQUIRED',
        patientAmount: '140.00',
        insurerAmount: '360.00',
        reason: null,
        message: null,
      });
    });

    it('no toma ningún lock, ni siquiera con aprobación previa', async () => {
      const ctx = approvedSurgery();
      const line = await quote(ctx, surgeryClaim());
      expect(line.priorAuthorizationStatus).toBe('APPROVED');
      expect(ctx.memory.locks).toEqual([]);
    });

    it('`evaluate` sigue bloqueando la aprobación (no cambió)', async () => {
      const ctx = approvedSurgery();
      await ctx.policy.evaluate(ctx.em, surgeryClaim());
      expect(ctx.memory.locks).toContain(PriorAuthorizationRequests);
    });

    it('informa el deducible pero no lo aplica al reparto', async () => {
      const ctx = setup({
        benefits: [benefit({ deductibleAmount: '25.00' })],
      });
      const line = await quote(ctx, claim());
      expect(line.deductibleAmount).toBe('25.00');
      expect(line.patientAmount).toBe('140.00');
    });

    it('ignora la parte del paciente que declara el cliente', async () => {
      const ctx = setup({});
      const declared = claim({
        lines: [
          {
            lineSequence: 1,
            serviceConceptId: CONSULT,
            billedAmount: '500.00',
            patientResponsibilityAmount: '300.00',
          },
        ],
      });
      const line = await quote(ctx, declared);
      expect(line.reason).toBeNull();
      expect(line.patientAmount).toBe('140.00');
    });

    it('aprobación PARTIAL se informa como aprobada, con su tope', async () => {
      const ctx = approvedSurgery({
        decisionConceptId: INS.DECISION_PARTIAL,
        approvedAmount: '1000.00',
      });
      const line = await quote(ctx, surgeryClaim());
      expect(line.priorAuthorizationStatus).toBe('APPROVED');
      expect(line.reason).toBeNull();
    });
  });

  describe('sin beneficio utilizable', () => {
    const uncovered = {
      benefitId: null,
      coveragePercent: null,
      copayAmount: null,
      patientAmount: null,
      insurerAmount: null,
      priorAuthorizationStatus: null,
    };

    it('servicio sin beneficio en el plan', async () => {
      const line = await quote(setup({ benefits: [] }), claim());
      expect(line).toMatchObject({
        ...uncovered,
        reason: CLAIM_COVERAGE_REASON.SERVICE_NOT_COVERED,
        message: 'El plan del paciente no cubre este servicio',
      });
    });

    it('beneficio vencido', async () => {
      const ctx = setup({
        benefits: [benefit({ effectiveTo: new Date(NOW.getTime() - DAY) })],
      });
      expect((await quote(ctx, claim())).reason).toBe(
        CLAIM_COVERAGE_REASON.SERVICE_NOT_COVERED,
      );
    });

    it('beneficio de otro plan', async () => {
      const ctx = setup({
        benefits: [benefit({ insurancePlanId: OTHER_PLAN })],
      });
      expect((await quote(ctx, claim())).reason).toBe(
        CLAIM_COVERAGE_REASON.SERVICE_NOT_COVERED,
      );
    });

    it('dos beneficios vigentes para el mismo servicio', async () => {
      const ctx = setup({
        benefits: [benefit(), benefit({ id: 'benefit-other' })],
      });
      expect((await quote(ctx, claim())).reason).toBe(
        CLAIM_COVERAGE_REASON.BENEFIT_AMBIGUOUS,
      );
    });

    it('ítem sin servicio', async () => {
      const ctx = setup({});
      const noService = claim({
        lines: [{ lineSequence: 1, billedAmount: '500.00' }],
      });
      expect((await quote(ctx, noService)).reason).toBe(
        CLAIM_COVERAGE_REASON.SERVICE_REQUIRED,
      );
    });
  });

  describe('reparto que no se puede calcular', () => {
    it('beneficio sin porcentaje ni copago conserva el beneficio y deja los importes en null', async () => {
      const ctx = setup({
        benefits: [benefit({ coveragePercent: null, copayAmount: null })],
      });
      expect(await quote(ctx, claim())).toMatchObject({
        benefitId: 'benefit-consult',
        patientAmount: null,
        insurerAmount: null,
        reason: CLAIM_COVERAGE_REASON.BENEFIT_WITHOUT_TERMS,
      });
    });

    it('monto con tres decimales', async () => {
      const ctx = setup({});
      const invalid = claim({
        lines: [
          { lineSequence: 1, serviceConceptId: CONSULT, billedAmount: '1.234' },
        ],
      });
      expect(await quote(ctx, invalid)).toMatchObject({
        patientAmount: null,
        reason: CLAIM_COVERAGE_REASON.INVALID_AMOUNT,
      });
    });
  });

  describe('aprobación previa', () => {
    it('exigida y ausente: informa el reparto y no pide nada más', async () => {
      const ctx = withSurgery({});
      const line = await quote(
        ctx,
        surgeryClaim({ priorAuthorizationRequestId: null }),
      );
      expect(line).toMatchObject({
        requiresPriorAuthorization: true,
        priorAuthorizationStatus: 'MISSING',
        reason: CLAIM_COVERAGE_REASON.PRIOR_AUTH_REQUIRED,
        patientAmount: '100.00',
        insurerAmount: '900.00',
      });
    });

    it('de otra cobertura', async () => {
      const ctx = withSurgery({
        requests: [paRequest({ patientCoverageId: 'coverage-other' })],
        items: [paItem()],
        determinations: [determination()],
      });
      expect(await quote(ctx, surgeryClaim())).toMatchObject({
        priorAuthorizationStatus: 'MISMATCH',
        reason: CLAIM_COVERAGE_REASON.PRIOR_AUTH_MISMATCH,
      });
    });

    it('sin respuesta de la aseguradora', async () => {
      const ctx = withSurgery({
        requests: [paRequest()],
        items: [paItem()],
        determinations: [],
      });
      expect(await quote(ctx, surgeryClaim())).toMatchObject({
        priorAuthorizationStatus: 'PENDING',
        reason: CLAIM_COVERAGE_REASON.PRIOR_AUTH_PENDING,
      });
    });

    it('denegada', async () => {
      const ctx = approvedSurgery({ decisionConceptId: INS.DECISION_DENIED });
      expect(await quote(ctx, surgeryClaim())).toMatchObject({
        priorAuthorizationStatus: 'DENIED',
        reason: CLAIM_COVERAGE_REASON.PRIOR_AUTH_DENIED,
      });
    });

    it('vencida', async () => {
      const ctx = approvedSurgery({
        validTo: new Date(NOW.getTime() - DAY),
      });
      expect(await quote(ctx, surgeryClaim())).toMatchObject({
        priorAuthorizationStatus: 'EXPIRED',
        reason: CLAIM_COVERAGE_REASON.PRIOR_AUTH_EXPIRED,
      });
    });

    it('el tope aprobado es acumulado entre las líneas de la misma cotización', async () => {
      const ctx = approvedSurgery({ approvedAmount: '1500.00' });
      const twoLines = surgeryClaim({
        lines: [
          {
            lineSequence: 1,
            serviceConceptId: SURGERY,
            billedAmount: '1000.00',
          },
          {
            lineSequence: 2,
            serviceConceptId: SURGERY,
            billedAmount: '1000.00',
          },
        ],
      });
      const shared = new Map<string, string>();
      const first = await quote(ctx, twoLines, 0, shared);
      const second = await quote(ctx, twoLines, 1, shared);
      expect(first.priorAuthorizationStatus).toBe('APPROVED');
      expect(second).toMatchObject({
        priorAuthorizationStatus: 'AMOUNT_EXCEEDED',
        reason: CLAIM_COVERAGE_REASON.PRIOR_AUTH_AMOUNT_EXCEEDED,
      });
      expect(ctx.memory.locks).toEqual([]);
    });
  });

  describe('cobertura de otro plan', () => {
    it('la cotización lo informa en reason y no calcula importes', async () => {
      const ctx = setup({
        coverages: [{ id: COVERAGE, insurancePlanId: OTHER_PLAN }],
      });
      expect(await quote(ctx, claim())).toMatchObject({
        reason: CLAIM_COVERAGE_REASON.COVERAGE_PLAN_MISMATCH,
        benefitId: null,
        patientAmount: null,
        insurerAmount: null,
      });
    });
  });

  describe('fallos que no son de negocio', () => {
    it('no los traga: un error de la base se relanza', async () => {
      const ctx = setup({});
      const broken = {
        ...ctx.memory,
        find: async () => {
          throw new Error('connection reset');
        },
      };
      await expect(
        ctx.policy.quoteLine(
          broken as never,
          claim(),
          claim().lines[0],
          new Map(),
        ),
      ).rejects.toThrow('connection reset');
    });
  });
});
