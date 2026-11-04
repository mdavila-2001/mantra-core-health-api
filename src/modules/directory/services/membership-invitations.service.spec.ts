import { describe, expect, it, jest } from '@jest/globals';
import { AUDITED_KEY } from '../../../common/audit-trail/audit-trail.decorators';
import { DIR } from '../directory.concepts';
import { TenantMemberships, Tenants } from '../entities';
import { MembershipInvitationsService } from './membership-invitations.service';
import { MembershipInvitationsController } from '../controllers/membership-invitations.controller';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const ME = { id: 'user-me' } as any;

type Row = Partial<TenantMemberships> & { id: string };

/** In-memory `tenant_memberships` behind a fake transaction. */
function build(rows: Row[], tenants: Partial<Tenants>[] = []) {
  const matches = (row: Row, where: Record<string, any>) =>
    Object.entries(where).every(([key, cond]) =>
      cond && typeof cond === 'object' && '$ne' in cond
        ? (row as any)[key] !== cond.$ne
        : (row as any)[key] === cond,
    );
  const tx = {
    execute: mockFn(async () => []),
    flush: mockFn(async () => undefined),
    find: mockFn(async (entity: unknown, where: any) =>
      entity === Tenants
        ? tenants.filter((t) => where.id.$in.includes(t.id))
        : rows.filter((row) => matches(row, where)),
    ),
    findOne: mockFn(
      async (_entity: unknown, where: any) =>
        rows.find((row) => matches(row, where)) ?? null,
    ),
  };
  const em = { fork: () => ({ transactional: async (cb: any) => cb(tx) }) };
  return { service: new MembershipInvitationsService(em as any), tx };
}

const invited = (over: Partial<Row> = {}): Row => ({
  id: 'm-1',
  userId: ME.id,
  tenantId: 't-1',
  tenantRoleConceptId: DIR.ROLE_STAFF,
  statusConceptId: DIR.MEMBERSHIP_INVITED,
  createdAt: new Date('2026-11-01T10:00:00Z'),
  ...over,
});

describe('MembershipInvitationsService', () => {
  it('lists only my invited memberships, with tenant name and role code', async () => {
    const { service, tx } = build(
      [
        invited(),
        invited({
          id: 'm-2',
          tenantId: 't-2',
          tenantRoleConceptId: 'odd-role',
        }),
        invited({ id: 'm-3', userId: 'someone-else' }),
        invited({ id: 'm-4', statusConceptId: DIR.MEMBERSHIP_ACTIVE }),
        invited({ id: 'm-5', tenantRoleConceptId: DIR.ROLE_SUPPORT }),
      ],
      [
        {
          id: 't-1',
          tradeName: 'Lab Central',
          legalName: 'Lab SRL',
          code: 'L',
        },
        { id: 't-2', tradeName: '', legalName: 'Imagen SA', code: 'I' },
      ],
    );
    const { items } = await service.list(ME);
    expect(items).toEqual([
      {
        id: 'm-1',
        tenantId: 't-1',
        tenantName: 'Lab Central',
        role: 'STAFF',
        invitedAt: '2026-11-01T10:00:00.000Z',
      },
      {
        id: 'm-2',
        tenantId: 't-2',
        tenantName: 'Imagen SA',
        role: 'OTHER',
        invitedAt: '2026-11-01T10:00:00.000Z',
      },
    ]);
    expect(tx.execute).toHaveBeenCalledWith(
      "select set_config('app.system_context', 'true', true)",
    );
  });

  it('accept turns the membership active', async () => {
    const row = invited();
    const { service, tx } = build([row]);
    await expect(service.accept('m-1', ME)).resolves.toEqual({
      id: 'm-1',
      tenantId: 't-1',
      status: 'ACTIVE',
    });
    expect(row.statusConceptId).toBe(DIR.MEMBERSHIP_ACTIVE);
    expect(row.updatedByUserId).toBe(ME.id);
    expect(tx.flush).toHaveBeenCalled();
  });

  it('decline ends the membership', async () => {
    const row = invited();
    const { service } = build([row]);
    await expect(service.decline('m-1', ME)).resolves.toEqual({
      id: 'm-1',
      tenantId: 't-1',
      status: 'DECLINED',
    });
    expect(row.statusConceptId).toBe(DIR.MEMBERSHIP_ENDED);
    expect(row.endDate).toBeInstanceOf(Date);
  });

  it("someone else's invitation reads as missing (404)", async () => {
    const row = invited({ userId: 'someone-else' });
    const { service } = build([row]);
    await expect(service.accept('m-1', ME)).rejects.toMatchObject({
      status: 404,
    });
    await expect(service.decline('m-1', ME)).rejects.toMatchObject({
      status: 404,
    });
    expect(row.statusConceptId).toBe(DIR.MEMBERSHIP_INVITED);
  });

  it('a support-staff membership is not handled here (404)', async () => {
    const { service } = build([
      invited({ tenantRoleConceptId: DIR.ROLE_SUPPORT }),
    ]);
    await expect(service.accept('m-1', ME)).rejects.toMatchObject({
      status: 404,
    });
  });

  it('an already accepted invitation is a 409', async () => {
    const { service } = build([
      invited({ statusConceptId: DIR.MEMBERSHIP_ACTIVE }),
    ]);
    await expect(service.accept('m-1', ME)).rejects.toMatchObject({
      status: 409,
    });
    await expect(service.decline('m-1', ME)).rejects.toMatchObject({
      status: 409,
    });
  });

  it('accepting while already active in that tenant is a 409', async () => {
    const row = invited();
    const { service } = build([
      row,
      invited({ id: 'm-0', statusConceptId: DIR.MEMBERSHIP_ACTIVE }),
    ]);
    await expect(service.accept('m-1', ME)).rejects.toMatchObject({
      status: 409,
    });
    expect(row.statusConceptId).toBe(DIR.MEMBERSHIP_INVITED);
  });
});

describe('MembershipInvitationsController', () => {
  it('is tenant-agnostic and audits both decisions', () => {
    expect(
      Reflect.getMetadata('isTenantAgnostic', MembershipInvitationsController),
    ).toBe(true);
    const proto = MembershipInvitationsController.prototype as any;
    expect(Reflect.getMetadata(AUDITED_KEY, proto.accept)).toMatchObject({
      action: 'TENANT_MEMBERSHIP_ACCEPTED',
    });
    expect(Reflect.getMetadata(AUDITED_KEY, proto.decline)).toMatchObject({
      action: 'TENANT_MEMBERSHIP_DECLINED',
    });
  });
});
