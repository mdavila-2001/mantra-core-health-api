import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { CONCEPTS } from '../../../common';
import type { WorkflowInstances } from '../entities';
import { WorkflowInstancesService } from './workflow-instances.service';

const actor = { id: 'user-1', roles: ['CLINICIAN'] } as any;
const SUBJECT_ID = '11111111-1111-1111-1111-111111111111';
const TENANT_ID = '22222222-2222-2222-2222-222222222222';
const TASK_ID = '33333333-3333-3333-3333-333333333333';
const STATE_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const STATE_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

const MACHINE = { id: 'machine-1', machineCode: 'encounter-lifecycle' };

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const machinesRepo = {
    findActiveMachineByCode: mockFn(async () => MACHINE),
    findInitialState: mockFn(async () => ({ stateConceptId: STATE_A })),
    findTransitionByCommand: mockFn(async () => null),
  };
  const runtimeRepo = {
    findLiveInstance: mockFn(async () => null),
    createInstance: mockFn((_tx: any, data: any) => ({
      id: 'instancia-1',
      ...data,
    })),
    createTask: mockFn((_tx: any, data: any) => ({ id: 'tarea-1', ...data })),
    findTaskForUpdate: mockFn(async () => null),
    findInstanceForUpdate: mockFn(async () => null),
    findOpenTasksByInstance: mockFn(async () => []),
    findDueInstancesForUpdate: mockFn(async () => []),
    findDueTasksByInstanceForUpdate: mockFn(async () => []),
    createTransitionEvent: mockFn((_tx: any, data: any) => ({
      id: 'evento-1',
      ...data,
    })),
  };
  const outbox = {
    publishDomainEvent: mockFn(async () => ({ duplicate: false })),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new WorkflowInstancesService(
    em as any,
    machinesRepo as any,
    runtimeRepo as any,
    outbox as any,
    logger as any,
  );
  return { service, em, tx, machinesRepo, runtimeRepo, outbox, logger };
}

const CREATE_DTO = {
  workflowCode: 'encounter-lifecycle',
  subjectTypeConceptId: CONCEPTS.WF_SUBJECT_ENCOUNTER,
  subjectId: SUBJECT_ID,
  tenantId: TENANT_ID,
  tasks: [
    { taskCode: 'sign', taskTypeConceptId: CONCEPTS.WF_TASK_TYPE_APPROVAL },
  ],
} as any;

