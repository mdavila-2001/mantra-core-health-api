import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ForbiddenException } from '@nestjs/common';
import { ChartCarePlansService } from './chart-care-plans.service';
import { CHART } from '../chart.concepts';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

// CL-29 (BR-13): el autor del plan sale de la sesión, así que quien crea
// planes en estas pruebas tiene perfil profesional.
const actor = { id: 'clin-1', roles: [], practitionerProfileId: 's1' } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const carePlansRepo = {
    findPlanById: mockFn(),
    findActivityById: mockFn(),
    findActivitiesForPlan: mockFn().mockResolvedValue([]),
    findPlansByPatient: mockFn().mockResolvedValue([]),
    findActivitiesForPlans: mockFn().mockResolvedValue([]),
    findByEncounter: mockFn().mockResolvedValue([]),
    createPlan: mockFn(),
    createActivity: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const clinicalRead = {
    assertPuedeEscribirHistoria: mockFn().mockResolvedValue(undefined),
  };
  const service = new ChartCarePlansService(
    em as any,
    carePlansRepo,
    logger as any,
    clinicalRead as any,
  );
  return { service, tx, carePlansRepo, clinicalRead };
}

describe('ChartCarePlansService', () => {
  describe('createCarePlan (UC-15-10)', () => {
    it('flushes the plan before its activities and defaults the activity concept', async () => {
      const d = build();
      d.carePlansRepo.createPlan.mockReturnValue({
        id: 'cp1',
        statusConceptId: CHART.CAREPLAN_ACTIVE,
        createdAt: new Date(),
      });

      const res = await d.service.createCarePlan(
        { patientProfileId: 'p1', activities: [{ detailText: 'walk' }] },
        actor,
      );
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
      expect(res.activityCount).toBe(1);
      expect(d.carePlansRepo.createActivity).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          activityConceptId: CHART.ACTIVITY_DEFAULT,
          statusConceptId: CHART.ACTIVITY_SCHEDULED,
        }),
      );
    });

    // CL-29 (BR-13) — el autor del plan sale de la sesión.
    describe('autor por sesión (CL-29)', () => {
      const creado = () => ({
        id: 'cp1',
        statusConceptId: CHART.CAREPLAN_ACTIVE,
        createdAt: new Date(),
      });

      it('sin autor en el cuerpo, queda el perfil de la sesión', async () => {
        const d = build();
        d.carePlansRepo.createPlan.mockReturnValue(creado());
        await d.service.createCarePlan({ patientProfileId: 'p1' }, actor);
        expect(d.carePlansRepo.createPlan).toHaveBeenCalledWith(
          d.tx,
          expect.objectContaining({ authorProfileId: 's1' }),
        );
      });

      it('con otro perfil en el cuerpo responde 403 y no crea el plan', async () => {
        const d = build();
        await expect(
          d.service.createCarePlan(
            { patientProfileId: 'p1', authorProfileId: 'hp-otro' },
            actor,
          ),
        ).rejects.toBeInstanceOf(ForbiddenException);
        expect(d.carePlansRepo.createPlan).not.toHaveBeenCalled();
      });

      it('una sesión sin perfil profesional no crea planes (403)', async () => {
        const d = build();
        await expect(
          d.service.createCarePlan({ patientProfileId: 'p1' }, {
            id: 'u',
            roles: [],
          } as any),
        ).rejects.toBeInstanceOf(ForbiddenException);
        expect(d.carePlansRepo.createPlan).not.toHaveBeenCalled();
      });
    });
  });

  describe('updateActivity (UC-15-11)', () => {
    it('throws when the plan is not active', async () => {
      const d = build();
      d.carePlansRepo.findPlanById.mockResolvedValue({
        id: 'cp1',
        statusConceptId: CHART.CAREPLAN_COMPLETED,
      });
      await expect(
        d.service.updateActivity(
          'cp1',
          'a1',
          { status: 'COMPLETED' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('throws when the activity does not belong to the plan', async () => {
      const d = build();
      d.carePlansRepo.findPlanById.mockResolvedValue({
        id: 'cp1',
        statusConceptId: CHART.CAREPLAN_ACTIVE,
      });
      d.carePlansRepo.findActivityById.mockResolvedValue({
        id: 'a1',
        carePlanId: 'other',
      });
      await expect(
        d.service.updateActivity(
          'cp1',
          'a1',
          { status: 'COMPLETED' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('completes the plan when all activities are completed', async () => {
      const d = build();
      const plan: any = {
        id: 'cp1',
        statusConceptId: CHART.CAREPLAN_ACTIVE,
        updatedAt: new Date(),
      };
      const activity: any = {
        id: 'a1',
        carePlanId: 'cp1',
        statusConceptId: CHART.ACTIVITY_SCHEDULED,
        updatedAt: new Date(),
      };
      d.carePlansRepo.findPlanById.mockResolvedValue(plan);
      d.carePlansRepo.findActivityById.mockResolvedValue(activity);
      d.carePlansRepo.findActivitiesForPlan.mockResolvedValue([
        { statusConceptId: CHART.ACTIVITY_COMPLETED },
      ]);

      const res = await d.service.updateActivity(
        'cp1',
        'a1',
        { status: 'COMPLETED', detailText: 'done' } as any,
        actor,
      );
      expect(activity.statusConceptId).toBe(CHART.ACTIVITY_COMPLETED);
      expect(plan.statusConceptId).toBe(CHART.CAREPLAN_COMPLETED);
      expect(res.planStatusConceptId).toBe(CHART.CAREPLAN_COMPLETED);
    });

    it('keeps the plan active when some activities are not completed', async () => {
      const d = build();
      const plan: any = {
        id: 'cp1',
        statusConceptId: CHART.CAREPLAN_ACTIVE,
        updatedAt: new Date(),
      };
      const activity: any = {
        id: 'a1',
        carePlanId: 'cp1',
        statusConceptId: CHART.ACTIVITY_SCHEDULED,
        updatedAt: new Date(),
      };
      d.carePlansRepo.findPlanById.mockResolvedValue(plan);
      d.carePlansRepo.findActivityById.mockResolvedValue(activity);
      d.carePlansRepo.findActivitiesForPlan.mockResolvedValue([
        { statusConceptId: CHART.ACTIVITY_COMPLETED },
        { statusConceptId: CHART.ACTIVITY_IN_PROGRESS },
      ]);

      const res = await d.service.updateActivity(
        'cp1',
        'a1',
        { status: 'IN_PROGRESS' } as any,
        actor,
      );
      expect(plan.statusConceptId).toBe(CHART.CAREPLAN_ACTIVE);
      expect(res.statusConceptId).toBe(CHART.ACTIVITY_IN_PROGRESS);
    });
  });
});

describe('ChartCarePlansService · MCH-007, actividad por id', () => {
  it('pregunta por el paciente del plan y, sin permiso, no toca la actividad', async () => {
    const d = build();
    d.carePlansRepo.findPlanById.mockResolvedValue({
      id: 'cp1',
      patientProfileId: 'paciente-ajeno',
      statusConceptId: CHART.CAREPLAN_ACTIVE,
    });
    const activity = { id: 'a1', carePlanId: 'cp1', detailText: 'antes' };
    d.carePlansRepo.findActivityById.mockResolvedValue(activity);
    d.clinicalRead.assertPuedeEscribirHistoria.mockRejectedValue(
      new ForbiddenException('sin permiso'),
    );

    await expect(
      d.service.updateActivity('cp1', 'a1', { detailText: 'después' }, actor),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(d.clinicalRead.assertPuedeEscribirHistoria).toHaveBeenCalledWith(
      'paciente-ajeno',
      actor,
    );
    expect(activity.detailText).toBe('antes');
    expect(d.tx.flush).not.toHaveBeenCalled();
  });
});
