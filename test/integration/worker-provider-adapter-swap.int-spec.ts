import { Test } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { PinoLogger } from 'nestjs-pino';
import { MockProviderClient } from '../../src/worker/mock-provider-client.service';
import { WORKER_ENV } from '../../src/worker/worker.tokens';
import { loadWorkerEnv } from '../../src/worker/worker.env';
import { NotificationDeliveryJob } from '../../src/worker/jobs/messaging/notification-delivery.job';
import { TracingService } from '../../src/observability';
import { MockProviderWiringService } from '../../src/worker/jobs/messaging/mock-provider-wiring.service';

/**
 * Verifica de punta a punta lo que el resto de esta sesión sólo confirmó por
 * lectura de código: que conectar un proveedor real a un job es
 * ÚNICAMENTE (1) escribir un adapter que cumpla el tipo `XxxProviderAdapter`
 * y (2) registrarlo en un `OnModuleInit` — sin tocar el job. Corre contra
 * `mock-provider-server` real (proceso Node separado en `../mock-provider-server`,
 * `PORT=4100`), no un stub en memoria: la llamada HTTP es real.
 */
describe('Worker — intercambio de adapter de proveedor (integración, mock-provider-server real)', () => {
  const originalBaseUrl = process.env.MOCK_PROVIDER_BASE_URL;

  afterAll(() => {
    process.env.MOCK_PROVIDER_BASE_URL = originalBaseUrl;
  });

  async function buildModule() {
    const env = loadWorkerEnv();
    const moduleRef = await Test.createTestingModule({
      imports: [
        HttpModule.register({
          baseURL: env.mockProviderBaseUrl || undefined,
          timeout: env.httpTimeoutMs,
        }),
      ],
      providers: [
        { provide: WORKER_ENV, useValue: env },
        MockProviderClient,
        NotificationDeliveryJob,
        MockProviderWiringService,
        {
          provide: PinoLogger,
          useValue: { setContext: () => {}, info: () => {}, warn: () => {} },
        },
      ],
    })
      .overrideProvider(NotificationDeliveryJob)
      .useFactory({
        factory: (logger: PinoLogger) =>
          new NotificationDeliveryJob({} as any, logger, new TracingService()),
        inject: [PinoLogger],
      })
      .compile();
    return moduleRef;
  }

  it('sin MOCK_PROVIDER_BASE_URL configurada, el adapter por defecto falla visible (PROVIDER_NOT_CONFIGURED)', async () => {
    process.env.MOCK_PROVIDER_BASE_URL = '';
    const moduleRef = await buildModule();
    const job = moduleRef.get(NotificationDeliveryJob);

    const outcome = await job.providerAdapter({
      id: 'req-1',
      channelId: 'sms',
      statusConceptId: 'x',
      recipientAddress: '+51999999999',
    });

    expect(outcome).toMatchObject({
      outcome: 'FAILED',
      errorCode: 'PROVIDER_NOT_CONFIGURED',
    });
    await moduleRef.close();
  });

  const itWithLiveProvider =
    process.env.MOCK_PROVIDER_INTEGRATION_TEST === '1' ? it : it.skip;

  itWithLiveProvider(
    'con MOCK_PROVIDER_BASE_URL configurada, el wiring reemplaza el adapter y hace una llamada HTTP real',
    async () => {
      process.env.MOCK_PROVIDER_BASE_URL = 'http://localhost:4100';
      const moduleRef = await buildModule();
      const job = moduleRef.get(NotificationDeliveryJob);
      const client = moduleRef.get(MockProviderClient);
      const wiring = moduleRef.get(MockProviderWiringService);

      expect(client.isConfigured()).toBe(true);

      wiring.onModuleInit();

      const outcome = await job.providerAdapter({
        id: 'req-2',
        channelId: 'sms',
        statusConceptId: 'x',
        recipientAddress: '+51999999999',
        payloadJson: { text: 'hola' },
      });

      // `mock-provider-server` corre con NOTIFICATIONS_FAILURE_RATE=0 en este
      // entorno de prueba: si la llamada HTTP real no ocurriera, seguiríamos
      // viendo el stub PROVIDER_NOT_CONFIGURED.
      expect(outcome.errorCode).not.toBe('PROVIDER_NOT_CONFIGURED');
      expect(outcome).toMatchObject({
        outcome: 'SENT',
        providerMessageRef: expect.any(String),
      });

      await moduleRef.close();
    },
  );
});
