import { jest } from '@jest/globals';
import { ConflictException } from '../../../common';
import { DIR } from '../../directory/directory.concepts';
import { SupportStaffProvisioningRepository } from './support-staff-provisioning.repository';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const DATA = { userId: 'u1', tenantId: 't1', actorUserId: 'admin-1' };

/** Un `EntityManager` cuya búsqueda de membresía devuelve `existing`. */
function emWith(existing: unknown) {
  return {
    findOne: mockFn().mockResolvedValue(existing),
    create: mockFn((_entity: unknown, data: any) => ({ id: 'new', ...data })),
    flush: mockFn().mockResolvedValue(undefined),
  };
}

/**
 * El alta directa abre la membresía de una cuenta recién creada. Una membresía
 * previa que no está activa (terminada, suspendida, invitada) la cerró o la
 * retuvo otra decisión: este camino no la revive.
 */
describe('SupportStaffProvisioningRepository.ensureActiveTenantMembership', () => {
  const repo = new SupportStaffProvisioningRepository();

  it.each([
    ['ENDED', DIR.MEMBERSHIP_ENDED],
    ['SUSPENDED', DIR.MEMBERSHIP_SUSPENDED],
    ['INVITED', DIR.MEMBERSHIP_INVITED],
  ])(
    'no reactiva una membresía %s: falla con 409 y no la toca',
    async (_label, status) => {
      const membership = { id: 'm1', statusConceptId: status };
      const em = emWith(membership);

      await expect(
        repo.ensureActiveTenantMembership(em as never, DATA),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(membership.statusConceptId).toBe(status);
      expect(em.flush).not.toHaveBeenCalled();
      expect(em.create).not.toHaveBeenCalled();
    },
  );

  it('devuelve la membresía ya activa sin modificarla', async () => {
    const membership = { id: 'm1', statusConceptId: DIR.MEMBERSHIP_ACTIVE };
    const em = emWith(membership);

    await expect(
      repo.ensureActiveTenantMembership(em as never, DATA),
    ).resolves.toBe(membership);
    expect(em.flush).not.toHaveBeenCalled();
  });

  it('sin membresía previa crea una de apoyo activa', async () => {
    const em = emWith(null);

    const created: any = await repo.ensureActiveTenantMembership(
      em as never,
      DATA,
    );
    expect(created.statusConceptId).toBe(DIR.MEMBERSHIP_ACTIVE);
    expect(created.tenantRoleConceptId).toBe(DIR.ROLE_SUPPORT);
  });
});
