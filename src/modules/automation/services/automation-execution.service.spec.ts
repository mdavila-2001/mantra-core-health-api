import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { CONCEPTS } from '../../../common';
import type { AgentRuns, AutomationApprovals } from '../entities';
import {
  AutomationExecutionService,
  compareDecimals,
} from './automation-execution.service';

const actor = { id: 'user-1', roles: ['SYSTEM'] } as any;
const WORKFLOW_ID = '11111111-1111-1111-1111-111111111111';
const RUN_ID = '22222222-2222-2222-2222-222222222222';
const AGENT_RUN_ID = '33333333-3333-3333-3333-333333333333';
const AGENT_ID = '44444444-4444-4444-4444-444444444444';
const VERSION_ID = '55555555-5555-5555-5555-555555555555';
const TOOL_ID = '66666666-6666-6666-6666-666666666666';
const SERVICE_USER_ID = '77777777-7777-7777-7777-777777777777';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const runsRepo = {
    createWorkflowRun: mockFn((_tx: any, data: any) => ({
      id: RUN_ID,
      ...data,
    })),
    findWorkflowRunById: mockFn(async () => null),
    findWorkflowRunForUpdate: mockFn(async () => null),
    findLiveRunByContext: mockFn(async () => null),
    countRunsByWorkflow: mockFn(async () => 0),
    createAgentRun: mockFn((_tx: any, data: any) => ({
      id: AGENT_RUN_ID,
      ...data,
    })),
    findAgentRunForUpdate: mockFn(async () => null),
    findAgentRunsByWorkflowRunForUpdate: mockFn(async () => []),
    createAgentRunStep: mockFn((_tx: any, data: any) => ({
      id: 'step-1',
      ...data,
    })),
    findMaxSequenceNo: mockFn(async () => 0),
    countToolCalls: mockFn(async () => 0),
    createApproval: mockFn((_tx: any, data: any) => ({
      id: 'approval-1',
      ...data,
    })),
    findApprovalForUpdate: mockFn(async () => null),
    findPendingApprovalsByAgentRuns: mockFn(async () => []),
  };
  const agentsRepo = {
    findAgentById: mockFn(async () => ({
      id: AGENT_ID,
      stateConceptId: CONCEPTS.AUTO_AGENT_ACTIVE,
      currentVersion: 1,
      actsAsUserId: SERVICE_USER_ID,
    })),
    findVersionById: mockFn(async () => null),
    findVersion: mockFn(async () => ({
      id: VERSION_ID,
      agentId: AGENT_ID,
      statusConceptId: CONCEPTS.AUTO_VERSION_PUBLISHED,
    })),
    findToolById: mockFn(async () => null),
    findBinding: mockFn(async () => null),
  };
  const governanceRepo = {
    findWorkflowById: mockFn(async () => ({
      id: WORKFLOW_ID,
      code: 'triage',
      stateConceptId: CONCEPTS.AUTO_WORKFLOW_ACTIVE,
    })),
    findTriggerById: mockFn(async () => null),
    findEnabledGuardrailsByAgent: mockFn(async () => []),
    findGuardrailPolicyById: mockFn(async () => null),
    findEnabledCalendarTriggers: mockFn(async () => []),
  };
  const outbox = {
    publishDomainEvent: mockFn(async () => ({ duplicate: false })),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new AutomationExecutionService(
    em as any,
    runsRepo as any,
    agentsRepo as any,
    governanceRepo as any,
    outbox as any,
    logger as any,
  );
  return {
    service,
    em,
    tx,
    runsRepo,
    agentsRepo,
    governanceRepo,
    outbox,
    logger,
  };
}

const START_DTO = { triggerSourceConceptId: CONCEPTS.AUTO_SOURCE_EVENT } as any;

describe('compareDecimals', () => {
  it('no se equivoca donde la coma flotante sí', () => {
    expect(compareDecimals('0.30000000000000004', '0.3')).toBe(1);
    expect(compareDecimals('0.3', '0.30')).toBe(0);
    expect(compareDecimals('10.5', '9.99')).toBe(1);
    expect(compareDecimals('-1.5', '0')).toBe(-1);
  });
});

