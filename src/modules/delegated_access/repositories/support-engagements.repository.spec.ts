import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../common';
import { DIR } from '../../directory/directory.concepts';
import { SupportEngagementsRepository } from './support-engagements.repository';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const NOW = new Date('2026-10-30T12:00:00Z');
const MINUTE = 60_000;

/** Membresía y vínculos como los lee la base, con el `em` mínimo que usa el método. */
function build(opts: {
  membership?: Record<string, unknown>;
  assignments?: Record<string, unknown>[];
  branchMemberships?: number;
}) {
  const membership = {
    id: 'mem-1',
    tenantRoleConceptId: DIR.ROLE_STAFF,
    statusConceptId: DIR.MEMBERSHIP_ACTIVE,
    createdAt: NOW,
    ...opts.membership,
  };
  const em = {
    findOne: mockFn().mockResolvedValue(membership),
    find: mockFn().mockResolvedValue(
      opts.assignments ?? [
        {
          roleTemplateId: 'tpl-secretary',
          statusConceptId: CONCEPTS.STATE_ACTIVE,
          createdAt: NOW,
        },
      ],
    ),
    count: mockFn().mockResolvedValue(opts.branchMemberships ?? 0),
  };
  return { repo: new SupportEngagementsRepository(), em, membership };
}

const ended = (createdAt: Date, state = CONCEPTS.STATE_REVOKED) => [
  { roleTemplateId: 'tpl-secretary', statusConceptId: state, createdAt },
];

describe('SupportEngagementsRepository.syncSupportMembership (N10: otra razón de membresía)', () => {
  it('la membresía que abrió el propio vínculo de apoyo se cierra al terminarlo', async () => {
    const d = build({
      membership: { createdAt: new Date(NOW.getTime() - 2_000) },
      assignments: ended(NOW),
    });
    expect(
      await d.repo.syncSupportMembership(
        d.em as any,
        'mem-1',
        'ENDED',
        NOW,
        'admin',
      ),
    ).toBe(true);
    expect(d.membership.statusConceptId).toBe(DIR.MEMBERSHIP_ENDED);
  });

  it('un empleado STAFF que ya era miembro antes del vínculo de apoyo conserva su membresía al terminarlo', async () => {
    const d = build({
      membership: {
        createdAt: new Date(NOW.getTime() - 400 * 24 * 60 * MINUTE),
      },
      assignments: ended(NOW),
    });
    expect(
      await d.repo.syncSupportMembership(d.em as any, 'mem-1', 'ENDED', NOW),
    ).toBe(false);
    expect(d.membership.statusConceptId).toBe(DIR.MEMBERSHIP_ACTIVE);
  });

  it('tampoco la suspende cuando el vínculo no se recertifica', async () => {
    const d = build({
      membership: {
        createdAt: new Date(NOW.getTime() - 400 * 24 * 60 * MINUTE),
      },
      assignments: ended(NOW, CONCEPTS.STATE_EXPIRED),
    });
    expect(
      await d.repo.syncSupportMembership(
        d.em as any,
        'mem-1',
        'SUSPENDED',
        NOW,
      ),
    ).toBe(false);
    expect(d.membership.statusConceptId).toBe(DIR.MEMBERSHIP_ACTIVE);
  });

  it('una membresía con sede principal o con asignación de sede activa es de otra razón, aunque sea nueva', async () => {
    const withPrimary = build({
      membership: { primaryBranchId: 'branch-1' },
      assignments: ended(NOW),
    });
    expect(
      await withPrimary.repo.syncSupportMembership(
        withPrimary.em as any,
        'mem-1',
        'ENDED',
        NOW,
      ),
    ).toBe(false);
    const withBranch = build({
      assignments: ended(NOW),
      branchMemberships: 1,
    });
    expect(
      await withBranch.repo.syncSupportMembership(
        withBranch.em as any,
        'mem-1',
        'ENDED',
        NOW,
      ),
    ).toBe(false);
    expect(withBranch.membership.statusConceptId).toBe(DIR.MEMBERSHIP_ACTIVE);
  });

  it('sigue sin cerrarse mientras quede otro vínculo de apoyo activo, y con otra asignación (sin plantilla) no se toca', async () => {
    const stillActive = build({
      assignments: [
        ...ended(NOW),
        {
          roleTemplateId: 'tpl-otro',
          statusConceptId: CONCEPTS.STATE_ACTIVE,
          createdAt: NOW,
        },
      ],
    });
    expect(
      await stillActive.repo.syncSupportMembership(
        stillActive.em as any,
        'mem-1',
        'ENDED',
        NOW,
      ),
    ).toBe(false);
    const other = build({
      assignments: [
        ...ended(NOW),
        { statusConceptId: CONCEPTS.STATE_ACTIVE, createdAt: NOW },
      ],
    });
    expect(
      await other.repo.syncSupportMembership(
        other.em as any,
        'mem-1',
        'ENDED',
        NOW,
      ),
    ).toBe(false);
  });
});

