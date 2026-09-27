import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import {
  daysUntil,
  PharmacyStaffReadService,
} from './pharmacy-staff-read.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const ACTOR = { id: 'user-staff', roles: ['USER'] } as any;

const HABILITACION = {
  id: 'concept-lic',
  code: 'PHARM_LICENSE_OPERATING',
  display: 'Licencia de funcionamiento',
};
const VERIFICADA = {
  id: 'concept-verified',
  code: 'PHARM_VERIFICATION_VERIFIED',
  display: 'Verificada',
};

function pharmacy() {
  return { id: 'ph-1', tenantId: 'tenant-a', legalName: 'Farmacia S.R.L.' };
}

function build() {
  const fork = {};
  const em = { fork: mockFn(() => fork) };
  const repo = {
    findByIdInTenant: mockFn().mockResolvedValue(null),
    findLicenses: mockFn().mockResolvedValue([]),
    findSitesByIds: mockFn().mockResolvedValue([]),
    findConcepts: mockFn().mockResolvedValue([]),
  };
  const tenantAdmin = { assertCanRead: mockFn().mockResolvedValue(undefined) };
  const directoryRead = { readRepresentation: mockFn().mockResolvedValue({}) };
  const service = new PharmacyStaffReadService(
    em as any,
    repo as any,
    tenantAdmin as any,
    directoryRead as any,
  );
  return { service, repo, tenantAdmin, directoryRead, fork };
}

