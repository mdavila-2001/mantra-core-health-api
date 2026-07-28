import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { OrgextHospitalsService } from './orgext-hospitals.service';
import { ORGEXT } from '../organization_extensions.concepts';
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
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const hospitalsRepo = {
    findById: mockFn(),
    findByTenantOrPractice: mockFn(),
    create: mockFn(),
  };
  const serviceLinesRepo = { findByIdForHospital: mockFn(), create: mockFn() };
  const licensesRepo = { countVerifiedForTenant: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new OrgextHospitalsService(
    em as any,
    hospitalsRepo,
    serviceLinesRepo,
    licensesRepo as any,
    logger as any,
  );
  return { service, tx, hospitalsRepo, serviceLinesRepo, licensesRepo };
}

describe('OrgextHospitalsService', () => {
  describe('specialize (UC-22-01)', () => {
    it('creates a draft hospital and flushes the parent', async () => {
      const d = build();
      d.hospitalsRepo.findByTenantOrPractice.mockResolvedValue(null);
      const created = {
        id: 'h1',
        tenantId: 't1',
        practiceId: 'p1',
        statusConceptId: ORGEXT.HOSPITAL_DRAFT,
        createdAt: new Date('2026-01-01'),
      };
      d.hospitalsRepo.create.mockReturnValue(created);

      const res = await d.service.specialize(
        { tenantId: 't1', practiceId: 'p1' },
        actor,
      );

      expect(res).toEqual({
        id: 'h1',
        tenantId: 't1',
        practiceId: 'p1',
        status: ORGEXT.HOSPITAL_DRAFT,
        createdAt: created.createdAt,
      });
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
      expect(d.hospitalsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ statusConceptId: ORGEXT.HOSPITAL_DRAFT }),
      );
    });

    it('rejects when tenant or practice is already specialized (conflict)', async () => {
      const d = build();
      d.hospitalsRepo.findByTenantOrPractice.mockResolvedValue({ id: 'h0' });

      await expect(
        d.service.specialize(
          { tenantId: 't1', practiceId: 'p1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.hospitalsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('activate (UC-22-02)', () => {
    it('throws when the hospital does not exist', async () => {
      const d = build();
      d.hospitalsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.activate('missing', {} as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects when the hospital is not in draft state', async () => {
      const d = build();
      d.hospitalsRepo.findById.mockResolvedValue({
        id: 'h1',
        tenantId: 't1',
        statusConceptId: ORGEXT.HOSPITAL_ACTIVE,
      });
      await expect(
        d.service.activate('h1', {} as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects when there is no verified facility license', async () => {
      const d = build();
      d.hospitalsRepo.findById.mockResolvedValue({
        id: 'h1',
        tenantId: 't1',
        statusConceptId: ORGEXT.HOSPITAL_DRAFT,
      });
      d.licensesRepo.countVerifiedForTenant.mockResolvedValue(0);
      await expect(
        d.service.activate('h1', {} as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('activates when a verified license exists', async () => {
      const d = build();
      const hospital = {
        id: 'h1',
        tenantId: 't1',
        practiceId: 'p1',
        statusConceptId: ORGEXT.HOSPITAL_DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      d.hospitalsRepo.findById.mockResolvedValue(hospital);
      d.licensesRepo.countVerifiedForTenant.mockResolvedValue(1);

      const res = await d.service.activate(
        'h1',
        { publicProfileId: 'pp1' },
        actor,
      );

      expect(res.status).toBe(ORGEXT.HOSPITAL_ACTIVE);
      expect(hospital.statusConceptId).toBe(ORGEXT.HOSPITAL_ACTIVE);
      expect((hospital as any).publicProfileId).toBe('pp1');
    });
  });

  describe('addServiceLine (UC-22-03)', () => {
    it('rejects when the hospital is not active', async () => {
      const d = build();
      d.hospitalsRepo.findById.mockResolvedValue({
        id: 'h1',
        statusConceptId: ORGEXT.HOSPITAL_DRAFT,
      });
      await expect(
        d.service.addServiceLine('h1', {} as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('creates the service line for an active hospital', async () => {
      const d = build();
      d.hospitalsRepo.findById.mockResolvedValue({
        id: 'h1',
        statusConceptId: ORGEXT.HOSPITAL_ACTIVE,
      });
      const line = {
        id: 'l1',
        hospitalId: 'h1',
        statusConceptId: ORGEXT.SERVICE_LINE_ACTIVE,
        createdAt: new Date(),
      };
      d.serviceLinesRepo.create.mockReturnValue(line);

      const res = await d.service.addServiceLine('h1', {}, actor);

      expect(res).toEqual({
        id: 'l1',
        hospitalId: 'h1',
        status: ORGEXT.SERVICE_LINE_ACTIVE,
        createdAt: line.createdAt,
      });
      expect(d.tx.flush).toHaveBeenCalled();
    });
  });

  describe('retireServiceLine (UC-22-04)', () => {
    it('throws when the line does not exist', async () => {
      const d = build();
      d.serviceLinesRepo.findByIdForHospital.mockResolvedValue(null);
      await expect(
        d.service.retireServiceLine('h1', 'l1', actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('soft-deletes an active line', async () => {
      const d = build();
      const line = {
        id: 'l1',
        statusConceptId: ORGEXT.SERVICE_LINE_ACTIVE,
        updatedAt: new Date(),
      };
      d.serviceLinesRepo.findByIdForHospital.mockResolvedValue(line);

      const res = await d.service.retireServiceLine('h1', 'l1', actor);

      expect(res).toEqual({ ok: true, status: ORGEXT.SERVICE_LINE_RETIRED });
      expect(line.statusConceptId).toBe(ORGEXT.SERVICE_LINE_RETIRED);
    });
  });
});
