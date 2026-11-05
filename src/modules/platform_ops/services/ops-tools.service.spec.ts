import { jest } from '@jest/globals';
import { ResourceNotFoundException } from '../../../common';
import { PLATFORM_OPS } from '../platform_ops.concepts';
import { PlatformOpsErrorReason } from '../platform_ops.error-reasons';
import type {
  OpsToolsRepository,
  ToolRecord,
  ToolRunRecord,
} from '../repositories/ops-tools.repository';
import { OpsToolsService, type ToolClock } from './ops-tools.service';

/**
 * DOBLE DECLARADO: el repositorio es un fake en memoria (no hay base real en
 * esta suite). Prueba la lógica de estado, no las consultas SQL/ORM.
 */
const NOW = new Date('2026-10-31T12:00:00.000Z');
const clockWith = (env: Record<string, string | undefined>): ToolClock => ({
  now: () => NOW,
  env: () => env,
});

function record(overrides: Partial<ToolRecord> = {}): ToolRecord {
  return {
    code: 'postgresql',
    name: 'PostgreSQL',
    toolTypeConceptId: PLATFORM_OPS.TOOL_KIND_DATABASE,
    stateConceptId: PLATFORM_OPS.TOOL_STATE_ACTIVE,
    criticalityConceptId: PLATFORM_OPS.CRITICALITY_CRITICAL,
    checkId: 'check-1',
    checkTypeConceptId: PLATFORM_OPS.CHECK_LIVE,
    checkIntervalSeconds: 60,
    lastRun: null,
    ...overrides,
  };
}

function run(secondsAgo: number, outcome: ToolRunRecord['outcome'] = 'PASS') {
  return {
    outcome,
    recordedAt: new Date(NOW.getTime() - secondsAgo * 1000),
    latencyMs: 12,
    httpStatus: 200,
  };
}

function build(records: ToolRecord[], history: ToolRunRecord[] = []) {
  const repo = {
    listTools: jest.fn(async () => records),
    findTool: jest.fn(
      async (code: string) => records.find((r) => r.code === code) ?? null,
    ),
    recentRuns: jest.fn(async () => history),
  };
  return {
    service: new OpsToolsService(repo as unknown as OpsToolsRepository),
    repo,
  };
}

