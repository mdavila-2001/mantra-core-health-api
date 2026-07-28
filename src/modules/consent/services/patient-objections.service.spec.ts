import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PatientObjectionsService } from './patient-objections.service';
import { ConflictException, ResourceNotFoundException } from '../../../common';
import { CONS } from '../consent.concepts';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const objectionsRepo = {
    findOpenByPurpose: mockFn(),
    findById: mockFn(),
    create: mockFn(),
  };
  const restrictionsRepo = {
    create: mockFn(),
    findActiveByPatient: mockFn().mockResolvedValue([]),
  };
  const eventsRepo = { record: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new PatientObjectionsService(
    em as any,
    objectionsRepo,
    restrictionsRepo as any,
    eventsRepo,
    logger as any,
  );
  return { service, tx, objectionsRepo, restrictionsRepo, eventsRepo };
}

describe('PatientObjectionsService', () => {
  describe('raise (UC-07-03)', () => {
    it('rejects when an open objection already exists', async () => {
      const d = build();
      d.objectionsRepo.findOpenByPurpose.mockResolvedValue({ id: 'o1' });
      await expect(
        d.service.raise(
          { patientProfileId: 'p1', processingPurposeId: 'pp1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('raises an objection without restriction', async () => {
      const d = build();
      d.objectionsRepo.findOpenByPurpose.mockResolvedValue(null);
      const obj = {
        id: 'o1',
        patientProfileId: 'p1',
        statusConceptId: CONS.OBJECTION_STATUS_RAISED,
        createdAt: new Date(),
      };
      d.objectionsRepo.create.mockReturnValue(obj);

      const res = await d.service.raise(
        { patientProfileId: 'p1', processingPurposeId: 'pp1' },
        actor,
      );

      expect(res.restrictionId).toBeNull();
      expect(d.restrictionsRepo.create).not.toHaveBeenCalled();
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: CONS.EVENT_OBJECTION_RAISED,
        }),
      );
    });

    it('materializes a restriction when applyRestriction is set (include UC-07-07)', async () => {
      const d = build();
      d.objectionsRepo.findOpenByPurpose.mockResolvedValue(null);
      d.objectionsRepo.create.mockReturnValue({
        id: 'o1',
        patientProfileId: 'p1',
        statusConceptId: CONS.OBJECTION_STATUS_RAISED,
        createdAt: new Date(),
      });
      d.restrictionsRepo.create.mockReturnValue({ id: 'r1' });

      const res = await d.service.raise(
        {
          patientProfileId: 'p1',
          processingPurposeId: 'pp1',
          applyRestriction: true,
        },
        actor,
      );

      expect(res.restrictionId).toBe('r1');
      expect(d.restrictionsRepo.create).toHaveBeenCalled();
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: CONS.EVENT_RESTRICTION_APPLIED,
        }),
      );
    });
  });

  describe('resolve (UC-07-12)', () => {
    it('throws when the objection does not exist', async () => {
      const d = build();
      d.objectionsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.resolve('missing', { resolution: 'UPHELD' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects resolving an objection that is not open', async () => {
      const d = build();
      d.objectionsRepo.findById.mockResolvedValue({
        id: 'o1',
        statusConceptId: CONS.OBJECTION_STATUS_RESOLVED,
      });
      await expect(
        d.service.resolve('o1', { resolution: 'UPHELD' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('revokes active restrictions when the objection is rejected', async () => {
      const d = build();
      const obj: any = {
        id: 'o1',
        patientProfileId: 'p1',
        statusConceptId: CONS.OBJECTION_STATUS_RAISED,
        updatedAt: new Date(),
      };
      d.objectionsRepo.findById.mockResolvedValue(obj);
      const restriction = {
        id: 'r1',
        statusConceptId: CONS.RESTRICTION_ACTIVE,
        updatedAt: new Date(),
      };
      d.restrictionsRepo.findActiveByPatient.mockResolvedValue([restriction]);

      const res = await d.service.resolve(
        'o1',
        { resolution: 'REJECTED' } as any,
        actor,
      );

      expect(res).toEqual({ ok: true });
      expect(obj.statusConceptId).toBe(CONS.OBJECTION_STATUS_RESOLVED);
      expect(obj.resolutionConceptId).toBe(CONS.RESOLUTION_REJECTED);
      expect(restriction.statusConceptId).toBe(CONS.RESTRICTION_REVOKED);
    });
  });
});
