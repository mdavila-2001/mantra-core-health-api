import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { DIR } from '../../modules/directory/directory.concepts';
import { ProviderAccountsSeedService } from './provider-accounts-seed.service';
import { PROVIDER_ACCOUNTS } from './provider-accounts.catalog';

const INSURER = 'aseguradora.demo@alovida.test';
const PHARMACY = 'farmacia.demo@alovida.test';

/**
 * Construye el seed con un `em` en memoria: credenciales y membresías que la
 * base «ya tiene», y lo que el seed crea o modifica.
 *
 * @param memberships - Rol de tenant que ya tiene cada cuenta, por correo.
 *   Las cuentas que no aparecen todavía no existen.
 */
function build(memberships: Record<string, string> = {}) {
  const userId = (email: string) => `user:${email}`;
  const rows = new Map(
    Object.entries(memberships).map(([email, role]) => [
      userId(email),
      { userId: userId(email), tenantRoleConceptId: role } as any,
    ]),
  );
  const created: { entity: string; data: any }[] = [];

  const em = {
    findOne: mockFn((entity: any, where: any) => {
      if (entity.name === 'AuthenticationCredentials') {
        const email = where.externalSubject as string;
        return Promise.resolve(
          email in memberships ? { userId: userId(email) } : null,
        );
      }
      if (entity.name === 'TenantMemberships') {
        return Promise.resolve(rows.get(where.userId) ?? null);
      }
      return Promise.resolve(null);
    }),
    create: mockFn((entity: any, data: any) => {
      created.push({ entity: entity.name, data });
      return data;
    }),
    flush: mockFn(() => Promise.resolve()),
  };
  const orm = { em: { fork: mockFn(() => em) } };
  const users = {
    createUser: mockFn((input: any) =>
      Promise.resolve({ id: userId(input.email) }),
    ),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new ProviderAccountsSeedService(
    orm as any,
    users as any,
    logger as any,
  );

  return {
    service,
    /** Rol de tenant con el que quedó (o se creó) la membresía de la cuenta. */
    rolDe: (email: string): string | undefined => {
      const createdAccount = created.find(
        (row) =>
          row.entity === 'TenantMemberships' &&
          row.data.userId === userId(email),
      );
      return (
        createdAccount?.data.tenantRoleConceptId ??
        rows.get(userId(email))?.tenantRoleConceptId
      );
    },
    row: (email: string) => rows.get(userId(email)),
  };
}

describe('ProviderAccountsSeedService · rol en la organización', () => {
  it('la aseguradora demo es ADMIN: sin eso la API le niega editar su catálogo', () => {
    const account = PROVIDER_ACCOUNTS.find((c) => c.email === INSURER);

    expect(account?.tenantRole).toBe('ADMIN');
  });

  it('una base nueva crea la membresía con el rol que declara el catálogo', async () => {
    const { service, rolDe: roleOf } = build();

    await service.run('demo-password', 'development');

    expect(roleOf(INSURER)).toBe(DIR.ROLE_ADMIN);
    expect(roleOf(PHARMACY)).toBe(DIR.ROLE_STAFF);
  });

  it('una base ya sembrada sube a la aseguradora de STAFF a ADMIN', async () => {
    const todasStaff = Object.fromEntries(
      PROVIDER_ACCOUNTS.map((c) => [c.email, DIR.ROLE_STAFF]),
    );
    const { service, row: row } = build(todasStaff);

    await service.run('demo-password', 'development');

    expect(row(INSURER).tenantRoleConceptId).toBe(DIR.ROLE_ADMIN);
    expect(row(INSURER).updatedAt).toBeInstanceOf(Date);
    expect(row(PHARMACY).tenantRoleConceptId).toBe(DIR.ROLE_STAFF);
    expect(row(PHARMACY).updatedAt).toBeUndefined();
  });
});
