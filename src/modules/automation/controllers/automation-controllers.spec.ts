import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { AgentCatalogController } from './agent-catalog.controller';
import { AutomationOrchestrationController } from './automation-orchestration.controller';

const actor = { id: 'user-1', roles: ['PLATFORM_ADMIN'] } as any;
const ID = '11111111-1111-1111-1111-111111111111';
const SECOND_ID = '22222222-2222-2222-2222-222222222222';

describe('AgentCatalogController', () => {
  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
  function build() {
    const catalogService = {
      registerAgent: mockFn(async () => ({ id: ID })),
      publishAgentVersion: mockFn(async () => ({ id: ID })),
      registerTool: mockFn(async () => ({ id: ID })),
      bindTools: mockFn(async () => ({ bindingIds: [] })),
      defineGuardrail: mockFn(async () => ({ id: ID })),
      attachGuardrail: mockFn(async () => ({ id: ID })),
      upsertMemory: mockFn(async () => ({ id: ID })),
    };
    return {
      controller: new AgentCatalogController(catalogService as any),
      catalogService,
    };
  }

  it('delega el registro del agente (UC-48-01)', async () => {
    const d = build();
    const dto = { code: 'triage-bot' } as any;

    await d.controller.registerAgent(dto, actor);

    expect(d.catalogService.registerAgent).toHaveBeenCalledWith(dto, actor);
  });

  it('delega la publicación con el id de ruta (UC-48-02)', async () => {
    const d = build();
    const dto = {} as any;

    await d.controller.publishAgentVersion(ID, dto, actor);

    expect(d.catalogService.publishAgentVersion).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delega el registro de la herramienta (UC-48-03)', async () => {
    const d = build();
    const dto = { code: 'create-encounter' } as any;

    await d.controller.registerTool(dto, actor);

    expect(d.catalogService.registerTool).toHaveBeenCalledWith(dto, actor);
  });

  it('pasa agente y versión de la ruta al enlazar (UC-48-04)', async () => {
    const d = build();
    const dto = { bindings: [] } as any;

    await d.controller.bindTools(ID, SECOND_ID, dto, actor);

    expect(d.catalogService.bindTools).toHaveBeenCalledWith(
      ID,
      SECOND_ID,
      dto,
      actor,
    );
  });

  it('delega la definición del guardrail (UC-48-05)', async () => {
    const d = build();
    const dto = { code: 'phi-block' } as any;

    await d.controller.defineGuardrail(dto, actor);

    expect(d.catalogService.defineGuardrail).toHaveBeenCalledWith(dto, actor);
  });

  it('delega la adjunción con el id de ruta (UC-48-05)', async () => {
    const d = build();
    const dto = { guardrailPolicyId: SECOND_ID } as any;

    await d.controller.attachGuardrail(ID, dto, actor);

    expect(d.catalogService.attachGuardrail).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delega la memoria con el id de ruta (UC-48-12)', async () => {
    const d = build();
    const dto = { contentText: 'algo' } as any;

    await d.controller.upsertMemory(ID, dto, actor);

    expect(d.catalogService.upsertMemory).toHaveBeenCalledWith(ID, dto, actor);
  });
});

describe('AutomationOrchestrationController', () => {
  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
  function build() {
    const definitionService = {
      defineWorkflow: mockFn(async () => ({ id: ID })),
      configureTrigger: mockFn(async () => ({ id: ID })),
    };
    const executionService = {
      startWorkflowRun: mockFn(async () => ({ id: ID })),
      startAgentRun: mockFn(async () => ({ id: ID })),
      recordAgentStep: mockFn(async () => ({ id: ID })),
      requestApproval: mockFn(async () => ({ id: ID })),
      decideApproval: mockFn(async () => ({ id: ID })),
      finalizeWorkflowRun: mockFn(async () => ({ id: ID })),
    };
    const recordService = {
      executeRecordAutomation: mockFn(async () => ({ written: true })),
    };
    return {
      controller: new AutomationOrchestrationController(
        definitionService as any,
        executionService as any,
        recordService as any,
      ),
      definitionService,
      executionService,
      recordService,
    };
  }

  it('delega la definición del workflow (UC-48-06)', async () => {
    const d = build();
    const dto = { code: 'triage' } as any;

    await d.controller.defineWorkflow(dto, actor);

    expect(d.definitionService.defineWorkflow).toHaveBeenCalledWith(dto, actor);
  });

  it('delega la configuración del disparador (UC-48-07)', async () => {
    const d = build();
    const dto = { code: 'on-created' } as any;

    await d.controller.configureTrigger(dto, actor);

    expect(d.definitionService.configureTrigger).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('delega el arranque del run con el id de ruta (UC-48-08)', async () => {
    const d = build();
    const dto = {} as any;

    await d.controller.startWorkflowRun(ID, dto, actor);

    expect(d.executionService.startWorkflowRun).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delega el arranque del agente con el id del run (UC-48-09)', async () => {
    const d = build();
    const dto = { agentId: SECOND_ID } as any;

    await d.controller.startAgentRun(ID, dto, actor);

    expect(d.executionService.startAgentRun).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delega el registro del paso (UC-48-09)', async () => {
    const d = build();
    const dto = { stepKindConceptId: SECOND_ID } as any;

    await d.controller.recordAgentStep(ID, dto, actor);

    expect(d.executionService.recordAgentStep).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delega la solicitud de aprobación (UC-48-10)', async () => {
    const d = build();
    const dto = { approvalTypeConceptId: SECOND_ID } as any;

    await d.controller.requestApproval(ID, dto, actor);

    expect(d.executionService.requestApproval).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delega la decisión de la aprobación (UC-48-11)', async () => {
    const d = build();
    const dto = { decision: 'approved' } as any;

    await d.controller.decideApproval(ID, dto, actor);

    expect(d.executionService.decideApproval).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('pasa run y automatización de la ruta al ejecutar (UC-48-13)', async () => {
    const d = build();
    const dto = { payloadJson: {} } as any;

    await d.controller.executeRecordAutomation(ID, SECOND_ID, dto, actor);

    expect(d.recordService.executeRecordAutomation).toHaveBeenCalledWith(
      ID,
      SECOND_ID,
      dto,
      actor,
    );
  });

  it('delega el cierre del run (UC-48-14)', async () => {
    const d = build();
    const dto = {} as any;

    await d.controller.finalizeWorkflowRun(ID, dto, actor);

    expect(d.executionService.finalizeWorkflowRun).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });
});
