import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CareGapsService } from './care-gaps.service';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { CEXT } from '../clinical_ext.concepts';

const actor = { id: 'nur-1', roles: ['USER'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const gapsRepo = { findById: mockFn(), findOpen: mockFn(), create: mockFn() };
  const schedulesRepo = { findActive: mockFn(), create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new CareGapsService(
    em as any,
    gapsRepo,
    schedulesRepo,
    logger as any,
  );
  return { service, gapsRepo, schedulesRepo };
}

describe('CareGapsService', () => {
  describe('recompute (UC-18-09)', () => {
    it('opens new gaps and skips already-open ones', async () => {
      const d = build();
      d.gapsRepo.findOpen.mockImplementation(
        (_tx: any, _p: string, gapType: string) =>
          gapType === 'existing' ? { id: 'g0' } : null,
      );
      d.gapsRepo.create.mockImplementation((_tx: any, data: any) => ({
        id: 'g1',
        ...data,
      }));

      const res = await d.service.recompute(
        {
          patientProfileId: 'p1',
          gaps: [{ gapTypeConceptId: 'new' }, { gapTypeConceptId: 'existing' }],
        },
        actor,
      );

      expect(res.opened).toBe(1);
      expect(res.skipped).toBe(1);
    });
  });

  describe('close (UC-18-10)', () => {
    it('closes an open gap', async () => {
      const d = build();
      const gap = {
        id: 'g1',
        statusConceptId: CEXT.CARE_GAP_OPEN,
        updatedAt: new Date(),
      };
      d.gapsRepo.findById.mockResolvedValue(gap);
      const res = await d.service.close('g1', {}, actor);
      expect(res).toEqual({ ok: true });
      expect(gap.statusConceptId).toBe(CEXT.CARE_GAP_CLOSED);
    });

    it('throws when the gap is missing', async () => {
      const d = build();
      d.gapsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.close('g1', {} as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects closing a non-open gap (precondition)', async () => {
      const d = build();
      d.gapsRepo.findById.mockResolvedValue({
        id: 'g1',
        statusConceptId: CEXT.CARE_GAP_CLOSED,
      });
      await expect(
        d.service.close('g1', {} as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('projectImmunizationPlan (UC-18-11)', () => {
    it('opens a gap per pending dose using the recommended age', async () => {
      const d = build();
      d.schedulesRepo.findActive.mockResolvedValue([
        { id: 's1', vaccineConceptId: 'v1', recommendedAgeDays: 60 },
        { id: 's2', vaccineConceptId: 'v2', recommendedAgeDays: 120 },
      ]);
      d.gapsRepo.findOpen.mockResolvedValue(null);
      d.gapsRepo.create.mockImplementation((_tx: any, data: any) => ({
        id: `g-${data.measureConceptId}`,
        ...data,
      }));

      const res = await d.service.projectImmunizationPlan(
        'p1',
        { birthDate: '2026-01-01' },
        actor,
      );

      expect(res.gapsOpened).toBe(2);
      expect(res.dosesEvaluated).toBe(2);
    });

    it('skips doses that already have an open gap', async () => {
      const d = build();
      d.schedulesRepo.findActive.mockResolvedValue([
        { id: 's1', vaccineConceptId: 'v1', recommendedAgeDays: 60 },
      ]);
      d.gapsRepo.findOpen.mockResolvedValue({ id: 'g0' });
      const res = await d.service.projectImmunizationPlan(
        'p1',
        { birthDate: '2026-01-01' },
        actor,
      );
      expect(res.gapsOpened).toBe(0);
    });
  });
});
