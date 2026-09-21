import {
  addressViolation,
  classifyAddress,
  redactHeaders,
  SECRET_REF_PATTERN,
  urlViolations,
  type TargetAllowlist,
} from './target-guard';
import {
  approvalViolation,
  buildPlan,
  clampLimits,
  DEFAULT_LIMITS,
  finalPlanStatus,
  type PlanInput,
} from './plan';

const target: TargetAllowlist = {
  scheme: 'https',
  host: 'staging.api.example.test',
  port: 443,
  allowedPathPrefixes: ['/api'],
  allowPrivateNetwork: false,
};
const codes = (url: string, t: TargetAllowlist = target) =>
  urlViolations(url, t).map((v) => v.code);

describe('guarda de URL', () => {
  it('acepta lo que cae dentro del destino', () => {
    expect(codes('https://staging.api.example.test/api/patients?x=1')).toEqual(
      [],
    );
    expect(codes('https://STAGING.api.example.test:443/api')).toEqual([]);
  });

  it.each([
    ['http://staging.api.example.test/api/x', 'SCHEME_NOT_ALLOWED'],
    ['https://evil.example.test/api/x', 'HOST_NOT_ALLOWED'],
    ['https://staging.api.example.test.evil.test/api', 'HOST_NOT_ALLOWED'],
    ['https://staging.api.example.test:8443/api/x', 'PORT_NOT_ALLOWED'],
    ['https://user:pw@staging.api.example.test/api/x', 'USERINFO_NOT_ALLOWED'],
    ['https://staging.api.example.test/api-internal/x', 'PATH_NOT_ALLOWED'],
    ['https://staging.api.example.test/admin', 'PATH_NOT_ALLOWED'],
    ['https://staging.api.example.test/api/../admin', 'PATH_NOT_ALLOWED'],
    ['https://staging.api.example.test/api/%2e%2e/admin', 'PATH_NOT_ALLOWED'],
    ['no es una url', 'URL_INVALID'],
  ])('%s → %s', (url, code) => {
    expect(codes(url)).toContain(code);
  });

  it('una IP decimal no se cuela como otro host', () => {
    // El parser normaliza 2130706433 a 127.0.0.1: no coincide con el host.
    expect(
      codes('https://2130706433/api', { ...target, host: 'localhost' }),
    ).toContain('HOST_NOT_ALLOWED');
  });
});

describe('clasificación de direcciones', () => {
  it.each([
    ['8.8.8.8', 'PUBLIC'],
    ['10.1.2.3', 'PRIVATE'],
    ['172.20.0.1', 'PRIVATE'],
    ['172.32.0.1', 'PUBLIC'],
    ['192.168.1.1', 'PRIVATE'],
    ['127.0.0.1', 'LOOPBACK'],
    ['169.254.169.254', 'LINK_LOCAL'],
    ['100.64.0.1', 'SHARED_CGNAT'],
    ['0.0.0.0', 'UNSPECIFIED'],
    ['::1', 'LOOPBACK'],
    ['::', 'UNSPECIFIED'],
    ['fe80::1', 'LINK_LOCAL'],
    ['fd00::1', 'PRIVATE'],
    ['::ffff:127.0.0.1', 'LOOPBACK'],
    ['::ffff:169.254.169.254', 'LINK_LOCAL'],
    ['2001:4860:4860::8888', 'PUBLIC'],
    ['no-ip', 'INVALID'],
  ])('%s es %s', (ip, kind) => {
    expect(classifyAddress(ip)).toBe(kind);
  });

  it('la metadata cloud se bloquea aunque se autorice la red privada', () => {
    expect(addressViolation('169.254.169.254', true)?.code).toBe(
      'ADDRESS_LINK_LOCAL',
    );
    expect(addressViolation('10.0.0.5', true)).toBeNull();
    expect(addressViolation('10.0.0.5', false)?.code).toBe('ADDRESS_PRIVATE');
    expect(addressViolation('8.8.8.8', false)).toBeNull();
  });
});

describe('secretos y cabeceras', () => {
  it('redacta por completo, sin prefijo ni sufijo', () => {
    const redacted = redactHeaders({
      Authorization: 'Bearer abc.def.ghi',
      'X-Trace': 't-1',
    });
    expect(redacted).toEqual({
      Authorization: '[redactado]',
      'X-Trace': 't-1',
    });
    expect(JSON.stringify(redacted)).not.toMatch(/abc|ghi/);
  });

  it('sólo admite referencias a secretos de prueba', () => {
    expect(SECRET_REF_PATTERN.test('QA_TARGET_STAGING_TOKEN')).toBe(true);
    expect(SECRET_REF_PATTERN.test('DB_PASSWORD')).toBe(false);
    expect(SECRET_REF_PATTERN.test('QA_TARGET_X; rm -rf')).toBe(false);
  });
});

