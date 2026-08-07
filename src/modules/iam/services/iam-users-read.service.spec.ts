import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { IamUsersReadService } from './iam-users-read.service';
import { ResourceNotFoundException } from '../../../common';

const USER = 'u1';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const em: any = {};
  em.fork = mockFn(() => em);
  const usersRepo = {
    findById: mockFn(() => Promise.resolve({ id: USER })),
    searchPage: mockFn(() => Promise.resolve([])),
  };
  const credentialsRepo = {
    findByUser: mockFn(() => Promise.resolve([])),
    findBySubjectMatch: mockFn(() => Promise.resolve([])),
  };
  const devicesRepo = { findByUser: mockFn(() => Promise.resolve([])) };
  const mfaRepo = { findByUser: mockFn(() => Promise.resolve([])) };
  const sessionsRepo = { findByUser: mockFn(() => Promise.resolve([])) };
  const rolesRepo = { findByUser: mockFn(() => Promise.resolve([])) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new IamUsersReadService(
    em,
    usersRepo as any,
    credentialsRepo as any,
    devicesRepo as any,
    mfaRepo as any,
    sessionsRepo as any,
    rolesRepo as any,
    logger as any,
  );
  return {
    service,
    usersRepo,
    credentialsRepo,
    devicesRepo,
    mfaRepo,
    sessionsRepo,
    rolesRepo,
  };
}

/** Fila de usuario con los campos que el listado publica. */
const userRow = (id: string, displayName: string) => ({
  id,
  displayName,
  statusConceptId: 'status-active',
  mfaStatusConceptId: 'mfa-disabled',
  emailVerified: true,
  phoneVerified: false,
  lastLoginAt: undefined,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-02T00:00:00Z'),
  timeZone: 'America/La_Paz',
  privacyAcceptedAt: undefined,
  anonymizedAt: undefined,
  mustChangePassword: undefined,
});

describe('IamUsersReadService.searchUsers', () => {
  it('busca el texto también contra el sujeto de las credenciales', async () => {
    // Quien administra cuentas busca por correo, y el correo no está en `iam.users`.
    const d = build();
    d.credentialsRepo.findBySubjectMatch.mockResolvedValue([
      { userId: 'u7' },
      { userId: 'u9' },
    ]);

    await d.service.searchUsers({ query: 'ana@', limit: 50 });

    expect(d.credentialsRepo.findBySubjectMatch).toHaveBeenCalledWith(
      expect.anything(),
      'ana@',
      1000,
    );
    expect(d.usersRepo.searchPage).toHaveBeenCalledWith(
      expect.anything(),
      {
        query: 'ana@',
        statusConceptId: undefined,
        ids: ['u7', 'u9'],
        after: undefined,
      },
      51,
    );
  });

  it('no toca las credenciales cuando no hay texto que buscar', async () => {
    const d = build();

    await d.service.searchUsers({ limit: 50 });

    expect(d.credentialsRepo.findBySubjectMatch).not.toHaveBeenCalled();
  });

  it('pide una fila de más y la recorta para saber si hay página siguiente', async () => {
    const d = build();
    d.usersRepo.searchPage.mockResolvedValue([
      userRow('u1', 'Ana'),
      userRow('u2', 'Beto'),
      userRow('u3', 'Cora'),
    ]);

    const result = await d.service.searchUsers({ limit: 2 });

    expect(result.count).toBe(2);
    expect(result.items.map((item: any) => item.id)).toEqual(['u1', 'u2']);
    expect(result.nextCursor).toEqual(expect.any(String));
  });

  it('continúa desde el cursor, desempatando por identificador', async () => {
    const d = build();
    d.usersRepo.searchPage.mockResolvedValue([
      userRow('u1', 'Ana'),
      userRow('u2', 'Ana'),
    ]);
    const primera = await d.service.searchUsers({ limit: 1 });

    d.usersRepo.searchPage.mockClear();
    d.usersRepo.searchPage.mockResolvedValue([]);
    await d.service.searchUsers({ cursor: primera.nextCursor!, limit: 1 });

    expect(d.usersRepo.searchPage).toHaveBeenCalledWith(
      expect.anything(),
      {
        query: undefined,
        statusConceptId: undefined,
        ids: undefined,
        after: { displayName: 'Ana', id: 'u1' },
      },
      2,
    );
  });

  it('normaliza a `false` los verificados sin valor', async () => {
    const d = build();
    d.usersRepo.searchPage.mockResolvedValue([
      { ...userRow('u1', 'Ana'), emailVerified: undefined },
    ]);

    const result = await d.service.searchUsers({ limit: 50 });

    expect(result.items[0].emailVerified).toBe(false);
  });
});

