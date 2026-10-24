import { jest } from '@jest/globals';
import { IntegrationsSecretsService } from './integrations-secrets.service';
import { INTEG } from '../integrations.concepts';
import { IntegrationsErrorReason } from '../integrations.error-reasons';
import { PreconditionFailedException } from '../../../common';

/**
 * Crea un mock tipado de forma laxa.
 *
 * @param impl - Implementación opcional.
 * @returns Función mock.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const SECRET_V2 = 'secreto-nuevo-de-la-rotacion-000000001';
const SECRET_V1 = 'secreto-anterior-de-la-rotacion-0000002';

/**
 * Construye el adaptador con una credencial controlada.
 *
 * @returns El servicio y el repositorio de credenciales simulado.
 */
function build() {
  const credentialsRepo = { findActiveByConnection: mockFn() };
  const service = new IntegrationsSecretsService(credentialsRepo as any);
  return { service, credentialsRepo };
}

describe('IntegrationsSecretsService (INT-02)', () => {
  const em = {} as any;

  it('resuelve el secreto de la referencia de la credencial activa', async () => {
    const d = build();
    d.credentialsRepo.findActiveByConnection.mockResolvedValue({
      secretRef: 'env:WEBHOOK_SECRET_CLINICA_A',
    });
    const secrets = await d.service.resolveActiveSecrets(em, 'c1', {
      WEBHOOK_SECRET_CLINICA_A: SECRET_V2,
    });
    expect(secrets).toEqual([SECRET_V2]);
    expect(d.credentialsRepo.findActiveByConnection).toHaveBeenCalledWith(
      em,
      'c1',
      INTEG.CRED_ACTIVE,
    );
  });

  it('límite: durante una rotación entrega la clave nueva primero y la anterior después', async () => {
    const d = build();
    d.credentialsRepo.findActiveByConnection.mockResolvedValue({
      secretRef:
        'env:WEBHOOK_SECRET_CLINICA_A_V2,env:WEBHOOK_SECRET_CLINICA_A_V1',
    });
    const secrets = await d.service.resolveActiveSecrets(em, 'c1', {
      WEBHOOK_SECRET_CLINICA_A_V2: SECRET_V2,
      WEBHOOK_SECRET_CLINICA_A_V1: SECRET_V1,
    });
    expect(secrets).toEqual([SECRET_V2, SECRET_V1]);
  });

  it.each([
    ['la conexión no tiene credencial activa', null, {}],
    [
      'la credencial no tiene referencia',
      { secretRef: undefined },
      { WEBHOOK_SECRET_X: SECRET_V2 },
    ],
    [
      'la referencia no usa el prefijo permitido (env:NODE_ENV)',
      { secretRef: 'env:NODE_ENV' },
      { NODE_ENV: 'production' },
    ],
    [
      'la variable referida no está definida',
      { secretRef: 'env:WEBHOOK_SECRET_AUSENTE' },
      {},
    ],
    [
      'el secreto es demasiado corto',
      { secretRef: 'env:WEBHOOK_SECRET_CORTO' },
      { WEBHOOK_SECRET_CORTO: 'corto' },
    ],
    [
      'una referencia literal en vez de una referencia a la bóveda',
      { secretRef: 'new-ref-123' },
      {},
    ],
  ])(
    'falla cerrado con error catalogado cuando %s',
    async (_name, credential, env) => {
      const d = build();
      d.credentialsRepo.findActiveByConnection.mockResolvedValue(credential);
      const attempt = d.service.resolveActiveSecrets(em, 'c1', env as any);
      await expect(attempt).rejects.toBeInstanceOf(PreconditionFailedException);
      await expect(attempt).rejects.toMatchObject({
        reason:
          IntegrationsErrorReason.INTEGRATIONS_CONNECTION_SECRET_UNAVAILABLE,
        details: { connectionId: 'c1' },
      });
    },
  );

  it('la rotación retira la credencial anterior: sin credencial activa su clave deja de valer', async () => {
    const d = build();
    d.credentialsRepo.findActiveByConnection.mockResolvedValue(null);
    await expect(
      d.service.resolveActiveSecrets(em, 'c1', {
        WEBHOOK_SECRET_CLINICA_A: SECRET_V1,
      }),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('no incluye la referencia ni el secreto en el error', async () => {
    const d = build();
    d.credentialsRepo.findActiveByConnection.mockResolvedValue({
      secretRef: 'env:WEBHOOK_SECRET_CORTO',
    });
    const error: any = await d.service
      .resolveActiveSecrets(em, 'c1', { WEBHOOK_SECRET_CORTO: 'corto' })
      .catch((e: unknown) => e);
    const serialized = JSON.stringify(error.getResponse());
    expect(serialized).not.toContain('WEBHOOK_SECRET_CORTO');
    expect(serialized).not.toContain('corto"');
  });
});
