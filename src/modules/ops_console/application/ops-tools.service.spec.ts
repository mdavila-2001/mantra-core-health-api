import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { ServiceUnavailableException } from '@nestjs/common';
import type { AppReadinessService } from '../../../app-readiness.service';
import { TOOL_CATALOG } from '../domain/tool-catalog';
import {
  OPS_TOOLS_MODEL_VERSION,
  OpsToolsService,
  READINESS_CACHE_TTL_MS,
  SLOW_PROBE_MS,
} from './ops-tools.service';

type Check = AppReadinessService['check'];

const upChecks = (latencyMs = 12) => ({
  postgresql: { status: 'up' as const, latencyMs },
  mongodb: { status: 'up' as const, latencyMs },
  redis: { status: 'up' as const, latencyMs },
  opensearch: { status: 'up' as const, latencyMs },
  rls: { status: 'up' as const, latencyMs },
});

function build(check: Check = jest.fn<Check>()) {
  const readiness = { check } as unknown as AppReadinessService;
  return { service: new OpsToolsService(readiness), check };
}

const okCheck = (latencyMs?: number) =>
  jest.fn<Check>().mockResolvedValue({
    status: 'ok',
    checks: upChecks(latencyMs),
    timestamp: new Date().toISOString(),
  });

/** Entorno mínimo sin ninguna integración configurada. */
const EMPTY_ENV: NodeJS.ProcessEnv = { NODE_ENV: 'production' };

