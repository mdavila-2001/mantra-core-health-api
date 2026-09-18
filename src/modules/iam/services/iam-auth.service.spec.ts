import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { IamAuthService } from './iam-auth.service';
import { TracingService } from '../../../observability';
import { CONCEPTS } from '../../../common';

const PASSWORD = 'correct-horse-1';
let PASSWORD_HASH: string;

beforeAll(async () => {
  PASSWORD_HASH = await argon2.hash(PASSWORD);
});

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn(), find: mockFn(() => []) };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => ({})),
  };
  const tokenService = {
    hashRefreshToken: mockFn((raw: string) => `h:${raw}`),
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
  const usersRepo = { findById: mockFn() };
  const credentialsRepo = { findActivePasswordBySubject: mockFn() };
  const sessionsRepo = {
    create: mockFn(),
    findById: mockFn(),
    revokeById: mockFn().mockResolvedValue(1),
    findActiveByTokenId: mockFn().mockResolvedValue(null),
    activeSessionIdsForUser: mockFn().mockResolvedValue([]),
    revokeAllActiveForUser: mockFn().mockResolvedValue(0),
    findByUser: jest.fn(() => Promise.resolve([])),
    purgeExpired: mockFn().mockResolvedValue(0),
  };
  const refreshRepo = {
    create: mockFn(),
    findByHash: mockFn(),
    findByHashForUpdate: mockFn(),
    revokeBySessionId: mockFn().mockResolvedValue(1),
    revokeActiveBySessionIds: mockFn().mockResolvedValue(0),
    purgeExpired: mockFn().mockResolvedValue(0),
  };
  const rolesRepo = { findActiveForUser: mockFn().mockResolvedValue([]) };
  const lockoutsRepo = { create: mockFn(), findActiveForUser: mockFn() };
  const eventsRepo = {
    record: mockFn(),
    countFailedLoginsSince: mockFn().mockResolvedValue(0),
  };
  // Por defecto, una cuenta sin persona vinculada: los claims `pid` y `hpid` se
  // omiten y el token queda igual que antes de que existieran. Los casos que los
  // necesitan sobrescriben estos dobles.
  const accountLinksRepo = {
    findActiveByUser: mockFn().mockResolvedValue(null),
  };
  const patientProfilesRepo = { findById: mockFn().mockResolvedValue(null) };
  const practitionerProfilesRepo = {
    findById: mockFn().mockResolvedValue(null),
  };
  // Sin asignaciones en `authz`: el token queda con los roles de plataforma, que
  // es el caso por defecto de una cuenta que no ejerce ningún rol asistencial.
  const effectiveRoles = { codesForUser: mockFn().mockResolvedValue([]) };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };

  const service = new IamAuthService(
    em as any,
    tokenService as any,
    usersRepo as any,
    credentialsRepo as any,
    sessionsRepo,
    refreshRepo,
    rolesRepo as any,
    lockoutsRepo,
    eventsRepo,
    effectiveRoles as any,
    accountLinksRepo as any,
    patientProfilesRepo as any,
    practitionerProfilesRepo as any,
    logger as any,
    new TracingService(),
  );
  return {
    effectiveRoles,
    service,
    tx,
    tokenService,
    usersRepo,
    credentialsRepo,
    sessionsRepo,
    refreshRepo,
    rolesRepo,
    lockoutsRepo,
    eventsRepo,
    accountLinksRepo,
    patientProfilesRepo,
    practitionerProfilesRepo,
  };
}

