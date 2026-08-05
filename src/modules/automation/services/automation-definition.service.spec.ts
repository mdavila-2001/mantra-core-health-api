import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { CONCEPTS } from '../../../common';
import { AutomationDefinitionService } from './automation-definition.service';

const actor = { id: 'user-1', roles: ['AUTOMATION_ENGINEER'] } as any;
const WORKFLOW_ID = '11111111-1111-1111-1111-111111111111';
const AGENT_ID = '22222222-2222-2222-2222-222222222222';
const TOOL_ID = '33333333-3333-3333-3333-333333333333';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const governanceRepo = {
    findWorkflowByCode: mockFn(async () => null),
    findWorkflowById: mockFn(async () => null),
    createWorkflow: mockFn((_tx: any, data: any) => ({
      id: WORKFLOW_ID,
      ...data,
    })),
    createWorkflowStep: mockFn((_tx: any, data: any) => ({
      id: `step-${data.stepCode}`,
      ...data,
    })),
    findTriggerByCode: mockFn(async () => null),
    createTrigger: mockFn((_tx: any, data: any) => ({
      id: 'trigger-1',
      ...data,
    })),
  };
  const agentsRepo = {
    findAgentById: mockFn(async () => ({ id: AGENT_ID })),
    findToolById: mockFn(async () => ({ id: TOOL_ID })),
  };
  const outbox = {
    publishDomainEvent: mockFn(async () => ({ duplicate: false })),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new AutomationDefinitionService(
    em as any,
    governanceRepo as any,
    agentsRepo as any,
    outbox as any,
    logger as any,
  );
  return { service, em, tx, governanceRepo, agentsRepo, outbox, logger };
}

const WORKFLOW_DTO = {
  code: 'triage',
  name: 'Triaje',
  orchestrationTypeConceptId: CONCEPTS.AUTO_ORCHESTRATION_SEQUENTIAL,
  steps: [
    {
      stepCode: 'clasificar',
      stepTypeConceptId: CONCEPTS.AUTO_STEP_AGENT_CALL,
      agentId: AGENT_ID,
      onSuccessStepCode: 'registrar',
      ordinal: 0,
    },
    {
      stepCode: 'registrar',
      stepTypeConceptId: CONCEPTS.AUTO_STEP_TOOL_CALL,
      agentToolId: TOOL_ID,
      ordinal: 1,
    },
  ],
} as any;