describe('SupportEngagementsRepository.syncSupportMembership (N10c: origen exacto)', () => {
  const OLD = new Date(NOW.getTime() - 400 * 24 * 60 * MINUTE);

  it('SUPPORT_ENGAGEMENT: se cierra al terminar el último vínculo aunque la heurística la daría por de otra razón (membresía vieja, sede principal)', async () => {
    const d = build({
      membership: {
        originConceptId: DIR.MEMBERSHIP_ORIGIN_SUPPORT_ENGAGEMENT,
        createdAt: OLD,
        primaryBranchId: 'branch-1',
      },
      assignments: ended(NOW),
      branchMemberships: 1,
    });
    expect(
      await d.repo.syncSupportMembership(d.em as any, 'mem-1', 'ENDED', NOW),
    ).toBe(true);
    expect(d.membership.statusConceptId).toBe(DIR.MEMBERSHIP_ENDED);
  });

  it('SUPPORT_ENGAGEMENT: tampoco depende de que todas las asignaciones tengan plantilla', async () => {
    const d = build({
      membership: { originConceptId: DIR.MEMBERSHIP_ORIGIN_SUPPORT_ENGAGEMENT },
      assignments: [
        ...ended(NOW),
        {
          statusConceptId: CONCEPTS.STATE_REVOKED,
          createdAt: NOW,
        },
      ],
    });
    expect(
      await d.repo.syncSupportMembership(d.em as any, 'mem-1', 'ENDED', NOW),
    ).toBe(true);
  });

  it('SUPPORT_ENGAGEMENT: mientras quede un vínculo activo no se cierra ni se suspende', async () => {
    for (const target of ['ENDED', 'SUSPENDED'] as const) {
      const d = build({
        membership: {
          originConceptId: DIR.MEMBERSHIP_ORIGIN_SUPPORT_ENGAGEMENT,
        },
        assignments: [
          ...ended(NOW),
          {
            roleTemplateId: 'tpl-otro',
            statusConceptId: CONCEPTS.STATE_ACTIVE,
            createdAt: NOW,
          },
        ],
      });
      expect(
        await d.repo.syncSupportMembership(d.em as any, 'mem-1', target, NOW),
      ).toBe(false);
      expect(d.membership.statusConceptId).toBe(DIR.MEMBERSHIP_ACTIVE);
    }
  });

  it('SUPPORT_ENGAGEMENT: se reactiva cuando vuelve un vínculo', async () => {
    const d = build({
      membership: {
        originConceptId: DIR.MEMBERSHIP_ORIGIN_SUPPORT_ENGAGEMENT,
        statusConceptId: DIR.MEMBERSHIP_ENDED,
        endDate: NOW,
      },
    });
    expect(
      await d.repo.syncSupportMembership(d.em as any, 'mem-1', 'ACTIVE', NOW),
    ).toBe(true);
    expect(d.membership.statusConceptId).toBe(DIR.MEMBERSHIP_ACTIVE);
    expect((d.membership as any).endDate).toBeUndefined();
  });

  it.each([
    ['OWNER_CREATED', DIR.MEMBERSHIP_ORIGIN_OWNER_CREATED],
    ['ADMIN_ADDED', DIR.MEMBERSHIP_ORIGIN_ADMIN_ADDED],
    ['INVITATION_REDEEMED', DIR.MEMBERSHIP_ORIGIN_INVITATION_REDEEMED],
  ])(
    'un empleado con origen %s nunca se cierra al terminar el vínculo, aunque por la heurística pareciera solo-apoyo',
    async (_name, origin) => {
      // Membresía nueva, sin sede y con todas las asignaciones de plantilla: la
      // heurística sola la cerraría. El origen declarado manda.
      const d = build({
        membership: { originConceptId: origin },
        assignments: ended(NOW),
      });
      expect(
        await d.repo.syncSupportMembership(d.em as any, 'mem-1', 'ENDED', NOW),
      ).toBe(false);
      expect(d.membership.statusConceptId).toBe(DIR.MEMBERSHIP_ACTIVE);
      expect(
        await d.repo.syncSupportMembership(
          d.em as any,
          'mem-1',
          'SUSPENDED',
          NOW,
        ),
      ).toBe(false);
    },
  );

  it.each([
    ['NULL', undefined],
    ['UNKNOWN', DIR.MEMBERSHIP_ORIGIN_UNKNOWN],
  ])(
    'origen %s: se conserva la heurística (se cierra la que abrió el vínculo, no la que ya existía)',
    async (_name, origin) => {
      const own = build({
        membership: {
          originConceptId: origin,
          createdAt: new Date(NOW.getTime() - 2_000),
        },
        assignments: ended(NOW),
      });
      expect(
        await own.repo.syncSupportMembership(
          own.em as any,
          'mem-1',
          'ENDED',
          NOW,
        ),
      ).toBe(true);
      const previous = build({
        membership: { originConceptId: origin, createdAt: OLD },
        assignments: ended(NOW),
      });
      expect(
        await previous.repo.syncSupportMembership(
          previous.em as any,
          'mem-1',
          'ENDED',
          NOW,
        ),
      ).toBe(false);
    },
  );

  it('un rol distinto de STAFF no se toca ni con origen SUPPORT_ENGAGEMENT', async () => {
    const d = build({
      membership: {
        originConceptId: DIR.MEMBERSHIP_ORIGIN_SUPPORT_ENGAGEMENT,
        tenantRoleConceptId: DIR.ROLE_ADMIN,
      },
      assignments: ended(NOW),
    });
    expect(
      await d.repo.syncSupportMembership(d.em as any, 'mem-1', 'ENDED', NOW),
    ).toBe(false);
  });
});
