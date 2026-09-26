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
  const challenge = (code?: string) =>
    (service as any).assertMfaChallenge({}, 'u1', code, span, '1.1.1.1');
  return { challenge, eventsRepo, mfaRepo };
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
      { secretEncrypted: encryptSecret(secret), stateConceptId: CONCEPTS.STATE_VERIFIED },
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
