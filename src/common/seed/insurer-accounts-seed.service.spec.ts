import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { DIR } from '../../modules/directory/directory.concepts';
import { InsurerAccountsSeedService } from './insurer-accounts-seed.service';
import { INSURER_ACCOUNTS } from './insurer-accounts.catalog';

/**
 * Construye el seed con un `em` en memoria.
 *
 * @param existing - Correos que ya tienen credencial, con su hash.
 * @param carriers - Si las aseguradoras ya están sembradas.
 */
function build(existing: Record<string, string> = {}, carriers = true) {
  const credentials = new Map(Object.entries(existing));
  const memberships: any[] = [];
  const em = {
    findOne: mockFn((entity: any, where: any) => {
      if (entity.name === 'AuthenticationCredentials') {
        const hash = credentials.get(where.externalSubject);
        return Promise.resolve(hash ? { secretHash: hash } : null);
      }
      if (entity.name === 'InsuranceCarriers') {
        return Promise.resolve(
          carriers ? { tenantId: `tenant:${where.carrierCode}` } : null,
        );
      }
      return Promise.resolve(null);
    }),
    create: mockFn((entity: any, data: any) => {
      if (entity.name === 'TenantMemberships') memberships.push(data);
      return data;
    }),
    flush: mockFn(() => Promise.resolve()),
  };
  const orm = { em: { fork: mockFn(() => em) } };
  const users = {
    createUser: mockFn((input: any) => {
      credentials.set(input.email, 'hash-nuevo');
      return Promise.resolve({ id: `user:${input.email}` });
    }),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new InsurerAccountsSeedService(
    orm as any,
    users as any,
    logger as any,
  );
  return { service, users, memberships, credentials };
}

describe('InsurerAccountsSeedService', () => {
  it('el catálogo conserva las 33 cuentas del parche, con correos únicos', () => {
    expect(INSURER_ACCOUNTS).toHaveLength(33);
    expect(new Set(INSURER_ACCOUNTS.map((a) => a.email)).size).toBe(33);
  });

  it('sin SEED_DEMO_PASSWORD no crea nada', async () => {
    const { service, users } = build();

    const result = await service.run(undefined, 'development');

    expect(result).toEqual({ created: 0, skipped: 'not-configured' });
    expect(users.createUser).not.toHaveBeenCalled();
  });

  it('en producción sin permiso se niega', async () => {
    const { service, users } = build();

    const result = await service.run('clave', 'production', false);

    expect(result).toEqual({ created: 0, skipped: 'production-not-allowed' });
    expect(users.createUser).not.toHaveBeenCalled();
  });

  it('con clave crea las 33, cada una administradora de su aseguradora', async () => {
    const { service, users, memberships } = build();

    const result = await service.run('clave', 'development');

    expect(result).toEqual({ created: 33 });
    expect(users.createUser).toHaveBeenCalledTimes(33);
    expect(memberships).toHaveLength(33);
    expect(memberships[0]).toMatchObject({
      tenantId: `tenant:${INSURER_ACCOUNTS[0].carrierCode}`,
      tenantRoleConceptId: DIR.ROLE_ADMIN,
      statusConceptId: DIR.MEMBERSHIP_ACTIVE,
    });
    expect(new Set(memberships.map((m) => m.id)).size).toBe(33);
  });

  it('con permiso explícito siembra también en producción', async () => {
    const { service } = build();

    const result = await service.run('clave', 'production', true);

    expect(result.created).toBe(33);
  });

  it('la segunda corrida no crea ninguna', async () => {
    const { service, users } = build();
    await service.run('clave', 'development');
    users.createUser.mockClear();

    const result = await service.run('clave', 'development');

    expect(result).toEqual({ created: 0 });
    expect(users.createUser).not.toHaveBeenCalled();
  });

  it('el hash de una cuenta existente no cambia aunque la clave sea otra', async () => {
    const email = INSURER_ACCOUNTS[0].email;
    const { service, users, credentials } = build({ [email]: 'hash-previo' });

    const result = await service.run('otra-clave', 'development');

    expect(result.created).toBe(32);
    expect(credentials.get(email)).toBe('hash-previo');
    expect(users.createUser).not.toHaveBeenCalledWith(
      expect.objectContaining({ email }),
      expect.anything(),
    );
  });

  it('si la aseguradora no está sembrada, omite la cuenta sin crear usuarios huérfanos', async () => {
    const { service, users } = build({}, false);

    const result = await service.run('clave', 'development');

    expect(result).toEqual({ created: 0 });
    expect(users.createUser).not.toHaveBeenCalled();
  });
});