describe('OpsToolsService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('devuelve el catálogo completo con la versión del modelo y el resumen', async () => {
    const { service } = build(okCheck());
    const res = await service.listTools(EMPTY_ENV);

    expect(res.modelVersion).toBe(OPS_TOOLS_MODEL_VERSION);
    expect(res.tools).toHaveLength(TOOL_CATALOG.length);
    expect(res.tools.map((t) => t.code)).toEqual(
      TOOL_CATALOG.map((t) => t.code),
    );
    expect(res.summary).toEqual({
      total: TOOL_CATALOG.length,
      healthy: 4,
      down: 0,
      noProbe: TOOL_CATALOG.filter((t) => t.checkType === 'CONFIGURATION')
        .length,
      notApplicable: TOOL_CATALOG.filter(
        (t) => t.checkType === 'NOT_APPLICABLE',
      ).length,
      critical: TOOL_CATALOG.filter((t) => t.isCritical).length,
    });
  });

  describe('herramientas de configuración', () => {
    it('Gmail con las cuatro credenciales → real y configurada', async () => {
      const { service } = build(okCheck());
      const res = await service.listTools({
        ...EMPTY_ENV,
        GOOGLE_OAUTH_CLIENT_ID: 'id',
        GOOGLE_OAUTH_CLIENT_SECRET: 's',
        GOOGLE_OAUTH_REFRESH_TOKEN: 'r',
        GOOGLE_SENDER_EMAIL: 'no-reply@example.test',
      });
      const gmail = res.tools.find((t) => t.code === 'gmail')!;
      expect(gmail).toMatchObject({
        binding: 'real',
        isConfigured: true,
        missingEnvVars: [],
        isHealthy: null,
        checkType: 'CONFIGURATION',
      });
    });

    it('Gmail sin credenciales en producción → none, nombres de lo que falta y sin salud', async () => {
      const { service } = build(okCheck());
      const res = await service.listTools({
        ...EMPTY_ENV,
        GOOGLE_OAUTH_CLIENT_ID: 'id',
      });
      const gmail = res.tools.find((t) => t.code === 'gmail')!;
      expect(gmail.binding).toBe('none');
      expect(gmail.isConfigured).toBe(false);
      expect(gmail.missingEnvVars).toEqual([
        'GOOGLE_OAUTH_CLIENT_SECRET',
        'GOOGLE_OAUTH_REFRESH_TOKEN',
        'GOOGLE_SENDER_EMAIL',
      ]);
      expect(gmail.isHealthy).toBeNull();
    });

    it('fuera de producción sin Gmail, el correo cae al emulador (mock)', async () => {
      const { service } = build(okCheck());
      const res = await service.listTools({ NODE_ENV: 'development' });
      const byCode = Object.fromEntries(res.tools.map((t) => [t.code, t]));
      expect(byCode.gmail.binding).toBe('mock');
      expect(byCode.mock_provider_server.binding).toBe('mock');
      expect(byCode.identity_verification.binding).toBe('mock');
      expect(byCode.identity_verification.checkType).toBe('NOT_APPLICABLE');
    });

    it('los interruptores apagados son none/simulated sin variables faltantes', async () => {
      const { service } = build(okCheck());
      const res = await service.listTools(EMPTY_ENV);
      const byCode = Object.fromEntries(res.tools.map((t) => [t.code, t]));
      expect(byCode.siat).toMatchObject({
        binding: 'simulated',
        missingEnvVars: [],
      });
      expect(byCode.payments_gateway).toMatchObject({
        binding: 'none',
        missingEnvVars: [],
      });
      expect(byCode.clamav).toMatchObject({
        binding: 'none',
        missingEnvVars: [],
      });
      expect(byCode.ga4).toMatchObject({ binding: 'none', missingEnvVars: [] });
      expect(byCode.otel).toMatchObject({
        binding: 'none',
        missingEnvVars: [],
      });
      expect(byCode.object_storage).toMatchObject({
        binding: 'real',
        isConfigured: true,
      });
    });

    it('un interruptor encendido exige sus variables: SIAT real sin NIT', async () => {
      const { service } = build(okCheck());
      const res = await service.listTools({
        ...EMPTY_ENV,
        SIAT_MODE: 'real',
        SIAT_BASE_URL: 'https://siat.example.test',
        SIAT_CODIGO_SISTEMA: 'X',
      });
      const siat = res.tools.find((t) => t.code === 'siat')!;
      expect(siat).toMatchObject({
        binding: 'real',
        isConfigured: false,
        missingEnvVars: ['SIAT_NIT'],
        isHealthy: null,
      });
    });

    it('S3 con una sola mitad de las credenciales estáticas la señala como faltante', async () => {
      const { service } = build(okCheck());
      const res = await service.listTools({
        ...EMPTY_ENV,
        FILE_STORAGE_ADAPTER: 's3',
        FILE_STORAGE_S3_BUCKET: 'b',
        FILE_STORAGE_S3_ACCESS_KEY_ID: 'k',
      });
      const storage = res.tools.find((t) => t.code === 'object_storage')!;
      expect(storage.missingEnvVars).toEqual([
        'FILE_STORAGE_S3_SECRET_ACCESS_KEY',
      ]);
    });

    it('CONFIGURATION y NOT_APPLICABLE nunca quedan en rojo, aunque todo falte', async () => {
      const { service } = build(okCheck());
      const res = await service.listTools({
        ...EMPTY_ENV,
        FILE_STORAGE_ADAPTER: 's3',
        SIAT_MODE: 'real',
        PAYMENTS_VIA_GATEWAY: 'true',
        AUDIO_TTS_PROVIDER: 'elevenlabs',
        TELEMETRY_WEB_ANALYTICS_ENABLED: 'true',
        TELEMETRY_WEB_ANALYTICS_PROVIDER: 'google_analytics',
        OTEL_ENABLED: 'true',
      });
      for (const tool of res.tools.filter((t) => t.checkType !== 'LIVE')) {
        expect(tool.isHealthy).toBeNull();
        expect(tool.latencyMs).toBeNull();
      }
      const incomplete = res.tools.filter(
        (t) => t.checkType === 'CONFIGURATION' && !t.isConfigured,
      );
      expect(incomplete.map((t) => t.code)).toEqual(
        expect.arrayContaining([
          'object_storage',
          'siat',
          'payments_gateway',
          'elevenlabs',
          'ga4',
          'otel',
        ]),
      );
    });
  });

  describe('sondas LIVE', () => {
    it('todas arriba → isHealthy true con latencia y mensaje propio', async () => {
      const { service } = build(okCheck(37));
      const res = await service.listTools(EMPTY_ENV);
      const pg = res.tools.find((t) => t.code === 'postgresql')!;
      expect(pg).toMatchObject({
        checkType: 'LIVE',
        binding: 'real',
        isHealthy: true,
        latencyMs: 37,
        healthMessage: 'Responde a la sonda de readiness en 37 ms.',
      });
      expect(pg.checkedAt).toEqual(expect.any(String));
      expect(pg.missingEnvVars).toEqual([
        'DB_HOST',
        'DB_PORT',
        'DB_USER',
        'DB_PASSWORD',
        'DB_NAME',
      ]);
    });

    it('arriba pero lenta → sigue sana y el mensaje lo dice', async () => {
      const { service } = build(okCheck(SLOW_PROBE_MS + 500));
      const res = await service.listTools(EMPTY_ENV);
      const redis = res.tools.find((t) => t.code === 'redis')!;
      expect(redis.isHealthy).toBe(true);
      expect(redis.healthMessage).toContain('lento');
      expect(redis.healthMessage).toContain(`${SLOW_PROBE_MS + 500} ms`);
    });

    it('una dependencia caída (503 de readiness) → sólo esa en rojo, sin el error del driver', async () => {
      const check = jest.fn<Check>().mockRejectedValue(
        new ServiceUnavailableException({
          code: 'DEPENDENCY_UNAVAILABLE',
          message: 'Una o más dependencias obligatorias no están disponibles',
          reason: 'SYSTEM_READINESS_DEPENDENCY_UNAVAILABLE',
          details: {
            status: 'error',
            checks: {
              ...upChecks(5),
              redis: { status: 'down', latencyMs: 3000 },
            },
            timestamp: new Date().toISOString(),
          },
        }),
      );
      const { service } = build(check);
      const res = await service.listTools(EMPTY_ENV);
      const byCode = Object.fromEntries(res.tools.map((t) => [t.code, t]));
      expect(byCode.redis).toMatchObject({
        isHealthy: false,
        latencyMs: 3000,
      });
      expect(byCode.redis.healthMessage).not.toMatch(
        /ECONNREFUSED|\d+\.\d+\.\d+\.\d+/,
      );
      expect(byCode.postgresql.isHealthy).toBe(true);
      expect(res.summary).toMatchObject({ healthy: 3, down: 1 });
    });

    it('si la sonda no puede ejecutarse, las LIVE quedan sin dato (null), no en rojo', async () => {
      const check = jest
        .fn<Check>()
        .mockRejectedValue(new Error('fallo interno de la sonda'));
      const { service } = build(check);
      const res = await service.listTools(EMPTY_ENV);
      for (const tool of res.tools.filter((t) => t.checkType === 'LIVE')) {
        expect(tool.isHealthy).toBeNull();
        expect(tool.healthMessage).toBe(
          'La sonda de readiness no pudo ejecutarse.',
        );
      }
      expect(res.summary.down).toBe(0);
    });

    it('reutiliza la sonda durante 10 s y la repite después', async () => {
      const check = okCheck();
      const { service } = build(check);
      const now = jest.spyOn(Date, 'now');
      now.mockReturnValue(1_000_000);
      await service.listTools(EMPTY_ENV);
      await service.listTools(EMPTY_ENV);
      expect(check).toHaveBeenCalledTimes(1);

      now.mockReturnValue(1_000_000 + READINESS_CACHE_TTL_MS + 1);
      await service.listTools(EMPTY_ENV);
      expect(check).toHaveBeenCalledTimes(2);
    });
  });

  describe('sin valores de entorno en la respuesta', () => {
    const SENTINEL = 'CENTINELA-NO-DEBE-SALIR-7f3a9c';
    let env: NodeJS.ProcessEnv;

    beforeEach(() => {
      env = { NODE_ENV: 'production' };
      for (const name of new Set(
        TOOL_CATALOG.flatMap((tool) => [...tool.requiredEnvVars]),
      )) {
        env[name] = `${SENTINEL}-${name}`;
      }
      Object.assign(env, {
        FILE_STORAGE_ADAPTER: 's3',
        SIAT_MODE: 'real',
        PAYMENTS_VIA_GATEWAY: 'true',
        AUDIO_TTS_PROVIDER: 'elevenlabs',
        TELEMETRY_WEB_ANALYTICS_ENABLED: 'true',
        TELEMETRY_WEB_ANALYTICS_PROVIDER: 'google_analytics',
        OTEL_ENABLED: 'true',
        MALWARE_SCAN_ENABLED: 'true',
        MOCK_PROVIDER_BASE_URL: `${SENTINEL}-mock`,
      });
    });

    it('ningún valor configurado aparece en el JSON, sólo nombres', async () => {
      const { service } = build(okCheck());
      const res = await service.listTools(env);
      expect(JSON.stringify(res)).not.toContain(SENTINEL);
      const configured = res.tools.filter(
        (t) => t.checkType === 'CONFIGURATION',
      );
      expect(configured.every((t) => t.isConfigured)).toBe(true);
    });
  });
});
