import { jest } from '@jest/globals';
import { runWithTenant } from '../../../common';
import { GovernanceAccessGate } from './governance-access.gate';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const TENANT = 'tenant-1';
const em: any = {};
const ADMIN = { id: 'admin', roles: ['SECURITY_ADMIN'] } as any;
const SOFIA = { id: 'sofia', roles: ['SUPPORT_STAFF'] } as any;

const grant = (
  id: string,
  actions: string[],
  over: Record<string, unknown> = {},
): any => ({
  grantId: id,
  targetKind: 'SERVICE',
  healthcareServiceId: 'eco',
  expansionMode: 'DYNAMIC',
  active: true,
  actions,
  effect: 'ALLOW',
  ...over,
});

function build(people: any[]) {
  const loader = { load: mockFn().mockResolvedValue(people) };
  const scope = { resolveTenant: () => TENANT };
  return {
    gate: new GovernanceAccessGate(loader as any, scope as any),
    loader,
  };
}
const run = <T>(fn: () => Promise<T>) => runWithTenant(TENANT, fn);

describe('GovernanceAccessGate', () => {
  it('el administrador de seguridad ve todo y no consulta nada', async () => {
    const d = build([]);
    const view = await run(() =>
      d.gate.view(em, ADMIN, 'audit.reports.governance.view'),
    );
    expect(view).toEqual({ full: true });
    expect(d.loader.load).not.toHaveBeenCalled();
  });

  it('un delegado con el átomo ve solo el alcance de la concesión que lo contiene', async () => {
    const d = build([
      {
        engagementId: 'e',
        userId: 'sofia',
        grants: [
          grant('g1', ['audit.reports.governance.view', 'team.grants.assign']),
        ],
      },
    ]);
    const view = await run(() =>
      d.gate.view(em, SOFIA, 'audit.reports.governance.view'),
    );
    expect(view.full).toBe(false);
    if (view.full) throw new Error('inesperado');
    expect(view.adminTargets).toHaveLength(1);
    expect(
      d.gate.manages(view, [grant('x', ['agenda.appointment.view'])]),
    ).toBe(true);
    expect(
      d.gate.manages(view, [
        grant('y', ['agenda.appointment.view'], {
          healthcareServiceId: 'cardio',
        }),
      ]),
    ).toBe(false);
  });

  it('un delegado sin el átomo: 403 ADMIN_SCOPE_EXCEEDED', async () => {
    const d = build([
      {
        engagementId: 'e',
        userId: 'sofia',
        grants: [grant('g1', ['agenda.appointment.view'])],
      },
    ]);
    await expect(
      run(() => d.gate.view(em, SOFIA, 'audit.reports.governance.view')),
    ).rejects.toMatchObject({ reason: 'ADMIN_SCOPE_EXCEEDED' });
  });

  it('una concesión vencida o prohibida no da el átomo', async () => {
    const d = build([
      {
        engagementId: 'e',
        userId: 'sofia',
        grants: [
          grant('g1', ['audit.reports.governance.view'], { active: false }),
          grant('g2', ['audit.reports.governance.view'], { effect: 'DENY' }),
        ],
      },
    ]);
    await expect(
      run(() => d.gate.view(em, SOFIA, 'audit.reports.governance.view')),
    ).rejects.toMatchObject({ reason: 'ADMIN_SCOPE_EXCEEDED' });
  });
});

describe('GovernanceAccessGate con la función común (SEG A-A5)', () => {
  const tenantAdmins = (targets: any[]) => ({
    governanceTargets: mockFn().mockResolvedValue(targets),
  });
  const buildWith = (admins: any) =>
    new GovernanceAccessGate(
      { load: mockFn() } as any,
      { resolveTenant: () => TENANT } as any,
      admins,
    );

  it('el alcance de un delegado sale de la función común (vigencia, DENY y reglas L1), no de las concesiones crudas', async () => {
    const admins = tenantAdmins([
      { targetKind: 'SERVICE', healthcareServiceId: 'eco' },
    ]);
    const view = await run(() =>
      buildWith(admins).view(em, SOFIA, 'audit.reports.governance.view'),
    );
    expect(view).toEqual({
      full: false,
      adminTargets: [{ targetKind: 'SERVICE', healthcareServiceId: 'eco' }],
    });
    expect(admins.governanceTargets).toHaveBeenCalledWith(
      em,
      'sofia',
      TENANT,
      'audit.reports.governance.view',
      expect.any(Date),
    );
  });

  it('si la función común no le deja el átomo (vínculo suspendido, recertificación vencida, DENY): 403 ADMIN_SCOPE_EXCEEDED', async () => {
    await expect(
      run(() =>
        buildWith(tenantAdmins([])).view(em, SOFIA, 'team.members.view'),
      ),
    ).rejects.toMatchObject({ reason: 'ADMIN_SCOPE_EXCEEDED' });
  });

  it('SECURITY_ADMIN sigue sin consultar nada', async () => {
    const admins = tenantAdmins([]);
    expect(
      await run(() => buildWith(admins).view(em, ADMIN, 'team.members.view')),
    ).toEqual({ full: true });
    expect(admins.governanceTargets).not.toHaveBeenCalled();
  });
});
