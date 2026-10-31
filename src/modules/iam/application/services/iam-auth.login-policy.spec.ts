import { jest } from '@jest/globals';
import * as argon2 from 'argon2';
import { CONCEPTS } from '../../../../common';
import { TracingService } from '../../../../observability';
import { TenantMemberships } from '../../../directory/entities';
import { DirectoryTenantClaimsAdapter } from '../../infrastructure/adapters/directory-tenant-claims.adapter';
import { ProfilesAccountProfileIdsAdapter } from '../../infrastructure/adapters/profiles-account-profile-ids.adapter';
import type { EffectiveSessionRules } from '../../domain/session-policy';
import { IamAuthService } from './iam-auth.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const PASSWORD = 'correct-horse-1';
let PASSWORD_HASH: string;
beforeAll(async () => {
  PASSWORD_HASH = await argon2.hash(PASSWORD);
});

const noRules: EffectiveSessionRules = {
  requireMfa: false,
  allowedHours: [],
  newDeviceAlert: false,
  enforceIpRules: false,
};

/** Reglas de UNA organización sin nada que exigir; se completa por prueba. */
const tenantRules = (over: Record<string, unknown> = {}) => ({
  requireMfa: false,
  allowedHours: [],
  newDeviceAlert: false,
  enforceIpRules: false,
  ...over,
});

/** Una franja de una hora que empieza dentro de dos horas: «ahora» queda fuera. */
function bandOutsideNow() {
  const hhmm = (offsetMin: number) =>
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'America/La_Paz',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(new Date(Date.now() + offsetMin * 60_000));
  return [{ from: hhmm(120), to: hhmm(180) }];
}

/**
 * Servicio con las políticas de sesión, las reglas de red y el reconocimiento de
 * dispositivo en doble. `opts.tenants` son las membresías activas de la persona y
 * `opts.assignments` sus roles de negocio con ámbito.
 */
function build(
  rules: Partial<EffectiveSessionRules> | undefined,
  opts: {
    tenants?: string[];
    assignments?: { code: string; tenantId?: string }[];
    factors?: any[];
  } = {},
) {
  const memberships = (opts.tenants ?? []).map((tenantId) => ({
    tenantId,
    userId: 'u1',
  }));
  const tx = {
    flush: mockFn(),
    find: mockFn((entity: unknown) =>
      entity === TenantMemberships ? memberships : [],
    ),
  };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => tx),
  };
  const tokenService = {
    hashRefreshToken: mockFn((raw: string) => `h:${raw}`),
    isMfaVerifiedRefreshToken: mockFn((raw: string) => raw.startsWith('mfa.')),
    issueSessionTokens: mockFn(() => ({
      accessToken: 'at',
      refreshToken: 'rt',
      refreshTokenHash: 'rth',
      sessionTokenId: 'sid',
      expiresAt: new Date('2030-01-01'),
    })),
    signAccessToken: mockFn(() => 'new-access'),
    issueRefreshToken: mockFn(() => ({ raw: 'new-refresh', hash: 'new-hash' })),
  };
  const usersRepo = {
    findById: mockFn().mockResolvedValue({
      id: 'u1',
      statusConceptId: CONCEPTS.USER_ACTIVE,
      updatedAt: new Date(),
    }),
  };
  const credentialsRepo = {
    findActivePasswordByLoginIdentifier: mockFn().mockResolvedValue({
      userId: 'u1',
      secretHash: PASSWORD_HASH,
    }),
  };
  const sessionsRepo = {
    create: mockFn().mockReturnValue({ id: 's1' }),
    findById: mockFn(),
    revokeById: mockFn().mockResolvedValue(1),
  };
  const refreshRepo = {
    create: mockFn(),
    findByHashForUpdate: mockFn(),
    revokeBySessionId: mockFn().mockResolvedValue(1),
  };
  const eventsRepo = {
    record: mockFn(),
    countFailedMfaSince: mockFn().mockResolvedValue(0),
  };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };
  const mfaRepo = {
    findVerifiedByUser: mockFn().mockResolvedValue(opts.factors ?? []),
  };
  const totp = { consume: mockFn().mockResolvedValue({ valid: true }) };
  const sessionPolicies = {
    rulesFor: mockFn().mockResolvedValue(
      rules === undefined
        ? undefined
        : { ...noRules, tenantIds: opts.tenants, ...rules },
    ),
  };
  const ipRules = { deniedTenantIds: mockFn().mockResolvedValue([]) };
  const deviceRecognition = { recognize: mockFn().mockResolvedValue({}) };
  const service = new IamAuthService(
    em as any,
    tokenService as any,
    usersRepo as any,
    credentialsRepo as any,
    sessionsRepo as any,
    refreshRepo as any,
    { findActiveForUser: mockFn().mockResolvedValue([]) } as any,
    {} as any,
    eventsRepo as any,
    {
      scopedAssignmentsForUser: mockFn().mockResolvedValue(
        opts.assignments ?? [],
      ),
    } as any,
    new ProfilesAccountProfileIdsAdapter(
      { findActiveByUser: mockFn().mockResolvedValue(null) } as any,
      { findById: mockFn().mockResolvedValue(null) } as any,
      { findById: mockFn().mockResolvedValue(null) } as any,
    ),
    new DirectoryTenantClaimsAdapter(),
    logger as any,
    new TracingService(),
    mfaRepo as any,
    sessionPolicies as any,
    undefined,
    ipRules as any,
    deviceRecognition as any,
    totp as any,
  );
  return {
    service,
    tx,
    tokenService,
    sessionsRepo,
    refreshRepo,
    eventsRepo,
    mfaRepo,
    ipRules,
    deviceRecognition,
    sessionPolicies,
    totp,
  };
}

