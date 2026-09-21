import {
  CODES,
  catalogControl,
  defectsControl,
  deploymentControl,
  incidentsControl,
  overallStatus,
  qaControl,
  restoreControl,
  sloControl,
  type Control,
} from './readiness';

const NOW = new Date('2026-09-18T12:00:00Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

describe('códigos derivados del registro', () => {
  it('coinciden con los códigos reales de los conceptos', () => {
    expect(CODES.incidentSevere).toEqual(['INC_SEV1', 'INC_SEV2']);
    expect(CODES.defectSevere).toEqual(['DEF_SEV_CRITICAL', 'DEF_SEV_HIGH']);
    expect(CODES.deploySucceeded).toBe('DEP_SUCCEEDED');
  });
});

describe('restoreControl', () => {
  const policy = {
    policyId: 'p1',
    rpoSeconds: 900,
    rtoSeconds: 14_400,
    testFrequencyDays: 30,
    lastTest: {
      id: 't1',
      finishedAt: daysAgo(3),
      outcomePass: true,
      integrityPassed: true,
      measuredRpoSeconds: 600,
      measuredRtoSeconds: 3_600,
    },
  };

  it('pasa con una prueba reciente dentro de objetivo', () => {
    expect(restoreControl([policy], NOW)).toMatchObject({
      status: 'PASS',
      blocking: true,
    });
  });

  it('sin políticas es UNKNOWN, no PASS', () => {
    expect(restoreControl([], NOW).status).toBe('UNKNOWN');
  });

  it('una política sin prueba es UNKNOWN', () => {
    expect(restoreControl([{ ...policy, lastTest: null }], NOW).status).toBe(
      'UNKNOWN',
    );
  });

  it.each([
    [{ outcomePass: false }, 'resultado FAIL'],
    [{ integrityPassed: false }, 'integridad fallida'],
    [{ measuredRtoSeconds: 20_000 }, 'RTO excedido'],
    [{ finishedAt: daysAgo(45) }, 'más de 30 días'],
  ])('%j falla por %s', (override, reason) => {
    const control = restoreControl(
      [{ ...policy, lastTest: { ...policy.lastTest, ...override } }],
      NOW,
    );
    expect(control.status).toBe('FAIL');
    expect(control.reason).toContain(reason);
  });
});

describe('controles simples', () => {
  it('incidentes: sólo los graves bloquean', () => {
    expect(
      incidentsControl([
        {
          id: 'i',
          number: 'INC-1',
          severity: 'INC_SEV3',
          status: 'INC_OPEN',
          openedAt: NOW,
        },
      ]).status,
    ).toBe('PASS');
    expect(
      incidentsControl([
        {
          id: 'i',
          number: 'INC-2',
          severity: 'INC_SEV1',
          status: 'INC_ACK',
          openedAt: NOW,
        },
      ]).status,
    ).toBe('FAIL');
  });

  it('SLO: sin SLO activos o sin medición reciente no es PASS', () => {
    expect(sloControl([], NOW).status).toBe('UNKNOWN');
    expect(
      sloControl(
        [
          {
            sloId: 's',
            target: '0.999',
            lastMeasurement: {
              status: 'SLO_PASS',
              measuredAt: daysAgo(10),
              attained: '1',
            },
          },
        ],
        NOW,
      ).status,
    ).toBe('UNKNOWN');
    expect(
      sloControl(
        [
          {
            sloId: 's',
            target: '0.999',
            lastMeasurement: {
              status: 'SLO_FAIL',
              measuredAt: daysAgo(1),
              attained: '0.9',
            },
          },
        ],
        NOW,
      ).status,
    ).toBe('FAIL');
  });

  it('QA: sin suites es N/A; sin plan reciente es UNKNOWN; un plan fallido falla', () => {
    expect(qaControl([], NOW).status).toBe('NOT_APPLICABLE');
    expect(
      qaControl([{ suiteId: 's', suiteCode: 'S', lastPlan: null }], NOW).status,
    ).toBe('UNKNOWN');
    expect(
      qaControl(
        [
          {
            suiteId: 's',
            suiteCode: 'S',
            lastPlan: {
              id: 'p',
              status: 'INFRA_ERROR',
              finishedAt: daysAgo(1),
            },
          },
        ],
        NOW,
      ).status,
    ).toBe('FAIL');
    expect(
      qaControl(
        [
          {
            suiteId: 's',
            suiteCode: 'S',
            lastPlan: { id: 'p', status: 'PASSED', finishedAt: daysAgo(1) },
          },
        ],
        NOW,
      ).status,
    ).toBe('PASS');
  });

  it('defectos graves abiertos bloquean', () => {
    expect(
      defectsControl([
        {
          id: 'd',
          number: 'DEF-1',
          severity: 'DEF_SEV_CRITICAL',
          status: 'DEFECT_OPEN',
        },
      ]).status,
    ).toBe('FAIL');
  });

  it('catálogo y despliegue informan pero no bloquean', () => {
    expect(
      catalogControl({ hasScan: false, reviewed: 0, denominator: 0 }),
    ).toMatchObject({ status: 'UNKNOWN', blocking: false });
    expect(
      catalogControl({ hasScan: true, reviewed: 0, denominator: 0 }).status,
    ).toBe('NOT_APPLICABLE');
    expect(
      deploymentControl({
        id: 'd',
        number: 'DEP-1',
        status: 'DEP_FAILED',
        finishedAt: NOW,
      }),
    ).toMatchObject({ status: 'FAIL', blocking: false });
  });
});

describe('overallStatus', () => {
  const control = (
    code: string,
    status: Control['status'],
    blocking = true,
  ): Control => ({
    code,
    title: code,
    blocking,
    status,
    reason: '',
    evidence: [],
    observedAt: null,
    staleAfterDays: null,
  });

  it('todo lo bloqueante en PASS o N/A es READY', () => {
    expect(
      overallStatus([
        control('A', 'PASS'),
        control('B', 'NOT_APPLICABLE'),
        control('C', 'FAIL', false),
      ]).status,
    ).toBe('READY');
  });

  it('un FAIL bloqueante no se compensa con verdes', () => {
    const result = overallStatus([
      control('A', 'PASS'),
      control('B', 'PASS'),
      control('RESTORE', 'FAIL'),
    ]);
    expect(result).toEqual({
      status: 'NOT_READY',
      blockingFailures: ['RESTORE'],
      blockingUnknown: [],
    });
  });

  it('un UNKNOWN bloqueante también bloquea', () => {
    expect(
      overallStatus([control('A', 'PASS'), control('SLO', 'UNKNOWN')]).status,
    ).toBe('BLOCKED_BY_UNKNOWN');
  });
});
