import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PractitionerSitesService } from './practitioner-sites.service';
import { PRAC } from '../practice.concepts';
import { ResourceNotFoundException } from '../../../common';

const TENANT = 'tenant-1';
const OTRO_TENANT = 'tenant-2';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const fork = { findOne: mockFn().mockResolvedValue(null) };
  const em = { fork: mockFn(() => fork) };
  const practicesRepo = {
    findById: mockFn().mockResolvedValue({ id: 'pr-1', tenantId: TENANT }),
  };
  const sitesRepo = { findById: mockFn().mockResolvedValue(null) };
  const spacesRepo = { findById: mockFn().mockResolvedValue(null) };
  const rolesRepo = { findCurrentWithSite: mockFn().mockResolvedValue([]) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new PractitionerSitesService(
    em as any,
    practicesRepo as any,
    sitesRepo as any,
    spacesRepo as any,
    rolesRepo as any,
    logger as any,
  );
  return {
    service,
    fork,
    practicesRepo,
    sitesRepo,
    spacesRepo,
    rolesRepo,
    logger,
  };
}

/** Una sede de la práctica del tenant. */
const sede = (over: Record<string, unknown> = {}): any => ({
  id: 'site-1',
  practiceId: 'pr-1',
  code: 'CC',
  name: 'Consultorio Central',
  timeZone: 'America/La_Paz',
  statusConceptId: PRAC.SITE_ACTIVE,
  ...over,
});

describe('PractitionerSitesService', () => {
  describe('listSitesOfPractitioner', () => {
    it('resolves the sites of the practitioner current assignments', async () => {
      const d = build();
      d.rolesRepo.findCurrentWithSite.mockResolvedValue([
        { practitionerProfileId: 'prac-1', practiceSiteId: 'site-1' },
      ]);
      d.sitesRepo.findById.mockResolvedValue(sede());

      const res = await d.service.listSitesOfPractitioner('prac-1', TENANT);

      expect(d.rolesRepo.findCurrentWithSite).toHaveBeenCalledWith(
        d.fork,
        ['prac-1'],
        PRAC.ROLE_ASSIGNMENT_ACTIVE,
      );
      expect(res).toHaveLength(1);
      expect(res[0]).toMatchObject({
        id: 'site-1',
        name: 'Consultorio Central',
        addressText: null,
      });
    });

    it('returns an empty list when there is no current assignment with a site', async () => {
      const d = build();
      // Vacío es «no tiene asignación vigente con sede», no un error: quien lo
      // consuma no debe leerlo como que el profesional no existe.
      await expect(
        d.service.listSitesOfPractitioner('prac-1', TENANT),
      ).resolves.toEqual([]);
    });

    it('drops sites that belong to another organization', async () => {
      const d = build();
      d.rolesRepo.findCurrentWithSite.mockResolvedValue([
        { practitionerProfileId: 'prac-1', practiceSiteId: 'site-1' },
      ]);
      d.sitesRepo.findById.mockResolvedValue(sede());
      d.practicesRepo.findById.mockResolvedValue({
        id: 'pr-1',
        tenantId: OTRO_TENANT,
      });

      const res = await d.service.listSitesOfPractitioner('prac-1', TENANT);

      expect(res).toEqual([]);
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('composes the address in one line, skipping the empty pieces', async () => {
      const d = build();
      d.rolesRepo.findCurrentWithSite.mockResolvedValue([
        { practitionerProfileId: 'prac-1', practiceSiteId: 'site-1' },
      ]);
      d.sitesRepo.findById.mockResolvedValue(sede({ addressId: 'addr-1' }));
      d.fork.findOne.mockResolvedValue({
        lines: 'Av. Brasil 1234',
        city: 'La Paz',
        postalCode: '   ',
      });

      const res = await d.service.listSitesOfPractitioner('prac-1', TENANT);

      expect(res[0].addressText).toBe('Av. Brasil 1234, La Paz');
    });
  });

  describe('resolveSitesForResources', () => {
    it('maps a practitioner resource to the site of its primary assignment', async () => {
      const d = build();
      d.rolesRepo.findCurrentWithSite.mockResolvedValue([
        { practitionerProfileId: 'prac-1', practiceSiteId: 'site-1' },
        { practitionerProfileId: 'prac-1', practiceSiteId: 'site-9' },
      ]);
      d.sitesRepo.findById.mockResolvedValue(sede());

      const res = await d.service.resolveSitesForResources(
        [{ refType: 'health_practitioner_profiles', refId: 'prac-1' }],
        TENANT,
      );

      // La primera gana: el repositorio ya puso la principal delante.
      expect(res.get('prac-1')).toMatchObject({ id: 'site-1' });
    });

    it('maps a care space resource through its site', async () => {
      const d = build();
      d.spacesRepo.findById.mockResolvedValue({
        id: 'space-9',
        practiceSiteId: 'site-1',
      });
      d.sitesRepo.findById.mockResolvedValue(sede());

      const res = await d.service.resolveSitesForResources(
        [{ refType: 'care_spaces', refId: 'space-9' }],
        TENANT,
      );

      expect(res.get('space-9')).toMatchObject({ id: 'site-1' });
    });

    it('ignores reference types it does not know how to resolve', async () => {
      const d = build();
      const res = await d.service.resolveSitesForResources(
        [{ refType: 'equipment_units', refId: 'eq-1' }],
        TENANT,
      );
      expect(res.size).toBe(0);
      expect(d.rolesRepo.findCurrentWithSite).toHaveBeenCalledWith(
        expect.anything(),
        [],
        PRAC.ROLE_ASSIGNMENT_ACTIVE,
      );
    });

    it('does not query anything for an empty resource list', async () => {
      const d = build();
      const res = await d.service.resolveSitesForResources([], TENANT);
      expect(res.size).toBe(0);
      expect(d.rolesRepo.findCurrentWithSite).not.toHaveBeenCalled();
    });
  });

  describe('getSite', () => {
    it('fails with not found when the site belongs to another organization', async () => {
      const d = build();
      d.sitesRepo.findById.mockResolvedValue(sede());
      d.practicesRepo.findById.mockResolvedValue({
        id: 'pr-1',
        tenantId: OTRO_TENANT,
      });

      await expect(d.service.getSite('site-1', TENANT)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });
  });
});
