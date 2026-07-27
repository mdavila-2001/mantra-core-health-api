import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { WorkflowDefinitionsController } from './workflow-definitions.controller';
import { WorkflowTransitionsController } from './workflow-transitions.controller';
import { WorkflowInstancesController } from './workflow-instances.controller';

const actor = { id: 'user-1', roles: ['PLATFORM_ADMIN'] } as any;
const ID = '11111111-1111-1111-1111-111111111111';
const EVENT_ID = '22222222-2222-2222-2222-222222222222';

describe('WorkflowDefinitionsController', () => {
  function build() {
    const definitionService = {
      registerStateMachine: mockFn(async () => ({ id: ID })),
      defineStates: mockFn(async () => ({ stateIds: [] })),
      defineTransition: mockFn(async () => ({ id: ID })),
      publishStateMachine: mockFn(async () => ({ id: ID })),
    };
    return {
      controller: new WorkflowDefinitionsController(definitionService as any),
      definitionService,
    };
  }

  it('delega el registro de la máquina (UC-32-01)', async () => {
    const d = build();
    const dto = { machineCode: 'encounter-lifecycle' } as any;

    await d.controller.registerStateMachine(dto, actor);

    expect(d.definitionService.registerStateMachine).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('delega la declaración de estados con el id de ruta (UC-32-02)', async () => {
    const d = build();
    const dto = { states: [] } as any;

    await d.controller.defineStates(ID, dto, actor);

    expect(d.definitionService.defineStates).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delega la declaración de la transición con el id de ruta (UC-32-03)', async () => {
    const d = build();
    const dto = { transitionCode: 'close' } as any;

    await d.controller.defineTransition(ID, dto, actor);

    expect(d.definitionService.defineTransition).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delega la publicación con el id de ruta (UC-32-04)', async () => {
    const d = build();
    const dto = {} as any;

    await d.controller.publishStateMachine(ID, dto, actor);

    expect(d.definitionService.publishStateMachine).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });
});

describe('WorkflowTransitionsController', () => {
  function build() {
    const executionService = {
      triggerTransition: mockFn(async () => ({ id: ID })),
      compensateTransition: mockFn(async () => ({ compensationEventId: ID })),
      retryTransition: mockFn(async () => ({ retryEventId: ID })),
      getTransitionHistory: mockFn(async () => ({ transitions: [] })),
    };
    return {
      controller: new WorkflowTransitionsController(executionService as any),
      executionService,
    };
  }

  it('pasa el comando de la ruta y la cabecera de idempotencia (UC-32-05, 06)', async () => {
    const d = build();
    const dto = { machineCode: 'encounter-lifecycle' } as any;

    await d.controller.triggerTransition(ID, 'CLOSE', dto, actor, 'clave-1');

    expect(d.executionService.triggerTransition).toHaveBeenCalledWith(
      ID,
      'CLOSE',
      dto,
      actor,
      'clave-1',
    );
  });

  it('delega la compensación con agregado y evento (UC-32-08)', async () => {
    const d = build();
    const dto = { reasonText: 'falló el pago' } as any;

    await d.controller.compensateTransition(ID, EVENT_ID, dto, actor);

    expect(d.executionService.compensateTransition).toHaveBeenCalledWith(
      ID,
      EVENT_ID,
      dto,
      actor,
    );
  });

  it('delega el reintento con agregado y evento (UC-32-09)', async () => {
    const d = build();
    const dto = {} as any;

    await d.controller.retryTransition(ID, EVENT_ID, dto, actor);

    expect(d.executionService.retryTransition).toHaveBeenCalledWith(
      ID,
      EVENT_ID,
      dto,
      actor,
    );
  });

  it('delega el historial con la query (UC-32-11)', async () => {
    const d = build();
    const query = { limit: 10 } as any;

    await d.controller.getTransitionHistory(ID, query);

    expect(d.executionService.getTransitionHistory).toHaveBeenCalledWith(
      ID,
      query,
    );
  });
});

describe('WorkflowInstancesController', () => {
  function build() {
    const instancesService = {
      createInstance: mockFn(async () => ({ id: ID })),
      completeTask: mockFn(async () => ({ taskId: ID })),
      sweepTimeouts: mockFn(async () => ({ escalatedInstances: 0 })),
    };
    return {
      controller: new WorkflowInstancesController(instancesService as any),
      instancesService,
    };
  }

  it('delega la creación de la instancia (UC-32-12)', async () => {
    const d = build();
    const dto = { workflowCode: 'encounter-lifecycle' } as any;

    await d.controller.createInstance(dto, actor);

    expect(d.instancesService.createInstance).toHaveBeenCalledWith(dto, actor);
  });

  it('delega el completado con el id de ruta (UC-32-13)', async () => {
    const d = build();
    const dto = { commandCode: 'SIGN' } as any;

    await d.controller.completeTask(ID, dto, actor);

    expect(d.instancesService.completeTask).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delega el barrido de vencidos (UC-32-10)', async () => {
    const d = build();
    const dto = { batchSize: 10 } as any;

    await d.controller.sweepTimeouts(dto, actor);

    expect(d.instancesService.sweepTimeouts).toHaveBeenCalledWith(dto, actor);
  });
});
