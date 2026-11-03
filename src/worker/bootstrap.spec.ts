import { jest } from '@jest/globals';
import * as Joi from 'joi';

const assertMockProviderNotInProduction = jest.fn<() => void>();
const configureTicks = jest.fn<(timeoutMs: number) => void>();
const configureHealth = jest.fn<(name: string, stuckTickMs: number) => void>();
const inFlightOperations = jest.fn<() => string[]>();
const getStatus = jest.fn<() => string>();
const installProcessGuards = jest.fn();
const installShutdownWatchdog = jest.fn();
const startWorkerHealthServer = jest.fn();
const forRootConfig = jest.fn((options: unknown) => ({ options }));
const forRootSchedule = jest.fn(() => ({ schedule: true }));
const loadWorkerEnv = jest.fn();
const createApplicationContext = jest.fn<(...args: any[]) => Promise<any>>();

const authEnvSchema = Joi.object({ AUTH_SPEC: Joi.string() });
const loggingEnvSchema = Joi.object({ LOGGING_SPEC: Joi.string() });
const workerEnvSchema = Joi.object({ WORKER_SPEC: Joi.string() });
const telemetryEnvSchema = Joi.object({ TELEMETRY_SPEC: Joi.string() });

class AuthTokenModule {}
class LoggingModule {}
class ObservabilityModule {}
class SystemApiClientModule {}
class MockProviderClientModule {}
class GoogleEmailClientModule {}
class WorkerLifecycleService {}
class WorkerHeartbeatService {}
class LoggerToken {}
class PinoLoggerToken {}

jest.unstable_mockModule('../observability/telemetry.bootstrap', () => ({}));
jest.unstable_mockModule('@nestjs/core', () => ({
  NestFactory: { createApplicationContext },
}));
jest.unstable_mockModule('@nestjs/config', () => ({
  ConfigModule: { forRoot: forRootConfig },
}));
jest.unstable_mockModule('@nestjs/schedule', () => ({
  ScheduleModule: { forRoot: forRootSchedule },
}));
jest.unstable_mockModule('nestjs-pino', () => ({
  Logger: LoggerToken,
  PinoLogger: PinoLoggerToken,
}));
jest.unstable_mockModule('../common', () => ({
  AuthTokenModule,
  authEnvSchema,
  installProcessGuards,
  installShutdownWatchdog,
}));
jest.unstable_mockModule('../logging', () => ({
  LoggingModule,
  loggingEnvSchema,
}));
jest.unstable_mockModule('../observability', () => ({
  ObservabilityModule,
  telemetryEnvSchema,
}));
jest.unstable_mockModule('./worker.env', () => ({
  assertMockProviderNotInProduction,
  loadWorkerEnv,
  workerEnvSchema,
}));
jest.unstable_mockModule('./system-api-client.module', () => ({
  SystemApiClientModule,
}));
jest.unstable_mockModule('./mock-provider-client.module', () => ({
  MockProviderClientModule,
}));
jest.unstable_mockModule('./google-email-client.module', () => ({
  GoogleEmailClientModule,
}));
jest.unstable_mockModule('./worker-lifecycle.service', () => ({
  WorkerLifecycleService,
}));
jest.unstable_mockModule('./worker-heartbeat.service', () => ({
  WorkerHeartbeatService,
}));
jest.unstable_mockModule('./run-tick.util', () => ({ configureTicks }));
jest.unstable_mockModule('./worker-health.registry', () => ({
  workerHealth: {
    configure: configureHealth,
    inFlightOperations,
    getStatus,
  },
}));
jest.unstable_mockModule('./worker-health.server', () => ({
  startWorkerHealthServer,
}));

let bootstrapWorker: typeof import('./bootstrap').bootstrapWorker;

beforeAll(async () => {
  const modulePath: string = './bootstrap';
  ({ bootstrapWorker } = (await import(
    modulePath
  )) as typeof import('./bootstrap'));
});

function buildApp() {
  const logger = {
    setContext: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  };
  const appLogger = { kind: 'application-logger' };
  const app = {
    useLogger: jest.fn(),
    flushLogs: jest.fn(),
    enableShutdownHooks: jest.fn(),
    get: jest.fn(() => appLogger),
    resolve: jest.fn(async () => logger),
    close: jest.fn<() => Promise<void>>(),
  };
  return { app, appLogger, logger };
}

const baseEnv = {
  healthPort: 9310,
  healthHost: '127.0.0.1',
  tickTimeoutMs: 45_000,
  stuckTickMs: 90_000,
  shutdownTimeoutMs: 12_000,
  mockProviderBaseUrl: '   ',
};