const login = (d: ReturnType<typeof build>, ip = '203.0.113.9') =>
  d.service.login({ email: 'a@x.io', password: PASSWORD }, ip, 'UA/1.0');

describe('IamAuthService: login con política de sesión', () => {
  describe('reglas de red (enforceIpRules)', () => {
    const NET_T1 = {
      enforceIpRules: true,
      ipRuleTenantIds: ['t1'],
      byTenant: { t1: tenantRules({ enforceIpRules: true }) },
    };
    const refreshable = (d: ReturnType<typeof build>) => {
      d.refreshRepo.findByHashForUpdate.mockResolvedValue({
        id: 'rt1',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        sessionId: 's1',
        expiresAt: new Date('2030-01-01'),
        createdAt: new Date(),
      });
      d.sessionsRepo.findById.mockResolvedValue({
        id: 's1',
        userId: 'u1',
        tokenId: 'tid',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      });
    };

    it('fuera de las redes permitidas de su única organización el login es 401 OUTSIDE_ALLOWED_NETWORK y no abre sesión', async () => {
      const d = build(NET_T1, { tenants: ['t1'] });
      d.ipRules.deniedTenantIds.mockResolvedValue(['t1']);

      await expect(login(d)).rejects.toMatchObject({
        status: 401,
        response: { details: { reason: 'OUTSIDE_ALLOWED_NETWORK' } },
      });
      expect(d.sessionsRepo.create).not.toHaveBeenCalled();
      // Queda un evento de seguridad, pero no como contraseña fallida.
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: CONCEPTS.SEC_LOGIN,
          outcomeConceptId: CONCEPTS.OUTCOME_FAILURE,
          detailJson: { reason: 'OUTSIDE_ALLOWED_NETWORK' },
        }),
      );
      expect(d.eventsRepo.record).not.toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: CONCEPTS.SEC_LOGIN_FAILED,
        }),
      );
    });

    it('el origen que se evalúa es el que recibe el servicio (req.ip), con las reglas efectivas', async () => {
      const d = build(NET_T1, { tenants: ['t1'] });
      await login(d, '190.129.1.7');
      expect(d.ipRules.deniedTenantIds).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ ipRuleTenantIds: ['t1'] }),
        '190.129.1.7',
      );
    });

    it('el refresco fuera de la red de su única organización cierra la sesión con el mismo motivo', async () => {
      const d = build(NET_T1, { tenants: ['t1'] });
      d.ipRules.deniedTenantIds.mockResolvedValue(['t1']);
      refreshable(d);

      await expect(
        d.service.refresh('raw', '198.51.100.4'),
      ).rejects.toMatchObject({
        status: 401,
        response: { details: { reason: 'OUTSIDE_ALLOWED_NETWORK' } },
      });
      expect(d.ipRules.deniedTenantIds).toHaveBeenCalledWith(
        d.tx,
        expect.anything(),
        '198.51.100.4',
      );
      expect(d.sessionsRepo.revokeById).toHaveBeenCalledWith(d.tx, 's1');
      expect(d.refreshRepo.revokeBySessionId).toHaveBeenCalledWith(d.tx, 's1');
    });

    it('N2: si la red de X niega pero la persona tiene otra organización, el login entra SIN X y declara el motivo', async () => {
      const d = build(
        {
          enforceIpRules: true,
          ipRuleTenantIds: ['x'],
          byTenant: { x: tenantRules({ enforceIpRules: true }) },
        },
        {
          tenants: ['x', 'y'],
          assignments: [
            { code: 'NURSE', tenantId: 'x' },
            { code: 'DOCTOR', tenantId: 'y' },
          ],
        },
      );
      d.ipRules.deniedTenantIds.mockResolvedValue(['x']);

      const res = await login(d);

      const [, roles, tenants, display] =
        d.tokenService.issueSessionTokens.mock.calls[0];
      expect(tenants).toEqual(['y']);
      expect(display.scopedRoles).toEqual({ y: ['DOCTOR'] });
      // El rol que solo regía en X sale de `roles`: si se quedara, sin ámbito
      // pasaría a valer en todas las organizaciones.
      expect(roles).toContain('DOCTOR');
      expect(roles).not.toContain('NURSE');
      expect(display.deniedTenants).toEqual({ x: 'OUTSIDE_ALLOWED_NETWORK' });
      expect(res.deniedTenants).toEqual([
        { tenantId: 'x', reason: 'OUTSIDE_ALLOWED_NETWORK' },
      ]);
      expect(d.sessionsRepo.create).toHaveBeenCalled();
    });

    it('N2: si todas las organizaciones niegan, el login se rechaza como siempre', async () => {
      const d = build(
        {
          enforceIpRules: true,
          ipRuleTenantIds: ['x', 'y'],
          byTenant: {
            x: tenantRules({ enforceIpRules: true }),
            y: tenantRules({ enforceIpRules: true }),
          },
        },
        { tenants: ['x', 'y'] },
      );
      d.ipRules.deniedTenantIds.mockResolvedValue(['x', 'y']);
      await expect(login(d)).rejects.toMatchObject({
        status: 401,
        response: { details: { reason: 'OUTSIDE_ALLOWED_NETWORK' } },
      });
    });

    it('N2: en el refresco, la red de X no revoca la sesión de quien tiene otra organización: X sale del token', async () => {
      const d = build(
        {
          enforceIpRules: true,
          ipRuleTenantIds: ['x'],
          byTenant: { x: tenantRules({ enforceIpRules: true }) },
        },
        { tenants: ['x', 'y'] },
      );
      d.ipRules.deniedTenantIds.mockResolvedValue(['x']);
      refreshable(d);

      await expect(
        d.service.refresh('raw', '198.51.100.4'),
      ).resolves.toMatchObject({ accessToken: 'new-access' });
      expect(d.sessionsRepo.revokeById).not.toHaveBeenCalled();
      const [, , , tenants, display] =
        d.tokenService.signAccessToken.mock.calls[0];
      expect(tenants).toEqual(['y']);
      expect(display.deniedTenants).toEqual({ x: 'OUTSIDE_ALLOWED_NETWORK' });
    });
  });

  describe('N2: franja horaria por organización', () => {
    it('X fuera de su franja: el login entra a las demás organizaciones y X queda en deniedTenants', async () => {
      const d = build(
        {
          byTenant: {
            x: tenantRules({ allowedHours: bandOutsideNow() }),
            y: tenantRules(),
          },
        },
        { tenants: ['x', 'y'] },
      );
      const res = await login(d);
      const [, , tenants, display] =
        d.tokenService.issueSessionTokens.mock.calls[0];
      expect(tenants).toEqual(['y']);
      expect(display.deniedTenants).toEqual({ x: 'OUTSIDE_ALLOWED_HOURS' });
      expect(res.deniedTenants).toEqual([
        { tenantId: 'x', reason: 'OUTSIDE_ALLOWED_HOURS' },
      ]);
    });

    it('quien solo pertenece a X sigue sin poder entrar fuera de la franja (401)', async () => {
      const d = build(
        { byTenant: { x: tenantRules({ allowedHours: bandOutsideNow() }) } },
        { tenants: ['x'] },
      );
      await expect(login(d)).rejects.toMatchObject({
        status: 401,
        response: { details: { reason: 'OUTSIDE_ALLOWED_HOURS' } },
      });
      expect(d.sessionsRepo.create).not.toHaveBeenCalled();
    });

    it('la franja vacía (from == to) de una organización AJENA a la que no entra no cierra a nadie el resto', async () => {
      const d = build(
        {
          byTenant: {
            x: tenantRules({ allowedHours: [{ from: '08:00', to: '08:00' }] }),
            y: tenantRules(),
          },
        },
        { tenants: ['x', 'y'] },
      );
      await expect(login(d)).resolves.toMatchObject({ accessToken: 'at' });
    });

    it('el refresco con X fuera de franja y otra organización no revoca la sesión', async () => {
      const d = build(
        { byTenant: { x: tenantRules({ allowedHours: bandOutsideNow() }) } },
        { tenants: ['x', 'y'] },
      );
      d.refreshRepo.findByHashForUpdate.mockResolvedValue({
        id: 'rt1',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        sessionId: 's1',
        expiresAt: new Date('2030-01-01'),
        createdAt: new Date(),
      });
      d.sessionsRepo.findById.mockResolvedValue({
        id: 's1',
        userId: 'u1',
        tokenId: 'tid',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      });
      const res = await d.service.refresh('raw');
      expect(res.deniedTenants).toEqual([
        { tenantId: 'x', reason: 'OUTSIDE_ALLOWED_HOURS' },
      ]);
      expect(d.sessionsRepo.revokeById).not.toHaveBeenCalled();
    });
  });

  describe('claim idleTimeoutMinutes', () => {
    it('el login lo emite con el menor plazo de las políticas aplicables', async () => {
      const d = build({ idleTimeoutMinutes: 10 });
      await login(d);
      expect(d.tokenService.issueSessionTokens).toHaveBeenCalledWith(
        'u1',
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ idleTimeoutMinutes: 10 }),
      );
    });

    it('lo acota a 5-480 minutos', async () => {
      const d = build({ idleTimeoutMinutes: 1440 });
      await login(d);
      expect(d.tokenService.issueSessionTokens.mock.calls[0][3]).toMatchObject({
        idleTimeoutMinutes: 480,
      });
    });

    it('sin política aplicable no hay claim', async () => {
      const d = build(undefined);
      await login(d);
      expect(
        d.tokenService.issueSessionTokens.mock.calls[0][3].idleTimeoutMinutes,
      ).toBeUndefined();
    });

    it('el refresco también lo emite', async () => {
      const d = build({ idleTimeoutMinutes: 30 });
      d.refreshRepo.findByHashForUpdate.mockResolvedValue({
        id: 'rt1',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        sessionId: 's1',
        expiresAt: new Date('2030-01-01'),
        createdAt: new Date(),
      });
      d.sessionsRepo.findById.mockResolvedValue({
        id: 's1',
        userId: 'u1',
        tokenId: 'tid',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      });
      await d.service.refresh('raw', '203.0.113.9');
      expect(d.tokenService.signAccessToken.mock.calls[0][4]).toMatchObject({
        idleTimeoutMinutes: 30,
      });
    });

    it('un refresco normal NO cierra a quien estuvo activo aunque el plazo sea menor que la vida del token', async () => {
      // 10 min de inactividad con un access token de 15: refrescar 14 minutos
      // después del último refresco es lo normal de quien trabaja sin parar.
      const d = build(
        {
          idleTimeoutMinutes: 10,
          byTenant: { t1: tenantRules({ idleTimeoutMinutes: 10 }) },
        },
        { tenants: ['t1'] },
      );
      d.refreshRepo.findByHashForUpdate.mockResolvedValue({
        id: 'rt1',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        sessionId: 's1',
        expiresAt: new Date('2030-01-01'),
        createdAt: new Date(Date.now() - 14 * 60_000),
      });
      d.sessionsRepo.findById.mockResolvedValue({
        id: 's1',
        userId: 'u1',
        tokenId: 'tid',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      });
      await expect(d.service.refresh('raw')).resolves.toMatchObject({
        accessToken: 'new-access',
      });
    });

    it('y sí cierra a quien dejó vencer el token más del plazo sin pedir otro', async () => {
      const d = build(
        {
          idleTimeoutMinutes: 10,
          byTenant: { t1: tenantRules({ idleTimeoutMinutes: 10 }) },
        },
        { tenants: ['t1'] },
      );
      d.refreshRepo.findByHashForUpdate.mockResolvedValue({
        id: 'rt1',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        sessionId: 's1',
        expiresAt: new Date('2030-01-01'),
        // 15 min de token + 10 de plazo = 25: a los 40 minutos ya no.
        createdAt: new Date(Date.now() - 40 * 60_000),
      });
      d.sessionsRepo.findById.mockResolvedValue({
        id: 's1',
        userId: 'u1',
        tokenId: 'tid',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      });
      await expect(d.service.refresh('raw')).rejects.toMatchObject({
        status: 401,
        response: { details: { reason: 'IDLE_TIMEOUT' } },
      });
    });
  });

  describe('dispositivo nuevo', () => {
    it('reconoce el dispositivo antes de abrir la sesión, la asocia a él y devuelve el aviso', async () => {
      const d = build({ newDeviceAlert: true });
      const notice = {
        deviceId: 'dev-1',
        label: 'Chrome en Windows',
        ip: '203.0.113.9',
        occurredAt: new Date('2026-10-30T12:00:00Z'),
      };
      d.deviceRecognition.recognize.mockResolvedValue({
        deviceId: 'dev-1',
        notice,
      });

      const res = await login(d);

      expect(d.deviceRecognition.recognize).toHaveBeenCalledWith(
        'u1',
        'UA/1.0',
        '203.0.113.9',
        expect.objectContaining({ newDeviceAlert: true }),
      );
      expect(d.sessionsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ deviceId: 'dev-1' }),
      );
      expect(res.newDevice).toEqual(notice);
    });

    it('sin aviso la respuesta no trae newDevice', async () => {
      const d = build({ newDeviceAlert: true });
      d.deviceRecognition.recognize.mockResolvedValue({ deviceId: 'dev-1' });
      const res = await login(d);
      expect(res).not.toHaveProperty('newDevice');
    });
  });

  describe('alta del segundo paso (N6)', () => {
    const MFA_X = {
      requireMfa: true,
      byTenant: { x: tenantRules({ requireMfa: true }) },
    };
    const FACTOR = { id: 'f1', secretEncrypted: 'enc', verifiedAt: new Date() };

    it('con requireMfa y sin factor confirmado, quien solo pertenece a esa organización recibe un token de alcance LIMITADO', async () => {
      const d = build(MFA_X, { tenants: ['x'] });
      const res = await login(d);
      expect(res.mfaEnrollmentRequired).toBe(true);
      const [, roles, tenants, display] =
        d.tokenService.issueSessionTokens.mock.calls[0];
      expect(display.mfaEnrollment).toBe(true);
      // Sin roles ni organizaciones: aunque una ruta se saltara el guard, el
      // token no autoriza nada.
      expect(roles).toEqual([]);
      expect(tenants).toEqual([]);
      expect(display.deniedTenants).toEqual({ x: 'MFA_ENROLLMENT_REQUIRED' });
    });

    it('si tiene otra organización sin esa exigencia, entra completa a ella y X queda negada hasta dar de alta el factor', async () => {
      const d = build(MFA_X, { tenants: ['x', 'y'] });
      const res = await login(d);
      const [, , tenants, display] =
        d.tokenService.issueSessionTokens.mock.calls[0];
      expect(display.mfaEnrollment).toBe(false);
      expect(tenants).toEqual(['y']);
      expect(display.deniedTenants).toEqual({ x: 'MFA_ENROLLMENT_REQUIRED' });
      expect(res.mfaEnrollmentRequired).toBe(true);
    });

    it('sin requireMfa no hay marca ni limitación', async () => {
      const d = build({ requireMfa: false }, { tenants: ['x'] });
      const res = await login(d);
      expect(res).not.toHaveProperty('mfaEnrollmentRequired');
      expect(d.mfaRepo.findVerifiedByUser).not.toHaveBeenCalled();
      expect(
        d.tokenService.issueSessionTokens.mock.calls[0][3].mfaEnrollment,
      ).toBe(false);
    });

    it('con factor y SIN código, quien solo pertenece a X sigue recibiendo 401 MFA_REQUIRED', async () => {
      const d = build(MFA_X, { tenants: ['x'], factors: [FACTOR] });
      await expect(login(d)).rejects.toMatchObject({
        status: 401,
        response: { details: { reason: 'MFA_REQUIRED' } },
      });
    });

    it('con factor y sin código, quien tiene otra organización entra SIN X (MFA_REQUIRED) y la sesión no queda marcada como verificada', async () => {
      const d = build(MFA_X, { tenants: ['x', 'y'], factors: [FACTOR] });
      const res = await login(d);
      const call = d.tokenService.issueSessionTokens.mock.calls[0];
      expect(call[2]).toEqual(['y']);
      expect(call[3].deniedTenants).toEqual({ x: 'MFA_REQUIRED' });
      expect(call[4]).toBeUndefined();
      expect(res).not.toHaveProperty('mfaEnrollmentRequired');
    });

    it('con el código correcto entra con X y el refresh token queda marcado como verificado', async () => {
      const d = build(MFA_X, { tenants: ['x', 'y'], factors: [FACTOR] });
      await d.service.login(
        { email: 'a@x.io', password: PASSWORD, mfaCode: '123456' },
        '203.0.113.9',
        'UA/1.0',
      );
      const call = d.tokenService.issueSessionTokens.mock.calls[0];
      expect(call[2]).toEqual(['x', 'y']);
      expect(call[4]).toBe(true);
      expect(d.totp.consume).toHaveBeenCalledWith('u1', [FACTOR], '123456');
    });

    it('un código inválido (o ya usado) es 401 MFA_INVALID y cuenta como intento fallido, aunque haya otras organizaciones', async () => {
      const d = build(MFA_X, { tenants: ['x', 'y'], factors: [FACTOR] });
      d.totp.consume.mockResolvedValue({ valid: false });
      await expect(
        d.service.login(
          { email: 'a@x.io', password: PASSWORD, mfaCode: '000000' },
          '203.0.113.9',
          'UA/1.0',
        ),
      ).rejects.toMatchObject({
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
      expect(d.sessionsRepo.create).not.toHaveBeenCalled();
    });

    describe('el refresco conserva el alcance', () => {
      const session = (d: ReturnType<typeof build>, createdAt = new Date()) => {
        d.refreshRepo.findByHashForUpdate.mockResolvedValue({
          id: 'rt1',
          stateConceptId: CONCEPTS.STATE_ACTIVE,
          sessionId: 's1',
          expiresAt: new Date('2030-01-01'),
          createdAt: new Date(),
        });
        d.sessionsRepo.findById.mockResolvedValue({
          id: 's1',
          userId: 'u1',
          tokenId: 'tid',
          stateConceptId: CONCEPTS.STATE_ACTIVE,
          createdAt,
        });
      };

      it('sin factor sigue limitado (mfaEnrollment) y NO reemite lo completo', async () => {
        const d = build(MFA_X, { tenants: ['x'] });
        session(d);
        const res = await d.service.refresh('raw');
        const [, , roles, tenants, display] =
          d.tokenService.signAccessToken.mock.calls[0];
        expect(display.mfaEnrollment).toBe(true);
        expect(roles).toEqual([]);
        expect(tenants).toEqual([]);
        expect(res.mfaEnrollmentRequired).toBe(true);
        expect(d.sessionsRepo.revokeById).not.toHaveBeenCalled();
      });

      it('al confirmar un factor DENTRO de la sesión, el refresco reemite el token completo', async () => {
        const created = new Date(Date.now() - 60_000);
        const d = build(MFA_X, {
          tenants: ['x'],
          factors: [{ ...FACTOR, verifiedAt: new Date() }],
        });
        session(d, created);
        await d.service.refresh('raw');
        const [, , , tenants, display] =
          d.tokenService.signAccessToken.mock.calls[0];
        expect(tenants).toEqual(['x']);
        expect(display.mfaEnrollment).toBe(false);
        // Y el siguiente refresh token ya lleva la marca de sesión verificada.
        expect(d.tokenService.issueRefreshToken).toHaveBeenCalledWith(true);
      });

      it('una sesión sin código al entrar NO recupera X por refrescar (MFA_REQUIRED)', async () => {
        const d = build(MFA_X, {
          tenants: ['x', 'y'],
          factors: [
            { ...FACTOR, verifiedAt: new Date(Date.now() - 86_400_000) },
          ],
        });
        session(d, new Date());
        const res = await d.service.refresh('raw');
        const [, , , tenants, display] =
          d.tokenService.signAccessToken.mock.calls[0];
        expect(tenants).toEqual(['y']);
        expect(display.deniedTenants).toEqual({ x: 'MFA_REQUIRED' });
        expect(res.deniedTenants).toEqual([
          { tenantId: 'x', reason: 'MFA_REQUIRED' },
        ]);
      });

      it('con la marca de sesión verificada en el refresh token, X se conserva', async () => {
        const d = build(MFA_X, { tenants: ['x', 'y'], factors: [FACTOR] });
        session(d);
        await d.service.refresh('mfa.abc');
        const [, , , tenants] = d.tokenService.signAccessToken.mock.calls[0];
        expect(tenants).toEqual(['x', 'y']);
        expect(d.tokenService.issueRefreshToken).toHaveBeenCalledWith(true);
      });
    });
  });
});
