import { NotificationsService } from './notifications.service';
import type { MockProviderEnv } from '../common/env';

function build(env: Partial<MockProviderEnv> = {}) {
  const fullEnv: MockProviderEnv = {
    port: 4100,
    apiKey: undefined,
    notificationsFailureRate: 0,
    deletionsFailureRate: 0,
    simulatedLatencyMs: 0,
    identityVerificationDelayMs: 0,
    identityVerificationRejectionRate: 0,
    ...env,
  };
  return new NotificationsService(fullEnv);
}

describe('NotificationsService', () => {
  it('SENT con tasa de fallo 0', async () => {
    const service = build({ notificationsFailureRate: 0 });

    const res = await service.send({
      channel: 'EMAIL',
      to: 'a@b.com',
      body: 'hola',
    });

    expect(res.outcome).toBe('SENT');
    expect(res.providerMessageRef).toContain('mock-email-');
    expect(res.errorCode).toBeUndefined();
  });

  it('FAILED con tasa de fallo 1', async () => {
    const service = build({ notificationsFailureRate: 1 });

    const res = await service.send({
      channel: 'SMS',
      to: '+50600000000',
      body: 'hola',
    });

    expect(res.outcome).toBe('FAILED');
    expect(res.errorCode).toBe('SIMULATED_PROVIDER_ERROR');
    expect(res.providerMessageRef).toBeUndefined();
  });

  it('findById recupera un envío previo y undefined si no existe', async () => {
    const service = build();
    const sent = await service.send({
      channel: 'PUSH',
      to: 'device-token',
      body: 'hola',
    });

    expect(service.findById(sent.id)).toEqual(sent);
    expect(service.findById('no-existe')).toBeUndefined();
  });
});