describe('IamAuthService', () => {
  describe('login (UC-01-04)', () => {
    it('issues tokens on valid credentials and records success', async () => {
      const d = build();
      d.credentialsRepo.findActivePasswordBySubject.mockResolvedValue({
        userId: 'u1',
        secretHash: PASSWORD_HASH,
      });
      d.usersRepo.findById.mockResolvedValue({
        id: 'u1',
        statusConceptId: CONCEPTS.USER_ACTIVE,
        updatedAt: new Date(),
      });
      d.sessionsRepo.create.mockReturnValue({ id: 's1' });

      const res = await d.service.login(
        { email: 'a@x.io', password: PASSWORD },
        '1.2.3.4',
      );

      expect(res).toEqual({
        accessToken: 'at',
        refreshToken: 'rt',
        expiresAt: new Date('2030-01-01'),
      });
      expect(d.tx.flush).toHaveBeenCalled();
      expect(d.refreshRepo.create).toHaveBeenCalled();
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ eventTypeConceptId: CONCEPTS.SEC_LOGIN }),
      );
    });

    it('carries the business roles of `authz` in the token claim', async () => {
      const d = build();
      d.credentialsRepo.findActivePasswordBySubject.mockResolvedValue({
        userId: 'u1',
        secretHash: PASSWORD_HASH,
      });
      d.usersRepo.findById.mockResolvedValue({
        id: 'u1',
        statusConceptId: CONCEPTS.USER_ACTIVE,
        updatedAt: new Date(),
      });
      d.sessionsRepo.create.mockReturnValue({ id: 's1' });
      // El sujeto tiene el rol global `USER` y, en `authz`, el asistencial.
      d.rolesRepo.findActiveForUser.mockResolvedValue([
        { roleConceptId: CONCEPTS.ROLE_USER },
      ]);
      d.effectiveRoles.codesForUser.mockResolvedValue(['SURGEON']);

      await d.service.login({ email: 'a@x.io', password: PASSWORD }, '1.2.3.4');

      // Sin esto, `@Roles('SURGEON')` es inalcanzable para cualquiera que no
      // sea `SUPERADMIN`, que es justamente lo que este cambio corrige.
      expect(d.tokenService.issueSessionTokens).toHaveBeenCalledWith(
        'u1',
        ['USER', 'SURGEON'],
        expect.anything(),
        expect.anything(),
      );
    });

    it('still issues the token when the business roles cannot be resolved', async () => {
      const d = build();
      d.credentialsRepo.findActivePasswordBySubject.mockResolvedValue({
        userId: 'u1',
        secretHash: PASSWORD_HASH,
      });
      d.usersRepo.findById.mockResolvedValue({
        id: 'u1',
        statusConceptId: CONCEPTS.USER_ACTIVE,
        updatedAt: new Date(),
      });
      d.sessionsRepo.create.mockReturnValue({ id: 's1' });
      d.rolesRepo.findActiveForUser.mockResolvedValue([
        { roleConceptId: CONCEPTS.ROLE_USER },
      ]);
      d.effectiveRoles.codesForUser.mockRejectedValue(new Error('authz down'));

      // Un problema de autorización no debe convertirse en una caída de la
      // autenticación: entra con sus roles de plataforma y recibirá un 403
      // legible al tocar lo clínico.
      await expect(
        d.service.login({ email: 'a@x.io', password: PASSWORD }, '1.2.3.4'),
      ).resolves.toBeDefined();
      expect(d.tokenService.issueSessionTokens).toHaveBeenCalledWith(
        'u1',
        ['USER'],
        expect.anything(),
        expect.anything(),
      );
    });

    it('embeds the patient profile of the account holder as the `pid` claim', async () => {
      const d = build();
      d.credentialsRepo.findActivePasswordBySubject.mockResolvedValue({
        userId: 'u1',
        secretHash: PASSWORD_HASH,
      });
      d.usersRepo.findById.mockResolvedValue({
        id: 'u1',
        statusConceptId: CONCEPTS.USER_ACTIVE,
        updatedAt: new Date(),
      });
      d.sessionsRepo.create.mockReturnValue({ id: 's1' });
      // `patient_profiles.profile_id` ES `persons.id`: el vínculo lleva la persona
      // y el perfil se busca por ese mismo id.
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: 'per-1',
      });
      d.patientProfilesRepo.findById.mockResolvedValue({ profileId: 'per-1' });

      await d.service.login({ email: 'a@x.io', password: PASSWORD });

      expect(d.tokenService.issueSessionTokens).toHaveBeenCalledWith(
        'u1',
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ patientProfileId: 'per-1' }),
      );
    });

    it('omits the patient profile for an account that is not a patient', async () => {
      const d = build();
      d.credentialsRepo.findActivePasswordBySubject.mockResolvedValue({
        userId: 'u1',
        secretHash: PASSWORD_HASH,
      });
      d.usersRepo.findById.mockResolvedValue({
        id: 'u1',
        statusConceptId: CONCEPTS.USER_ACTIVE,
        updatedAt: new Date(),
      });
      d.sessionsRepo.create.mockReturnValue({ id: 's1' });
      // Personal de salud o administración: hay persona vinculada, pero no perfil
      // de paciente. El claim tiene que quedar afuera, no venir vacío.
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: 'per-2',
      });
      d.patientProfilesRepo.findById.mockResolvedValue(null);

      await d.service.login({ email: 'a@x.io', password: PASSWORD });

      expect(d.tokenService.issueSessionTokens).toHaveBeenCalledWith(
        'u1',
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ patientProfileId: undefined }),
      );
    });

    it('embeds the practitioner profile of the account holder as the `hpid` claim', async () => {
      const d = build();
      d.credentialsRepo.findActivePasswordBySubject.mockResolvedValue({
        userId: 'u1',
        secretHash: PASSWORD_HASH,
      });
      d.usersRepo.findById.mockResolvedValue({
        id: 'u1',
        statusConceptId: CONCEPTS.USER_ACTIVE,
        updatedAt: new Date(),
      });
      d.sessionsRepo.create.mockReturnValue({ id: 's1' });
      // Misma cadena que el perfil de paciente sobre la otra tabla:
      // `health_practitioner_profiles.profile_id` ES `persons.id`.
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: 'per-3',
      });
      d.practitionerProfilesRepo.findById.mockResolvedValue({
        profileId: 'per-3',
      });

      await d.service.login({ email: 'a@x.io', password: PASSWORD });

      expect(d.tokenService.issueSessionTokens).toHaveBeenCalledWith(
        'u1',
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ practitionerProfileId: 'per-3' }),
      );
    });

    it('omits the practitioner profile for an account that is not a practitioner', async () => {
      const d = build();
      d.credentialsRepo.findActivePasswordBySubject.mockResolvedValue({
        userId: 'u1',
        secretHash: PASSWORD_HASH,
      });
      d.usersRepo.findById.mockResolvedValue({
        id: 'u1',
        statusConceptId: CONCEPTS.USER_ACTIVE,
        updatedAt: new Date(),
      });
      d.sessionsRepo.create.mockReturnValue({ id: 's1' });
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: 'per-1',
      });
      d.practitionerProfilesRepo.findById.mockResolvedValue(null);

      await d.service.login({ email: 'a@x.io', password: PASSWORD });

      expect(d.tokenService.issueSessionTokens).toHaveBeenCalledWith(
        'u1',
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ practitionerProfileId: undefined }),
      );
    });

    /**
     * Los dos perfiles no se excluyen: nada impide que quien atiende sea además
     * paciente de la institución. Si un claim tapara al otro, el portal de esa
     * persona perdería una de sus dos mitades.
     */
    it('embeds both profiles when the holder is patient and practitioner', async () => {
      const d = build();
      d.credentialsRepo.findActivePasswordBySubject.mockResolvedValue({
        userId: 'u1',
        secretHash: PASSWORD_HASH,
      });
      d.usersRepo.findById.mockResolvedValue({
        id: 'u1',
        statusConceptId: CONCEPTS.USER_ACTIVE,
        updatedAt: new Date(),
      });
      d.sessionsRepo.create.mockReturnValue({ id: 's1' });
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: 'per-4',
      });
      d.patientProfilesRepo.findById.mockResolvedValue({ profileId: 'per-4' });
      d.practitionerProfilesRepo.findById.mockResolvedValue({
        profileId: 'per-4',
      });

      await d.service.login({ email: 'a@x.io', password: PASSWORD });

      expect(d.tokenService.issueSessionTokens).toHaveBeenCalledWith(
        'u1',
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          patientProfileId: 'per-4',
          practitionerProfileId: 'per-4',
        }),
      );
    });

    it('rejects and records a failure when there is no matching credential', async () => {
      const d = build();
      d.credentialsRepo.findActivePasswordBySubject.mockResolvedValue(null);

      await expect(
        d.service.login({ email: 'a@x.io', password: PASSWORD }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: CONCEPTS.SEC_LOGIN_FAILED,
        }),
      );
    });

    it('locks the account when failed attempts reach the threshold (UC-01-07 auto)', async () => {
      const d = build();
      const user = {
        id: 'u1',
        statusConceptId: CONCEPTS.USER_ACTIVE,
        updatedAt: new Date(),
      };
      d.credentialsRepo.findActivePasswordBySubject.mockResolvedValue({
        userId: 'u1',
        secretHash: PASSWORD_HASH,
      });
      d.usersRepo.findById.mockResolvedValue(user);
      d.eventsRepo.countFailedLoginsSince.mockResolvedValue(5);
      d.lockoutsRepo.findActiveForUser.mockResolvedValue(null);
      d.sessionsRepo.activeSessionIdsForUser.mockResolvedValue(['s1']);

      await expect(
        d.service.login({ email: 'a@x.io', password: 'WRONG-pass' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(user.statusConceptId).toBe(CONCEPTS.USER_LOCKED);
      expect(d.lockoutsRepo.create).toHaveBeenCalled();
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: CONCEPTS.SEC_ACCOUNT_LOCK,
        }),
      );
    });
  });

  describe('refresh (UC-01-06)', () => {
    it('rotates the token on a valid active refresh token', async () => {
      const d = build();
      const active = {
        id: 'rt1',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        sessionId: 's1',
        expiresAt: new Date('2030-01-01'),
        updatedAt: new Date(),
      };
      d.refreshRepo.findByHashForUpdate.mockResolvedValue(active);
      d.sessionsRepo.findById.mockResolvedValue({
        id: 's1',
        userId: 'u1',
        tokenId: 'tid',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      });

      const res = await d.service.refresh('raw');

      expect(res).toMatchObject({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });
      expect(active.stateConceptId).toBe(CONCEPTS.STATE_ROTATED);
      expect(d.refreshRepo.create).toHaveBeenCalled();
    });

    // MCH-005: la comprobación de estado tiene que hacerse sobre la fila
    // bloqueada dentro de la transacción. Una lectura previa fuera de ella deja
    // que dos peticiones con el mismo token la superen y emitan dos sucesores.
    it('reads the token under a row lock inside the transaction, never before it', async () => {
      const d = build();
      d.refreshRepo.findByHashForUpdate.mockResolvedValue({
        id: 'rt1',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        sessionId: 's1',
        expiresAt: new Date('2030-01-01'),
      });
      d.sessionsRepo.findById.mockResolvedValue({
        id: 's1',
        userId: 'u1',
        tokenId: 'tid',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      });

      await d.service.refresh('raw');

      expect(d.refreshRepo.findByHashForUpdate).toHaveBeenCalledWith(
        d.tx,
        expect.any(String),
      );
      expect(d.refreshRepo.findByHash).not.toHaveBeenCalled();
    });

    it('issues no successor when the locked row is no longer active (lost race)', async () => {
      const d = build();
      // Primera lectura (si la hubiera) ve ACTIVE; la fila bloqueada ya fue rotada.
      d.refreshRepo.findByHash.mockResolvedValue({
        id: 'rt1',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        sessionId: 's1',
        expiresAt: new Date('2030-01-01'),
      });
      d.refreshRepo.findByHashForUpdate.mockResolvedValue({
        id: 'rt1',
        stateConceptId: CONCEPTS.STATE_ROTATED,
        sessionId: 's1',
        expiresAt: new Date('2030-01-01'),
      });
      d.sessionsRepo.findById.mockResolvedValue({
        id: 's1',
        userId: 'u1',
        tokenId: 'tid',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      });

      await expect(d.service.refresh('raw')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(d.refreshRepo.create).not.toHaveBeenCalled();
      expect(d.refreshRepo.revokeBySessionId).toHaveBeenCalledWith(d.tx, 's1');
    });

    it('rejects an expired token read under the lock without issuing a successor', async () => {
      const d = build();
      d.refreshRepo.findByHashForUpdate.mockResolvedValue({
        id: 'rt1',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        sessionId: 's1',
        expiresAt: new Date('2000-01-01'),
      });

      await expect(d.service.refresh('raw')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(d.refreshRepo.create).not.toHaveBeenCalled();
    });

    it('detects reuse of a non-active token and revokes the session', async () => {
      const d = build();
      d.refreshRepo.findByHashForUpdate.mockResolvedValue({
        id: 'rt1',
        stateConceptId: CONCEPTS.STATE_ROTATED,
        sessionId: 's1',
        expiresAt: new Date('2030-01-01'),
      });

      await expect(d.service.refresh('raw')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(d.refreshRepo.revokeBySessionId).toHaveBeenCalledWith(d.tx, 's1');
      expect(d.sessionsRepo.revokeById).toHaveBeenCalledWith(d.tx, 's1');
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: CONCEPTS.SEC_TOKEN_REUSE,
        }),
      );
    });

    it('rejects an unknown refresh token', async () => {
      const d = build();
      d.refreshRepo.findByHashForUpdate.mockResolvedValue(null);
      await expect(d.service.refresh('raw')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('logoutAll (UC-01-08)', () => {
    it('revokes all active sessions and returns the count', async () => {
      const d = build();
      d.sessionsRepo.activeSessionIdsForUser.mockResolvedValue(['s1', 's2']);
      d.sessionsRepo.revokeAllActiveForUser.mockResolvedValue(2);

      const res = await d.service.logoutAll({ id: 'u1', roles: [] });

      expect(res).toEqual({ revokedSessions: 2 });
      expect(d.refreshRepo.revokeActiveBySessionIds).toHaveBeenCalledWith(
        d.tx,
        ['s1', 's2'],
      );
    });
  });

  describe('logout (sesión actual)', () => {
    it('revoca la sesión del token y su refresh token', async () => {
      const d = build();
      d.sessionsRepo.findActiveByTokenId.mockResolvedValue({
        id: 's1',
        userId: 'u1',
      });

      const res = await d.service.logout({
        id: 'u1',
        sessionId: 'sid-1',
        roles: [],
      });

      expect(res).toEqual({ revoked: true });
      expect(d.sessionsRepo.revokeById).toHaveBeenCalledWith(d.tx, 's1');
      // El refresh token es lo que sobrevive al cierre si no se revoca.
      expect(d.refreshRepo.revokeBySessionId).toHaveBeenCalledWith(d.tx, 's1');
    });

    it('no revoca la sesión de otro usuario aunque nombre su sid', async () => {
      const d = build();
      d.sessionsRepo.findActiveByTokenId.mockResolvedValue({
        id: 's1',
        userId: 'otro',
      });

      const res = await d.service.logout({
        id: 'u1',
        sessionId: 'sid-1',
        roles: [],
      });

      expect(res).toEqual({ revoked: false });
      expect(d.sessionsRepo.revokeById).not.toHaveBeenCalled();
    });

    it('cerrar una sesión ya cerrada no es un error', async () => {
      const d = build();
      d.sessionsRepo.findActiveByTokenId.mockResolvedValue(null);

      const res = await d.service.logout({
        id: 'u1',
        sessionId: 'sid-1',
        roles: [],
      });

      expect(res).toEqual({ revoked: false });
    });

    it('un token sin sid no tiene sesión que revocar', async () => {
      const d = build();

      const res = await d.service.logout({ id: 'u1', roles: [] });

      expect(res).toEqual({ revoked: false });
      expect(d.sessionsRepo.findActiveByTokenId).not.toHaveBeenCalled();
    });
  });

  describe('purgeSessions (UC-01-11)', () => {
    it('expires stale sessions and tokens', async () => {
      const d = build();
      d.sessionsRepo.purgeExpired.mockResolvedValue(3);
      d.refreshRepo.purgeExpired.mockResolvedValue(4);

      const res = await d.service.purgeSessions({
        id: 'admin',
        roles: ['SECURITY_ADMIN'],
      });

      expect(res).toEqual({ expiredSessions: 3, expiredTokens: 4 });
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: CONCEPTS.SEC_SESSION_PURGE,
        }),
      );
    });
  });
});