describe('IamUsersReadService.getUserById', () => {
  it('devuelve la ficha sin material secreto', async () => {
    const d = build();
    d.usersRepo.findById.mockResolvedValue(userRow(USER, 'Ana'));

    const result = await d.service.getUserById(USER);

    expect(result).toMatchObject({
      id: USER,
      displayName: 'Ana',
      timeZone: 'America/La_Paz',
      mustChangePassword: false,
      anonymizedAt: null,
    });
    expect(Object.keys(result)).not.toContain('secretHash');
  });

  it('falla cuando el usuario no existe', async () => {
    const d = build();
    d.usersRepo.findById.mockResolvedValue(null);

    await expect(d.service.getUserById(USER)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });
});

describe('IamUsersReadService — sub-colecciones', () => {
  it('no publica el hash ni la clave pública de las credenciales', async () => {
    const d = build();
    d.credentialsRepo.findByUser.mockResolvedValue([
      {
        id: 'c1',
        methodConceptId: 'm1',
        externalSubject: 'ana@x.io',
        secretHash: '$argon2id$secreto',
        publicKey: 'clave-publica',
        stateConceptId: 's1',
        createdAt: new Date(),
      },
    ]);

    const result = await d.service.listCredentials(USER);

    expect(result.items[0]).toEqual({
      id: 'c1',
      methodConceptId: 'm1',
      externalSubject: 'ana@x.io',
      identityProvider: undefined,
      stateConceptId: 's1',
      lastUsedAt: null,
      expiresAt: null,
      createdAt: expect.any(Date),
    });
  });

  it('publica que hay token de push, no el token', async () => {
    const d = build();
    d.devicesRepo.findByUser.mockResolvedValue([
      {
        id: 'd1',
        deviceFingerprint: 'fp',
        pushTokenEncrypted: 'token-cifrado',
        createdAt: new Date(),
      },
    ]);

    const result = await d.service.listDevices(USER);

    expect(result.items[0].hasPushToken).toBe(true);
    expect(JSON.stringify(result)).not.toContain('token-cifrado');
  });

  it('no publica el secreto del factor de MFA', async () => {
    const d = build();
    d.mfaRepo.findByUser.mockResolvedValue([
      {
        id: 'f1',
        factorTypeConceptId: 'totp',
        stateConceptId: 's1',
        secretEncrypted: 'secreto-totp',
        createdAt: new Date(),
      },
    ]);

    const result = await d.service.listMfaFactors(USER);

    expect(JSON.stringify(result)).not.toContain('secreto-totp');
  });

  it('no publica el identificador del token de sesión', async () => {
    const d = build();
    d.sessionsRepo.findByUser.mockResolvedValue([
      {
        id: 's1',
        tokenId: 'jti-secreto',
        stateConceptId: 'activa',
        createdAt: new Date(),
      },
    ]);

    const result = await d.service.listSessions(USER);

    expect(JSON.stringify(result)).not.toContain('jti-secreto');
    expect(result.items[0].deviceId).toBeNull();
  });

  it('lista los roles globales con su estado', async () => {
    const d = build();
    d.rolesRepo.findByUser.mockResolvedValue([
      {
        id: 'r1',
        roleConceptId: 'rol-1',
        stateConceptId: 'activo',
        createdAt: new Date(),
      },
    ]);

    const result = await d.service.listGlobalRoles(USER);

    expect(result.count).toBe(1);
    expect(result.items[0].roleConceptId).toBe('rol-1');
  });

  it.each([
    'listCredentials',
    'listDevices',
    'listMfaFactors',
    'listSessions',
    'listGlobalRoles',
  ])(
    '%s distingue "usuario inexistente" de "colección vacía"',
    async (metodo) => {
      // Sin esta comprobación la pantalla mostraría un estado vacío en vez de un 404.
      const d = build();
      d.usersRepo.findById.mockResolvedValue(null);

      await expect((d.service as any)[metodo](USER)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    },
  );
});