describe('AutomationExecutionService', () => {
  describe('startWorkflowRun (UC-48-08)', () => {
    it('arranca el run directamente en marcha', async () => {
      const d = build();

      const result = await d.service.startWorkflowRun(
        WORKFLOW_ID,
        START_DTO,
        actor,
      );

      expect(
        d.runsRepo.createWorkflowRun.mock.calls[0][1].statusConceptId,
      ).toBe(CONCEPTS.AUTO_RUN_RUNNING);
      expect(result.duplicate).toBe(false);
    });

    it('numera el run a partir de los que ya lleva el workflow', async () => {
      const d = build();
      d.runsRepo.countRunsByWorkflow.mockResolvedValue(7);

      const result = await d.service.startWorkflowRun(
        WORKFLOW_ID,
        START_DTO,
        actor,
      );

      expect(result.runNumber).toBe('triage-8');
    });

    it('devuelve el run vivo en vez de arrancar otro sobre el mismo expediente', async () => {
      const d = build();
      d.runsRepo.findLiveRunByContext.mockResolvedValue({
        id: 'run-vivo',
        runNumber: 'triage-1',
        statusConceptId: CONCEPTS.AUTO_RUN_RUNNING,
      });

      const result = await d.service.startWorkflowRun(
        WORKFLOW_ID,
        { ...START_DTO, contextRefId: '88888888-8888-8888-8888-888888888888' },
        actor,
      );

      expect(result.duplicate).toBe(true);
      expect(result.id).toBe('run-vivo');
      expect(d.runsRepo.createWorkflowRun).not.toHaveBeenCalled();
    });

    it('rechaza un disparador deshabilitado', async () => {
      const d = build();
      d.governanceRepo.findTriggerById.mockResolvedValue({
        id: 'trigger-1',
        isEnabled: false,
        workflowId: WORKFLOW_ID,
      });

      await expect(
        d.service.startWorkflowRun(
          WORKFLOW_ID,
          { ...START_DTO, triggerId: 'trigger-1' },
          actor,
        ),
      ).rejects.toThrow(/deshabilitado/);
    });

    it('rechaza un disparador de otro workflow', async () => {
      const d = build();
      d.governanceRepo.findTriggerById.mockResolvedValue({
        id: 'trigger-1',
        isEnabled: true,
        workflowId: 'otro-workflow',
      });

      await expect(
        d.service.startWorkflowRun(
          WORKFLOW_ID,
          { ...START_DTO, triggerId: 'trigger-1' },
          actor,
        ),
      ).rejects.toThrow(/no pertenece a ese workflow/);
    });

    it('rechaza arrancar un workflow archivado', async () => {
      const d = build();
      d.governanceRepo.findWorkflowById.mockResolvedValue({
        id: WORKFLOW_ID,
        code: 'triage',
        stateConceptId: CONCEPTS.AUTO_WORKFLOW_ARCHIVED,
      });

      await expect(
        d.service.startWorkflowRun(WORKFLOW_ID, START_DTO, actor),
      ).rejects.toThrow(/archivado/);
    });
  });

  describe('startAgentRun (UC-48-09)', () => {
    const DTO = { agentId: AGENT_ID, taskTypeConceptId: 'task-type' } as any;

    /**
     * Ejecuta la operación with running run.
     *
     * @param d - Valor de d requerido por la operación.
     * @returns Resultado de with running run.
     */
    function withRunningRun(d: ReturnType<typeof build>) {
      d.runsRepo.findWorkflowRunById.mockResolvedValue({
        id: RUN_ID,
        statusConceptId: CONCEPTS.AUTO_RUN_RUNNING,
      });
    }

    it('usa la versión vigente del agente y la atribuye a su identidad de servicio', async () => {
      const d = build();
      withRunningRun(d);

      await d.service.startAgentRun(RUN_ID, DTO, actor);

      const created = d.runsRepo.createAgentRun.mock.calls[0][1];
      expect(created.agentVersionId).toBe(VERSION_ID);
      expect(created.actorUserId).toBe(SERVICE_USER_ID);
    });

    it('rechaza ejecutar una versión en borrador', async () => {
      const d = build();
      withRunningRun(d);
      d.agentsRepo.findVersion.mockResolvedValue({
        id: VERSION_ID,
        agentId: AGENT_ID,
        statusConceptId: CONCEPTS.AUTO_VERSION_DRAFT,
      });

      await expect(d.service.startAgentRun(RUN_ID, DTO, actor)).rejects.toThrow(
        /versión publicada/,
      );
    });

    it('rechaza ejecutar un agente que no está activo', async () => {
      const d = build();
      withRunningRun(d);
      d.agentsRepo.findAgentById.mockResolvedValue({
        id: AGENT_ID,
        stateConceptId: CONCEPTS.AUTO_AGENT_DRAFT,
        currentVersion: 1,
      });

      await expect(d.service.startAgentRun(RUN_ID, DTO, actor)).rejects.toThrow(
        /no está activo/,
      );
    });

    it('rechaza arrancar un agente si el run no está en marcha', async () => {
      const d = build();
      d.runsRepo.findWorkflowRunById.mockResolvedValue({
        id: RUN_ID,
        statusConceptId: CONCEPTS.AUTO_RUN_WAITING,
      });

      await expect(d.service.startAgentRun(RUN_ID, DTO, actor)).rejects.toThrow(
        /no está en marcha/,
      );
    });
  });

  describe('recordAgentStep (UC-48-09 y 10)', () => {
    /**
     * Ejecuta la operación with running agent run.
     *
     * @param d - Valor de d requerido por la operación.
     * @returns Resultado de with running agent run.
     */
    function withRunningAgentRun(d: ReturnType<typeof build>) {
      const agentRun = {
        id: AGENT_RUN_ID,
        agentId: AGENT_ID,
        agentVersionId: VERSION_ID,
        workflowRunId: RUN_ID,
        statusConceptId: CONCEPTS.AUTO_AGENT_RUN_RUNNING,
        updatedAt: new Date(),
      };
      d.runsRepo.findAgentRunForUpdate.mockResolvedValue(agentRun);
      return agentRun;
    }

    it('deriva el número de secuencia del último paso', async () => {
      const d = build();
      withRunningAgentRun(d);
      d.runsRepo.findMaxSequenceNo.mockResolvedValue(4);

      const result = await d.service.recordAgentStep(
        AGENT_RUN_ID,
        { stepKindConceptId: CONCEPTS.AUTO_STEP_THOUGHT },
        actor,
      );

      expect(result.sequenceNo).toBe(5);
      expect(result.paused).toBe(false);
    });

    it('registra el paso como fallido cuando llega un error', async () => {
      const d = build();
      withRunningAgentRun(d);

      const result = await d.service.recordAgentStep(
        AGENT_RUN_ID,
        {
          stepKindConceptId: CONCEPTS.AUTO_STEP_THOUGHT,
          errorText: 'timeout',
        },
        actor,
      );

      expect(result.statusConceptId).toBe(CONCEPTS.AUTO_STEP_FAILED);
    });

    it('lo atribuye a la identidad de servicio del agente', async () => {
      const d = build();
      withRunningAgentRun(d);

      await d.service.recordAgentStep(
        AGENT_RUN_ID,
        { stepKindConceptId: CONCEPTS.AUTO_STEP_THOUGHT },
        actor,
      );

      expect(
        d.runsRepo.createAgentRunStep.mock.calls[0][1].recordedByUserId,
      ).toBe(SERVICE_USER_ID);
    });

    describe('herramientas', () => {
      const TOOL_DTO = {
        stepKindConceptId: CONCEPTS.AUTO_STEP_TOOL_CALL,
        agentToolId: TOOL_ID,
        toolOutputJson: { ok: true },
      } as any;

      it('rechaza una herramienta no enlazada a la versión', async () => {
        const d = build();
        withRunningAgentRun(d);
        d.agentsRepo.findToolById.mockResolvedValue({ id: TOOL_ID });

        await expect(
          d.service.recordAgentStep(AGENT_RUN_ID, TOOL_DTO, actor),
        ).rejects.toThrow(/no está enlazada/);
      });

      it('rechaza un enlace que deniega la herramienta', async () => {
        const d = build();
        withRunningAgentRun(d);
        d.agentsRepo.findToolById.mockResolvedValue({ id: TOOL_ID });
        d.agentsRepo.findBinding.mockResolvedValue({
          permissionEffectConceptId: CONCEPTS.AUTO_PERMISSION_DENY,
        });

        await expect(
          d.service.recordAgentStep(AGENT_RUN_ID, TOOL_DTO, actor),
        ).rejects.toThrow(/deniega el uso/);
      });

      it('rechaza superar el tope de llamadas del enlace', async () => {
        const d = build();
        withRunningAgentRun(d);
        d.agentsRepo.findToolById.mockResolvedValue({ id: TOOL_ID });
        d.agentsRepo.findBinding.mockResolvedValue({
          permissionEffectConceptId: CONCEPTS.AUTO_PERMISSION_ALLOW,
          maxCallsPerRun: 2,
        });
        d.runsRepo.countToolCalls.mockResolvedValue(2);

        await expect(
          d.service.recordAgentStep(AGENT_RUN_ID, TOOL_DTO, actor),
        ).rejects.toThrow(/tope de llamadas/);
      });

      it('pausa el run cuando la herramienta escribe y exige aprobación', async () => {
        const d = build();
        const agentRun = withRunningAgentRun(d);
        d.agentsRepo.findToolById.mockResolvedValue({
          id: TOOL_ID,
          isWrite: true,
          requiresApproval: true,
          targetResource: 'clinical.encounters',
        });
        d.agentsRepo.findBinding.mockResolvedValue({
          permissionEffectConceptId: CONCEPTS.AUTO_PERMISSION_ALLOW,
        });
        const run = {
          id: RUN_ID,
          statusConceptId: CONCEPTS.AUTO_RUN_RUNNING,
          updatedAt: new Date(),
        };
        d.runsRepo.findWorkflowRunForUpdate.mockResolvedValue(run);

        const result = await d.service.recordAgentStep(
          AGENT_RUN_ID,
          TOOL_DTO,
          actor,
        );

        expect(result.paused).toBe(true);
        expect(result.statusConceptId).toBe(
          CONCEPTS.AUTO_STEP_AWAITING_APPROVAL,
        );
        expect(agentRun.statusConceptId).toBe(CONCEPTS.AUTO_AGENT_RUN_PAUSED);
        expect(run.statusConceptId).toBe(CONCEPTS.AUTO_RUN_WAITING);
      });

      it('no guarda salida en un paso bloqueado: la herramienta no llegó a correr', async () => {
        const d = build();
        withRunningAgentRun(d);
        d.agentsRepo.findToolById.mockResolvedValue({
          id: TOOL_ID,
          isWrite: true,
          requiresApproval: true,
        });
        d.agentsRepo.findBinding.mockResolvedValue({
          permissionEffectConceptId: CONCEPTS.AUTO_PERMISSION_ALLOW,
        });

        await d.service.recordAgentStep(AGENT_RUN_ID, TOOL_DTO, actor);

        expect(
          d.runsRepo.createAgentRunStep.mock.calls[0][1].toolOutputJson,
        ).toBeUndefined();
      });

      it('deja pasar una herramienta que escribe pero no exige aprobación', async () => {
        const d = build();
        withRunningAgentRun(d);
        d.agentsRepo.findToolById.mockResolvedValue({
          id: TOOL_ID,
          isWrite: true,
          requiresApproval: false,
        });
        d.agentsRepo.findBinding.mockResolvedValue({
          permissionEffectConceptId: CONCEPTS.AUTO_PERMISSION_ALLOW,
        });

        const result = await d.service.recordAgentStep(
          AGENT_RUN_ID,
          TOOL_DTO,
          actor,
        );

        expect(result.paused).toBe(false);
      });
    });

    describe('guardrails', () => {
      /**
       * Ejecuta la operación with guardrail.
       *
       * @param d - Valor de d requerido por la operación.
       * @param policy - Valor de policy requerido por la operación.
       * @returns Resultado de with guardrail.
       */
      function withGuardrail(d: ReturnType<typeof build>, policy: any) {
        d.governanceRepo.findEnabledGuardrailsByAgent.mockResolvedValue([
          { guardrailPolicyId: 'policy-1' },
        ]);
        d.governanceRepo.findGuardrailPolicyById.mockResolvedValue(policy);
      }

      it('pausa cuando se supera el tope de coste', async () => {
        const d = build();
        withRunningAgentRun(d);
        withGuardrail(d, {
          isActive: true,
          enforcementConceptId: CONCEPTS.AUTO_ENFORCEMENT_BLOCK,
          policyTypeConceptId: CONCEPTS.AUTO_GUARDRAIL_COST,
          maxCostAmount: '10.00',
        });

        const result = await d.service.recordAgentStep(
          AGENT_RUN_ID,
          {
            stepKindConceptId: CONCEPTS.AUTO_STEP_THOUGHT,
            accruedCostAmount: '10.01',
          },
          actor,
        );

        expect(result.paused).toBe(true);
        expect(
          d.runsRepo.createApproval.mock.calls[0][1].approvalTypeConceptId,
        ).toBe(CONCEPTS.AUTO_APPROVAL_TYPE_COST);
      });

      it('no pausa justo en el tope', async () => {
        const d = build();
        withRunningAgentRun(d);
        withGuardrail(d, {
          isActive: true,
          enforcementConceptId: CONCEPTS.AUTO_ENFORCEMENT_BLOCK,
          policyTypeConceptId: CONCEPTS.AUTO_GUARDRAIL_COST,
          maxCostAmount: '10.00',
        });

        const result = await d.service.recordAgentStep(
          AGENT_RUN_ID,
          {
            stepKindConceptId: CONCEPTS.AUTO_STEP_THOUGHT,
            accruedCostAmount: '10.00',
          },
          actor,
        );

        expect(result.paused).toBe(false);
      });

      it('no pausa si el guardrail sólo avisa', async () => {
        const d = build();
        withRunningAgentRun(d);
        withGuardrail(d, {
          isActive: true,
          enforcementConceptId: CONCEPTS.AUTO_ENFORCEMENT_WARN,
          policyTypeConceptId: CONCEPTS.AUTO_GUARDRAIL_COST,
          maxCostAmount: '1.00',
        });

        const result = await d.service.recordAgentStep(
          AGENT_RUN_ID,
          {
            stepKindConceptId: CONCEPTS.AUTO_STEP_THOUGHT,
            accruedCostAmount: '999',
          },
          actor,
        );

        expect(result.paused).toBe(false);
      });

      it('pausa ante una política de PHI que bloquea', async () => {
        const d = build();
        withRunningAgentRun(d);
        withGuardrail(d, {
          isActive: true,
          enforcementConceptId: CONCEPTS.AUTO_ENFORCEMENT_BLOCK,
          policyTypeConceptId: CONCEPTS.AUTO_GUARDRAIL_PHI,
          piiPhiHandlingConceptId: CONCEPTS.AUTO_PHI_BLOCK,
        });

        const result = await d.service.recordAgentStep(
          AGENT_RUN_ID,
          { stepKindConceptId: CONCEPTS.AUTO_STEP_THOUGHT },
          actor,
        );

        expect(result.paused).toBe(true);
        expect(
          d.runsRepo.createApproval.mock.calls[0][1].approvalTypeConceptId,
        ).toBe(CONCEPTS.AUTO_APPROVAL_TYPE_PHI_ACCESS);
      });

      it('ignora una política inactiva', async () => {
        const d = build();
        withRunningAgentRun(d);
        withGuardrail(d, {
          isActive: false,
          enforcementConceptId: CONCEPTS.AUTO_ENFORCEMENT_BLOCK,
          policyTypeConceptId: CONCEPTS.AUTO_GUARDRAIL_PHI,
          piiPhiHandlingConceptId: CONCEPTS.AUTO_PHI_BLOCK,
        });

        const result = await d.service.recordAgentStep(
          AGENT_RUN_ID,
          { stepKindConceptId: CONCEPTS.AUTO_STEP_THOUGHT },
          actor,
        );

        expect(result.paused).toBe(false);
      });
    });

    it('rechaza pasos sobre un run que no está en marcha', async () => {
      const d = build();
      d.runsRepo.findAgentRunForUpdate.mockResolvedValue({
        id: AGENT_RUN_ID,
        statusConceptId: CONCEPTS.AUTO_AGENT_RUN_PAUSED,
      });

      await expect(
        d.service.recordAgentStep(
          AGENT_RUN_ID,
          { stepKindConceptId: CONCEPTS.AUTO_STEP_THOUGHT } as any,
          actor,
        ),
      ).rejects.toThrow(/no está en marcha/);
    });
  });

  describe('requestApproval (UC-48-10)', () => {
    const DTO = {
      approvalTypeConceptId: CONCEPTS.AUTO_APPROVAL_TYPE_TOOL_WRITE,
    } as any;

    it('crea la aprobación y pausa el run', async () => {
      const d = build();
      const agentRun = {
        id: AGENT_RUN_ID,
        agentId: AGENT_ID,
        workflowRunId: RUN_ID,
        statusConceptId: CONCEPTS.AUTO_AGENT_RUN_RUNNING,
        updatedAt: new Date(),
      };
      d.runsRepo.findAgentRunForUpdate.mockResolvedValue(agentRun);

      const result = await d.service.requestApproval(AGENT_RUN_ID, DTO, actor);

      expect(result.duplicate).toBe(false);
      expect(agentRun.statusConceptId).toBe(CONCEPTS.AUTO_AGENT_RUN_PAUSED);
    });

    it('devuelve la pendiente en vez de crear otra', async () => {
      const d = build();
      d.runsRepo.findAgentRunForUpdate.mockResolvedValue({
        id: AGENT_RUN_ID,
        statusConceptId: CONCEPTS.AUTO_AGENT_RUN_PAUSED,
        updatedAt: new Date(),
      });
      d.runsRepo.findPendingApprovalsByAgentRuns.mockResolvedValue([
        {
          id: 'approval-previa',
          statusConceptId: CONCEPTS.AUTO_APPROVAL_PENDING,
        },
      ]);

      const result = await d.service.requestApproval(AGENT_RUN_ID, DTO, actor);

      expect(result.duplicate).toBe(true);
      expect(result.id).toBe('approval-previa');
      expect(d.runsRepo.createApproval).not.toHaveBeenCalled();
    });

    it('rechaza pedir aprobación sobre un run terminado', async () => {
      const d = build();
      d.runsRepo.findAgentRunForUpdate.mockResolvedValue({
        id: AGENT_RUN_ID,
        statusConceptId: CONCEPTS.AUTO_AGENT_RUN_SUCCEEDED,
      });

      await expect(
        d.service.requestApproval(AGENT_RUN_ID, DTO, actor),
      ).rejects.toThrow(/ya terminó/);
    });
  });

  describe('decideApproval (UC-48-11)', () => {
    /**
     * Ejecuta la operación with pending.
     *
     * @param d - Valor de d requerido por la operación.
     * @returns Resultado de with pending.
     */
    function withPending(d: ReturnType<typeof build>) {
      // `decidedByUserId` lo escribe el servicio al resolver la aprobación; se
      // declara en el doble (opcional, como en la entidad) para que el mock tenga
      // la forma real y las aserciones compilen.
      const approval: Pick<
        AutomationApprovals,
        'id' | 'agentRunId' | 'statusConceptId' | 'updatedAt' | 'decidedByUserId'
      > = {
        id: 'approval-1',
        agentRunId: AGENT_RUN_ID,
        statusConceptId: CONCEPTS.AUTO_APPROVAL_PENDING,
        updatedAt: new Date(),
      };
      const agentRun = {
        id: AGENT_RUN_ID,
        workflowRunId: RUN_ID,
        statusConceptId: CONCEPTS.AUTO_AGENT_RUN_PAUSED,
        updatedAt: new Date(),
      };
      const run = {
        id: RUN_ID,
        statusConceptId: CONCEPTS.AUTO_RUN_WAITING,
        updatedAt: new Date(),
      };
      d.runsRepo.findApprovalForUpdate.mockResolvedValue(approval);
      d.runsRepo.findAgentRunForUpdate.mockResolvedValue(agentRun);
      d.runsRepo.findWorkflowRunForUpdate.mockResolvedValue(run);
      return { approval, agentRun, run };
    }

    it('aprobar reanuda el agente y el workflow', async () => {
      const d = build();
      const { approval, agentRun, run } = withPending(d);

      await d.service.decideApproval(
        'approval-1',
        { decision: 'approved' } as any,
        actor,
      );

      expect(approval.statusConceptId).toBe(CONCEPTS.AUTO_APPROVAL_APPROVED);
      expect(agentRun.statusConceptId).toBe(CONCEPTS.AUTO_AGENT_RUN_RUNNING);
      expect(run.statusConceptId).toBe(CONCEPTS.AUTO_RUN_RUNNING);
    });

    it('rechazar cancela el agente y falla el workflow', async () => {
      const d = build();
      const { agentRun, run } = withPending(d);

      await d.service.decideApproval(
        'approval-1',
        { decision: 'rejected' } as any,
        actor,
      );

      expect(agentRun.statusConceptId).toBe(CONCEPTS.AUTO_AGENT_RUN_CANCELLED);
      expect(run.statusConceptId).toBe(CONCEPTS.AUTO_RUN_FAILED);
    });

    it('registra quién decidió y añade el paso de resolución', async () => {
      const d = build();
      const { approval } = withPending(d);

      const result = await d.service.decideApproval(
        'approval-1',
        { decision: 'approved', decisionNote: 'ok' } as any,
        actor,
      );

      expect(approval.decidedByUserId).toBe('user-1');
      expect(result.resolutionStepId).toBe('step-1');
      expect(
        d.runsRepo.createAgentRunStep.mock.calls[0][1].stepKindConceptId,
      ).toBe(CONCEPTS.AUTO_STEP_HUMAN_APPROVAL);
    });

    it('rechaza decidir dos veces', async () => {
      const d = build();
      d.runsRepo.findApprovalForUpdate.mockResolvedValue({
        id: 'approval-1',
        statusConceptId: CONCEPTS.AUTO_APPROVAL_APPROVED,
      });

      await expect(
        d.service.decideApproval(
          'approval-1',
          { decision: 'rejected' } as any,
          actor,
        ),
      ).rejects.toThrow(/ya está decidida/);
    });

    it('rechaza decidir si el agente no está en pausa', async () => {
      const d = build();
      d.runsRepo.findApprovalForUpdate.mockResolvedValue({
        id: 'approval-1',
        agentRunId: AGENT_RUN_ID,
        statusConceptId: CONCEPTS.AUTO_APPROVAL_PENDING,
        updatedAt: new Date(),
      });
      d.runsRepo.findAgentRunForUpdate.mockResolvedValue({
        id: AGENT_RUN_ID,
        statusConceptId: CONCEPTS.AUTO_AGENT_RUN_RUNNING,
      });

      await expect(
        d.service.decideApproval(
          'approval-1',
          { decision: 'approved' } as any,
          actor,
        ),
      ).rejects.toThrow(/no está en pausa/);
    });
  });

  describe('finalizeWorkflowRun (UC-48-14)', () => {
    /**
     * Ejecuta la operación with run.
     *
     * @param d - Valor de d requerido por la operación.
     * @param agentRuns - Valor de agent runs requerido por la operación.
     * @returns Resultado de with run.
     */
    function withRun(d: ReturnType<typeof build>, agentRuns: any[]) {
      const run = {
        id: RUN_ID,
        runNumber: 'triage-1',
        statusConceptId: CONCEPTS.AUTO_RUN_RUNNING,
        updatedAt: new Date(),
      };
      d.runsRepo.findWorkflowRunForUpdate.mockResolvedValue(run);
      d.runsRepo.findAgentRunsByWorkflowRunForUpdate.mockResolvedValue(
        agentRuns,
      );
      return run;
    }

    it('suma el coste de los agent_runs sin coma flotante', async () => {
      const d = build();
      const run = withRun(d, [
        {
          id: 'ar-1',
          statusConceptId: CONCEPTS.AUTO_AGENT_RUN_SUCCEEDED,
          costAmount: '0.1',
          updatedAt: new Date(),
        },
        {
          id: 'ar-2',
          statusConceptId: CONCEPTS.AUTO_AGENT_RUN_SUCCEEDED,
          costAmount: '0.2',
          updatedAt: new Date(),
        },
      ]);

      const result = await d.service.finalizeWorkflowRun(RUN_ID, {}, actor);

      expect(result.totalCostAmount).toBe('0.3');
      expect(run.statusConceptId).toBe(CONCEPTS.AUTO_RUN_COMPLETED);
    });

    it('cierra los agent_runs abiertos y calcula su latencia', async () => {
      const d = build();
      // `latencyMs` la calcula el servicio al cerrar el run; se declara en el
      // doble (opcional, como en la entidad) para que la aserción compile.
      const agentRun: Pick<
        AgentRuns,
        'id' | 'statusConceptId' | 'startedAt' | 'updatedAt' | 'latencyMs'
      > = {
        id: 'ar-1',
        statusConceptId: CONCEPTS.AUTO_AGENT_RUN_RUNNING,
        startedAt: new Date(Date.now() - 5000),
        updatedAt: new Date(),
      };
      withRun(d, [agentRun]);

      const result = await d.service.finalizeWorkflowRun(RUN_ID, {}, actor);

      expect(agentRun.statusConceptId).toBe(CONCEPTS.AUTO_AGENT_RUN_SUCCEEDED);
      expect(agentRun.latencyMs).toBeGreaterThanOrEqual(5000);
      expect(result.closedAgentRuns).toBe(1);
    });

    it('cierra como fallido si algún agent_run falló', async () => {
      const d = build();
      const run = withRun(d, [
        {
          id: 'ar-1',
          statusConceptId: CONCEPTS.AUTO_AGENT_RUN_FAILED,
          updatedAt: new Date(),
        },
      ]);

      await d.service.finalizeWorkflowRun(RUN_ID, {}, actor);

      expect(run.statusConceptId).toBe(CONCEPTS.AUTO_RUN_FAILED);
    });

    it('es idempotente sobre un run ya cerrado', async () => {
      const d = build();
      d.runsRepo.findWorkflowRunForUpdate.mockResolvedValue({
        id: RUN_ID,
        statusConceptId: CONCEPTS.AUTO_RUN_COMPLETED,
        totalCostAmount: '12.50',
      });

      const result = await d.service.finalizeWorkflowRun(RUN_ID, {}, actor);

      expect(result.alreadyFinalized).toBe(true);
      expect(result.totalCostAmount).toBe('12.50');
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });

    it('no cierra con aprobaciones pendientes', async () => {
      const d = build();
      withRun(d, [
        { id: 'ar-1', statusConceptId: CONCEPTS.AUTO_AGENT_RUN_PAUSED },
      ]);
      d.runsRepo.findPendingApprovalsByAgentRuns.mockResolvedValue([
        { id: 'approval-1' },
      ]);

      await expect(
        d.service.finalizeWorkflowRun(RUN_ID, {} as any, actor),
      ).rejects.toThrow(/aprobaciones pendientes/);
    });
  });

  describe('evaluateCalendarTriggers (UC-48-07, worker)', () => {
    const EVERY_MINUTE_CRON = '* * * * *';
    /** Cron con la próxima marca años en el futuro: nunca vence en la prueba. */
    const YEARLY_CRON = '0 0 1 1 *';

    it('arranca un workflow_run por cada disparador vencido y avanza su marca', async () => {
      const d = build();
      const twoMinutesAgo = new Date(Date.now() - 2 * 60_000);
      const trigger = {
        id: 'trigger-1',
        tenantId: undefined,
        workflowId: WORKFLOW_ID,
        scheduleCron: EVERY_MINUTE_CRON,
        updatedAt: twoMinutesAgo,
      };
      d.governanceRepo.findEnabledCalendarTriggers.mockResolvedValue([trigger]);

      const result = await d.service.evaluateCalendarTriggers({}, actor);

      expect(result.scanned).toBe(1);
      expect(result.fired).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.firedTriggers[0].triggerId).toBe('trigger-1');
      expect(
        d.runsRepo.createWorkflowRun.mock.calls[0][1].triggerSourceConceptId,
      ).toBe(CONCEPTS.AUTO_SOURCE_SCHEDULE);
      expect(d.runsRepo.createWorkflowRun.mock.calls[0][1].triggerId).toBe(
        'trigger-1',
      );
      // La marca avanza al instante exacto que tocaba, no a "ahora".
      expect(trigger.updatedAt.getTime()).toBeGreaterThan(
        twoMinutesAgo.getTime(),
      );
      expect(d.outbox.publishDomainEvent).toHaveBeenCalled();
    });

    it('no dispara un disparador cuya marca todavía no vence', async () => {
      const d = build();
      const trigger = {
        id: 'trigger-2',
        workflowId: WORKFLOW_ID,
        scheduleCron: YEARLY_CRON,
        updatedAt: new Date(),
      };
      d.governanceRepo.findEnabledCalendarTriggers.mockResolvedValue([trigger]);

      const result = await d.service.evaluateCalendarTriggers({}, actor);

      expect(result.fired).toBe(0);
      expect(result.skipped).toBe(1);
      expect(d.runsRepo.createWorkflowRun).not.toHaveBeenCalled();
    });

    it('salta y avanza igual un disparador cuyo workflow ya no está activo', async () => {
      const d = build();
      const twoMinutesAgo = new Date(Date.now() - 2 * 60_000);
      const trigger = {
        id: 'trigger-3',
        workflowId: WORKFLOW_ID,
        scheduleCron: EVERY_MINUTE_CRON,
        updatedAt: twoMinutesAgo,
      };
      d.governanceRepo.findEnabledCalendarTriggers.mockResolvedValue([trigger]);
      d.governanceRepo.findWorkflowById.mockResolvedValue({
        id: WORKFLOW_ID,
        code: 'triage',
        stateConceptId: CONCEPTS.AUTO_WORKFLOW_ARCHIVED,
      });

      const result = await d.service.evaluateCalendarTriggers({}, actor);

      expect(result.fired).toBe(0);
      expect(result.skipped).toBe(1);
      expect(d.runsRepo.createWorkflowRun).not.toHaveBeenCalled();
      expect(trigger.updatedAt.getTime()).toBeGreaterThan(
        twoMinutesAgo.getTime(),
      );
    });

    it('salta sin avanzar un disparador con un cron que el intérprete rechaza', async () => {
      const d = build();
      const reference = new Date(Date.now() - 2 * 60_000);
      const trigger = {
        id: 'trigger-4',
        workflowId: WORKFLOW_ID,
        scheduleCron: 'not a cron',
        updatedAt: reference,
      };
      d.governanceRepo.findEnabledCalendarTriggers.mockResolvedValue([trigger]);

      const result = await d.service.evaluateCalendarTriggers({}, actor);

      expect(result.fired).toBe(0);
      expect(result.skipped).toBe(1);
      expect(trigger.updatedAt).toBe(reference);
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('respeta el batchSize pedido al consultar el repositorio', async () => {
      const d = build();

      await d.service.evaluateCalendarTriggers({ batchSize: 10 }, actor);

      expect(d.governanceRepo.findEnabledCalendarTriggers).toHaveBeenCalledWith(
        d.tx,
        CONCEPTS.AUTO_TRIGGER_TYPE_SCHEDULE,
        CONCEPTS.AUTO_TRIGGER_ACTIVE,
        10,
      );
    });
  });
});
