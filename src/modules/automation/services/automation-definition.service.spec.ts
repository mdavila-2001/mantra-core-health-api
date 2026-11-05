import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { CONCEPTS, runWithTenant } from '../../../common';
import { AutomationErrorReason } from '../automation.error-reasons';
import { AutomationDefinitionService } from './automation-definition.service';

const TENANT_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TENANT_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

/**
 * Ejecuta cada método del servicio dentro del contexto de tenant dado, como lo
 * hace `TenantContextInterceptor` en una petición real.
 *
 * @param service - Servicio bajo prueba.
 * @param tenantId - Tenant del contexto de la petición.
 * @returns Un proxy que ejecuta cada método dentro de `runWithTenant`.
 */
function inTenant<T extends object>(service: T, tenantId: string): T {
  return new Proxy(service, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) =>
        runWithTenant(tenantId, () => value.apply(target, args));
    },
  });
}

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
    findAgentById: mockFn(async () => ({ id: AGENT_ID, tenantId: TENANT_A })),
    findToolById: mockFn(async () => ({ id: TOOL_ID })),
  };
  const outbox = {
    publishDomainEvent: mockFn(async () => ({ duplicate: false })),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const raw = new AutomationDefinitionService(
    em as any,
    governanceRepo as any,
    agentsRepo as any,
    outbox as any,
    logger as any,
  );
  const service = inTenant(raw, TENANT_A);
  return {
    service,
    raw,
    asTenantB: inTenant(raw, TENANT_B),
    em,
    tx,
    governanceRepo,
    agentsRepo,
    outbox,
    logger,
  };
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

      const classify =
        d.governanceRepo.createWorkflowStep.mock.results[0].value;
      expect(classify.onSuccessStepId).toBe('step-registrar');
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
        tenantId: TENANT_A,
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
  describe('alcance de tenant (AUTO-01)', () => {
    const NOT_FOUND = 404;

    /**
     * Captura el rechazo para inspeccionar status, code, reason y details.
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

    it('el engineer de A define workflow, y el tenant sale del contexto', async () => {
      const d = build();

      const result = await d.service.defineWorkflow(WORKFLOW_DTO, actor);

      expect(result.id).toBe(WORKFLOW_ID);
      expect(d.governanceRepo.createWorkflow.mock.calls[0][1].tenantId).toBe(
        TENANT_A,
      );
      expect(d.outbox.publishDomainEvent.mock.calls[0][1].tenantId).toBe(
        TENANT_A,
      );
    });

    it('ignora el tenantId del cuerpo: nunca es fuente de verdad', async () => {
      const d = build();

      await d.service.defineWorkflow(
        { ...WORKFLOW_DTO, tenantId: TENANT_B },
        actor,
      );

      expect(d.governanceRepo.createWorkflow.mock.calls[0][1].tenantId).toBe(
        TENANT_A,
      );
    });

    it('sin tenant en el contexto no define nada (denegar por defecto)', async () => {
      const d = build();

      const error = await rejection(d.raw.defineWorkflow(WORKFLOW_DTO, actor));

      expect(error.getStatus()).toBe(422);
      expect(error.details).toEqual({ reason: 'TENANT_REQUIRED' });
      expect(d.governanceRepo.createWorkflow).not.toHaveBeenCalled();
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });

    it('un agente de B referenciado por un paso responde igual que uno inexistente', async () => {
      const foreign = build();
      foreign.agentsRepo.findAgentById.mockResolvedValue({
        id: AGENT_ID,
        tenantId: TENANT_B,
      });
      const absent = build();
      absent.agentsRepo.findAgentById.mockResolvedValue(null);

      const a = await rejection(
        foreign.service.defineWorkflow(WORKFLOW_DTO, actor),
      );
      const b = await rejection(
        absent.service.defineWorkflow(WORKFLOW_DTO, actor),
      );

      expect(a.getStatus()).toBe(NOT_FOUND);
      expect(a.reason).toBe(AutomationErrorReason.STEP_AGENT_NOT_FOUND);
      expect(a.getResponse()).toEqual(b.getResponse());
      expect(a.details).toBeUndefined();
      expect(foreign.governanceRepo.createWorkflow).not.toHaveBeenCalled();
      expect(foreign.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });

    it('un agente sin tenant (huérfano) tampoco se acepta', async () => {
      const d = build();
      d.agentsRepo.findAgentById.mockResolvedValue({ id: AGENT_ID });

      await expect(
        d.service.defineWorkflow(WORKFLOW_DTO, actor),
      ).rejects.toMatchObject({
        reason: AutomationErrorReason.STEP_AGENT_NOT_FOUND,
      });
    });

    it('configura el disparador de A con el tenant del contexto', async () => {
      const d = build();
      d.governanceRepo.findWorkflowById.mockResolvedValue({
        id: WORKFLOW_ID,
        tenantId: TENANT_A,
        stateConceptId: CONCEPTS.AUTO_WORKFLOW_ACTIVE,
      });

      await d.service.configureTrigger(
        {
          code: 't',
          name: 'T',
          triggerTypeConceptId: CONCEPTS.AUTO_TRIGGER_TYPE_EVENT,
          eventType: 'E',
          workflowId: WORKFLOW_ID,
          tenantId: TENANT_B,
        } as any,
        actor,
      );

      expect(d.governanceRepo.createTrigger.mock.calls[0][1].tenantId).toBe(
        TENANT_A,
      );
      expect(d.outbox.publishDomainEvent.mock.calls[0][1].tenantId).toBe(
        TENANT_A,
      );
    });

    it('el workflow de B configurado desde A responde igual que uno inexistente', async () => {
      const foreign = build();
      foreign.governanceRepo.findWorkflowById.mockResolvedValue({
        id: WORKFLOW_ID,
        tenantId: TENANT_B,
        stateConceptId: CONCEPTS.AUTO_WORKFLOW_ACTIVE,
      });
      const absent = build();
      absent.governanceRepo.findWorkflowById.mockResolvedValue(null);
      const dto = {
        code: 't',
        name: 'T',
        triggerTypeConceptId: CONCEPTS.AUTO_TRIGGER_TYPE_EVENT,
        eventType: 'E',
        workflowId: WORKFLOW_ID,
      } as any;

      const a = await rejection(foreign.service.configureTrigger(dto, actor));
      const b = await rejection(absent.service.configureTrigger(dto, actor));

      expect(a.getStatus()).toBe(NOT_FOUND);
      expect(a.reason).toBe(AutomationErrorReason.WORKFLOW_NOT_FOUND);
      expect(a.getResponse()).toEqual(b.getResponse());
      expect(foreign.governanceRepo.createTrigger).not.toHaveBeenCalled();
      expect(foreign.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });

    it('el mismo workflow es visible desde su propio tenant y ajeno desde B', async () => {
      const d = build();
      d.governanceRepo.findWorkflowById.mockResolvedValue({
        id: WORKFLOW_ID,
        tenantId: TENANT_A,
        stateConceptId: CONCEPTS.AUTO_WORKFLOW_ACTIVE,
      });
      const dto = {
        code: 't',
        name: 'T',
        triggerTypeConceptId: CONCEPTS.AUTO_TRIGGER_TYPE_EVENT,
        eventType: 'E',
        workflowId: WORKFLOW_ID,
      } as any;

      await expect(
        d.asTenantB.configureTrigger(dto, actor),
      ).rejects.toMatchObject({
        reason: AutomationErrorReason.WORKFLOW_NOT_FOUND,
      });
      await expect(
        d.service.configureTrigger(dto, actor),
      ).resolves.toBeDefined();
    });
  });
});
