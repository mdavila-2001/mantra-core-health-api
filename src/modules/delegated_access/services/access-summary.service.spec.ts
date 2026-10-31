import { jest } from '@jest/globals';
import { runWithTenant } from '../../../common';
import { AccessSummaryService } from './access-summary.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const TENANT = 'tenant-1';
const ADMIN = { id: 'admin', roles: ['SECURITY_ADMIN'] } as any;

const grant = (
  id: string,
  actions: string[],
  over: Record<string, unknown> = {},
): any => ({
  grantId: id,
  targetKind: 'ALL',
  expansionMode: 'DYNAMIC',
  active: true,
  actions,
  effect: 'ALLOW',
  ...over,
});

function build(
  opts: {
    people?: any[];
    engagement?: any;
    view?: any;
    manages?: boolean;
  } = {},
) {
  const tx: any = {};
  const em: any = { fork: () => tx };
  const access = {
    findEngagements: mockFn().mockResolvedValue(
      opts.engagement === null
        ? []
        : [
            opts.engagement ?? {
              assignment: { id: 'eng-1' },
              tenantId: TENANT,
              userId: 'u-1',
            },
          ],
    ),
  };
  const people = {
    load: mockFn().mockResolvedValue(
      opts.people ?? [
        {
          engagementId: 'eng-1',
          userId: 'u-1',
          grants: [
            grant('g1', ['schedule.cancel', 'agenda.appointment.view']),
            grant('g2', ['billing.receipt.void'], {
              effect: 'DENY',
              condition: {
                schemaVersion: 1,
                patients: { flags: { anyOf: ['VIP'] } },
              },
            }),
          ],
        },
      ],
    ),
  };
  const gate = {
    view: mockFn().mockResolvedValue(opts.view ?? { full: true }),
    manages: mockFn().mockReturnValue(opts.manages ?? true),
  };
  const scope = { resolveTenant: () => TENANT };
  return {
    service: new AccessSummaryService(
      em,
      access as any,
      people as any,
      gate as any,
      scope as any,
    ),
    gate,
    tx,
  };
}
const run = <T>(fn: () => Promise<T>) => runWithTenant(TENANT, fn);
const failure = async (p: Promise<unknown>) => {
  try {
    await p;
  } catch (e) {
    return e as any;
  }
  return undefined;
};

describe('AccessSummaryService.catalog', () => {
  it('73 permisos con sus metadatos, 7 categorías y los 15 alias con su paquete', async () => {
    const d = build();
    const out = await run(() => d.service.catalog(ADMIN));
    expect(out.atoms).toHaveLength(73);
    expect(out.categories).toHaveLength(7);
    expect(out.aliases).toHaveLength(15);
    expect(out.atoms.find((a) => a.code === 'agenda.hours.edit')).toMatchObject(
      {
        sensitivity: 'HIGH',
        requiresReason: true,
        requiresStepUp: true,
        approvalMode: 'DOCTOR',
        supportAssignable: true,
      },
    );
    expect(
      out.atoms.find((a) => a.code === 'team.sessionpolicy.manage')
        ?.supportAssignable,
    ).toBe(false);
    expect(out.aliases.find((a) => a.code === 'schedule.cancel')).toMatchObject(
      {
        atoms: ['agenda.appointment.cancel'],
        primary: 'agenda.appointment.cancel',
      },
    );
    expect(d.gate.view).toHaveBeenCalledWith(d.tx, ADMIN, 'team.members.view');
  });
});

describe('AccessSummaryService.summary', () => {
  it('resume cada permiso en lenguaje simple, con su efecto y condiciones', async () => {
    const d = build();
    const out = await run(() => d.service.summary('eng-1', ADMIN));
    expect(out.engagementId).toBe('eng-1');
    expect(out.grants).toHaveLength(2);
    expect(out.grants[0]).toMatchObject({ grantId: 'g1', effect: 'ALLOW' });
    expect(out.grants[0].summary).toMatch(/Incluye:/);
    expect(out.grants[1]).toMatchObject({ grantId: 'g2', effect: 'DENY' });
    expect(out.grants[1].summary).toMatch(/No puede:/);
    expect(out.plain).toHaveLength(2);
  });

  it('un vínculo ajeno o fuera del alcance de un delegado: 404 uniforme', async () => {
    const none = build({ engagement: null });
    expect(
      (
        await failure(run(() => none.service.summary('eng-x', ADMIN)))
      ).getStatus(),
    ).toBe(404);
    const out = build({
      manages: false,
      view: { full: false, adminTargets: [] },
    });
    expect(
      (
        await failure(run(() => out.service.summary('eng-1', ADMIN)))
      ).getStatus(),
    ).toBe(404);
  });
});

describe('AccessSummaryService.effective', () => {
  it('átomos efectivos con su origen (alias o átomo) y los permisos que los dan; la prohibición no suma', async () => {
    const d = build();
    const out = await run(() => d.service.effective('eng-1', ADMIN));
    const cancel = out.atoms.find(
      (a) => a.atom === 'agenda.appointment.cancel',
    )!;
    expect(cancel).toMatchObject({ origin: 'LEGACY', grantIds: ['g1'] });
    const view = out.atoms.find((a) => a.atom === 'agenda.appointment.view')!;
    expect(view.origin).toBe('ATOM');
    expect(
      out.atoms.find((a) => a.atom === 'billing.receipt.void'),
    ).toBeUndefined();
    expect(out.denied).toEqual([
      expect.objectContaining({ atom: 'billing.receipt.void', grantId: 'g2' }),
    ]);
  });

  it('si el mismo átomo llega por alias y por átomo, el origen es BOTH', async () => {
    const d = build({
      people: [
        {
          engagementId: 'eng-1',
          userId: 'u-1',
          grants: [
            grant('g1', ['schedule.cancel', 'agenda.appointment.cancel']),
          ],
        },
      ],
    });
    const out = await run(() => d.service.effective('eng-1', ADMIN));
    expect(
      out.atoms.find((a) => a.atom === 'agenda.appointment.cancel')?.origin,
    ).toBe('BOTH');
  });
});
