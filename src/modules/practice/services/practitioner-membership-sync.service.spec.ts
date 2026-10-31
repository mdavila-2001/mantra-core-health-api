import { jest } from '@jest/globals';
import { PractitionerMembershipSyncService } from './practitioner-membership-sync.service';
import { PRAC } from '../practice.concepts';
import { DIR } from '../../directory/directory.concepts';
import { PROF } from '../../profiles/profiles.concepts';
import { TenantMemberships } from '../../directory/entities';
import { PersonAccountLinks } from '../../profiles/entities';
import { PractitionerRoleAssignments } from '../entities';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 'tenant-1';
const role = (overrides: Record<string, unknown> = {}): any => ({
  id: 'r1',
  practiceId: 'p1',
  practitionerProfileId: 'hp1',
  statusConceptId: PRAC.ROLE_ASSIGNMENT_PENDING,
  ...overrides,
});

function build(
  memberships: any[],
  links: any[] = [{ userId: 'user-ana' }],
  otherPending = 0,
) {
  const finds: Array<[unknown, any]> = [];
  const tx: any = {
    find: mockFn((entity: unknown, where: any) => {
      finds.push([entity, where]);
      if (entity === PersonAccountLinks) return Promise.resolve(links);
      if (entity === TenantMemberships) return Promise.resolve(memberships);
      return Promise.resolve([]);
    }),
    count: mockFn(() => Promise.resolve(otherPending)),
  };
  const practicesRepo = {
    findById: mockFn().mockResolvedValue({ id: 'p1', tenantId: TENANT }),
  };
  const service = new PractitionerMembershipSyncService(practicesRepo as any);
  return { service, tx, finds, practicesRepo };
}

const pendingMembership = (): any => ({
  id: 'm1',
  userId: 'user-ana',
  tenantId: TENANT,
  statusConceptId: DIR.MEMBERSHIP_INVITED,
});

describe('PractitionerMembershipSyncService', () => {
  const original = process.env.RLS_ENFORCE;
  afterEach(() => {
    if (original === undefined) delete process.env.RLS_ENFORCE;
    else process.env.RLS_ENFORCE = original;
  });

  it('aprobar activa la membresía pendiente (MEMBERSHIP_INVITED) de la cuenta del médico en la organización de la práctica', async () => {
    const membership = pendingMembership();
    const d = build([membership]);

    const changed = await d.service.settle(d.tx, role(), true, 'admin-1');

    expect(changed).toBe(1);
    expect(membership.statusConceptId).toBe(DIR.MEMBERSHIP_ACTIVE);
    expect(membership.endDate).toBeUndefined();
    expect(membership.updatedByUserId).toBe('admin-1');
    // Solo busca pendientes (INVITED) de las cuentas del perfil, en esa organización.
    const [, where] = d.finds.find(([e]) => e === TenantMemberships)!;
    expect(where).toEqual({
      userId: { $in: ['user-ana'] },
      tenantId: TENANT,
      statusConceptId: DIR.MEMBERSHIP_INVITED,
    });
    const [, linkWhere] = d.finds.find(([e]) => e === PersonAccountLinks)!;
    expect(linkWhere).toEqual({
      personId: 'hp1',
      statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
    });
  });

  it('rechazar termina la membresía pendiente con fecha de fin', async () => {
    const membership = pendingMembership();
    const d = build([membership]);

    const changed = await d.service.settle(d.tx, role(), false, 'admin-1');

    expect(changed).toBe(1);
    expect(membership.statusConceptId).toBe(DIR.MEMBERSHIP_ENDED);
    expect(membership.endDate).toBeInstanceOf(Date);
  });

  it('rechazar no termina la membresía si el médico conserva otra solicitud pendiente en la práctica', async () => {
    const membership = pendingMembership();
    const d = build([membership], undefined, 1);

    const changed = await d.service.settle(d.tx, role(), false, 'admin-1');

    expect(changed).toBe(0);
    expect(membership.statusConceptId).toBe(DIR.MEMBERSHIP_INVITED);
    expect(d.tx.count).toHaveBeenCalledWith(
      PractitionerRoleAssignments,
      expect.objectContaining({
        practitionerProfileId: 'hp1',
        practiceId: 'p1',
        statusConceptId: PRAC.ROLE_ASSIGNMENT_PENDING,
        id: { $ne: 'r1' },
      }),
    );
  });

  it('un médico sin membresía pendiente (pidió por su cuenta, o ya es miembro) no cambia nada', async () => {
    const d = build([]);
    await expect(d.service.settle(d.tx, role(), true, 'admin-1')).resolves.toBe(
      0,
    );
  });

  it('sin cuentas activas para el perfil, o sin práctica, no toca membresías', async () => {
    const noAccounts = build([pendingMembership()], []);
    await expect(
      noAccounts.service.settle(noAccounts.tx, role(), true, 'a'),
    ).resolves.toBe(0);
    expect(noAccounts.finds.some(([e]) => e === TenantMemberships)).toBe(false);

    const noPractice = build([pendingMembership()]);
    noPractice.practicesRepo.findById.mockResolvedValue(null);
    await expect(
      noPractice.service.settle(noPractice.tx, role(), true, 'a'),
    ).resolves.toBe(0);
  });

  it('con RLS escribe en el contexto de la organización de la práctica y lo devuelve (finally)', async () => {
    process.env.RLS_ENFORCE = 'true';
    const settings: Record<string, string> = {
      'app.system_context': 'false',
      'app.current_tenant_id': 'otra-organizacion',
    };
    const membership = pendingMembership();
    let seenInside = '';
    const d = build([membership]);
    d.tx.execute = mockFn((sql: string, params?: unknown[]) => {
      if (sql.includes('current_setting')) {
        return Promise.resolve([
          {
            sc: settings['app.system_context'],
            tid: settings['app.current_tenant_id'],
          },
        ]);
      }
      const key = /'(app\.[a-z_]+)'/.exec(sql)![1];
      settings[key] = params ? String(params[0]) : 'false';
      return Promise.resolve([]);
    });
    const find = d.tx.find;
    d.tx.find = mockFn((entity: unknown, where: any) => {
      if (entity === TenantMemberships) {
        seenInside = settings['app.current_tenant_id'];
      }
      return find(entity, where);
    });

    await d.service.settle(d.tx, role(), true, 'admin-1');

    expect(seenInside).toBe(TENANT);
    expect(settings['app.current_tenant_id']).toBe('otra-organizacion');
    expect(settings['app.system_context']).toBe('false');
  });
});
