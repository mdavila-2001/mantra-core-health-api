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
  runWithTenant,
} from '../../../common';
import { ChartEncounterScopeService } from './chart-encounter-scope.service';
import { ChartErrorReason } from '../chart.error-reasons';

const TENANT_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TENANT_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

// CL-29 (BR-13): el autor del plan sale de la sesión, así que quien crea
// planes en estas pruebas tiene perfil profesional.
const actor = { id: 'clin-1', roles: [], practitionerProfileId: 's1' } as any;

/**
 * Ejecuta cada método del servicio dentro del contexto de tenant A, como lo hace
 * `TenantContextInterceptor` en una petición real.
 *
 * @param service - Servicio bajo prueba.
 * @returns Un proxy que ejecuta cada método dentro de `runWithTenant`.
 */
function inTenantA<T extends object>(service: T): T {
  return new Proxy(service, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) =>
        runWithTenant(TENANT_A, () => value.apply(target, args));
    },
  });
}

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
    assertCanWriteHistory: mockFn().mockResolvedValue(undefined),
  };
  // BR-14 (CL-07): por defecto no rechaza nada.
  const encounterSealGuard = {
    assertEncounterWritable: mockFn().mockResolvedValue(undefined),
  };
  // P43: el origen en formulario. Por defecto, válido.
  const formOrigin = {
    assertUsableOrigin: mockFn().mockResolvedValue(undefined),
  };
  // CHART-01: el alcance real, con repositorios de prueba. Por defecto el
  // encuentro `enc-1` existe, está abierto y es del paciente `p1`.
  const encountersRepo = {
    findById: mockFn(async (_tx: unknown, id: string) => ({
      id,
      patientProfileId: 'p1',
      tenantId: TENANT_A,
      sealedAt: undefined,
    })),
  };
  const conditionsRepo = {
    findById: mockFn(async (_tx: unknown, id: string) => ({
      id,
      patientProfileId: 'p1',
      custodianTenantId: TENANT_A,
    })),
  };
  const encounterScope = new ChartEncounterScopeService(
    encountersRepo as any,
    conditionsRepo as any,
  );
  const service = new ChartCarePlansService(
    em as any,
    carePlansRepo,
    logger as any,
    clinicalRead as any,
    encounterSealGuard as any,
    formOrigin as any,
    encounterScope,
  );
  return {
    service: inTenantA(service),
    tx,
    carePlansRepo,
    clinicalRead,
    encounterSealGuard,
    formOrigin,
    encountersRepo,
    conditionsRepo,
  };
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

    it('BR-14 (CL-07): rejects a plan against a sealed encounter', async () => {
      const d = build();
      d.encounterSealGuard.assertEncounterWritable.mockRejectedValue(
        new PreconditionFailedException('sellado'),
      );
      await expect(
        d.service.createCarePlan(
          { patientProfileId: 'p1', encounterId: 'enc-1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.carePlansRepo.createPlan).not.toHaveBeenCalled();
    });

    describe('formInstanceId (P43)', () => {
      it('valida la instancia contra el encuentro, la guarda y la devuelve', async () => {
        const d = build();
        d.carePlansRepo.createPlan.mockImplementation(
          (_tx: unknown, data: any) => ({
            id: 'cp1',
            statusConceptId: CHART.CAREPLAN_ACTIVE,
            formInstanceId: data.formInstanceId,
            createdAt: new Date(),
          }),
        );
        const res = await d.service.createCarePlan(
          {
            patientProfileId: 'p1',
            encounterId: 'enc-1',
            formInstanceId: 'form-1',
          },
          actor,
        );
        expect(d.formOrigin.assertUsableOrigin).toHaveBeenCalledWith(
          d.tx,
          'form-1',
          'enc-1',
        );
        expect(d.carePlansRepo.createPlan).toHaveBeenCalledWith(
          d.tx,
          expect.objectContaining({ formInstanceId: 'form-1' }),
        );
        expect(res.formInstanceId).toBe('form-1');
      });

      it('sin formInstanceId no valida nada y responde null', async () => {
        const d = build();
        d.carePlansRepo.createPlan.mockReturnValue({
          id: 'cp1',
          statusConceptId: CHART.CAREPLAN_ACTIVE,
          createdAt: new Date(),
        });
        const res = await d.service.createCarePlan(
          { patientProfileId: 'p1' },
          actor,
        );
        expect(d.formOrigin.assertUsableOrigin).not.toHaveBeenCalled();
        expect(res.formInstanceId).toBeNull();
      });

      it('si el validador rechaza (422), no se crea el plan', async () => {
        const d = build();
        d.formOrigin.assertUsableOrigin.mockRejectedValue(
          new PreconditionFailedException('La instancia no existe'),
        );
        await expect(
          d.service.createCarePlan(
            { patientProfileId: 'p1', formInstanceId: 'form-1' },
            actor,
          ),
        ).rejects.toBeInstanceOf(PreconditionFailedException);
        expect(d.carePlansRepo.createPlan).not.toHaveBeenCalled();
      });
    });

    // CL-29 (BR-13) — el autor del plan sale de la sesión.
    describe('autor por sesión (CL-29)', () => {
      const created = () => ({
        id: 'cp1',
        statusConceptId: CHART.CAREPLAN_ACTIVE,
        createdAt: new Date(),
      });

      it('sin autor en el cuerpo, queda el perfil de la sesión', async () => {
        const d = build();
        d.carePlansRepo.createPlan.mockReturnValue(created());
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
    d.clinicalRead.assertCanWriteHistory.mockRejectedValue(
      new ForbiddenException('sin permiso'),
    );

    await expect(
      d.service.updateActivity('cp1', 'a1', { detailText: 'después' }, actor),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(d.clinicalRead.assertCanWriteHistory).toHaveBeenCalledWith(
      'paciente-ajeno',
      actor,
    );
    expect(activity.detailText).toBe('antes');
    expect(d.tx.flush).not.toHaveBeenCalled();
  });
});

/**
 * Captura el rechazo para inspeccionar status, reason y details.
 *
 * @param promise - Operación que debe fallar.
 * @returns La excepción lanzada.
 */
async function rejection(promise: Promise<unknown>): Promise<any> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Se esperaba un rechazo');
}

describe('ChartCarePlansService.createCarePlan · encuentro y diagnóstico del paciente (CHART-01)', () => {
  const dto = (extra: Record<string, unknown> = {}) =>
    ({ patientProfileId: 'p1', ...extra }) as any;

  /**
   * Plan que devuelve el repositorio al crearlo.
   *
   * @param d - Doble del servicio.
   */
  function withPlan(d: ReturnType<typeof build>) {
    d.carePlansRepo.createPlan.mockReturnValue({
      id: 'cp1',
      statusConceptId: CHART.CAREPLAN_ACTIVE,
      createdAt: new Date(),
    });
  }

  it('correcto: el plan de A con encuentro y diagnóstico de A conserva las relaciones', async () => {
    const d = build();
    withPlan(d);

    await d.service.createCarePlan(
      dto({ encounterId: 'enc-1', conditionId: 'cond-1' }),
      actor,
    );

    expect(d.carePlansRepo.createPlan.mock.calls[0][1]).toMatchObject({
      patientProfileId: 'p1',
      encounterId: 'enc-1',
      conditionId: 'cond-1',
    });
  });

  it('límite: sin encounterId ni conditionId el plan se crea sin consultar nada', async () => {
    const d = build();
    withPlan(d);

    await d.service.createCarePlan(dto(), actor);

    expect(d.encountersRepo.findById).not.toHaveBeenCalled();
    expect(d.conditionsRepo.findById).not.toHaveBeenCalled();
  });

  it('error: el encuentro abierto de B usado desde A responde como inexistente, sin plan ni actividades', async () => {
    const foreign = build();
    foreign.encountersRepo.findById.mockResolvedValue({
      id: 'enc-b',
      patientProfileId: 'p2',
      tenantId: TENANT_A,
    });
    const absent = build();
    absent.encountersRepo.findById.mockResolvedValue(null);

    const a = await rejection(
      foreign.service.createCarePlan(dto({ encounterId: 'enc-b' }), actor),
    );
    const b = await rejection(
      absent.service.createCarePlan(dto({ encounterId: 'enc-b' }), actor),
    );

    expect(a).toBeInstanceOf(ResourceNotFoundException);
    expect(a.reason).toBe(ChartErrorReason.CHART_ENCOUNTER_OUT_OF_SCOPE);
    expect(a.details).toBeUndefined();
    expect(a.getResponse()).toEqual(b.getResponse());
    expect(foreign.carePlansRepo.createPlan).not.toHaveBeenCalled();
    expect(foreign.carePlansRepo.createActivity).not.toHaveBeenCalled();
  });

  it('un encuentro del mismo paciente pero de otro tenant también es ajeno', async () => {
    const d = build();
    d.encountersRepo.findById.mockResolvedValue({
      id: 'enc-1',
      patientProfileId: 'p1',
      tenantId: TENANT_B,
    });

    const error = await rejection(
      runWithTenant(TENANT_A, () =>
        d.service.createCarePlan(dto({ encounterId: 'enc-1' }), actor),
      ),
    );

    expect(error.reason).toBe(ChartErrorReason.CHART_ENCOUNTER_OUT_OF_SCOPE);
    expect(d.carePlansRepo.createPlan).not.toHaveBeenCalled();
  });

  it('falla catalogada: un encuentro sellado responde 422 CHART_ENCOUNTER_SEALED y no escribe', async () => {
    const d = build();
    d.encountersRepo.findById.mockResolvedValue({
      id: 'enc-1',
      patientProfileId: 'p1',
      tenantId: TENANT_A,
      sealedAt: new Date(),
    });

    const error = await rejection(
      d.service.createCarePlan(dto({ encounterId: 'enc-1' }), actor),
    );

    expect(error).toBeInstanceOf(PreconditionFailedException);
    expect(error.getStatus()).toBe(422);
    expect(error.reason).toBe(ChartErrorReason.CHART_ENCOUNTER_SEALED);
    expect(d.carePlansRepo.createPlan).not.toHaveBeenCalled();
  });

  it('el diagnóstico de otro paciente o inexistente responde igual y no crea el plan', async () => {
    const foreign = build();
    foreign.conditionsRepo.findById.mockResolvedValue({
      id: 'cond-b',
      patientProfileId: 'p2',
    });
    const absent = build();
    absent.conditionsRepo.findById.mockResolvedValue(null);

    const a = await rejection(
      foreign.service.createCarePlan(dto({ conditionId: 'cond-b' }), actor),
    );
    const b = await rejection(
      absent.service.createCarePlan(dto({ conditionId: 'cond-b' }), actor),
    );

    expect(a.getStatus()).toBe(404);
    expect(a.reason).toBe(ChartErrorReason.CHART_CONDITION_OUT_OF_SCOPE);
    expect(a.getResponse()).toEqual(b.getResponse());
    expect(foreign.carePlansRepo.createPlan).not.toHaveBeenCalled();
  });
});