describe('PharmacyStaffReadService', () => {
  describe('alcance', () => {
    it('requires the active tenant instead of accepting one from the client', async () => {
      const d = build();
      await expect(
        d.service.listLicenses('ph-1', ACTOR),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('answers 404 for a pharmacy outside the active tenant', async () => {
      const d = build();
      await expect(
        runWithTenant('tenant-a', () => d.service.listLicenses('ph-x', ACTOR)),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.repo.findByIdInTenant).toHaveBeenCalledWith(
        d.fork,
        'tenant-a',
        'ph-x',
      );
      expect(d.tenantAdmin.assertCanRead).not.toHaveBeenCalled();
    });

    it('answers the same 404 to someone outside the organization, never 403', async () => {
      const d = build();
      d.repo.findByIdInTenant.mockResolvedValue(pharmacy());
      d.tenantAdmin.assertCanRead.mockRejectedValue(
        new ForbiddenException('fuera'),
      );

      await expect(
        runWithTenant('tenant-a', () => d.service.getContacts('ph-1', ACTOR)),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.tenantAdmin.assertCanRead).toHaveBeenCalledWith(
        d.fork,
        'tenant-a',
        ACTOR,
      );
      expect(d.directoryRead.readRepresentation).not.toHaveBeenCalled();
    });

    it('lets any other failure of the scope check through untouched', async () => {
      const d = build();
      d.repo.findByIdInTenant.mockResolvedValue(pharmacy());
      const boom = new Error('db caída');
      d.tenantAdmin.assertCanRead.mockRejectedValue(boom);

      await expect(
        runWithTenant('tenant-a', () => d.service.listLicenses('ph-1', ACTOR)),
      ).rejects.toBe(boom);
    });
  });

  describe('licencias', () => {
    it('serves the folder with resolved concepts, site and days to expiry', async () => {
      const d = build();
      d.repo.findByIdInTenant.mockResolvedValue(pharmacy());
      const inTenDays = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      d.repo.findLicenses.mockResolvedValue([
        {
          id: 'lic-1',
          pharmacyId: 'ph-1',
          pharmacySiteId: 'site-1',
          licenseTypeConceptId: HABILITACION.id,
          licenseNumber: 'LF-2026-0001',
          validFrom: new Date('2026-01-01T00:00:00Z'),
          validTo: inTenDays,
          verificationStatusConceptId: VERIFICADA.id,
          evidenceFileId: 'file-1',
        },
        {
          id: 'lic-2',
          pharmacyId: 'ph-1',
          licenseTypeConceptId: 'concept-desconocido',
          licenseNumber: 'SEDES-77',
          verificationStatusConceptId: VERIFICADA.id,
        },
      ]);
      d.repo.findSitesByIds.mockResolvedValue([
        { id: 'site-1', name: 'Sede Centro' },
      ]);
      d.repo.findConcepts.mockResolvedValue([HABILITACION, VERIFICADA]);

      const result = await runWithTenant('tenant-a', () =>
        d.service.listLicenses('ph-1', ACTOR),
      );

      expect(result.count).toBe(2);
      expect(result.items[0]).toEqual({
        id: 'lic-1',
        type: { code: HABILITACION.code, display: HABILITACION.display },
        number: 'LF-2026-0001',
        siteId: 'site-1',
        siteName: 'Sede Centro',
        jurisdiction: null,
        validFrom: '2026-01-01',
        validTo: inTenDays.toISOString().slice(0, 10),
        daysToExpiry: 10,
        verificationStatus: {
          code: VERIFICADA.code,
          display: VERIFICADA.display,
        },
        evidenceFileId: 'file-1',
      });
      // La licencia de la farmacia entera y sin vigencia declarada: sin sede,
      // sin plazo y con el tipo desconocido dicho null — nada inventado.
      expect(result.items[1]).toMatchObject({
        siteId: null,
        siteName: null,
        type: null,
        validTo: null,
        daysToExpiry: null,
        evidenceFileId: null,
      });
    });

    it('returns an empty folder without relation queries', async () => {
      const d = build();
      d.repo.findByIdInTenant.mockResolvedValue(pharmacy());

      const result = await runWithTenant('tenant-a', () =>
        d.service.listLicenses('ph-1', ACTOR),
      );

      expect(result).toEqual({ items: [], count: 0 });
      expect(d.repo.findSitesByIds).not.toHaveBeenCalled();
      expect(d.repo.findConcepts).not.toHaveBeenCalled();
    });
  });

  describe('contactos', () => {
    it('serves representative and executives of the owner organization without their ID document', async () => {
      const d = build();
      d.repo.findByIdInTenant.mockResolvedValue(pharmacy());
      d.directoryRead.readRepresentation.mockResolvedValue({
        legalRepresentative: {
          role: 'LEGAL_REPRESENTATIVE',
          fullName: 'Ana Pérez',
          email: 'ana@farmacia.bo',
          phone: '+59170000001',
          idNumber: '1234567',
        },
        executives: [{ role: 'GENERAL_MANAGER', fullName: 'Luis Rojas' }],
      });

      const result = await runWithTenant('tenant-a', () =>
        d.service.getContacts('ph-1', ACTOR),
      );

      expect(d.directoryRead.readRepresentation).toHaveBeenCalledWith(
        'tenant-a',
      );
      expect(result).toEqual({
        legalRepresentative: {
          role: 'LEGAL_REPRESENTATIVE',
          fullName: 'Ana Pérez',
          email: 'ana@farmacia.bo',
          phone: '+59170000001',
        },
        executives: [
          {
            role: 'GENERAL_MANAGER',
            fullName: 'Luis Rojas',
            email: null,
            phone: null,
          },
        ],
      });
      expect(JSON.stringify(result)).not.toContain('1234567');
    });

    it('says null and empty when the organization registered nobody', async () => {
      const d = build();
      d.repo.findByIdInTenant.mockResolvedValue(pharmacy());

      const result = await runWithTenant('tenant-a', () =>
        d.service.getContacts('ph-1', ACTOR),
      );

      expect(result).toEqual({ legalRepresentative: null, executives: [] });
    });
  });

  describe('daysUntil', () => {
    const now = new Date('2026-09-26T23:30:00Z');

    it('counts calendar days: today is 0, not -1 by a few hours', () => {
      expect(daysUntil(new Date('2026-09-26T00:00:00Z'), now)).toBe(0);
      expect(daysUntil(new Date('2026-09-27T00:00:00Z'), now)).toBe(1);
    });

    it('is negative once expired', () => {
      expect(daysUntil(new Date('2026-09-20T00:00:00Z'), now)).toBe(-6);
    });

    it('is null without an end date', () => {
      expect(daysUntil(undefined, now)).toBeNull();
      expect(daysUntil(null, now)).toBeNull();
    });
  });
});