describe('AutomationDefinitionService', () => {
  describe('defineWorkflow (UC-48-06)', () => {
    it('crea el workflow en borrador con sus pasos', async () => {
      const d = build();

      const result = await d.service.defineWorkflow(WORKFLOW_DTO, actor);

      expect(
        d.governanceRepo.createWorkflow.mock.calls[0][1].stateConceptId,
      ).toBe(CONCEPTS.AUTO_WORKFLOW_DRAFT);
      expect(result.stepIds).toHaveLength(2);
    });

    it('resuelve los saltos por código después de crear todos los pasos', async () => {
      const d = build();

      await d.service.defineWorkflow(WORKFLOW_DTO, actor);

      const clasificar =
        d.governanceRepo.createWorkflowStep.mock.results[0].value;
      expect(clasificar.onSuccessStepId).toBe('step-registrar');
    });

    it('rechaza un salto a un paso no declarado', async () => {
      const d = build();

      await expect(
        d.service.defineWorkflow(
          {
            ...WORKFLOW_DTO,
            steps: [
              { ...WORKFLOW_DTO.steps[0], onSuccessStepCode: 'inexistente' },
            ],
          },
          actor,
        ),
      ).rejects.toThrow(/no está declarado/);
    });

    it('rechaza dos pasos con el mismo código', async () => {
      const d = build();

      await expect(
        d.service.defineWorkflow(
          {
            ...WORKFLOW_DTO,
            steps: [
              WORKFLOW_DTO.steps[0],
              { ...WORKFLOW_DTO.steps[0], onSuccessStepCode: undefined },
            ],
          },
          actor,
        ),
      ).rejects.toThrow(/mismo código/);
    });

    it('exige agente en un paso de llamada a agente', async () => {
      const d = build();

      await expect(
        d.service.defineWorkflow(
          {
            ...WORKFLOW_DTO,
            steps: [
              {
                stepCode: 'x',
                stepTypeConceptId: CONCEPTS.AUTO_STEP_AGENT_CALL,
                ordinal: 0,
              },
            ],
          },
          actor,
        ),
      ).rejects.toThrow(/qué agente llama/);
    });

    it('exige herramienta en un paso de llamada a herramienta', async () => {
      const d = build();

      await expect(
        d.service.defineWorkflow(
          {
            ...WORKFLOW_DTO,
            steps: [
              {
                stepCode: 'x',
                stepTypeConceptId: CONCEPTS.AUTO_STEP_TOOL_CALL,
                ordinal: 0,
              },
            ],
          },
          actor,
        ),
      ).rejects.toThrow(/qué herramienta usa/);
    });

    it('rechaza un agente referenciado que no existe', async () => {
      const d = build();
      d.agentsRepo.findAgentById.mockResolvedValue(null);

      await expect(
        d.service.defineWorkflow(WORKFLOW_DTO, actor),
      ).rejects.toThrow(/Agente referenciado/);
    });

    it('rechaza un código de workflow repetido', async () => {
      const d = build();
      d.governanceRepo.findWorkflowByCode.mockResolvedValue({ id: 'otro' });

      await expect(
        d.service.defineWorkflow(WORKFLOW_DTO, actor),
      ).rejects.toThrow(/Ya existe un workflow/);
    });
  });

  describe('configureTrigger (UC-48-07)', () => {
    const TRIGGER_DTO = {
      code: 'on-encounter-created',
      name: 'Al crear encuentro',
      triggerTypeConceptId: CONCEPTS.AUTO_TRIGGER_TYPE_EVENT,
      eventType: 'EncounterCreated',
      workflowId: WORKFLOW_ID,
    } as any;

    /**
     * Ejecuta la operación with workflow.
     *
     * @param d - Valor de d requerido por la operación.
     * @param state - Valor de state requerido por la operación.
     * @returns Resultado de with workflow.
     */
    function withWorkflow(
      d: ReturnType<typeof build>,
      state = CONCEPTS.AUTO_WORKFLOW_ACTIVE,
    ) {
      d.governanceRepo.findWorkflowById.mockResolvedValue({
        id: WORKFLOW_ID,
        stateConceptId: state,
      });
    }

    it('crea el disparador activo y habilitado', async () => {
      const d = build();
      withWorkflow(d);

      const result = await d.service.configureTrigger(TRIGGER_DTO, actor);

      expect(result.isEnabled).toBe(true);
      expect(result.stateConceptId).toBe(CONCEPTS.AUTO_TRIGGER_ACTIVE);
    });

    it('exige el tipo de evento a un disparador por evento', async () => {
      const d = build();
      withWorkflow(d);

      await expect(
        d.service.configureTrigger(
          { ...TRIGGER_DTO, eventType: undefined },
          actor,
        ),
      ).rejects.toThrow(/qué evento suscribe/);
    });

    it('exige cron a un disparador por calendario', async () => {
      const d = build();
      withWorkflow(d);

      await expect(
        d.service.configureTrigger(
          {
            ...TRIGGER_DTO,
            triggerTypeConceptId: CONCEPTS.AUTO_TRIGGER_TYPE_SCHEDULE,
          },
          actor,
        ),
      ).rejects.toThrow(/su cron/);
    });

    it('rechaza un cron que no tiene cinco campos', async () => {
      const d = build();
      withWorkflow(d);

      await expect(
        d.service.configureTrigger(
          {
            ...TRIGGER_DTO,
            triggerTypeConceptId: CONCEPTS.AUTO_TRIGGER_TYPE_SCHEDULE,
            scheduleCron: '0 9 *',
          },
          actor,
        ),
      ).rejects.toThrow(/cinco campos/);
    });

    it('acepta un cron de cinco campos', async () => {
      const d = build();
      withWorkflow(d);

      await expect(
        d.service.configureTrigger(
          {
            ...TRIGGER_DTO,
            triggerTypeConceptId: CONCEPTS.AUTO_TRIGGER_TYPE_SCHEDULE,
            scheduleCron: '0 9 * * 1',
          },
          actor,
        ),
      ).resolves.toBeDefined();
    });

    it('marca el origen del calendario como campaña cuando llega el id', async () => {
      const d = build();
      withWorkflow(d);

      await d.service.configureTrigger(
        {
          ...TRIGGER_DTO,
          campaignScheduleId: '44444444-4444-4444-4444-444444444444',
        },
        actor,
      );

      expect(
        d.governanceRepo.createTrigger.mock.calls[0][1].scheduleSourceConceptId,
      ).toBe(CONCEPTS.AUTO_SCHEDULE_SOURCE_CAMPAIGN);
    });

    it('rechaza disparar un workflow archivado', async () => {
      const d = build();
      withWorkflow(d, CONCEPTS.AUTO_WORKFLOW_ARCHIVED);

      await expect(
        d.service.configureTrigger(TRIGGER_DTO, actor),
      ).rejects.toThrow(/archivado/);
    });
  });
});