describe('bootstrapWorker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    inFlightOperations.mockReturnValue(['outbox.relay']);
    getStatus.mockReturnValue('draining');
  });

  it('arranca el contexto con la configuración base y expone el diagnóstico de apagado', async () => {
    const { app, appLogger, logger } = buildApp();
    app.close.mockRejectedValue(new Error('fallo durante cierre'));
    createApplicationContext.mockResolvedValue(app);
    loadWorkerEnv.mockReturnValue(baseEnv);
    class MessagingWorkerModule {}

    await bootstrapWorker(MessagingWorkerModule, 'messaging');

    expect(assertMockProviderNotInProduction).toHaveBeenCalledTimes(1);
    expect(configureTicks).toHaveBeenCalledWith(45_000);
    expect(configureHealth).toHaveBeenCalledWith('messaging', 90_000);
    expect(createApplicationContext).toHaveBeenCalledWith(
      expect.any(Function),
      { bufferLogs: true },
    );
    expect(app.get).toHaveBeenCalledWith(LoggerToken);
    expect(app.useLogger).toHaveBeenCalledWith(appLogger);
    expect(app.flushLogs).toHaveBeenCalledTimes(1);
    expect(app.enableShutdownHooks).toHaveBeenCalledTimes(1);
    expect(app.resolve).toHaveBeenCalledWith(PinoLoggerToken);
    expect(logger.setContext).toHaveBeenCalledWith('worker:messaging');

    const processGuardOptions = installProcessGuards.mock.calls[0]?.[0] as {
      logger: typeof logger;
      processName: string;
      onFatal: () => Promise<void>;
    };
    expect(processGuardOptions).toMatchObject({
      logger,
      processName: 'worker-messaging',
    });
    await expect(processGuardOptions.onFatal()).resolves.toBeUndefined();
    expect(app.close).toHaveBeenCalledTimes(1);

    const watchdogOptions = installShutdownWatchdog.mock.calls[0]?.[0] as {
      logger: typeof logger;
      processName: string;
      timeoutMs: number;
      describePending: () => unknown;
    };
    expect(watchdogOptions).toMatchObject({
      logger,
      processName: 'worker-messaging',
      timeoutMs: 12_000,
    });
    expect(watchdogOptions.describePending()).toEqual({
      inFlightTicks: ['outbox.relay'],
      status: 'draining',
    });
    expect(startWorkerHealthServer).toHaveBeenCalledWith({
      port: 9310,
      host: '127.0.0.1',
      logger,
    });
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      {
        worker: 'messaging',
        healthPort: 9310,
        tickTimeoutMs: 45_000,
        stuckTickMs: 90_000,
        shutdownTimeoutMs: 12_000,
      },
      'Worker "messaging" en marcha',
    );

    const config = forRootConfig.mock.calls[0]?.[0] as {
      isGlobal: boolean;
      validationSchema: Joi.ObjectSchema;
    };
    expect(config.isGlobal).toBe(true);
    expect(
      Object.keys(config.validationSchema.describe().keys ?? {}).sort(),
    ).toEqual(['AUTH_SPEC', 'LOGGING_SPEC', 'TELEMETRY_SPEC', 'WORKER_SPEC']);
  });

  it('concatena el esquema adicional y advierte cuando el emulador está activo', async () => {
    const { app, logger } = buildApp();
    app.close.mockResolvedValue(undefined);
    createApplicationContext.mockResolvedValue(app);
    loadWorkerEnv.mockReturnValue({
      ...baseEnv,
      mockProviderBaseUrl: 'http://127.0.0.1:4100',
    });
    const additionalEnvSchema = Joi.object({ DOMAIN_SPEC: Joi.string() });
    class BillingWorkerModule {}

    await bootstrapWorker(BillingWorkerModule, 'billing', additionalEnvSchema);

    const config = forRootConfig.mock.calls[0]?.[0] as {
      validationSchema: Joi.ObjectSchema;
    };
    expect(
      Object.keys(config.validationSchema.describe().keys ?? {}).sort(),
    ).toEqual([
      'AUTH_SPEC',
      'DOMAIN_SPEC',
      'LOGGING_SPEC',
      'TELEMETRY_SPEC',
      'WORKER_SPEC',
    ]);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        'Emulador de proveedores ACTIVO (http://127.0.0.1:4100)',
      ),
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ worker: 'billing' }),
      'Worker "billing" en marcha',
    );
  });
});
