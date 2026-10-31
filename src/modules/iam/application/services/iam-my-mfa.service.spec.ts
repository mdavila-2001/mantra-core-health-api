import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../../common';
import { IamMyMfaService } from './iam-my-mfa.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const actor = {
  id: 'u1',
  roles: ['USER', 'SUPPORT_STAFF'],
  scopedRoles: { t1: ['SUPPORT_STAFF'] },
  tenantIds: ['t1'],
} as any;

const factor = (over: Record<string, unknown> = {}): any => ({
  id: 'f1',
  userId: 'u1',
  factorTypeConceptId: CONCEPTS.MFA_TOTP,
  stateConceptId: CONCEPTS.STATE_PENDING,
  label: 'Teléfono',
  secretEncrypted: 'CIFRADO-NO-SALE',
  createdAt: new Date('2026-10-30T10:00:00Z'),
  ...over,
});

function build(factors: any[] = [], requireMfa = true) {
  const tx = {};
  const em = {
    fork: () => tx,
    transactional: mockFn((fn: (t: unknown) => unknown) => fn(tx)),
  };
  const mfaRepo = {
    findByUser: mockFn().mockResolvedValue(factors),
    findByIdAndUser: mockFn((_em: unknown, id: string) =>
      Promise.resolve(factors.find((f) => f.id === id) ?? null),
    ),
    findVerifiedByUser: mockFn(() =>
      Promise.resolve(
        factors.filter((f) => f.stateConceptId === CONCEPTS.STATE_VERIFIED),
      ),
    ),
  };
  const user: any = { id: 'u1', mfaStatusConceptId: CONCEPTS.MFA_ENABLED };
  const usersRepo = { findById: mockFn().mockResolvedValue(user) };
  const eventsRepo = { record: mockFn() };
  const mfa = {
    assertReauthenticated: mockFn().mockResolvedValue(undefined),
    enrollOrVerify: mockFn().mockResolvedValue({
      id: 'f-new',
      userId: 'u1',
      state: CONCEPTS.STATE_PENDING,
      secret: 'SECRETO',
      otpauthUri: 'otpauth://totp/x',
    }),
  };
  const sessionPolicies = {
    rulesFor: mockFn().mockResolvedValue({ requireMfa }),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new IamMyMfaService(
    em as any,
    mfaRepo as any,
    mfa as any,
    sessionPolicies as any,
    logger as any,
    usersRepo as any,
    eventsRepo as any,
  );
  return { service, mfaRepo, mfa, sessionPolicies, user, eventsRepo };
}

describe('IamMyMfaService', () => {
  describe('status', () => {
    it('con la política exigiéndolo y sin factor confirmado, el alta es obligatoria', async () => {
      const d = build([factor()]);
      const res = await d.service.status(actor);
      expect(res).toMatchObject({
        required: true,
        enrolled: false,
        enrollmentRequired: true,
      });
      expect(res.factors).toEqual([
        {
          id: 'f1',
          type: 'TOTP',
          state: 'PENDING',
          label: 'Teléfono',
          verifiedAt: undefined,
          createdAt: new Date('2026-10-30T10:00:00Z'),
        },
      ]);
    });

    it('con un factor confirmado ya no es obligatoria', async () => {
      const d = build([
        factor({
          stateConceptId: CONCEPTS.STATE_VERIFIED,
          verifiedAt: new Date(),
        }),
      ]);
      const res = await d.service.status(actor);
      expect(res).toMatchObject({
        required: true,
        enrolled: true,
        enrollmentRequired: false,
      });
    });

    it('calcula la exigencia con los roles y organizaciones del token', async () => {
      const d = build([], false);
      const res = await d.service.status(actor);
      expect(d.sessionPolicies.rulesFor).toHaveBeenCalledWith(
        expect.anything(),
        ['t1'],
        ['USER', 'SUPPORT_STAFF'],
        { t1: ['SUPPORT_STAFF'] },
      );
      expect(res).toMatchObject({ required: false, enrollmentRequired: false });
    });

    it('N6: con el token de alcance limitado la exigencia consta aunque sus organizaciones no figuren en el token', async () => {
      const d = build([], false);
      const limited = {
        id: 'u1',
        roles: [],
        scopedRoles: {},
        tenantIds: [],
        mfaEnrollment: true,
        deniedTenants: { t1: 'MFA_ENROLLMENT_REQUIRED' },
      } as any;
      const res = await d.service.status(limited);
      // Se consultan también las organizaciones que niegan: ahí está la política.
      expect(d.sessionPolicies.rulesFor).toHaveBeenCalledWith(
        expect.anything(),
        ['t1'],
        [],
        {},
      );
      expect(res).toMatchObject({
        required: true,
        enrolled: false,
        enrollmentRequired: true,
      });
    });

    it('N6: una organización que niega por MFA obliga a darlo de alta aunque haya otra organización viva', async () => {
      const d = build([], false);
      const res = await d.service.status({
        ...actor,
        deniedTenants: { t9: 'MFA_REQUIRED' },
      });
      expect(res.required).toBe(true);
    });

    it('no muestra los factores retirados ni expone jamás el secreto', async () => {
      const d = build([
        factor({ id: 'f0', stateConceptId: CONCEPTS.STATE_REVOKED }),
        factor(),
      ]);
      const res = await d.service.status(actor);
      expect(res.factors.map((f) => f.id)).toEqual(['f1']);
      expect(JSON.stringify(res)).not.toContain('CIFRADO-NO-SALE');
    });
  });

  describe('startTotp', () => {
    it('retira los intentos anteriores sin confirmar y delega el alta en el servicio de MFA, a nombre de la propia cuenta', async () => {
      const pending = factor();
      const verified = factor({
        id: 'f2',
        stateConceptId: CONCEPTS.STATE_VERIFIED,
      });
      const d = build([pending, verified]);
      const res = await d.service.startTotp(actor, {
        label: 'Nuevo',
        currentPassword: 'ClaveActual-1',
      });
      expect(pending.stateConceptId).toBe(CONCEPTS.STATE_REVOKED);
      expect(verified.stateConceptId).toBe(CONCEPTS.STATE_VERIFIED);
      expect(d.mfa.enrollOrVerify).toHaveBeenCalledWith(
        'u1',
        { factorType: 'TOTP', label: 'Nuevo' },
        actor,
        { reauthenticated: true },
      );
      expect(res.secret).toBe('SECRETO');
    });

    it('N6: reautentica ANTES de retirar o crear nada: sin la prueba, el factor pendiente queda como estaba', async () => {
      const pending = factor();
      const d = build([pending]);
      d.mfa.assertReauthenticated.mockRejectedValue(
        Object.assign(new Error('reauth'), { reason: 'MFA_REAUTH_REQUIRED' }),
      );
      await expect(
        d.service.startTotp(actor, { label: 'Nuevo' }, '1.1.1.1'),
      ).rejects.toMatchObject({ reason: 'MFA_REAUTH_REQUIRED' });
      expect(d.mfa.assertReauthenticated).toHaveBeenCalledWith(
        'u1',
        { label: 'Nuevo' },
        '1.1.1.1',
      );
      expect(pending.stateConceptId).toBe(CONCEPTS.STATE_PENDING);
      expect(d.mfa.enrollOrVerify).not.toHaveBeenCalled();
    });
  });

  describe('N6: revokeFactor (quitar un factor)', () => {
    it('exige reautenticación, retira el factor propio y deja el evento', async () => {
      const f1 = factor({ stateConceptId: CONCEPTS.STATE_VERIFIED });
      const f2 = factor({
        id: 'f2',
        stateConceptId: CONCEPTS.STATE_VERIFIED,
      });
      const d = build([f1, f2]);
      const res = await d.service.revokeFactor(
        actor,
        'f1',
        { currentPassword: 'ClaveActual-1' },
        '1.1.1.1',
      );
      expect(d.mfa.assertReauthenticated).toHaveBeenCalledWith(
        'u1',
        { currentPassword: 'ClaveActual-1' },
        '1.1.1.1',
      );
      expect(f1.stateConceptId).toBe(CONCEPTS.STATE_REVOKED);
      expect(f2.stateConceptId).toBe(CONCEPTS.STATE_VERIFIED);
      expect(res).toEqual({ revoked: true, remainingVerified: 1 });
      expect(d.user.mfaStatusConceptId).toBe(CONCEPTS.MFA_ENABLED);
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          eventTypeConceptId: CONCEPTS.SEC_MFA_ENROLL,
          detailJson: { action: 'revoke', factorId: 'f1' },
        }),
      );
    });

    it('al quitar el último factor confirmado el segundo paso de la cuenta queda apagado', async () => {
      const f1 = factor({ stateConceptId: CONCEPTS.STATE_VERIFIED });
      const d = build([f1]);
      const res = await d.service.revokeFactor(actor, 'f1', {
        mfaCode: '123456',
      });
      expect(res.remainingVerified).toBe(0);
      expect(d.user.mfaStatusConceptId).toBe(CONCEPTS.MFA_DISABLED);
    });

    it('sin reautenticar no toca el factor', async () => {
      const f1 = factor({ stateConceptId: CONCEPTS.STATE_VERIFIED });
      const d = build([f1]);
      d.mfa.assertReauthenticated.mockRejectedValue(
        Object.assign(new Error('reauth'), { reason: 'MFA_REAUTH_FAILED' }),
      );
      await expect(
        d.service.revokeFactor(actor, 'f1', { currentPassword: 'mal' }),
      ).rejects.toMatchObject({ reason: 'MFA_REAUTH_FAILED' });
      expect(f1.stateConceptId).toBe(CONCEPTS.STATE_VERIFIED);
    });

    it('un factor ajeno, inexistente o ya retirado es 404 uniforme', async () => {
      const gone = factor({ stateConceptId: CONCEPTS.STATE_REVOKED });
      const d = build([gone]);
      await expect(
        d.service.revokeFactor(actor, 'f1', { currentPassword: 'x' }),
      ).rejects.toMatchObject({ status: 404, reason: 'MFA_FACTOR_NOT_FOUND' });
      await expect(
        d.service.revokeFactor(actor, 'no-existe', { currentPassword: 'x' }),
      ).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('confirmTotp', () => {
    it('verifica el factor propio con el código y responde verificado', async () => {
      const d = build([factor()]);
      const verifiedAt = new Date('2026-10-30T11:00:00Z');
      d.mfa.enrollOrVerify.mockResolvedValue({
        id: 'f1',
        userId: 'u1',
        state: CONCEPTS.STATE_VERIFIED,
        verifiedAt,
      });
      const res = await d.service.confirmTotp(actor, 'f1', { code: '123456' });
      expect(d.mfa.enrollOrVerify).toHaveBeenCalledWith(
        'u1',
        { verify: true, factorId: 'f1', code: '123456' },
        actor,
      );
      expect(res).toEqual({ verified: true, factorId: 'f1', verifiedAt });
    });

    it('un factor reemplazado por uno más reciente no se confirma', async () => {
      const d = build([factor({ stateConceptId: CONCEPTS.STATE_REVOKED })]);
      await expect(
        d.service.confirmTotp(actor, 'f1', { code: '123456' }),
      ).rejects.toMatchObject({ status: 422 });
      expect(d.mfa.enrollOrVerify).not.toHaveBeenCalled();
    });

    it('un código inválido propaga el rechazo del servicio de MFA', async () => {
      const d = build([factor()]);
      d.mfa.enrollOrVerify.mockRejectedValue(
        Object.assign(new Error('Código MFA inválido'), { status: 422 }),
      );
      await expect(
        d.service.confirmTotp(actor, 'f1', { code: '000000' }),
      ).rejects.toThrow('Código MFA inválido');
    });
  });
});
