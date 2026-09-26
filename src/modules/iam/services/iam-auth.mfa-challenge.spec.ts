import { jest } from '@jest/globals';
import { generateSecret, generate } from 'otplib';
import { CONCEPTS, encryptSecret } from '../../../common';
import { IamAuthService } from './iam-auth.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/** Servicio con sólo lo que toca el desafío MFA. */
function build(factors: any[]) {
  const mfaRepo = { findVerifiedByUser: mockFn().mockResolvedValue(factors) };
  const tx = {};
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
  };
  const eventsRepo = { record: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new IamAuthService(
    em as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    eventsRepo as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    logger as any,
    {} as any,
    mfaRepo as any,
  );
  const span = { addEvent: mockFn() };
  const challenge = (code?: string, administrator = false) =>
    (service as any).assertMfaChallenge(
      {},
      'u1',
      code,
      span,
      '1.1.1.1',
      administrator,
    );
  return { challenge, eventsRepo, mfaRepo, span, logger, service };
}

/** TX-29: desafío MFA del login, detrás de `AUTH_MFA_CHALLENGE_ENABLED`. */
describe('IamAuthService.assertMfaChallenge', () => {
  const original = process.env.AUTH_MFA_CHALLENGE_ENABLED;
  afterEach(() => {
    if (original === undefined) delete process.env.AUTH_MFA_CHALLENGE_ENABLED;
    else process.env.AUTH_MFA_CHALLENGE_ENABLED = original;
  });

  it('con la bandera apagada no mira los factores: el login no cambia', async () => {
    delete process.env.AUTH_MFA_CHALLENGE_ENABLED;
    const d = build([{ secretEncrypted: 'x' }]);
    await expect(d.challenge()).resolves.toBeUndefined();
    expect(d.mfaRepo.findVerifiedByUser).not.toHaveBeenCalled();
  });

  it('encendida y sin factor verificado, entra sin código', async () => {
    process.env.AUTH_MFA_CHALLENGE_ENABLED = 'true';
    await expect(build([]).challenge()).resolves.toBeUndefined();
  });

  it('encendida, con factor y sin código: 401 MFA_REQUIRED (aceptado -> límite -> inválido)', async () => {
    process.env.AUTH_MFA_CHALLENGE_ENABLED = 'true';
    const secret = generateSecret();
    const d = build([
      {
        secretEncrypted: encryptSecret(secret),
        stateConceptId: CONCEPTS.STATE_VERIFIED,
      },
    ]);
    // límite: falta el código
    await expect(d.challenge()).rejects.toMatchObject({
      status: 401,
      response: { details: { reason: 'MFA_REQUIRED' } },
    });
    // inválido: código erróneo, queda registrado como fallo
    await expect(d.challenge('000000')).rejects.toMatchObject({
      status: 401,
      response: { details: { reason: 'MFA_INVALID' } },
    });
    expect(d.eventsRepo.record).toHaveBeenCalledTimes(1);
    // aceptado: código vigente
    const code = await generate({ secret });
    await expect(d.challenge(code)).resolves.toBeUndefined();
  });
});

/** TX-29: MFA obligatorio para roles administrativos, detrás de `AUTH_MFA_REQUIRED_FOR_ADMIN_ENABLED`. */
describe('IamAuthService · MFA de administradores', () => {
  const originalChallenge = process.env.AUTH_MFA_CHALLENGE_ENABLED;
  const originalAdmin = process.env.AUTH_MFA_REQUIRED_FOR_ADMIN_ENABLED;
  afterEach(() => {
    for (const [key, value] of [
      ['AUTH_MFA_CHALLENGE_ENABLED', originalChallenge],
      ['AUTH_MFA_REQUIRED_FOR_ADMIN_ENABLED', originalAdmin],
    ] as const) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  const factorWith = (secret: string) => ({
    secretEncrypted: encryptSecret(secret),
    stateConceptId: CONCEPTS.STATE_VERIFIED,
  });

  it('un administrador con factor recibe el desafío aunque la bandera general esté apagada', async () => {
    delete process.env.AUTH_MFA_CHALLENGE_ENABLED;
    const d = build([factorWith(generateSecret())]);
    await expect(d.challenge(undefined, true)).rejects.toMatchObject({
      status: 401,
      response: { details: { reason: 'MFA_REQUIRED' } },
    });
  });

  it('el mismo administrador con el código vigente entra', async () => {
    delete process.env.AUTH_MFA_CHALLENGE_ENABLED;
    const secret = generateSecret();
    const d = build([factorWith(secret)]);
    await expect(
      d.challenge(await generate({ secret }), true),
    ).resolves.toBeUndefined();
  });

  it('un administrador sin factor no queda fuera: entra y queda el rastro', async () => {
    const d = build([]);
    await expect(d.challenge(undefined, true)).resolves.toBeUndefined();
    expect(d.span.addEvent).toHaveBeenCalledWith('auth.admin-without-mfa');
    expect(d.logger.warn).toHaveBeenCalled();
  });

  it('un rol que no es administrativo no se desafía si la bandera general está apagada', async () => {
    delete process.env.AUTH_MFA_CHALLENGE_ENABLED;
    const d = build([factorWith(generateSecret())]);
    await expect(d.challenge(undefined, false)).resolves.toBeUndefined();
    expect(d.mfaRepo.findVerifiedByUser).not.toHaveBeenCalled();
  });

  describe('mustChallengeAdministrator', () => {
    const decide = async (roles: string[]) => {
      const d = build([]);
      const service: any = d.service;
      service.rolesRepo = { findActiveForUser: mockFn().mockResolvedValue([]) };
      service.mergeRoleCodes = mockFn().mockResolvedValue({
        roles,
        scopedRoles: {},
      });
      return {
        d,
        service,
        result: await service.mustChallengeAdministrator({}, 'u1'),
      };
    };

    it('con la bandera apagada no consulta nada', async () => {
      delete process.env.AUTH_MFA_REQUIRED_FOR_ADMIN_ENABLED;
      const { result, service } = await decide(['SECURITY_ADMIN']);
      expect(result).toBe(false);
      expect(service.rolesRepo.findActiveForUser).not.toHaveBeenCalled();
    });

    it('encendida, SECURITY_ADMIN sí y PATIENT no', async () => {
      process.env.AUTH_MFA_REQUIRED_FOR_ADMIN_ENABLED = 'true';
      expect((await decide(['SECURITY_ADMIN'])).result).toBe(true);
      expect((await decide(['PRACTITIONER', 'IDENTITY_ADMIN'])).result).toBe(
        true,
      );
      expect((await decide(['PATIENT'])).result).toBe(false);
    });
  });
});
