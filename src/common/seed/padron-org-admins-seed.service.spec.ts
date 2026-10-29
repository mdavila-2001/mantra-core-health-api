import { describe, it, expect, jest } from '@jest/globals';
import {
  PadronOrgAdminsSeedService,
  padronAdminEmail,
} from './padron-org-admins-seed.service';
import {
  padronFacilities,
  padronTenantId,
} from './padron-organizations-seed.service';
import { AuthenticationCredentials } from '../../modules/iam/entities';
import { TenantMemberships } from '../../modules/directory/entities';
import { SEED_ACTOR_ID } from './seed-actor';
import type { DemoGateEnv } from './demo-gate';

const OPEN: DemoGateEnv = {
  password: 'clave-de-prueba',
  nodeEnv: 'production',
  allowProduction: true,
};

interface Existing {
  credentials?: string[];
  memberships?: boolean;
}

function build(existing: Existing = {}) {
  const em: any = {
    findOne: jest.fn((entity: unknown, where: any) => {
      if (entity === AuthenticationCredentials) {
        return Promise.resolve(
          existing.credentials?.includes(where.externalSubject)
            ? { userId: `user-of-${where.externalSubject}` }
            : null,
        );
      }
      if (entity === TenantMemberships) {
        return Promise.resolve(existing.memberships ? { id: 'm' } : null);
      }
      // El actor semilla.
      return Promise.resolve({ id: SEED_ACTOR_ID });
    }),
    create: jest.fn(),
    flush: jest.fn(() => Promise.resolve()),
    fork: () => em,
  };
  const orm = { em: { fork: () => em } };
  let counter = 0;
  const users = {
    createUser: jest.fn((..._args: unknown[]) =>
      Promise.resolve({ id: `user-${++counter}` }),
    ),
  };
  const memberships = {
    invite: jest.fn((..._args: unknown[]) => Promise.resolve({})),
  };
  const organizations = {
    resolveIds: jest.fn((_em: unknown, facilities: { code: string }[]) =>
      Promise.resolve({
        idByCode: new Map(
          facilities.map((f) => [f.code, padronTenantId(f.code)]),
        ),
        ambiguous: new Set<string>(),
        fixedIds: new Map(),
      }),
    ),
  };
  const logger = { setContext: jest.fn(), info: jest.fn(), warn: jest.fn() };
  const service = new PadronOrgAdminsSeedService(
    orm as never,
    users as never,
    memberships as never,
    organizations as never,
    logger as never,
  );
  return { service, em, users, memberships, organizations };
}

const calls = (mock: jest.Mock<(...args: any[]) => any>): any[][] =>
  mock.mock.calls as any[][];

describe('PadronOrgAdminsSeedService', () => {
  it('apagado no hace nada', async () => {
    const { service, users } = build();

    const result = await service.run(OPEN, false);

    expect(result.reason).toBe('not-configured');
    expect(users.createUser).not.toHaveBeenCalled();
  });

  describe('candado de cuentas de demostración', () => {
    it('sin contraseña no crea cuentas', async () => {
      const { service, users } = build();

      const result = await service.run({ ...OPEN, password: undefined }, true);

      expect(result.reason).toBe('not-configured');
      expect(users.createUser).not.toHaveBeenCalled();
    });

    it('en producción sin permiso explícito no crea cuentas', async () => {
      const { service, users, memberships } = build();

      const result = await service.run(
        { ...OPEN, allowProduction: false },
        true,
      );

      expect(result.reason).toBe('production-not-allowed');
      expect(users.createUser).not.toHaveBeenCalled();
      expect(memberships.invite).not.toHaveBeenCalled();
    });
  });

  it('crea 94 cuentas y 94 membresías: 59 del padrón sin centros de salud y 35 aseguradoras', async () => {
    const { service, users, memberships } = build();

    const result = await service.run(OPEN, true);

    const nonCenters = padronFacilities().filter(
      (row) => row.tipo !== 'CENTRO_SALUD',
    );
    expect(nonCenters).toHaveLength(59);
    expect(result.failed).toEqual([]);
    expect(result.created).toBe(94);
    expect(result.memberships).toBe(94);
    expect(users.createUser).toHaveBeenCalledTimes(94);
    expect(memberships.invite).toHaveBeenCalledTimes(94);
  });

  it('todas las cuentas usan el dominio de pruebas y la contraseña de demostración', async () => {
    const { service, users } = build();

    await service.run(OPEN, true);

    for (const [dto] of calls(users.createUser)) {
      expect(dto.email).toMatch(/^admin\.[a-z0-9-]+@alovida\.test$/);
      expect(dto.password).toBe('clave-de-prueba');
    }
    const emails = calls(users.createUser).map(([dto]) => dto.email);
    expect(new Set(emails).size).toBe(emails.length);
  });

  it('la membresía es ADMIN de toda la organización, con id determinista', async () => {
    const { service, memberships } = build();

    await service.run(OPEN, true);

    const [tenantId, dto, actor, membershipId] = calls(memberships.invite)[0];
    expect(tenantId).toMatch(/^[0-9a-f-]{36}$/);
    expect(dto.role).toBe('ADMIN');
    expect(dto.accessScope).toBe('ALL_TENANT');
    expect(actor.id).toBe(SEED_ACTOR_ID);
    expect(membershipId).toMatch(/^[0-9a-f-]{36}$/);

    const again = build();
    await again.service.run(OPEN, true);
    expect(calls(again.memberships.invite)[0][3]).toBe(membershipId);
  });

  it('la segunda corrida no crea nada', async () => {
    const first = build();
    await first.service.run(OPEN, true);
    const emails = calls(first.users.createUser).map(([dto]) => dto.email);

    const second = build({ credentials: emails, memberships: true });
    const result = await second.service.run(OPEN, true);

    expect(result.created).toBe(0);
    expect(result.existing).toBe(94);
    expect(result.memberships).toBe(0);
    expect(second.users.createUser).not.toHaveBeenCalled();
    expect(second.memberships.invite).not.toHaveBeenCalled();
  });

  it('una cuenta que existe sin membresía recibe solo la membresía', async () => {
    const email = padronAdminEmail('clinica-las-americas');
    const { service, users, memberships } = build({ credentials: [email] });

    const result = await service.run(OPEN, true);

    expect(result.existing).toBe(1);
    expect(users.createUser).toHaveBeenCalledTimes(93);
    expect(memberships.invite).toHaveBeenCalledTimes(94);
  });

  it('una organización que todavía no existe espera, no falla', async () => {
    const { service, organizations, users } = build();
    organizations.resolveIds.mockImplementation(() =>
      Promise.resolve({
        idByCode: new Map(),
        ambiguous: new Set<string>(),
        fixedIds: new Map(),
      }),
    );

    const result = await service.run(OPEN, true);

    expect(result.organizationMissing).toBe(59);
    expect(result.failed).toEqual([]);
    // Las 35 aseguradoras sí existen: las crea otro paso, siempre.
    expect(users.createUser).toHaveBeenCalledTimes(35);
  });

  it('un error en una cuenta no detiene a las demás', async () => {
    const { service, users } = build();
    users.createUser.mockImplementationOnce(() =>
      Promise.reject(new Error('boom')),
    );

    const result = await service.run(OPEN, true);

    expect(result.failed).toHaveLength(1);
    expect(result.created).toBe(93);
  });
});