describe('OpsToolsService.list', () => {
  it('registro vacío: lista vacía, sin inventar nada', async () => {
    const { service } = build([]);
    const res = await service.list(clockWith({}));
    expect(res).toEqual({
      evaluatedAt: NOW.toISOString(),
      items: [],
      notMeasured: [],
    });
  });

  it('LIVE sin corridas → NOT_PROBED y figura en notMeasured', async () => {
    const { service } = build([record()]);
    const res = await service.list(clockWith({}));
    expect(res.items[0]).toMatchObject({
      code: 'postgresql',
      kind: 'DATABASE',
      isCritical: true,
      status: 'ACTIVE',
      requiredEnvVars: [
        'DB_HOST',
        'DB_PORT',
        'DB_USER',
        'DB_PASSWORD',
        'DB_NAME',
      ],
      health: { state: 'NOT_PROBED', checkType: 'LIVE', observedAt: null },
    });
    expect(res.notMeasured).toEqual([
      { code: 'postgresql', reason: expect.stringMatching(/Sin corridas/) },
    ]);
  });

  it('LIVE con corrida reciente verde → OK; vencida → NOT_PROBED', async () => {
    const { service } = build([
      record({ code: 'redis', name: 'Redis', lastRun: run(30) }),
      record({ code: 'mongodb', name: 'Mongo', lastRun: run(100_000) }),
    ]);
    const res = await service.list(clockWith({}));
    const byCode = Object.fromEntries(res.items.map((i) => [i.code, i]));
    expect(byCode.redis.health.state).toBe('OK');
    expect(byCode.mongodb.health.state).toBe('NOT_PROBED');
    expect(res.notMeasured.map((n) => n.code)).toEqual(['mongodb']);
  });

  it('CONFIGURATION: devuelve nombres faltantes, jamás valores', async () => {
    const gmail = record({
      code: 'gmail-api',
      name: 'Gmail',
      toolTypeConceptId: PLATFORM_OPS.TOOL_KIND_MESSAGING,
      checkTypeConceptId: PLATFORM_OPS.CHECK_CONFIGURATION,
      checkIntervalSeconds: null,
    });
    const { service } = build([gmail]);
    const res = await service.list(
      clockWith({
        GOOGLE_OAUTH_CLIENT_ID: 'id-super-secreto',
        GOOGLE_SENDER_EMAIL: 'x@y.z',
      }),
    );
    const item = res.items[0];
    expect(item.health.state).toBe('FAIL');
    expect(item.health.checkType).toBe('CONFIGURATION');
    expect(item.health.missingEnvVars).toEqual([
      'GOOGLE_OAUTH_CLIENT_SECRET',
      'GOOGLE_OAUTH_REFRESH_TOKEN',
    ]);
    expect(JSON.stringify(res)).not.toContain('id-super-secreto');
    expect(JSON.stringify(res)).not.toContain('x@y.z');
  });

  it('CONFIGURATION con todo presente → OK', async () => {
    const { service } = build([
      record({
        code: 'web-push',
        name: 'Web Push',
        toolTypeConceptId: PLATFORM_OPS.TOOL_KIND_MESSAGING,
        criticalityConceptId: PLATFORM_OPS.CRITICALITY_NON_CRITICAL,
        checkTypeConceptId: PLATFORM_OPS.CHECK_CONFIGURATION,
      }),
    ]);
    const res = await service.list(
      clockWith({
        VAPID_PUBLIC_KEY: 'a',
        VAPID_PRIVATE_KEY: 'b',
        VAPID_SUBJECT: 'c',
      }),
    );
    expect(res.items[0].health.state).toBe('OK');
    expect(res.items[0].isCritical).toBe(false);
    expect(res.notMeasured).toEqual([]);
  });

  it('herramienta PLANNED: nunca OK, aparece como no medida', async () => {
    const { service } = build([
      record({
        code: 'payment-gateways',
        toolTypeConceptId: PLATFORM_OPS.TOOL_KIND_PAYMENTS,
        stateConceptId: PLATFORM_OPS.TOOL_STATE_PLANNED,
        checkTypeConceptId: PLATFORM_OPS.CHECK_NOT_APPLICABLE,
        checkId: null,
      }),
    ]);
    const res = await service.list(clockWith({}));
    expect(res.items[0]).toMatchObject({
      kind: 'PAYMENTS',
      status: 'PLANNED',
      health: { state: 'NOT_PROBED', checkType: 'NOT_APPLICABLE' },
    });
    expect(res.notMeasured[0].reason).toMatch(/PLANNED/);
  });

  it('INVÁLIDO: conceptos desconocidos degradan sin afirmar salud', async () => {
    const { service } = build([
      record({
        code: 'extraña',
        toolTypeConceptId: 'desconocido',
        stateConceptId: 'desconocido',
        criticalityConceptId: null,
        checkTypeConceptId: 'desconocido',
        lastRun: run(1),
      }),
    ]);
    const res = await service.list(clockWith({}));
    expect(res.items[0]).toMatchObject({
      kind: 'OTHER',
      status: 'DISABLED',
      isCritical: false,
      requiredEnvVars: [],
      health: { state: 'NOT_PROBED' },
    });
  });

  it('LÍMITE: sin chequeo ni componente → NOT_PROBED con motivo', async () => {
    const { service } = build([
      record({
        checkId: null,
        checkTypeConceptId: null,
        criticalityConceptId: null,
      }),
    ]);
    const res = await service.list(clockWith({}));
    expect(res.items[0].health.state).toBe('NOT_PROBED');
    expect(res.notMeasured[0].reason).toMatch(/Sin health check/);
  });
});

describe('OpsToolsService.get', () => {
  it('devuelve el ítem con su historial', async () => {
    const history = [run(10), run(70, 'FAIL')];
    const { service, repo } = build([record({ lastRun: run(10) })], history);
    const res = await service.get('postgresql', clockWith({}));
    expect(res.code).toBe('postgresql');
    expect(res.health.state).toBe('OK');
    expect(res.evaluatedAt).toBe(NOW.toISOString());
    expect(res.history).toEqual([
      {
        observedAt: history[0].recordedAt.toISOString(),
        outcome: 'PASS',
        latencyMs: 12,
        httpStatus: 200,
      },
      {
        observedAt: history[1].recordedAt.toISOString(),
        outcome: 'FAIL',
        latencyMs: 12,
        httpStatus: 200,
      },
    ]);
    expect(repo.recentRuns).toHaveBeenCalledWith('check-1');
  });

  it('sin chequeo: historial vacío y no consulta corridas', async () => {
    const { service, repo } = build([record({ checkId: null })]);
    const res = await service.get('postgresql', clockWith({}));
    expect(res.history).toEqual([]);
    expect(repo.recentRuns).not.toHaveBeenCalled();
  });

  it('código inexistente → 404 con reason TOOL_NOT_FOUND', async () => {
    const { service } = build([record()]);
    const error = await service
      .get('no-existe', clockWith({}))
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ResourceNotFoundException);
    expect((error as ResourceNotFoundException).getStatus()).toBe(404);
    expect((error as ResourceNotFoundException).reason).toBe(
      PlatformOpsErrorReason.TOOL_NOT_FOUND,
    );
  });
});
