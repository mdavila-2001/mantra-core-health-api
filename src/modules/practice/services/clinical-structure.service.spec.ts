import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ClinicalStructureService } from './clinical-structure.service';
import { ForbiddenException } from '@nestjs/common';
import { PRAC } from '../practice.concepts';
import { AUD } from '../../audit/audit.concepts';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;
const TENANT = 'tenant-a';
const OTHER_TENANT = 'tenant-b';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const practicesRepo = {
    findById: mockFn().mockResolvedValue({ id: 'p1', tenantId: TENANT }),
  };
  const sitesRepo = { findById: mockFn() };
  const unitsRepo = {
    findById: mockFn(),
    findBySite: mockFn().mockResolvedValue([]),
    create: mockFn(),
  };
  const servicesRepo = { create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  // F1: la pertenencia la resuelve `StructureAccessService` con el
  // `tenant_id` de la sede; el doble reproduce su contrato (404 si la sede
  // no es del tenant activo) sobre `sitesRepo`.
  const access = {
    requireSite: mockFn(async (_tx: any, siteId: string, tenantId: string) => {
      const site = await sitesRepo.findById(_tx, siteId);
      if (!site || site.tenantId !== tenantId) {
        throw new ResourceNotFoundException('Sitio no encontrado', { siteId });
      }
      return site;
    }),
    assertCanWriteSite: mockFn().mockResolvedValue(undefined),
  };
  const historyRepo = { append: mockFn().mockResolvedValue(undefined) };
  const outbox = { publishDomainEvent: mockFn().mockResolvedValue({}) };
  const service = new ClinicalStructureService(
    em as any,
    practicesRepo as any,
    sitesRepo as any,
    unitsRepo as any,
    servicesRepo as any,
    logger as any,
    access as any,
    historyRepo as any,
    outbox as any,
  );
  return {
    service,
    tx,
    practicesRepo,
    sitesRepo,
    unitsRepo,
    servicesRepo,
    access,
    historyRepo,
    outbox,
  };
}

const activeSite = {
  id: 's1',
  practiceId: 'p1',
  tenantId: TENANT,
  statusConceptId: PRAC.SITE_ACTIVE,
};

