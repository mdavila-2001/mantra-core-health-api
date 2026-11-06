import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../common/constants/concepts';
import {
  NotificationDeliveryJob,
  defaultProviderAdapter,
  type PendingNotificationRequest,
} from './notification-delivery.job';

const baseRequest: PendingNotificationRequest = {
  id: 'req-1',
  channelId: 'channel-1',
  statusConceptId: 'status-1',
};

describe('defaultProviderAdapter (Carril 18)', () => {
  it('mantiene el literal CHANNEL_TYPE_IN_APP sincronizado con el catálogo real', () => {
    // Contrato explícito: el worker no puede importar `CONCEPTS` (proceso
    // separado), así que duplica el UUID determinista como literal. Si este
    // test falla, el literal quedó desincronizado del catálogo real y el
    // canal in-app volvería a fallar silenciosamente con
    // PROVIDER_NOT_CONFIGURED. El valor esperado es el mismo que usa el
    // adapter (verificado funcionalmente en el test siguiente).
    expect(CONCEPTS.CHANNEL_TYPE_IN_APP).toBe(
      '41557f04-1334-5b20-a794-16bf070f64fb',
    );
  });

  it('reporta SENT para el canal in-app sin llamar a ningún proveedor externo', async () => {
    const result = await defaultProviderAdapter({
      ...baseRequest,
      channelTypeConceptId: CONCEPTS.CHANNEL_TYPE_IN_APP,
    });
    expect(result).toEqual({ outcome: 'SENT' });
  });

  it('falla honestamente (PROVIDER_NOT_CONFIGURED) para un canal externo sin adapter conectado', async () => {
    const result = await defaultProviderAdapter({
      ...baseRequest,
      channelTypeConceptId: CONCEPTS.CHANNEL_TYPE_EMAIL,
    });
    expect(result.outcome).toBe('FAILED');
    expect(result.errorCode).toBe('PROVIDER_NOT_CONFIGURED');
  });

  it('falla honestamente cuando no se conoce el tipo de canal', async () => {
    const result = await defaultProviderAdapter(baseRequest);
    expect(result.outcome).toBe('FAILED');
    expect(result.errorCode).toBe('PROVIDER_NOT_CONFIGURED');
  });
});

describe('NotificationDeliveryJob.releaseDeferred (quiet hours)', () => {
  it('asks the API to release deferred in-app rows, declared idempotent', async () => {
    const api = {
      post: (jest.fn as any)().mockResolvedValue({ released: 0, announced: 0 }),
    };
    const logger: any = {
      setContext: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    const job = new NotificationDeliveryJob(api as any, logger, {} as any);

    await job.releaseDeferred();

    expect(api.post).toHaveBeenCalledWith(
      '/internal/notifications/in-app/release-due',
      {},
      { idempotent: true },
    );
  });
});