describe('plan de ejecución', () => {
  const base: PlanInput = {
    suiteId: 's1',
    suiteVersion: 2,
    environmentId: 'e1',
    environmentKind: 'STAGING',
    target: { ...target, allowMutations: false },
    targetMax: DEFAULT_LIMITS,
    cases: [
      {
        caseId: 'c1',
        code: 'LIST',
        method: 'GET',
        requestPath: '/api/patients',
        body: null,
      },
      {
        caseId: 'c2',
        code: 'ONE',
        method: 'GET',
        requestPath: '/api/patients/1',
        body: null,
      },
    ],
  };

  it('un plan de sólo lectura en staging no pide aprobación', () => {
    const plan = buildPlan(base);
    expect(plan).toMatchObject({ violations: [], requiresApproval: false });
    expect(plan.steps.map((s) => s.url)).toEqual([
      'https://staging.api.example.test/api/patients',
      'https://staging.api.example.test/api/patients/1',
    ]);
  });

  it('una mutación sin permiso del destino invalida el plan', () => {
    const plan = buildPlan({
      ...base,
      cases: [
        {
          caseId: 'c3',
          code: 'CREATE',
          method: 'POST',
          requestPath: '/api/patients',
          body: { a: 1 },
        },
      ],
    });
    expect(plan.violations.map((v) => v.code)).toEqual([
      'MUTATION_NOT_ALLOWED',
    ]);
  });

  it('producción: nada de mutaciones, y leer exige aprobación', () => {
    const prod = buildPlan({
      ...base,
      environmentKind: 'PRODUCTION',
      target: { ...base.target, allowMutations: true },
    });
    expect(prod.requiresApproval).toBe(true);
    expect(prod.approvalReasons).toEqual(['ENVIRONMENT_PRODUCTION']);
    const mutation = buildPlan({
      ...base,
      environmentKind: 'PRODUCTION',
      target: { ...base.target, allowMutations: true },
      cases: [
        {
          caseId: 'c3',
          code: 'DEL',
          method: 'DELETE',
          requestPath: '/api/x',
          body: null,
        },
      ],
    });
    expect(mutation.violations.map((v) => v.code)).toContain(
      'MUTATION_IN_PRODUCTION',
    );
  });

  it('una ruta que escapa del prefijo se detecta al planificar', () => {
    const plan = buildPlan({
      ...base,
      cases: [
        {
          caseId: 'c9',
          code: 'ESC',
          method: 'GET',
          requestPath: '/api/../internal/metrics',
          body: null,
        },
      ],
    });
    expect(plan.violations).toEqual([
      expect.objectContaining({ code: 'PATH_NOT_ALLOWED', caseCode: 'ESC' }),
    ]);
  });

  it('cambiar el cuerpo, la ruta o los límites cambia el hash', () => {
    const h = buildPlan(base).hash;
    expect(
      buildPlan({ ...base, requested: { maxRequests: 10 } }).hash,
    ).not.toBe(h);
    expect(
      buildPlan({
        ...base,
        cases: [
          { ...base.cases[0], requestPath: '/api/patients?all=1' },
          base.cases[1],
        ],
      }).hash,
    ).not.toBe(h);
    expect(buildPlan(base).hash).toBe(h);
  });

  it('el servidor recorta lo pedido pero nunca lo eleva', () => {
    const { limits, clamped } = clampLimits(DEFAULT_LIMITS, {
      maxRequests: 10_000,
      minIntervalMs: 0,
      maxDurationSeconds: 30,
    });
    expect(limits).toEqual({
      maxRequests: 300,
      maxDurationSeconds: 30,
      requestTimeoutMs: 10_000,
      minIntervalMs: 200,
    });
    expect(clamped.sort()).toEqual(['maxRequests', 'minIntervalMs']);
  });

  it('un presupuesto menor que el plan lo invalida', () => {
    expect(
      buildPlan({ ...base, requested: { maxRequests: 1 } }).violations.map(
        (v) => v.code,
      ),
    ).toEqual(['BUDGET_TOO_SMALL']);
  });
});

describe('aprobación', () => {
  const now = new Date('2026-09-18T12:00:00Z');
  const ok = {
    planHash: 'h',
    approverId: 'boss',
    decision: 'APPROVED' as const,
    expiresAt: new Date('2026-09-18T13:00:00Z'),
  };

  it.each([
    [null, 'APPROVAL_MISSING'],
    [{ ...ok, decision: 'REJECTED' as const }, 'APPROVAL_REJECTED'],
    [{ ...ok, planHash: 'otro' }, 'APPROVAL_STALE'],
    [{ ...ok, expiresAt: now }, 'APPROVAL_EXPIRED'],
    [{ ...ok, approverId: 'me' }, 'SELF_APPROVAL'],
  ])('%j → %s', (approval, code) => {
    expect(
      approvalViolation({ planHash: 'h', requesterId: 'me', approval, now })
        ?.code,
    ).toBe(code);
  });

  it('una aprobación vigente del mismo hash por otra persona vale', () => {
    expect(
      approvalViolation({
        planHash: 'h',
        requesterId: 'me',
        approval: ok,
        now,
      }),
    ).toBeNull();
  });
});

describe('estado final', () => {
  it('una caída de infraestructura no es un defecto del producto', () => {
    expect(
      finalPlanStatus({
        cancelled: false,
        timedOut: false,
        infraErrors: 1,
        failed: 3,
        executed: 4,
      }),
    ).toBe('INFRA_ERROR');
    expect(
      finalPlanStatus({
        cancelled: false,
        timedOut: false,
        infraErrors: 0,
        failed: 1,
        executed: 4,
      }),
    ).toBe('FAILED');
    expect(
      finalPlanStatus({
        cancelled: true,
        timedOut: false,
        infraErrors: 0,
        failed: 0,
        executed: 1,
      }),
    ).toBe('CANCELLED');
    expect(
      finalPlanStatus({
        cancelled: false,
        timedOut: false,
        infraErrors: 0,
        failed: 0,
        executed: 0,
      }),
    ).toBe('INFRA_ERROR');
  });
});
