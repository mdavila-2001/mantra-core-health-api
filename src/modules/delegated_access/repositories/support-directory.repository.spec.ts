import { jest } from '@jest/globals';
import { DIR } from '../../directory/directory.concepts';
import { TenantMemberships } from '../../directory/entities';
import { SupportDirectoryRepository } from './support-directory.repository';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const ADMIN = 'admin-1';

/** `em` mínimo: `find` devuelve las membresías previas y `create` las entidades nuevas. */
function build(existing: Record<string, unknown>[] = []) {
  const created: Record<string, unknown>[] = [];
  const em = {
    find: mockFn().mockResolvedValue(existing),
    create: mockFn((_entity: unknown, data: Record<string, unknown>) => {
      created.push(data);
      return data;
    }),
  };
  return { repo: new SupportDirectoryRepository(), em, created };
}

const membership = (over: Record<string, unknown> = {}) => ({
  id: 'mem-1',
  statusConceptId: DIR.MEMBERSHIP_ACTIVE,
  originConceptId: undefined,
  ...over,
});

describe('SupportDirectoryRepository (N10c: origen de la membresía)', () => {
  describe('ensureActiveStaffMembership', () => {
    it('una membresía nueva guarda el origen que pide el flujo', async () => {
      const d = build();
      await d.repo.ensureActiveStaffMembership(
        d.em as any,
        'user-1',
        'tenant-1',
        DIR.MEMBERSHIP_ORIGIN_SUPPORT_ENGAGEMENT,
        ADMIN,
      );
      expect(d.em.create).toHaveBeenCalledWith(
        TenantMemberships,
        expect.objectContaining({
          originConceptId: DIR.MEMBERSHIP_ORIGIN_SUPPORT_ENGAGEMENT,
          statusConceptId: DIR.MEMBERSHIP_ACTIVE,
          invitedByUserId: ADMIN,
        }),
        { partial: true },
      );
    });

    it.each([
      ['sin origen (fila anterior)', undefined],
      ['ADMIN_ADDED', DIR.MEMBERSHIP_ORIGIN_ADMIN_ADDED],
      ['OWNER_CREATED', DIR.MEMBERSHIP_ORIGIN_OWNER_CREATED],
      ['INVITATION_REDEEMED', DIR.MEMBERSHIP_ORIGIN_INVITATION_REDEEMED],
    ])(
      'un empleado con origen %s al que se le da un vínculo de apoyo NO cambia su origen',
      async (_name, origin) => {
        const existing = membership({ originConceptId: origin });
        const d = build([existing]);
        const res = await d.repo.ensureActiveStaffMembership(
          d.em as any,
          'user-1',
          'tenant-1',
          DIR.MEMBERSHIP_ORIGIN_SUPPORT_ENGAGEMENT,
          ADMIN,
        );
        expect(res).toBe(existing);
        expect(existing.originConceptId).toBe(origin);
        expect(d.em.create).not.toHaveBeenCalled();
      },
    );

    it('reactivar una membresía terminada tampoco le cambia el origen', async () => {
      const existing = membership({
        statusConceptId: DIR.MEMBERSHIP_ENDED,
        originConceptId: DIR.MEMBERSHIP_ORIGIN_ADMIN_ADDED,
      });
      const d = build([existing]);
      await d.repo.ensureActiveStaffMembership(
        d.em as any,
        'user-1',
        'tenant-1',
        DIR.MEMBERSHIP_ORIGIN_SUPPORT_ENGAGEMENT,
        ADMIN,
      );
      expect(existing.statusConceptId).toBe(DIR.MEMBERSHIP_ACTIVE);
      expect(existing.originConceptId).toBe(DIR.MEMBERSHIP_ORIGIN_ADMIN_ADDED);
    });

    it('quien existía solo por apoyo y entra por la invitación de un doctor deja de ser solo-apoyo', async () => {
      const existing = membership({
        originConceptId: DIR.MEMBERSHIP_ORIGIN_SUPPORT_ENGAGEMENT,
      });
      const d = build([existing]);
      await d.repo.ensureActiveStaffMembership(
        d.em as any,
        'user-1',
        'tenant-1',
        DIR.MEMBERSHIP_ORIGIN_INVITATION_REDEEMED,
        ADMIN,
      );
      expect(existing.originConceptId).toBe(
        DIR.MEMBERSHIP_ORIGIN_INVITATION_REDEEMED,
      );
    });

    it('un segundo vínculo de apoyo no toca el origen SUPPORT_ENGAGEMENT', async () => {
      const existing = membership({
        originConceptId: DIR.MEMBERSHIP_ORIGIN_SUPPORT_ENGAGEMENT,
      });
      const d = build([existing]);
      await d.repo.ensureActiveStaffMembership(
        d.em as any,
        'user-1',
        'tenant-1',
        DIR.MEMBERSHIP_ORIGIN_SUPPORT_ENGAGEMENT,
        ADMIN,
      );
      expect(existing.originConceptId).toBe(
        DIR.MEMBERSHIP_ORIGIN_SUPPORT_ENGAGEMENT,
      );
    });
  });

  describe('ensurePendingStaffMembership', () => {
    it('la membresía pendiente de un doctor nace INVITED con el origen de la invitación', async () => {
      const d = build();
      await d.repo.ensurePendingStaffMembership(
        d.em as any,
        'user-1',
        'tenant-1',
        DIR.MEMBERSHIP_ORIGIN_INVITATION_REDEEMED,
        ADMIN,
      );
      expect(d.em.create).toHaveBeenCalledWith(
        TenantMemberships,
        expect.objectContaining({
          originConceptId: DIR.MEMBERSHIP_ORIGIN_INVITATION_REDEEMED,
          statusConceptId: DIR.MEMBERSHIP_INVITED,
        }),
        { partial: true },
      );
    });

    it('una membresía activa existente conserva su origen', async () => {
      const existing = membership({
        originConceptId: DIR.MEMBERSHIP_ORIGIN_OWNER_CREATED,
      });
      const d = build([existing]);
      const res = await d.repo.ensurePendingStaffMembership(
        d.em as any,
        'user-1',
        'tenant-1',
        DIR.MEMBERSHIP_ORIGIN_INVITATION_REDEEMED,
        ADMIN,
      );
      expect(res).toBe(existing);
      expect(existing.originConceptId).toBe(
        DIR.MEMBERSHIP_ORIGIN_OWNER_CREATED,
      );
    });

    it('quien existía solo por apoyo y canjea el QR de un doctor deja de ser solo-apoyo', async () => {
      const existing = membership({
        originConceptId: DIR.MEMBERSHIP_ORIGIN_SUPPORT_ENGAGEMENT,
      });
      const d = build([existing]);
      await d.repo.ensurePendingStaffMembership(
        d.em as any,
        'user-1',
        'tenant-1',
        DIR.MEMBERSHIP_ORIGIN_INVITATION_REDEEMED,
        ADMIN,
      );
      expect(existing.originConceptId).toBe(
        DIR.MEMBERSHIP_ORIGIN_INVITATION_REDEEMED,
      );
    });
  });
});
