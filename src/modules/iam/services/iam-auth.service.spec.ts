import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { IamAuthService } from './iam-auth.service';
import { CONCEPTS } from '../../../common';

const PASSWORD = 'correct-horse-1';
let PASSWORD_HASH: string;

beforeAll(async () => {
  PASSWORD_HASH = await argon2.hash(PASSWORD);
});

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
    activeSessionIdsForUser: mockFn().mockResolvedValue([]),
    revokeAllActiveForUser: mockFn().mockResolvedValue(0),
    purgeExpired: mockFn().mockResolvedValue(0),
  };
  const refreshRepo = {
    create: mockFn(),
    findByHash: mockFn(),
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
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

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
    logger as any,
  );
  return {
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
      d.refreshRepo.findByHash.mockResolvedValue(active);
      d.sessionsRepo.findById.mockResolvedValue({
        id: 's1',
        userId: 'u1',
        tokenId: 'tid',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      });

      const res = await d.service.refresh({ refreshToken: 'raw' });

      expect(res).toMatchObject({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });
      expect(active.stateConceptId).toBe(CONCEPTS.STATE_ROTATED);
      expect(d.refreshRepo.create).toHaveBeenCalled();
    });

    it('detects reuse of a non-active token and revokes the session', async () => {
      const d = build();
      d.refreshRepo.findByHash.mockResolvedValue({
        id: 'rt1',
        stateConceptId: CONCEPTS.STATE_ROTATED,
        sessionId: 's1',
        expiresAt: new Date('2030-01-01'),
      });

      await expect(
        d.service.refresh({ refreshToken: 'raw' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
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
      d.refreshRepo.findByHash.mockResolvedValue(null);
      await expect(
        d.service.refresh({ refreshToken: 'raw' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
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
