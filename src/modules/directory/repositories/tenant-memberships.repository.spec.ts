import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../common';
import { DIR } from '../directory.concepts';
import { TenantMemberships } from '../entities';
import { TenantMembershipsRepository } from './tenant-memberships.repository';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/** `em` con la fila que devolvería la consulta de `isSupportOnly`. */
function emWithRow(row: Record<string, unknown> | undefined) {
  const execute = mockFn().mockResolvedValue(row ? [row] : []);
  return {
    execute,
    em: { getConnection: () => ({ execute }) } as any,
  };
}

const row = (over: Record<string, unknown>) => ({
  origin: null,
  has_support: false,
  has_other: false,
  has_other_active: false,
  ...over,
});

describe('TenantMembershipsRepository.create (N10c)', () => {
  it('guarda el origen que pide quien crea la membresía', () => {
    const em = { create: mockFn((_e: unknown, data: unknown) => data) };
    new TenantMembershipsRepository().create(em as any, {
      userId: 'user-1',
      tenantId: 'tenant-1',
      tenantRoleConceptId: DIR.ROLE_OWNER,
      statusConceptId: DIR.MEMBERSHIP_ACTIVE,
      accessScopeConceptId: DIR.SCOPE_ALL_TENANT,
      startDate: new Date(),
      originConceptId: DIR.MEMBERSHIP_ORIGIN_OWNER_CREATED,
    });
    expect(em.create).toHaveBeenCalledWith(
      TenantMemberships,
      expect.objectContaining({
        originConceptId: DIR.MEMBERSHIP_ORIGIN_OWNER_CREATED,
      }),
      { partial: true },
    );
  });
});

describe('TenantMembershipsRepository.isSupportOnly (N10c)', () => {
  const repo = new TenantMembershipsRepository();

  it('SUPPORT_ENGAGEMENT es solo apoyo, con o sin plantillas en sus asignaciones', async () => {
    const d = emWithRow(
      row({ origin: DIR.MEMBERSHIP_ORIGIN_SUPPORT_ENGAGEMENT }),
    );
    expect(await repo.isSupportOnly(d.em, 'mem-1')).toBe(true);
  });

  it('SUPPORT_ENGAGEMENT con una asignación activa que no es de apoyo ya es personal de la organización', async () => {
    const d = emWithRow(
      row({
        origin: DIR.MEMBERSHIP_ORIGIN_SUPPORT_ENGAGEMENT,
        has_support: true,
        has_other: true,
        has_other_active: true,
      }),
    );
    expect(await repo.isSupportOnly(d.em, 'mem-1')).toBe(false);
  });

  it.each([
    ['OWNER_CREATED', DIR.MEMBERSHIP_ORIGIN_OWNER_CREATED],
    ['ADMIN_ADDED', DIR.MEMBERSHIP_ORIGIN_ADMIN_ADDED],
    ['INVITATION_REDEEMED', DIR.MEMBERSHIP_ORIGIN_INVITATION_REDEEMED],
  ])(
    'origen %s no es solo apoyo aunque todas sus asignaciones sean de plantilla (el QR de un doctor no es apoyo)',
    async (_name, origin) => {
      const d = emWithRow(row({ origin, has_support: true }));
      expect(await repo.isSupportOnly(d.em, 'mem-1')).toBe(false);
    },
  );

  it.each([
    ['NULL', null],
    ['UNKNOWN', DIR.MEMBERSHIP_ORIGIN_UNKNOWN],
  ])(
    'origen %s: se conserva la regla anterior (vínculos de apoyo y ninguna otra asignación)',
    async (_name, origin) => {
      expect(
        await repo.isSupportOnly(
          emWithRow(row({ origin, has_support: true })).em,
          'm',
        ),
      ).toBe(true);
      expect(
        await repo.isSupportOnly(
          emWithRow(row({ origin, has_support: true, has_other: true })).em,
          'm',
        ),
      ).toBe(false);
      expect(await repo.isSupportOnly(emWithRow(row({ origin })).em, 'm')).toBe(
        false,
      );
    },
  );

  it('una membresía que no existe no es solo apoyo', async () => {
    expect(await repo.isSupportOnly(emWithRow(undefined).em, 'nada')).toBe(
      false,
    );
  });

  it('consulta la membresía con el estado activo como parámetro', async () => {
    const d = emWithRow(row({}));
    await repo.isSupportOnly(d.em, 'mem-9');
    expect(d.execute).toHaveBeenCalledWith(
      expect.stringContaining('origin_concept_id'),
      [CONCEPTS.STATE_ACTIVE, 'mem-9'],
    );
  });
});
