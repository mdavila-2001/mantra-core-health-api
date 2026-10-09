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

const ASEGURADORA = 'aseguradora.demo@alovida.test';
const FARMACIA = 'farmacia.demo@alovida.test';

/**
 * Construye el seed con un `em` en memoria: credenciales y membresías que la
 * base «ya tiene», y lo que el seed crea o modifica.
 *
 * @param membresias - Rol de tenant que ya tiene cada cuenta, por correo.
 *   Las cuentas que no aparecen todavía no existen.
 */
function build(membresias: Record<string, string> = {}) {
  const userIdDe = (email: string) => `user:${email}`;
  const filas = new Map(
    Object.entries(membresias).map(([email, rol]) => [
      userIdDe(email),
      { userId: userIdDe(email), tenantRoleConceptId: rol } as any,
    ]),
  );
  const creadas: { entity: string; data: any }[] = [];

  const em = {
    findOne: mockFn((entity: any, where: any) => {
      if (entity.name === 'AuthenticationCredentials') {
        const email = where.externalSubject as string;
        return Promise.resolve(
          email in membresias ? { userId: userIdDe(email) } : null,
        );
      }
      if (entity.name === 'TenantMemberships') {
        return Promise.resolve(filas.get(where.userId) ?? null);
      }
      return Promise.resolve(null);
    }),
    create: mockFn((entity: any, data: any) => {
      creadas.push({ entity: entity.name, data });
      return data;
    }),
    flush: mockFn(() => Promise.resolve()),
  };
  const orm = { em: { fork: mockFn(() => em) } };
  const users = {
    createUser: mockFn((input: any) =>
      Promise.resolve({ id: userIdDe(input.email) }),
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
      const creada = creadas.find(
        (fila) =>
          fila.entity === 'TenantMemberships' &&
          fila.data.userId === userIdDe(email),
      );
      return (
        creada?.data.tenantRoleConceptId ??
        filas.get(userIdDe(email))?.tenantRoleConceptId
      );
    },
    row: (email: string) => filas.get(userIdDe(email)),
  };
}

describe('ProviderAccountsSeedService · rol en la organización', () => {
  it('la aseguradora demo es ADMIN: sin eso la API le niega editar su catálogo', () => {
    const cuenta = PROVIDER_ACCOUNTS.find((c) => c.email === ASEGURADORA);

    expect(cuenta?.tenantRole).toBe('ADMIN');
  });

  it('una base nueva crea la membresía con el rol que declara el catálogo', async () => {
    const { service, rolDe } = build();

    await service.run('demo-password', 'development');

    expect(rolDe(ASEGURADORA)).toBe(DIR.ROLE_ADMIN);
    expect(rolDe(FARMACIA)).toBe(DIR.ROLE_STAFF);
  });

  it('una base ya sembrada sube a la aseguradora de STAFF a ADMIN', async () => {
    const todasStaff = Object.fromEntries(
      PROVIDER_ACCOUNTS.map((c) => [c.email, DIR.ROLE_STAFF]),
    );
    const { service, row: fila } = build(todasStaff);

    await service.run('demo-password', 'development');

    expect(fila(ASEGURADORA).tenantRoleConceptId).toBe(DIR.ROLE_ADMIN);
    expect(fila(ASEGURADORA).updatedAt).toBeInstanceOf(Date);
    expect(fila(FARMACIA).tenantRoleConceptId).toBe(DIR.ROLE_STAFF);
    expect(fila(FARMACIA).updatedAt).toBeUndefined();
  });
});
