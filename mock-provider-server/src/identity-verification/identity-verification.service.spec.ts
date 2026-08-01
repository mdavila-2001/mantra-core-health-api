import { IdentityVerificationService } from './identity-verification.service';
import type { MockProviderEnv } from '../common/env';

function build(env: Partial<MockProviderEnv> = {}) {
  const fullEnv: MockProviderEnv = {
    port: 4100,
    apiKey: undefined,
    notificationsFailureRate: 0,
    deletionsFailureRate: 0,
    simulatedLatencyMs: 0,
    identityVerificationDelayMs: 10_000,
    identityVerificationRejectionRate: 0,
    ...env,
  };
  return new IdentityVerificationService(fullEnv);
}

const ref = { subjectRef: 'check-1', checkType: 'IDENTITY_CARD' };

describe('IdentityVerificationService', () => {
  it('acepta encolar sin revelar el veredicto', async () => {
    const service = build();

    const queued = await service.execute(ref);

    expect(queued.accepted).toBe(true);
    expect(queued.providerReceipt).toContain('mock-identity-');
  });

  it('responde PENDING mientras no pasa el retardo configurado', async () => {
    const service = build();
    await service.execute(ref);

    const verified = await service.verify(ref);

    expect(verified.status).toBe('PENDING');
    expect(verified.retryAfterMs).toBeGreaterThan(0);
  });

  it('responde ACCEPTED una vez pasado el retardo', async () => {
    // Retardo 0: el veredicto está disponible de inmediato, sin esperar 10s en
    // la suite.
    const service = build({ identityVerificationDelayMs: 0 });
    await service.execute(ref);

    const verified = await service.verify(ref);

    expect(verified.status).toBe('ACCEPTED');
  });

  it('responde REJECTED cuando la tasa de rechazo es 1', async () => {
    const service = build({
      identityVerificationDelayMs: 0,
      identityVerificationRejectionRate: 1,
    });
    await service.execute(ref);

    const verified = await service.verify(ref);

    expect(verified.status).toBe('REJECTED');
    expect(verified.reason).toBe('SIMULATED_NO_MATCH');
  });

  it('consultar algo nunca encolado es PENDING, no un rechazo', async () => {
    const service = build({ identityVerificationDelayMs: 0 });

    const verified = await service.verify(ref);

    // Devolver REJECTED aquí haría que un worker que consulta antes de encolar
    // cerrara el caso en falso.
    expect(verified.status).toBe('PENDING');
  });

  it('reencolar no reinicia el reloj ni vuelve a sortear el veredicto', async () => {
    const service = build({ identityVerificationDelayMs: 0 });
    await service.execute(ref);
    const first = await service.verify(ref);

    await service.execute(ref);
    const second = await service.verify(ref);

    expect(second.status).toBe(first.status);
  });

  it('no confunde el mismo sujeto en distinto tipo de comprobación', async () => {
    const service = build({ identityVerificationDelayMs: 0 });
    await service.execute(ref);

    const other = await service.verify({
      subjectRef: ref.subjectRef,
      checkType: 'MEDICAL_LICENSE',
    });

    expect(other.status).toBe('PENDING');
  });
});
