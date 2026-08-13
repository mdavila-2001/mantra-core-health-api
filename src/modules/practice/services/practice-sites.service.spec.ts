import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PracticeSitesService } from './practice-sites.service';
import { runWithTenant } from '../../../common';
import { PRAC } from '../practice.concepts';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    // `listPractices` lee fuera de transacción, con su propio fork.
    fork: mockFn(() => ({})),
  };
  const practicesRepo = {
    findActive: mockFn(),
    findById: mockFn(),
    findByTenant: mockFn().mockResolvedValue([]),
    create: mockFn(),
  };
  const sitesRepo = {
    findById: mockFn(),
    findByPracticeAndCode: mockFn(),
    create: mockFn(),
  };
  const unitsRepo = { findBySite: mockFn().mockResolvedValue([]) };
  const spacesRepo = { findBySite: mockFn().mockResolvedValue([]) };
  const servicesRepo = { findBySite: mockFn().mockResolvedValue([]) };
  const rolesRepo = { findBySite: mockFn().mockResolvedValue([]) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new PracticeSitesService(
    em as any,
    practicesRepo,
    sitesRepo,
    unitsRepo as any,
    spacesRepo as any,
    servicesRepo as any,
    rolesRepo as any,
    logger as any,
  );
  return {
    service,
    tx,
    practicesRepo,
    sitesRepo,
    unitsRepo,
    spacesRepo,
    servicesRepo,
    rolesRepo,
  };
}

describe('PracticeSitesService', () => {
  describe('listPractices (la lectura que faltaba)', () => {
    it('acota al tenant del contexto y mapea nombre y moneda', async () => {
      const { service, practicesRepo } = build();
      practicesRepo.findByTenant.mockResolvedValue([
        {
          id: 'p-1',
          code: 'CLN-001',
          name: 'Clínica San Rafael',
          typeConceptId: 't-1',
          statusConceptId: 's-1',
          currencyConceptId: 'c-1',
          timeZone: 'America/La_Paz',
        },
      ]);

      const res = await runWithTenant('tenant-9', () =>
        service.listPractices(),
      );

      expect(practicesRepo.findByTenant).toHaveBeenCalledWith(
        expect.anything(),
        'tenant-9',
        expect.any(Number),
      );
      expect(res.count).toBe(1);
      expect(res.items[0]).toMatchObject({
        name: 'Clínica San Rafael',
        currencyConceptId: 'c-1',
      });
    });

    it('sin tenant en contexto no consulta y devuelve vacío', async () => {
      const { service, practicesRepo } = build();

      // Los carriles internos (SYSTEM, workers) no mandan `X-Tenant-Id`. Sin
      // tenant contra el que acotar, devolver «todas» sería una fuga.
      const res = await service.listPractices();

      expect(res).toEqual({ items: [], count: 0 });
      expect(practicesRepo.findByTenant).not.toHaveBeenCalled();
    });
  });

  describe('createPractice (bootstrap)', () => {
    it('creates and flushes the practice', async () => {
      const d = build();
      const created = {
        id: 'p1',
        code: 'P-1',
        statusConceptId: PRAC.PRACTICE_ACTIVE,
        createdAt: new Date(),
      };
      d.practicesRepo.create.mockReturnValue(created);

      const res = await d.service.createPractice(
        { tenantId: 't1', code: 'P-1', name: 'Acme' },
        actor,
      );

      expect(res).toEqual({
        id: 'p1',
        code: 'P-1',
        status: PRAC.PRACTICE_ACTIVE,
        createdAt: created.createdAt,
      });
      expect(d.tx.flush).toHaveBeenCalled();
    });
  });

  describe('createSite (UC-14-01)', () => {
    it('rejects when the practice does not exist', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.createSite('p1', { code: 'S-1', name: 'Site' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects when the practice is not active', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue({
        id: 'p1',
        statusConceptId: 'other',
      });
      await expect(
        d.service.createSite('p1', { code: 'S-1', name: 'Site' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a duplicated site code', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue({
        id: 'p1',
        statusConceptId: PRAC.PRACTICE_ACTIVE,
      });
      d.sitesRepo.findByPracticeAndCode.mockResolvedValue({ id: 'dup' });
      await expect(
        d.service.createSite('p1', { code: 'S-1', name: 'Site' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates a site with PLANNED operational status', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue({
        id: 'p1',
        statusConceptId: PRAC.PRACTICE_ACTIVE,
      });
      d.sitesRepo.findByPracticeAndCode.mockResolvedValue(null);
      const created = {
        id: 's1',
        practiceId: 'p1',
        code: 'S-1',
        statusConceptId: PRAC.SITE_ACTIVE,
        operationalStatusConceptId: PRAC.SITE_OP_PLANNED,
        createdAt: new Date(),
      };
      d.sitesRepo.create.mockReturnValue(created);

      const res = await d.service.createSite(
        'p1',
        { code: 'S-1', name: 'Site' },
        actor,
      );

      expect(res.operationalStatus).toBe(PRAC.SITE_OP_PLANNED);
      expect(d.sitesRepo.create).toHaveBeenCalled();
      expect(d.tx.flush).toHaveBeenCalled();
    });
  });

  describe('decommissionSite (UC-14-12)', () => {
    it('throws when the site is not in the practice', async () => {
      const d = build();
      d.sitesRepo.findById.mockResolvedValue({ id: 's1', practiceId: 'other' });
      await expect(
        d.service.decommissionSite('p1', 's1', actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('soft-deletes the site and cascades to children', async () => {
      const d = build();
      const site = {
        id: 's1',
        practiceId: 'p1',
        statusConceptId: PRAC.SITE_ACTIVE,
        operationalStatusConceptId: PRAC.SITE_OP_PLANNED,
        updatedAt: new Date(),
      };
      d.sitesRepo.findById.mockResolvedValue(site);
      const unit = { statusConceptId: PRAC.UNIT_ACTIVE, updatedAt: new Date() };
      const space = {
        statusConceptId: PRAC.SPACE_ACTIVE,
        operationalStatusConceptId: PRAC.SPACE_OP_AVAILABLE,
        updatedAt: new Date(),
      };
      const svc = {
        statusConceptId: PRAC.SERVICE_ACTIVE,
        updatedAt: new Date(),
      };
      const role = {
        statusConceptId: PRAC.ROLE_ASSIGNMENT_ACTIVE,
        validTo: undefined,
        updatedAt: new Date(),
      };
      d.unitsRepo.findBySite.mockResolvedValue([unit]);
      d.spacesRepo.findBySite.mockResolvedValue([space]);
      d.servicesRepo.findBySite.mockResolvedValue([svc]);
      d.rolesRepo.findBySite.mockResolvedValue([role]);

      const res = await d.service.decommissionSite('p1', 's1', actor);

      expect(res).toEqual({ ok: true });
      expect(site.statusConceptId).toBe(PRAC.SITE_RETIRED);
      expect(site.operationalStatusConceptId).toBe(PRAC.SITE_OP_CLOSED);
      expect(unit.statusConceptId).toBe(PRAC.UNIT_RETIRED);
      expect(space.statusConceptId).toBe(PRAC.SPACE_RETIRED);
      expect(svc.statusConceptId).toBe(PRAC.SERVICE_SUSPENDED);
      expect(role.statusConceptId).toBe(PRAC.ROLE_ASSIGNMENT_ENDED);
      expect(role.validTo).toBeInstanceOf(Date);
    });
  });
});
