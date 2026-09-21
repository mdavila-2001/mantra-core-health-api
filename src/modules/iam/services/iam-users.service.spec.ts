import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IamUsersService } from './iam-users.service';
import {
  CONCEPTS,
  ConflictException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] };

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const usersRepo = { findById: mockFn(), create: mockFn() };
  const credentialsRepo = {
    findActivePasswordBySubject: mockFn(),
    createPassword: mockFn(),
    revokeAllForUser: mockFn().mockResolvedValue(0),
  };
  const rolesRepo = {
    create: mockFn(),
    findActive: mockFn(),
    revokeAllForUser: mockFn().mockResolvedValue(0),
  };
  const sessionsRepo = {
    activeSessionIdsForUser: mockFn().mockResolvedValue([]),
    revokeAllActiveForUser: mockFn().mockResolvedValue(0),
  };
  const refreshRepo = {
    revokeActiveBySessionIds: mockFn().mockResolvedValue(0),
  };
  const lockoutsRepo = { create: mockFn() };
  const eventsRepo = { record: mockFn() };
  const contactPointsRepo = { create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new IamUsersService(
    em as any,
    usersRepo as any,
    credentialsRepo as any,
    rolesRepo as any,
    sessionsRepo as any,
    refreshRepo as any,
    lockoutsRepo as any,
    eventsRepo as any,
    contactPointsRepo as any,
    logger as any,
  );
  return {
    contactPointsRepo,
    service,
    tx,
    em,
    usersRepo,
    credentialsRepo,
    rolesRepo,
    sessionsRepo,
    refreshRepo,
    lockoutsRepo,
    eventsRepo,
  };
}

describe('IamUsersService', () => {
  describe('createUser (UC-01-01)', () => {
    it('creates user, flushes parent before children and records the grant', async () => {
      const d = build();
      d.credentialsRepo.findActivePasswordBySubject.mockResolvedValue(null);
      const created = {
        id: 'u1',
        displayName: 'Ada',
        statusConceptId: CONCEPTS.USER_ACTIVE,
        createdAt: new Date('2026-01-01'),
      };
      d.usersRepo.create.mockReturnValue(created);

      const res = await d.service.createUser(
        { displayName: 'Ada', email: 'ada@x.io', password: 'password123' },
        actor,
      );

      expect(res).toEqual({
        id: 'u1',
        displayName: 'Ada',
        status: CONCEPTS.USER_ACTIVE,
        createdAt: created.createdAt,
      });
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
      expect(d.credentialsRepo.createPassword).toHaveBeenCalled();
      expect(d.rolesRepo.create).toHaveBeenCalled();
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: CONCEPTS.SEC_ROLE_GRANT,
        }),
      );
    });

    it('rejects when the email already has an active password credential', async () => {
      const d = build();
      d.credentialsRepo.findActivePasswordBySubject.mockResolvedValue({
        id: 'c1',
      });

      await expect(
        d.service.createUser(
          { displayName: 'Ada', email: 'ada@x.io', password: 'password123' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.usersRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('lock (UC-01-07)', () => {
    it('throws when the user does not exist', async () => {
      const d = build();
      d.usersRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.lock('missing', {}, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('locks the user and revokes sessions', async () => {
      const d = build();
      const user = {
        id: 'u1',
        statusConceptId: CONCEPTS.USER_ACTIVE,
        updatedAt: new Date(),
      };
      d.usersRepo.findById.mockResolvedValue(user);
      d.sessionsRepo.activeSessionIdsForUser.mockResolvedValue(['s1']);

      const res = await d.service.lock('u1', { reason: 'abuse' }, actor);

      expect(res).toEqual({ ok: true });
      expect(user.statusConceptId).toBe(CONCEPTS.USER_LOCKED);
      expect(d.lockoutsRepo.create).toHaveBeenCalled();
      expect(d.sessionsRepo.revokeAllActiveForUser).toHaveBeenCalledWith(
        d.tx,
        'u1',
      );
      expect(d.refreshRepo.revokeActiveBySessionIds).toHaveBeenCalledWith(
        d.tx,
        ['s1'],
      );
    });
  });

  describe('changeGlobalRole (UC-01-10)', () => {
    it('rejects granting a role that is already active (conflict)', async () => {
      const d = build();
      d.usersRepo.findById.mockResolvedValue({ id: 'u1' });
      d.rolesRepo.findActive.mockResolvedValue({ id: 'r1' });

      await expect(
        d.service.changeGlobalRole(
          'u1',
          { role: 'SECURITY_ADMIN', action: 'GRANT' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects revoking a role the user does not hold (not found)', async () => {
      const d = build();
      d.usersRepo.findById.mockResolvedValue({ id: 'u1' });
      d.rolesRepo.findActive.mockResolvedValue(null);

      await expect(
        d.service.changeGlobalRole(
          'u1',
          { role: 'SECURITY_ADMIN', action: 'REVOKE' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    // MCH-004: el rol viaja firmado en el access token. Retirarlo sin cortar las
    // sesiones dejaba el permiso usable hasta que el token expirara.
    it('revoking a role ends the user sessions so the signed role stops working', async () => {
      const d = build();
      d.usersRepo.findById.mockResolvedValue({ id: 'u1' });
      d.rolesRepo.findActive.mockResolvedValue({ id: 'r1' });
      d.sessionsRepo.activeSessionIdsForUser.mockResolvedValue(['s1']);

      await d.service.changeGlobalRole(
        'u1',
        { role: 'SECURITY_ADMIN', action: 'REVOKE' },
        actor as any,
      );

      expect(d.sessionsRepo.revokeAllActiveForUser).toHaveBeenCalledWith(
        d.tx,
        'u1',
      );
      expect(d.refreshRepo.revokeActiveBySessionIds).toHaveBeenCalledWith(
        d.tx,
        ['s1'],
      );
    });

    it('granting a role does not end sessions', async () => {
      const d = build();
      d.usersRepo.findById.mockResolvedValue({ id: 'u1' });
      d.rolesRepo.findActive.mockResolvedValue(null);

      await d.service.changeGlobalRole(
        'u1',
        { role: 'SECURITY_ADMIN', action: 'GRANT' },
        actor as any,
      );

      expect(d.sessionsRepo.revokeAllActiveForUser).not.toHaveBeenCalled();
    });
  });

  describe('anonymize (UC-01-12)', () => {
    it('anonymizes the user and revokes credentials, sessions and roles', async () => {
      const d = build();
      const user = {
        id: 'u1',
        displayName: 'Ada',
        statusConceptId: CONCEPTS.USER_ACTIVE,
        updatedAt: new Date(),
      };
      d.usersRepo.findById.mockResolvedValue(user);

      const res = await d.service.anonymize('u1', actor);

      expect(res).toEqual({ ok: true });
      expect(user.statusConceptId).toBe(CONCEPTS.USER_ANONYMIZED);
      expect(user.displayName).toBe('ANONYMIZED');
      expect(d.credentialsRepo.revokeAllForUser).toHaveBeenCalledWith(
        d.tx,
        'u1',
      );
      expect(d.rolesRepo.revokeAllForUser).toHaveBeenCalledWith(d.tx, 'u1');
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ eventTypeConceptId: CONCEPTS.SEC_ANONYMIZE }),
      );
    });
  });
});