describe('WorkflowInstancesService', () => {
  describe('createInstance (UC-32-12)', () => {
    it('toma el estado inicial de la definición, no de la petición', async () => {
      const d = build();

      const result = await d.service.createInstance(
        { ...CREATE_DTO, currentStateConceptId: STATE_B },
        actor,
      );

      expect(result.currentStateConceptId).toBe(STATE_A);
      expect(
        d.runtimeRepo.createInstance.mock.calls[0][1].currentStateConceptId,
      ).toBe(STATE_A);
    });

    it('crea las tareas iniciales abiertas', async () => {
      const d = build();

      const result = await d.service.createInstance(CREATE_DTO, actor);

      expect(d.runtimeRepo.createTask.mock.calls[0][1].statusConceptId).toBe(
        CONCEPTS.WF_TASK_OPEN,
      );
      expect(result.taskIds).toHaveLength(1);
    });

    it('rechaza una segunda instancia viva del mismo workflow sobre el mismo sujeto', async () => {
      const d = build();
      d.runtimeRepo.findLiveInstance.mockResolvedValue({
        id: 'instancia-previa',
      });

      await expect(d.service.createInstance(CREATE_DTO, actor)).rejects.toThrow(
        /instancia viva/,
      );
    });

    it('rechaza si no hay versión activa de la máquina', async () => {
      const d = build();
      d.machinesRepo.findActiveMachineByCode.mockResolvedValue(null);

      await expect(d.service.createInstance(CREATE_DTO, actor)).rejects.toThrow(
        /versión activa/,
      );
    });

    it('rechaza si la definición activa no declara estado inicial', async () => {
      const d = build();
      d.machinesRepo.findInitialState.mockResolvedValue(null);

      await expect(d.service.createInstance(CREATE_DTO, actor)).rejects.toThrow(
        /estado inicial/,
      );
    });

    it('publica WorkflowInstanceStarted', async () => {
      const d = build();

      await d.service.createInstance(CREATE_DTO, actor);

      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ eventType: 'WorkflowInstanceStarted' }),
      );
    });
  });

  describe('completeTask (UC-32-13)', () => {
    /**
     * Ejecuta la operación with open task.
     *
     * @param d - Valor de d requerido por la operación.
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de with open task.
     */
    function withOpenTask(d: ReturnType<typeof build>, overrides: any = {}) {
      const task = {
        id: TASK_ID,
        workflowInstanceId: 'instancia-1',
        taskCode: 'sign',
        statusConceptId: CONCEPTS.WF_TASK_OPEN,
        updatedAt: new Date(),
        ...overrides,
      };
      // `currentStepCode` y `contextJson` los escribe el servicio, no el mock.
      // Se declaran igual (opcionales, como en la entidad) para que el doble
      // tenga la forma real: si no, las aserciones leen propiedades que el tipo
      // del literal no conoce y el spec deja de compilar.
      const instance: Pick<
        WorkflowInstances,
        | 'id'
        | 'workflowCode'
        | 'tenantId'
        | 'subjectId'
        | 'currentStateConceptId'
        | 'statusConceptId'
        | 'updatedAt'
        | 'currentStepCode'
        | 'contextJson'
      > = {
        id: 'instancia-1',
        workflowCode: 'encounter-lifecycle',
        tenantId: TENANT_ID,
        subjectId: SUBJECT_ID,
        currentStateConceptId: STATE_A,
        statusConceptId: CONCEPTS.WF_INSTANCE_ACTIVE,
        updatedAt: new Date(),
      };
      d.runtimeRepo.findTaskForUpdate.mockResolvedValue(task);
      d.runtimeRepo.findInstanceForUpdate.mockResolvedValue(instance);
      return { task, instance };
    }

    it('completa la tarea y fija quién la completó', async () => {
      const d = build();
      const { task } = withOpenTask(d);

      const result = await d.service.completeTask(TASK_ID, {}, actor);

      expect(task.statusConceptId).toBe(CONCEPTS.WF_TASK_COMPLETED);
      expect(task.assignedUserId).toBe('user-1');
      expect(result.remainingOpenTasks).toBe(0);
    });

    it('rechaza completar una tarea asignada a otra persona', async () => {
      const d = build();
      withOpenTask(d, { assignedUserId: 'otro-usuario' });

      await expect(
        d.service.completeTask(TASK_ID, {} as any, actor),
      ).rejects.toThrow(/asignada a otro usuario/);
    });

    it('rechaza completar una tarea que ya no está abierta', async () => {
      const d = build();
      withOpenTask(d, { statusConceptId: CONCEPTS.WF_TASK_COMPLETED });

      await expect(
        d.service.completeTask(TASK_ID, {} as any, actor),
      ).rejects.toThrow(/ya no está abierta/);
    });

    it('rechaza completar la tarea de una instancia que ya no está viva', async () => {
      const d = build();
      const { instance } = withOpenTask(d);
      instance.statusConceptId = CONCEPTS.WF_INSTANCE_COMPLETED;

      await expect(
        d.service.completeTask(TASK_ID, {} as any, actor),
      ).rejects.toThrow(/ya no está viva/);
    });

    it('dispara la transición asociada cuando llega un comando', async () => {
      const d = build();
      const { instance } = withOpenTask(d);
      d.machinesRepo.findTransitionByCommand.mockResolvedValue({
        id: 'transition-1',
        toStateConceptId: STATE_B,
      });

      const result = await d.service.completeTask(
        TASK_ID,
        { commandCode: 'SIGN' },
        actor,
      );

      expect(result.transitionEventId).toBe('evento-1');
      expect(instance.currentStateConceptId).toBe(STATE_B);
      expect(
        d.runtimeRepo.createTransitionEvent.mock.calls[0][1].reasonConceptId,
      ).toBe(CONCEPTS.WF_REASON_TASK_COMPLETED);
    });

    it('rechaza un comando que no sale del estado actual de la instancia', async () => {
      const d = build();
      withOpenTask(d);

      await expect(
        d.service.completeTask(TASK_ID, { commandCode: 'CLOSE' } as any, actor),
      ).rejects.toThrow(/no es aplicable/);
    });

    it('sin comando sólo avanza el paso, sin registrar transición', async () => {
      const d = build();
      const { instance } = withOpenTask(d);

      const result = await d.service.completeTask(
        TASK_ID,
        { nextStepCode: 'revision' },
        actor,
      );

      expect(result.transitionEventId).toBeUndefined();
      expect(instance.currentStepCode).toBe('revision');
      expect(d.runtimeRepo.createTransitionEvent).not.toHaveBeenCalled();
    });

    it('guarda el resultado en el contexto de la instancia sin pisar lo anterior', async () => {
      const d = build();
      const { instance } = withOpenTask(d);
      (instance as any).contextJson = { previo: 1 };

      await d.service.completeTask(
        TASK_ID,
        { resultJson: { ok: true } },
        actor,
      );

      expect(instance.contextJson).toEqual({
        previo: 1,
        'task:sign': { ok: true },
      });
    });
  });

  describe('sweepTimeouts (UC-32-10)', () => {
    it('escala las instancias vencidas y limpia su plazo', async () => {
      const d = build();
      const instance = {
        id: 'instancia-1',
        workflowCode: 'encounter-lifecycle',
        subjectId: SUBJECT_ID,
        tenantId: TENANT_ID,
        statusConceptId: CONCEPTS.WF_INSTANCE_ACTIVE,
        currentStateConceptId: STATE_A,
        dueAt: new Date('2020-01-01'),
        updatedAt: new Date(),
      };
      d.runtimeRepo.findDueInstancesForUpdate.mockResolvedValue([instance]);

      const result = await d.service.sweepTimeouts({}, actor);

      expect(instance.statusConceptId).toBe(CONCEPTS.WF_INSTANCE_ESCALATED);
      expect(instance.dueAt).toBeUndefined();
      expect(result.escalatedInstances).toBe(1);
      expect(result.instanceIds).toEqual(['instancia-1']);
    });

    it('escala también las tareas vencidas de la instancia', async () => {
      const d = build();
      d.runtimeRepo.findDueInstancesForUpdate.mockResolvedValue([
        {
          id: 'instancia-1',
          tenantId: TENANT_ID,
          statusConceptId: CONCEPTS.WF_INSTANCE_ACTIVE,
          updatedAt: new Date(),
        },
      ]);
      const task = {
        id: TASK_ID,
        statusConceptId: CONCEPTS.WF_TASK_OPEN,
        updatedAt: new Date(),
      };
      d.runtimeRepo.findDueTasksByInstanceForUpdate.mockResolvedValue([task]);

      const result = await d.service.sweepTimeouts({}, actor);

      expect(task.statusConceptId).toBe(CONCEPTS.WF_TASK_ESCALATED);
      expect(result.escalatedTasks).toBe(1);
    });

    it('recorta el lote pedido al máximo del módulo', async () => {
      const d = build();

      await d.service.sweepTimeouts({ batchSize: 100000 }, actor);

      expect(d.runtimeRepo.findDueInstancesForUpdate.mock.calls[0][3]).toBe(
        500,
      );
    });

    it('no publica nada cuando no hay vencidas', async () => {
      const d = build();

      const result = await d.service.sweepTimeouts({}, actor);

      expect(result.escalatedInstances).toBe(0);
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
      expect(d.logger.warn).not.toHaveBeenCalled();
    });

    it('publica WorkflowTimedOut por instancia escalada', async () => {
      const d = build();
      d.runtimeRepo.findDueInstancesForUpdate.mockResolvedValue([
        {
          id: 'instancia-1',
          tenantId: TENANT_ID,
          statusConceptId: CONCEPTS.WF_INSTANCE_ACTIVE,
          updatedAt: new Date(),
        },
      ]);

      await d.service.sweepTimeouts({}, actor);

      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ eventType: 'WorkflowTimedOut' }),
      );
    });
  });
});
