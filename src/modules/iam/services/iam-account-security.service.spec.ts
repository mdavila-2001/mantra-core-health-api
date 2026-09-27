import { jest } from '@jest/globals';
import * as argon2 from 'argon2';
import { CONCEPTS, ResourceNotFoundException } from '../../../common';
import { IamAccountSecurityService } from './iam-account-security.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/** Construye el servicio con dobles; la transacción ejecuta el callback tal cual. */
async function build() {
  const tx = {};
  const em = {
    fork: () => tx,
    transactional: mockFn((fn: (t: unknown) => unknown) => fn(tx)),
  };
  const credential: any = {
    secretHash: await argon2.hash('ClaveVieja1'),
    hashAlgorithmConceptId: 'x',
  };
  const credentialsRepo = {
    findActivePasswordByUser: mockFn().mockResolvedValue(credential),
  };
  const sessionsRepo = {
    findActiveByUser: mockFn().mockResolvedValue([
      {
        id: 's-actual',
        tokenId: 'sid-actual',
        createdAt: new Date(),
        expiresAt: new Date(),
        ip: '1.1.1.1',
      },
      {
        id: 's-otra',
        tokenId: 'sid-otra',
        createdAt: new Date(),
        expiresAt: new Date(),
      },
    ]),
    revokeByIds: mockFn().mockResolvedValue(1),
    findById: mockFn(),
    revokeById: mockFn().mockResolvedValue(1),
  };
  const refreshRepo = {
    revokeActiveBySessionIds: mockFn().mockResolvedValue(1),
    revokeBySessionId: mockFn().mockResolvedValue(1),
  };
  const eventsRepo = { record: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new IamAccountSecurityService(
    em as any,
    credentialsRepo as any,
    sessionsRepo as any,
    refreshRepo as any,
    eventsRepo as any,
    logger as any,
  );
  return { service, credential, sessionsRepo, refreshRepo, eventsRepo };
}

const actor = { id: 'u1', roles: [], sessionId: 'sid-actual' } as any;

describe('IamAccountSecurityService (ID-24)', () => {
  it('cambia la contraseña y revoca sólo las otras sesiones', async () => {
    const d = await build();
    const result = await d.service.changePassword(actor, {
      currentPassword: 'ClaveVieja1',
      newPassword: 'ClaveNueva99',
    });
    expect(result).toEqual({ revokedSessions: 1 });
    expect(await argon2.verify(d.credential.secretHash, 'ClaveNueva99')).toBe(
      true,
    );
    expect(d.sessionsRepo.revokeByIds).toHaveBeenCalledWith(expect.anything(), [
      's-otra',
    ]);
    expect(d.refreshRepo.revokeActiveBySessionIds).toHaveBeenCalledWith(
      expect.anything(),
      ['s-otra'],
    );
    expect(d.eventsRepo.record).toHaveBeenCalledTimes(1);
  });

  it('con la actual incorrecta responde 422 CURRENT_PASSWORD_INVALID y no toca nada', async () => {
    const d = await build();
    const before = d.credential.secretHash;
    await expect(
      d.service.changePassword(actor, {
        currentPassword: 'mala',
        newPassword: 'ClaveNueva99',
      }),
    ).rejects.toMatchObject({
      details: { reason: 'CURRENT_PASSWORD_INVALID' },
    });
    expect(d.credential.secretHash).toBe(before);
    expect(d.sessionsRepo.revokeByIds).not.toHaveBeenCalled();
  });

  it('rechaza una contraseña nueva igual a la actual', async () => {
    const d = await build();
    await expect(
      d.service.changePassword(actor, {
        currentPassword: 'ClaveVieja1',
        newPassword: 'ClaveVieja1',
      }),
    ).rejects.toMatchObject({ details: { reason: 'PASSWORD_UNCHANGED' } });
  });

  it('lista las sesiones marcando la actual', async () => {
    const d = await build();
    const list = await d.service.listSessions(actor);
    expect(list.map((s) => [s.id, s.current])).toEqual([
      ['s-actual', true],
      ['s-otra', false],
    ]);
  });

  it('revocar una sesión ajena es 404, no 403', async () => {
    const d = await build();
    d.sessionsRepo.findById.mockResolvedValue({
      id: 'x',
      userId: 'otro',
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
    await expect(d.service.revokeSession(actor, 'x')).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
    expect(d.sessionsRepo.revokeById).not.toHaveBeenCalled();
  });

  it('revoca la sesión propia y su refresh token', async () => {
    const d = await build();
    d.sessionsRepo.findById.mockResolvedValue({
      id: 's-otra',
      userId: 'u1',
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
    await expect(d.service.revokeSession(actor, 's-otra')).resolves.toEqual({
      revoked: true,
    });
    expect(d.refreshRepo.revokeBySessionId).toHaveBeenCalledWith(
      expect.anything(),
      's-otra',
    );
  });
});
