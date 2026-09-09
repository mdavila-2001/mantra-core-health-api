import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { OwnSiteProvisioningService } from './own-site-provisioning.service';
import { PRAC } from '../practice.concepts';
import { CONCEPTS } from '../../../common';

const OWNER = {
  tenantId: 'tenant-1',
  userId: 'user-1',
  practitionerProfileId: 'prac-1',
};

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const practicesRepo = {
    findOwnOffice: mockFn().mockResolvedValue(null),
    create: mockFn().mockReturnValue({ id: 'pr-own-1' }),
  };
  const sitesRepo = {
    findByPracticeAndCode: mockFn().mockResolvedValue(null),
    create: mockFn().mockReturnValue({
      id: 'site-own-1',
      practiceId: 'pr-own-1',
      code: 'MI-CONSULTORIO',
      name: 'Mi consultorio',
      timeZone: undefined,
      statusConceptId: PRAC.SITE_ACTIVE,
    }),
  };
  const rolesRepo = { create: mockFn().mockReturnValue({ id: 'role-1' }) };
  const addressesRepo = { create: mockFn().mockReturnValue({ id: 'addr-1' }) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new OwnSiteProvisioningService(
    practicesRepo as any,
    sitesRepo as any,
    rolesRepo as any,
    addressesRepo as any,
    logger as any,
  );
  return {
    service,
    tx,
    practicesRepo,
    sitesRepo,
    rolesRepo,
    addressesRepo,
    logger,
  };
}

describe('OwnSiteProvisioningService', () => {
  describe('provision', () => {
    it('creates a new personal practice, the site and the active role assignment', async () => {
      const d = build();

      const res = await d.service.provision(
        d.tx as any,
        OWNER,
        { name: 'Mi consultorio' } as any,
        OWNER.userId,
      );

      expect(d.practicesRepo.findOwnOffice).toHaveBeenCalledWith(
        d.tx,
        OWNER.tenantId,
        OWNER.userId,
        PRAC.PRACTICE_TYPE_OFFICE,
      );
      // Determinista y único por usuario: dos altas del mismo profesional
      // deben resolver a la MISMA práctica, no chocar por código.
      expect(d.practicesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          tenantId: OWNER.tenantId,
          code: `OFFICE-${OWNER.userId}`,
          name: 'Consultorio propio',
          typeConceptId: PRAC.PRACTICE_TYPE_OFFICE,
          adminUserId: OWNER.userId,
          statusConceptId: PRAC.PRACTICE_ACTIVE,
          actorUserId: OWNER.userId,
        }),
      );
      expect(d.sitesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          practiceId: 'pr-own-1',
          siteTypeConceptId: PRAC.SITE_TYPE_OFFICE,
          operationalStatusConceptId: PRAC.SITE_OP_PLANNED,
          managingTenantId: OWNER.tenantId,
          statusConceptId: PRAC.SITE_ACTIVE,
        }),
      );
      expect(d.rolesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          practitionerProfileId: OWNER.practitionerProfileId,
          practiceId: 'pr-own-1',
          practiceSiteId: 'site-own-1',
          roleConceptId: PRAC.ROLE_ATTENDING,
          statusConceptId: PRAC.ROLE_ASSIGNMENT_ACTIVE,
          isPrimary: false,
        }),
      );
      expect(res).toMatchObject({
        practiceId: 'pr-own-1',
        siteId: 'site-own-1',
        addressId: undefined,
      });
    });

    it('reuses the existing personal practice', async () => {
      const d = build();
      d.practicesRepo.findOwnOffice.mockResolvedValue({ id: 'pr-own-1' });

      await d.service.provision(
        d.tx as any,
        OWNER,
        { name: 'Segundo consultorio' } as any,
        OWNER.userId,
      );

      expect(d.practicesRepo.create).not.toHaveBeenCalled();
      expect(d.sitesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          practiceId: 'pr-own-1',
          addressId: undefined,
        }),
      );
    });

    it('archives the address as WORK, with coordinates serialized as strings', async () => {
      const d = build();

      const res = await d.service.provision(
        d.tx as any,
        OWNER,
        {
          name: 'Mi consultorio',
          address: {
            lines: ['Av. Brasil 1234', 'Piso 2'],
            city: 'La Paz',
            municipalityConceptId: 'mun-1',
            latitude: -16.5,
            longitude: -68.15,
          },
        } as any,
        OWNER.userId,
      );

      expect(d.addressesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          ownerTypeConceptId: CONCEPTS.OWNER_USER,
          ownerId: OWNER.userId,
          lines: 'Av. Brasil 1234\nPiso 2',
          city: 'La Paz',
          municipalityConceptId: 'mun-1',
          countryConceptId: CONCEPTS.COUNTRY_BO,
          useConceptId: CONCEPTS.ADDR_USE_WORK,
          typeConceptId: CONCEPTS.ADDR_TYPE_POSTAL,
          latitude: '-16.5',
          longitude: '-68.15',
        }),
      );
      expect(d.sitesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ addressId: 'addr-1' }),
      );
      expect(res.addressId).toBe('addr-1');
    });

    it('persists no lines when address.lines is empty or blank', async () => {
      const d = build();

      await d.service.provision(
        d.tx as any,
        OWNER,
        {
          name: 'Mi consultorio',
          address: { lines: [], municipalityConceptId: 'mun-1' },
        } as any,
        OWNER.userId,
      );

      expect(d.addressesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ lines: undefined }),
      );

      const d2 = build();
      await d2.service.provision(
        d2.tx as any,
        OWNER,
        { name: 'Mi consultorio', address: { lines: ['   '] } } as any,
        OWNER.userId,
      );
      expect(d2.addressesRepo.create).toHaveBeenCalledWith(
        d2.tx,
        expect.objectContaining({ lines: undefined }),
      );
    });

    it('resolves a code clash by appending a numeric suffix', async () => {
      const d = build();
      d.sitesRepo.findByPracticeAndCode
        .mockResolvedValueOnce({ id: 'existing' })
        .mockResolvedValueOnce(null);

      await d.service.provision(
        d.tx as any,
        OWNER,
        { name: 'Consultorio Suárez' } as any,
        OWNER.userId,
      );

      expect(d.sitesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ code: 'CONSULTORIO-SUAREZ-2' }),
      );
    });

    it('propagates a distinct actorUserId to every created row without touching the owner ids', async () => {
      const d = build();

      await d.service.provision(
        d.tx as any,
        OWNER,
        {
          name: 'Mi consultorio',
          address: { lines: ['Av. Brasil 1234'] },
        } as any,
        'admin-1',
      );

      expect(d.practicesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          adminUserId: OWNER.userId,
          actorUserId: 'admin-1',
        }),
      );
      expect(d.addressesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          ownerId: OWNER.userId,
          actorUserId: 'admin-1',
        }),
      );
      expect(d.sitesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ actorUserId: 'admin-1' }),
      );
      expect(d.rolesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          practitionerProfileId: OWNER.practitionerProfileId,
          actorUserId: 'admin-1',
        }),
      );
    });

    it('flushes the parent before creating each dependent row', async () => {
      const d = build();

      await d.service.provision(
        d.tx as any,
        OWNER,
        {
          name: 'Mi consultorio',
          address: { lines: ['Av. Brasil 1234'] },
        } as any,
        OWNER.userId,
      );

      // Práctica, dirección, sede y rol: cuatro filas con FK a la anterior.
      expect(d.tx.flush).toHaveBeenCalledTimes(4);
    });
  });
});
