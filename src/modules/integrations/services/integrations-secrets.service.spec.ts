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

/** Tenant dueño de la conexión y otro tenant de la misma plataforma. */
const TENANT = '0b9a7c1e-3f4d-4e2a-9c55-1d2e3f4a5b6c';
const OTHER_TENANT = '7f1c2d3e-4a5b-4c6d-8e7f-9a0b1c2d3e4f';
const OWN = 'WEBHOOK_SECRET_0B9A7C1E3F4D4E2A9C551D2E3F4A5B6C';
const FOREIGN = 'WEBHOOK_SECRET_7F1C2D3E4A5B4C6D8E7F9A0B1C2D3E4F';

/**
 * Construye el adaptador con una credencial controlada.
 *
 * @returns El servicio y el repositorio de credenciales simulado.
 */
function build() {
  const credentialsRepo = { findActiveByConnection: mockFn() };
  const connectionsRepo = {
    findById: mockFn().mockResolvedValue({ id: 'c1', tenantId: TENANT }),
  };
  const service = new IntegrationsSecretsService(
    credentialsRepo as any,
    connectionsRepo as any,
  );
  return { service, credentialsRepo, connectionsRepo };
}

describe('IntegrationsSecretsService (INT-02)', () => {
  const em = {} as any;

  it('resuelve el secreto de la referencia de la credencial activa', async () => {
    const d = build();
    d.credentialsRepo.findActiveByConnection.mockResolvedValue({
      secretRef: `env:${OWN}_CLINICA_A`,
    });
    const secrets = await d.service.resolveActiveSecrets(em, 'c1', {
      [`${OWN}_CLINICA_A`]: SECRET_V2,
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
      secretRef: `env:${OWN}_CLINICA_A_V2,env:${OWN}_CLINICA_A_V1`,
    });
    const secrets = await d.service.resolveActiveSecrets(em, 'c1', {
      [`${OWN}_CLINICA_A_V2`]: SECRET_V2,
      [`${OWN}_CLINICA_A_V1`]: SECRET_V1,
    });
    expect(secrets).toEqual([SECRET_V2, SECRET_V1]);
  });

  it.each([
    ['la conexión no tiene credencial activa', null, {}],
    [
      'la credencial no tiene referencia',
      { secretRef: undefined },
      { [`${OWN}_X`]: SECRET_V2 },
    ],
    [
      'la referencia no usa el prefijo permitido (env:NODE_ENV)',
      { secretRef: 'env:NODE_ENV' },
      { NODE_ENV: 'production' },
    ],
    [
      'la variable referida no está definida',
      { secretRef: `env:${OWN}_AUSENTE` },
      {},
    ],
    [
      'el secreto es demasiado corto',
      { secretRef: `env:${OWN}_CORTO` },
      { [`${OWN}_CORTO`]: 'corto' },
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
        [`${OWN}_CLINICA_A`]: SECRET_V1,
      }),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('no incluye la referencia ni el secreto en el error', async () => {
    const d = build();
    d.credentialsRepo.findActiveByConnection.mockResolvedValue({
      secretRef: `env:${OWN}_CORTO`,
    });
    const error: any = await d.service
      .resolveActiveSecrets(em, 'c1', { [`${OWN}_CORTO`]: 'corto' })
      .catch((e: unknown) => e);
    const serialized = JSON.stringify(error.getResponse());
    expect(serialized).not.toContain('_CORTO');
    expect(serialized).not.toContain(OWN);
    expect(serialized).not.toContain('corto"');
  });

  describe('propiedad de la referencia (hallazgo de revisión de seguridad)', () => {
    it('no resuelve el secreto de otro tenant aunque el nombre cumpla WEBHOOK_SECRET_*', async () => {
      const d = build();
      d.credentialsRepo.findActiveByConnection.mockResolvedValue({
        secretRef: `env:${FOREIGN}_CLINICA_B`,
      });
      const env = { [`${FOREIGN}_CLINICA_B`]: SECRET_V2 };
      await expect(
        d.service.resolveActiveSecrets(em, 'c1', env),
      ).rejects.toMatchObject({
        reason:
          IntegrationsErrorReason.INTEGRATIONS_CONNECTION_SECRET_UNAVAILABLE,
      });
    });

    it('no resuelve una variable de la plataforma con el prefijo genérico', async () => {
      const d = build();
      d.credentialsRepo.findActiveByConnection.mockResolvedValue({
        secretRef: 'env:WEBHOOK_SECRET_PLATAFORMA',
      });
      await expect(
        d.service.resolveActiveSecrets(em, 'c1', {
          WEBHOOK_SECRET_PLATAFORMA: SECRET_V2,
        }),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('una ventana de rotación que mezcla una entrada propia y una ajena se rechaza completa', async () => {
      const d = build();
      d.credentialsRepo.findActiveByConnection.mockResolvedValue({
        secretRef: `env:${OWN}_A_V2,env:${FOREIGN}_B_V1`,
      });
      await expect(
        d.service.resolveActiveSecrets(em, 'c1', {
          [`${OWN}_A_V2`]: SECRET_V2,
          [`${FOREIGN}_B_V1`]: SECRET_V1,
        }),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('el dueño sale de la conexión, no de la referencia: la misma referencia vale para su tenant y no para otro', async () => {
      const d = build();
      d.credentialsRepo.findActiveByConnection.mockResolvedValue({
        secretRef: `env:${OWN}_A`,
      });
      const env = { [`${OWN}_A`]: SECRET_V2 };
      await expect(
        d.service.resolveActiveSecrets(em, 'c1', env),
      ).resolves.toEqual([SECRET_V2]);
      d.connectionsRepo.findById.mockResolvedValue({
        id: 'c2',
        tenantId: OTHER_TENANT,
      });
      await expect(
        d.service.resolveActiveSecrets(em, 'c2', env),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('sin conexión no hay dueño y falla cerrado', async () => {
      const d = build();
      d.connectionsRepo.findById.mockResolvedValue(null);
      d.credentialsRepo.findActiveByConnection.mockResolvedValue({
        secretRef: `env:${OWN}_A`,
      });
      await expect(
        d.service.resolveActiveSecrets(em, 'c1', { [`${OWN}_A`]: SECRET_V2 }),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });
});