describe('ClinicalStructureService', () => {
  describe('createClinicalUnit (UC-14-04)', () => {
    it('throws when the site is missing', async () => {
      const d = build();
      d.sitesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.createClinicalUnit(
          's1',
          { code: 'U-1', name: 'Unit' } as any,
          actor,
          TENANT,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects a parent unit outside the site', async () => {
      const d = build();
      d.sitesRepo.findById.mockResolvedValue(activeSite);
      d.unitsRepo.findById.mockResolvedValue({
        id: 'u0',
        practiceSiteId: 'other',
      });
      await expect(
        d.service.createClinicalUnit(
          's1',
          { code: 'U-1', name: 'Unit', parentUnitId: 'u0' } as any,
          actor,
          TENANT,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('creates an active unit', async () => {
      const d = build();
      d.sitesRepo.findById.mockResolvedValue(activeSite);
      const created = {
        id: 'u1',
        practiceSiteId: 's1',
        tenantId: TENANT,
        code: 'U-1',
        statusConceptId: PRAC.UNIT_ACTIVE,
        createdAt: new Date(),
      };
      d.unitsRepo.create.mockReturnValue(created);
      const res = await d.service.createClinicalUnit(
        's1',
        { code: 'U-1', name: 'Unit' },
        actor,
        TENANT,
      );
      expect(res.status).toBe(PRAC.UNIT_ACTIVE);
    });
  });

  describe('F0 · aislamiento por tenant y regla de organización', () => {
    const cases = [
      {
        name: 'createClinicalUnit',
        run: (d: ReturnType<typeof build>, tenantId: string) =>
          d.service.createClinicalUnit(
            's1',
            { code: 'U-1', name: 'Unit' } as any,
            actor,
            tenantId,
          ),
        repo: (d: ReturnType<typeof build>) => d.unitsRepo,
        history: 'clinical_units',
        created: {
          id: 'u1',
          practiceSiteId: 's1',
          tenantId: TENANT,
          code: 'U-1',
          statusConceptId: PRAC.UNIT_ACTIVE,
          createdAt: new Date(),
        },
      },
    ];

    for (const c of cases) {
      describe(c.name, () => {
        it('sede de otro tenant: 404, sin autorizar ni crear', async () => {
          const d = build();
          d.sitesRepo.findById.mockResolvedValue({
            ...activeSite,
            tenantId: OTHER_TENANT,
          });
          await expect(c.run(d, TENANT)).rejects.toBeInstanceOf(
            ResourceNotFoundException,
          );
          expect(d.access.assertCanWriteSite).not.toHaveBeenCalled();
          expect(c.repo(d).create).not.toHaveBeenCalled();
        });

        it('sede inexistente: 404 (fail-closed)', async () => {
          const d = build();
          d.sitesRepo.findById.mockResolvedValue(null);
          await expect(c.run(d, TENANT)).rejects.toBeInstanceOf(
            ResourceNotFoundException,
          );
          expect(c.repo(d).create).not.toHaveBeenCalled();
        });

        it('sin administrar la org ni la sucursal: 403 y no crea', async () => {
          const d = build();
          d.sitesRepo.findById.mockResolvedValue(activeSite);
          d.access.assertCanWriteSite.mockRejectedValue(
            new ForbiddenException('no'),
          );
          await expect(c.run(d, TENANT)).rejects.toBeInstanceOf(
            ForbiddenException,
          );
          expect(c.repo(d).create).not.toHaveBeenCalled();
          expect(d.historyRepo.append).not.toHaveBeenCalled();
          expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
        });

        it('admin del tenant: crea, autoriza contra ese tenant y versiona', async () => {
          const d = build();
          d.sitesRepo.findById.mockResolvedValue(activeSite);
          c.repo(d).create.mockReturnValue(c.created);
          await c.run(d, TENANT);
          expect(d.access.assertCanWriteSite).toHaveBeenCalledWith(
            d.tx,
            activeSite,
            actor,
          );
          expect(c.repo(d).create).toHaveBeenCalledWith(
            d.tx,
            expect.objectContaining({ tenantId: TENANT }),
          );
          expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
            d.tx,
            expect.objectContaining({
              eventType: 'practice.clinical_unit.created',
              tenantId: TENANT,
              aggregateId: c.created.id,
            }),
          );
          expect(d.historyRepo.append).toHaveBeenCalledWith(
            d.tx,
            c.history,
            c.created.id,
            expect.objectContaining({
              operationConceptId: AUD.OPERATION_INSERT,
              changedByUserId: actor.id,
              tenantId: TENANT,
              dataSnapshot: expect.objectContaining({ id: c.created.id }),
            }),
          );
        });
      });
    }
  });

  describe('publishHealthcareService (UC-14-06)', () => {
    it('throws when the practice is missing', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.publishHealthcareService('p1', {} as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('publishes an active service', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue({
        id: 'p1',
        tenantId: 't1',
        statusConceptId: PRAC.PRACTICE_ACTIVE,
      });
      const created = {
        id: 'hs1',
        practiceId: 'p1',
        statusConceptId: PRAC.SERVICE_ACTIVE,
        createdAt: new Date(),
      };
      d.servicesRepo.create.mockReturnValue(created);
      const res = await d.service.publishHealthcareService('p1', {}, actor);
      expect(res.status).toBe(PRAC.SERVICE_ACTIVE);
      // F1c: healthcare_services.tenant_id NOT NULL = tenant de la práctica.
      expect(d.servicesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tenantId: 't1', practiceId: 'p1' }),
      );
    });
  });
});
