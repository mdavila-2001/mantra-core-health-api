import { jest } from '@jest/globals';
import { CONCEPTS, encryptSecret } from '../../../../common';
import { generateSecret } from 'otplib';
import { IamAuthService } from './iam-auth.service';
import type { EffectiveSessionRules } from '../../domain/session-policy';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const noRules: EffectiveSessionRules = {
  requireMfa: false,
  allowedHours: [],
  newDeviceAlert: false,
  enforceIpRules: false,
};

/** Servicio con las políticas de sesión y el desafío MFA en doble. */
function build(factors: any[] = []) {
  const mfaRepo = { findVerifiedByUser: mockFn().mockResolvedValue(factors) };
  const eventsRepo = {
    record: mockFn(),
    countFailedMfaSince: mockFn().mockResolvedValue(1),
  };
  const tx: any = { flush: mockFn() };
  const usersRepo = {
    findById: mockFn().mockResolvedValue({ id: 'u1', lastLoginAt: undefined }),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const totp = { consume: mockFn().mockResolvedValue({ valid: false }) };
  const service = new IamAuthService(
    { transactional: mockFn((cb: any) => cb(tx)) } as any,
    {} as any,
    usersRepo as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    eventsRepo as any,
    {} as any,
    {} as any,
    {} as any,
    logger as any,
    {} as any,
    mfaRepo as any,
    undefined,
    undefined,
    undefined,
    undefined,
    totp as any,
  );
  const span = { addEvent: mockFn() };
  /** Qué organizaciones niegan por horario, con las reglas por organización. */
  const denials = (byTenant: Record<string, any>) =>
    (service as any).tenantDenials({}, { ...noRules, byTenant }, {});
  const mfa = (required: boolean, code?: string, canDegrade = false) =>
    (service as any).assertMfaChallenge(
      {},
      'u1',
      code,
      span,
      '1.1.1.1',
      required,
      canDegrade,
    );
  return { denials, mfa, mfaRepo, span, service, totp, eventsRepo, tx };
}

describe('IamAuthService: políticas de sesión de la organización', () => {
  const original = process.env.AUTH_MFA_CHALLENGE_ENABLED;
  afterEach(() => {
    if (original === undefined) delete process.env.AUTH_MFA_CHALLENGE_ENABLED;
    else process.env.AUTH_MFA_CHALLENGE_ENABLED = original;
  });

  it('sin reglas efectivas el login no cambia', async () => {
    const d = build();
    await expect(
      (d.service as any).tenantDenials({}, undefined, {}),
    ).resolves.toEqual({});
    await expect(d.denials({})).resolves.toEqual({});
  });

  it('fuera del horario permitido de su ÚNICA organización el login responde 401 con su motivo', async () => {
    const d = build();
    // Una franja de un minuto que (casi seguro) no es «ahora» en La Paz.
    const now = new Date();
    const hhmm = (offsetMin: number) => {
      const t = new Date(now.getTime() + offsetMin * 60_000);
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: 'America/La_Paz',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).format(t);
    };
    const byTenant = {
      t1: {
        requireMfa: false,
        newDeviceAlert: false,
        enforceIpRules: false,
        allowedHours: [{ from: hhmm(120), to: hhmm(121) }],
      },
    };
    const denied = await d.denials(byTenant);
    expect(denied).toEqual({ t1: 'OUTSIDE_ALLOWED_HOURS' });
    await expect(
      (d.service as any).assertSomeTenantLeft(
        { ...noRules, tenantIds: ['t1'], byTenant },
        denied,
        d.span,
        'u1',
        '1.1.1.1',
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        details: { reason: 'OUTSIDE_ALLOWED_HOURS' },
      }),
    });
  });

  it('N2: si queda una organización que no niega, no se rechaza el login', async () => {
    const d = build();
    await expect(
      (d.service as any).assertSomeTenantLeft(
        { ...noRules, tenantIds: ['t1', 't2'] },
        { t1: 'OUTSIDE_ALLOWED_HOURS' },
        d.span,
        'u1',
        '1.1.1.1',
      ),
    ).resolves.toBeUndefined();
  });

  it('una política que exige segundo factor lo desafía aunque la bandera global esté apagada', async () => {
    delete process.env.AUTH_MFA_CHALLENGE_ENABLED;
    const secret = generateSecret();
    const d = build([
      {
        secretEncrypted: encryptSecret(secret),
        stateConceptId: CONCEPTS.STATE_VERIFIED,
      },
    ]);
    await expect(d.mfa(true)).rejects.toMatchObject({
      status: 401,
      response: { details: { reason: 'MFA_REQUIRED' } },
    });
  });

  it('A5: exigida por la política, una cuenta SIN factor no queda bloqueada: puede entrar a enrolar uno', async () => {
    // Bloquear el login de quien no tiene factor lo deja sin forma de enrolarlo
    // (el alta del factor exige sesión): la política exige el código a quien
    // ya tiene factor y deja una marca para quien debe enrolarlo.
    delete process.env.AUTH_MFA_CHALLENGE_ENABLED;
    const d = build([]);
    await expect(d.mfa(true)).resolves.toBeUndefined();
    expect(d.span.addEvent).toHaveBeenCalledWith(
      'auth.mfa-enrollment-pending',
      expect.anything(),
    );
  });

  it('A5: el login calcula las reglas con el rol de apoyo que lleva el token', async () => {
    const d = build();
    const rulesFor = mockFn().mockResolvedValue(undefined);
    const svc: any = d.service;
    svc.sessionPolicies = { rulesFor };
    svc.rolesRepo = { findActiveForUser: mockFn().mockResolvedValue([]) };
    svc.mergeRoleCodes = mockFn().mockResolvedValue({
      roles: ['USER'],
      scopedRoles: {},
    });
    svc.loadActiveTenantIds = mockFn().mockResolvedValue(['t1']);
    svc.supportClaims = {
      listTenantIdsWithActiveEngagement: mockFn().mockResolvedValue(['t1']),
    };
    await svc.loadSessionRules({}, 'u1');
    const [, , roles, scoped] = rulesFor.mock.calls[0];
    expect(roles).toContain('SUPPORT_STAFF');
    expect(scoped).toEqual({ t1: ['SUPPORT_STAFF'] });
  });

  it('sin política ni bandera, el desafío no mira los factores', async () => {
    delete process.env.AUTH_MFA_CHALLENGE_ENABLED;
    const d = build([{ secretEncrypted: 'x' }]);
    await expect(d.mfa(false)).resolves.toBeUndefined();
    expect(d.mfaRepo.findVerifiedByUser).not.toHaveBeenCalled();
  });

  describe('N6: segundo factor del login', () => {
    const factor = { id: 'f1', secretEncrypted: 'enc' };

    it('sin código y con otras organizaciones a las que entrar, devuelve "missing" en vez de rechazar', async () => {
      delete process.env.AUTH_MFA_CHALLENGE_ENABLED;
      const d = build([factor]);
      await expect(d.mfa(true, undefined, true)).resolves.toBe('missing');
    });

    it('con la bandera global encendida el código es obligatorio aunque haya otras organizaciones', async () => {
      process.env.AUTH_MFA_CHALLENGE_ENABLED = 'true';
      const d = build([factor]);
      await expect(d.mfa(true, undefined, true)).rejects.toMatchObject({
        status: 401,
        response: { details: { reason: 'MFA_REQUIRED' } },
      });
    });

    it('un código válido devuelve "verified" y se gasta (un solo uso)', async () => {
      const d = build([factor]);
      d.totp.consume.mockResolvedValue({ valid: true, factorId: 'f1' });
      await expect(d.mfa(true, '123456')).resolves.toBe('verified');
      expect(d.totp.consume).toHaveBeenCalledWith('u1', [factor], '123456');
    });

    it('un código inválido o ya usado es 401 MFA_INVALID y cuenta en el contador PROPIO del segundo factor', async () => {
      const d = build([factor]);
      d.totp.consume.mockResolvedValue({ valid: false });
      await expect(d.mfa(true, '123456')).rejects.toMatchObject({
        status: 401,
        response: { details: { reason: 'MFA_INVALID' } },
      });
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: CONCEPTS.SEC_LOGIN_FAILED,
          detailJson: { reason: 'bad-mfa' },
        }),
      );
      expect(d.eventsRepo.countFailedMfaSince).toHaveBeenCalled();
    });

    it('al llegar al umbral de fallos del segundo factor la cuenta se bloquea', async () => {
      const d = build([factor]);
      const user: any = {
        id: 'u1',
        lastLoginAt: undefined,
        statusConceptId: 'ok',
      };
      (d.service as any).usersRepo.findById = mockFn().mockResolvedValue(user);
      (d.service as any).lockoutsRepo = {
        lockForFailedAttempts: mockFn().mockResolvedValue(undefined),
      };
      (d.service as any).sessionsRepo = {
        activeSessionIdsForUser: mockFn().mockResolvedValue(['s1']),
        revokeAllActiveForUser: mockFn().mockResolvedValue(1),
      };
      (d.service as any).refreshRepo = {
        revokeActiveBySessionIds: mockFn().mockResolvedValue(1),
      };
      d.eventsRepo.countFailedMfaSince.mockResolvedValue(
        (d.service as any).authEnv.lockThreshold,
      );
      await expect(d.mfa(true, '123456')).rejects.toMatchObject({
        status: 401,
      });
      expect(user.statusConceptId).toBe(CONCEPTS.USER_LOCKED);
      expect(
        (d.service as any).lockoutsRepo.lockForFailedAttempts,
      ).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          failedAttempts: (d.service as any).authEnv.lockThreshold,
        }),
      );
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: CONCEPTS.SEC_ACCOUNT_LOCK,
          detailJson: expect.objectContaining({ by: 'mfa' }),
        }),
      );
    });

    it('por debajo del umbral no bloquea', async () => {
      const d = build([factor]);
      (d.service as any).lockoutsRepo = { lockForFailedAttempts: mockFn() };
      d.eventsRepo.countFailedMfaSince.mockResolvedValue(1);
      await expect(d.mfa(true, '123456')).rejects.toMatchObject({
        status: 401,
      });
      expect(
        (d.service as any).lockoutsRepo.lockForFailedAttempts,
      ).not.toHaveBeenCalled();
    });
  });
});
