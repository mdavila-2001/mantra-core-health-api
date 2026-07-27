import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { OutboxService } from '../../messaging/services';
import type { AgentRuns, WorkflowRuns } from '../entities';
import {
  AgentsRepository,
  AutomationGovernanceRepository,
  AutomationRunsRepository,
} from '../repositories';
import {
  StartWorkflowRunDto,
  WorkflowRunResponseDto,
  StartAgentRunDto,
  AgentRunResponseDto,
  RecordAgentStepDto,
  AgentStepResponseDto,
  RequestApprovalDto,
  ApprovalResponseDto,
  DecideApprovalDto,
  DecideApprovalResponseDto,
  FinalizeWorkflowRunDto,
  FinalizeWorkflowRunResponseDto,
} from '../dto';

/** Estados en los que un `workflow_run` sigue ocupando su contexto. */
const LIVE_RUN_STATUSES = [
  CONCEPTS.AUTO_RUN_QUEUED,
  CONCEPTS.AUTO_RUN_RUNNING,
  CONCEPTS.AUTO_RUN_WAITING,
];

/** Estados en los que un `agent_run` todavía no ha terminado. */
const OPEN_AGENT_RUN_STATUSES = [
  CONCEPTS.AUTO_AGENT_RUN_RUNNING,
  CONCEPTS.AUTO_AGENT_RUN_PAUSED,
];

/**
 * Compara dos importes decimales sin pasar por coma flotante. Escala los dos a
 * la misma cantidad de decimales y compara como enteros: `0.1 + 0.2 > 0.3` es
 * verdad en coma flotante, y aquí eso sería bloquear un run por un coste que no
 * se ha superado.
 */
export function compareDecimals(left: string, right: string): number {
  const split = (value: string): [bigint, string] => {
    const negative = value.trim().startsWith('-');
    const clean = value.trim().replace(/^[+-]/, '');
    const [whole, fraction = ''] = clean.split('.');
    return [negative ? -1n : 1n, `${whole}.${fraction}`];
  };

  const [leftSign, leftValue] = split(left);
  const [rightSign, rightValue] = split(right);
  const leftFraction = leftValue.split('.')[1];
  const rightFraction = rightValue.split('.')[1];
  const scale = Math.max(leftFraction.length, rightFraction.length);

  const toInteger = (sign: bigint, value: string): bigint => {
    const [whole, fraction] = value.split('.');
    return sign * BigInt(`${whole || '0'}${fraction.padEnd(scale, '0')}`);
  };

  const a = toInteger(leftSign, leftValue);
  const b = toInteger(rightSign, rightValue);
  return a === b ? 0 : a > b ? 1 : -1;
}

/**
 * Ejecución de la automatización (UC-48-08 … 11, 14): arrancar el run del
 * workflow, ejecutar agentes con traza paso a paso, pausar por guardrail, decidir
 * la aprobación y cerrar el run con el resumen de coste.
 */
@Injectable()
export class AutomationExecutionService {
  constructor(
    private readonly em: EntityManager,
    private readonly runsRepo: AutomationRunsRepository,
    private readonly agentsRepo: AgentsRepository,
    private readonly governanceRepo: AutomationGovernanceRepository,
    private readonly outbox: OutboxService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AutomationExecutionService.name);
  }

  /**
   * UC-48-08: arrancar la ejecución del workflow.
   *
   * Si ya hay un run vivo del mismo workflow sobre el mismo expediente, se
   * devuelve ése en lugar de arrancar otro. Es el sustituto local del bloqueo
   * distribuido que el caso de uso pide en Redis: sin él, un evento entregado dos
   * veces —que es lo normal en *at-least-once*— arrancaría dos ejecuciones sobre
   * el mismo expediente.
   *
   * El run nace `queued` y pasa a `running` en la misma transacción: el caso de
   * uso lo describe así (`queued -> running`) y separarlo dejaría un estado
   * intermedio que nadie observa.
   */
  async startWorkflowRun(
    workflowId: string,
    dto: StartWorkflowRunDto,
    actor: AuthenticatedUser,
  ): Promise<WorkflowRunResponseDto> {
    return this.em.transactional(async (tx) => {
      const workflow = await this.governanceRepo.findWorkflowById(
        tx,
        workflowId,
      );
      if (!workflow) {
        throw new ResourceNotFoundException('Workflow no encontrado.', {
          workflowId,
        });
      }
      if (workflow.stateConceptId === CONCEPTS.AUTO_WORKFLOW_ARCHIVED) {
        throw new PreconditionFailedException('El workflow está archivado.', {
          workflowId,
        });
      }

      if (dto.triggerId) {
        const trigger = await this.governanceRepo.findTriggerById(
          tx,
          dto.triggerId,
        );
        if (!trigger) {
          throw new ResourceNotFoundException('Disparador no encontrado.', {
            triggerId: dto.triggerId,
          });
        }
        if (trigger.isEnabled !== true) {
          throw new PreconditionFailedException(
            'El disparador está deshabilitado.',
            {
              triggerId: trigger.id,
            },
          );
        }
        if (trigger.workflowId !== workflowId) {
          throw new PreconditionFailedException(
            'El disparador no pertenece a ese workflow.',
            { triggerId: trigger.id, workflowId },
          );
        }
      }

      if (dto.contextRefId) {
        const live = await this.runsRepo.findLiveRunByContext(
          tx,
          workflowId,
          dto.contextRefId,
          LIVE_RUN_STATUSES,
        );
        if (live) {
          return {
            id: live.id,
            runNumber: live.runNumber,
            statusConceptId: live.statusConceptId,
            duplicate: true,
          };
        }
      }

      const previousRuns = await this.runsRepo.countRunsByWorkflow(
        tx,
        workflowId,
      );
      const run = this.runsRepo.createWorkflowRun(tx, {
        workflowId,
        triggerId: dto.triggerId,
        tenantId: dto.tenantId ?? workflow.tenantId,
        runNumber: `${workflow.code}-${previousRuns + 1}`,
        triggerSourceConceptId: dto.triggerSourceConceptId,
        inputJson: dto.inputJson,
        contextRefType: dto.contextRefType,
        contextRefId: dto.contextRefId,
        statusConceptId: CONCEPTS.AUTO_RUN_RUNNING,
        startedAt: new Date(),
        actorUserId: actor.id,
      });

      await this.outbox.publishDomainEvent(tx, {
        tenantId: run.tenantId,
        eventType: 'WorkflowRunStarted',
        aggregateType: 'automation.workflow_runs',
        aggregateId: run.id,
        payloadJson: {
          workflowId,
          runNumber: run.runNumber,
          triggerId: dto.triggerId ?? null,
          contextRefId: dto.contextRefId ?? null,
        },
        actorUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'automation.run.start',
          workflowRunId: run.id,
          runNumber: run.runNumber,
        },
        'Ejecución de workflow arrancada',
      );

      return {
        id: run.id,
        runNumber: run.runNumber,
        statusConceptId: run.statusConceptId,
        duplicate: false,
      };
    });
  }

  /**
   * UC-48-09 (primera mitad): arrancar la ejecución de un agente dentro del run.
   *
   * Sólo se ejecuta una versión **publicada**. Un borrador es una propuesta; dejar
   * que actúe sobre datos reales convierte cada edición del prompt en un despliegue
   * silencioso.
   */
  async startAgentRun(
    workflowRunId: string,
    dto: StartAgentRunDto,
    actor: AuthenticatedUser,
  ): Promise<AgentRunResponseDto> {
    return this.em.transactional(async (tx) => {
      const run = await this.runsRepo.findWorkflowRunById(tx, workflowRunId);
      if (!run) {
        throw new ResourceNotFoundException(
          'Ejecución de workflow no encontrada.',
          {
            workflowRunId,
          },
        );
      }
      if (run.statusConceptId !== CONCEPTS.AUTO_RUN_RUNNING) {
        throw new PreconditionFailedException(
          'La ejecución del workflow no está en marcha.',
          {
            workflowRunId,
            statusConceptId: run.statusConceptId,
          },
        );
      }

      const agent = await this.agentsRepo.findAgentById(tx, dto.agentId);
      if (!agent) {
        throw new ResourceNotFoundException('Agente no encontrado.', {
          agentId: dto.agentId,
        });
      }
      if (agent.stateConceptId !== CONCEPTS.AUTO_AGENT_ACTIVE) {
        throw new PreconditionFailedException('El agente no está activo.', {
          agentId: agent.id,
          stateConceptId: agent.stateConceptId,
        });
      }

      const version = dto.agentVersionId
        ? await this.agentsRepo.findVersionById(tx, dto.agentVersionId)
        : await this.agentsRepo.findVersion(tx, agent.id, agent.currentVersion);
      if (!version || version.agentId !== agent.id) {
        throw new ResourceNotFoundException(
          'La versión no existe para ese agente.',
          {
            agentId: agent.id,
            agentVersionId: dto.agentVersionId,
          },
        );
      }
      if (version.statusConceptId !== CONCEPTS.AUTO_VERSION_PUBLISHED) {
        throw new PreconditionFailedException(
          'Sólo se puede ejecutar una versión publicada del agente.',
          { agentVersionId: version.id },
        );
      }

      const agentRun = this.runsRepo.createAgentRun(tx, {
        workflowRunId,
        agentId: agent.id,
        agentVersionId: version.id,
        taskTypeConceptId: dto.taskTypeConceptId,
        inputJson: dto.inputJson,
        statusConceptId: CONCEPTS.AUTO_AGENT_RUN_RUNNING,
        startedAt: new Date(),
        // La ejecución se atribuye a la identidad de servicio del agente, no a
        // quien la disparó: es el agente el que actúa.
        actorUserId: agent.actsAsUserId ?? actor.id,
      });

      this.logger.info(
        {
          operation: 'automation.agent-run.start',
          agentRunId: agentRun.id,
          agentId: agent.id,
        },
        'Ejecución de agente arrancada',
      );

      return {
        id: agentRun.id,
        agentVersionId: version.id,
        statusConceptId: agentRun.statusConceptId,
      };
    });
  }

  /**
   * UC-48-09 (segunda mitad) + UC-48-10: registrar un paso de la traza.
   *
   * La traza es append-only y el número de secuencia se deriva del último paso, no
   * lo elige el llamante: dos pasos con el mismo número harían que el orden de la
   * traza dependiera del plan de la consulta, y la traza sin orden no explica nada.
   *
   * Si el paso invoca una herramienta que escribe y exige aprobación, o si un
   * guardrail bloqueante se dispara, el paso se registra como bloqueado, se crea la
   * aprobación y el run queda en pausa. **La herramienta no se ejecuta**: ése es el
   * punto entero del guardrail.
   */
  async recordAgentStep(
    agentRunId: string,
    dto: RecordAgentStepDto,
    actor: AuthenticatedUser,
  ): Promise<AgentStepResponseDto> {
    return this.em.transactional(async (tx) => {
      const agentRun = await this.runsRepo.findAgentRunForUpdate(
        tx,
        agentRunId,
      );
      if (!agentRun) {
        throw new ResourceNotFoundException(
          'Ejecución de agente no encontrada.',
          { agentRunId },
        );
      }
      if (agentRun.statusConceptId !== CONCEPTS.AUTO_AGENT_RUN_RUNNING) {
        throw new PreconditionFailedException(
          'La ejecución del agente no está en marcha; no admite pasos nuevos.',
          { agentRunId, statusConceptId: agentRun.statusConceptId },
        );
      }

      const agent = await this.agentsRepo.findAgentById(tx, agentRun.agentId);
      const recordedByUserId = agent?.actsAsUserId ?? actor.id;

      const blocker = await this.findBlocker(tx, agentRun, dto);
      const sequenceNo =
        (await this.runsRepo.findMaxSequenceNo(tx, agentRunId)) + 1;

      const step = this.runsRepo.createAgentRunStep(tx, {
        agentRunId,
        sequenceNo,
        stepKindConceptId: dto.stepKindConceptId,
        agentToolId: dto.agentToolId,
        thoughtText: dto.thoughtText,
        toolInputJson: dto.toolInputJson,
        // Un paso bloqueado no tiene salida: la herramienta no llegó a ejecutarse.
        toolOutputJson: blocker ? undefined : dto.toolOutputJson,
        statusConceptId: blocker
          ? CONCEPTS.AUTO_STEP_AWAITING_APPROVAL
          : dto.errorText
            ? CONCEPTS.AUTO_STEP_FAILED
            : CONCEPTS.AUTO_STEP_SUCCEEDED,
        errorText: dto.errorText,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
        recordedByUserId,
      });

      await this.outbox.publishDomainEvent(tx, {
        eventType: 'AgentStepRecorded',
        aggregateType: 'automation.agent_run_steps',
        aggregateId: step.id,
        payloadJson: {
          agentRunId,
          sequenceNo,
          statusConceptId: step.statusConceptId,
          agentToolId: dto.agentToolId ?? null,
        },
        actorUserId: recordedByUserId,
      });

      if (!blocker) {
        return {
          id: step.id,
          sequenceNo,
          statusConceptId: step.statusConceptId,
          paused: false,
        };
      }

      const approval = await this.pauseForApproval(
        tx,
        agentRun,
        {
          approvalTypeConceptId: blocker.approvalTypeConceptId,
          agentRunStepId: step.id,
          requestedActionJson: dto.toolInputJson,
          targetResourceType: blocker.targetResourceType,
        },
        recordedByUserId,
      );

      this.logger.warn(
        {
          operation: 'automation.agent-run.pause',
          agentRunId,
          stepId: step.id,
          approvalId: approval.id,
          reason: blocker.reason,
        },
        'Ejecución de agente pausada a la espera de aprobación',
      );

      return {
        id: step.id,
        sequenceNo,
        statusConceptId: step.statusConceptId,
        approvalId: approval.id,
        paused: true,
      };
    });
  }

  /**
   * UC-48-10: solicitar aprobación explícitamente.
   *
   * Es la misma operación que dispara automáticamente `recordAgentStep`; existe
   * como endpoint para el caso en que el runtime detecta la necesidad antes de
   * tener un paso que registrar.
   */
  async requestApproval(
    agentRunId: string,
    dto: RequestApprovalDto,
    actor: AuthenticatedUser,
  ): Promise<ApprovalResponseDto> {
    return this.em.transactional(async (tx) => {
      const agentRun = await this.runsRepo.findAgentRunForUpdate(
        tx,
        agentRunId,
      );
      if (!agentRun) {
        throw new ResourceNotFoundException(
          'Ejecución de agente no encontrada.',
          { agentRunId },
        );
      }
      if (!OPEN_AGENT_RUN_STATUSES.includes(agentRun.statusConceptId)) {
        throw new PreconditionFailedException(
          'La ejecución del agente ya terminó; no admite aprobaciones.',
          { agentRunId, statusConceptId: agentRun.statusConceptId },
        );
      }

      const pending = await this.runsRepo.findPendingApprovalsByAgentRuns(
        tx,
        [agentRunId],
        CONCEPTS.AUTO_APPROVAL_PENDING,
      );
      const duplicate = pending.find(
        (a) => !dto.agentRunStepId || a.agentRunStepId === dto.agentRunStepId,
      );
      if (duplicate) {
        return {
          id: duplicate.id,
          agentRunId,
          statusConceptId: duplicate.statusConceptId,
          agentRunStatusConceptId: agentRun.statusConceptId,
          duplicate: true,
        };
      }

      const agent = await this.agentsRepo.findAgentById(tx, agentRun.agentId);
      const approval = await this.pauseForApproval(
        tx,
        agentRun,
        {
          approvalTypeConceptId: dto.approvalTypeConceptId,
          agentRunStepId: dto.agentRunStepId,
          requestedActionJson: dto.requestedActionJson,
          targetResourceType: dto.targetResourceType,
          targetRefId: dto.targetRefId,
        },
        agent?.actsAsUserId ?? actor.id,
      );

      return {
        id: approval.id,
        agentRunId,
        statusConceptId: approval.statusConceptId,
        agentRunStatusConceptId: agentRun.statusConceptId,
        duplicate: false,
      };
    });
  }

  /**
   * UC-48-11: decidir la aprobación y reanudar (o abortar).
   *
   * Una sola decisión vale: la guarda sobre el estado `pending` es lo que impide
   * que un segundo aprobador reabra algo ya rechazado.
   *
   * Quien decide queda en `decided_by_user_id`. Es el actor humano, no la identidad
   * de servicio del agente: el sentido de la aprobación es precisamente que la
   * tomó una persona.
   */
  async decideApproval(
    approvalId: string,
    dto: DecideApprovalDto,
    actor: AuthenticatedUser,
  ): Promise<DecideApprovalResponseDto> {
    return this.em.transactional(async (tx) => {
      const approval = await this.runsRepo.findApprovalForUpdate(
        tx,
        approvalId,
      );
      if (!approval) {
        throw new ResourceNotFoundException('Aprobación no encontrada.', {
          approvalId,
        });
      }
      if (approval.statusConceptId !== CONCEPTS.AUTO_APPROVAL_PENDING) {
        throw new ConflictException('La aprobación ya está decidida.', {
          approvalId,
          statusConceptId: approval.statusConceptId,
        });
      }

      const agentRun = await this.runsRepo.findAgentRunForUpdate(
        tx,
        approval.agentRunId,
      );
      if (!agentRun) {
        throw new ResourceNotFoundException(
          'Ejecución de agente no encontrada.',
          {
            agentRunId: approval.agentRunId,
          },
        );
      }
      if (agentRun.statusConceptId !== CONCEPTS.AUTO_AGENT_RUN_PAUSED) {
        throw new PreconditionFailedException(
          'La ejecución del agente no está en pausa.',
          {
            agentRunId: agentRun.id,
            statusConceptId: agentRun.statusConceptId,
          },
        );
      }

      const approved = dto.decision === 'approved';
      approval.statusConceptId = approved
        ? CONCEPTS.AUTO_APPROVAL_APPROVED
        : CONCEPTS.AUTO_APPROVAL_REJECTED;
      approval.decidedByUserId = actor.id;
      approval.decidedAt = new Date();
      approval.decisionNote = dto.decisionNote;
      touch(approval, actor.id);

      agentRun.statusConceptId = approved
        ? CONCEPTS.AUTO_AGENT_RUN_RUNNING
        : CONCEPTS.AUTO_AGENT_RUN_CANCELLED;
      if (!approved) agentRun.finishedAt = new Date();
      touch(agentRun, actor.id);

      const sequenceNo =
        (await this.runsRepo.findMaxSequenceNo(tx, agentRun.id)) + 1;
      const resolutionStep = this.runsRepo.createAgentRunStep(tx, {
        agentRunId: agentRun.id,
        sequenceNo,
        stepKindConceptId: CONCEPTS.AUTO_STEP_HUMAN_APPROVAL,
        statusConceptId: approved
          ? CONCEPTS.AUTO_STEP_SUCCEEDED
          : CONCEPTS.AUTO_STEP_FAILED,
        toolOutputJson: {
          decision: dto.decision,
          decisionNote: dto.decisionNote ?? null,
        },
        recordedByUserId: actor.id,
      });

      if (agentRun.workflowRunId) {
        const run = await this.runsRepo.findWorkflowRunForUpdate(
          tx,
          agentRun.workflowRunId,
        );
        if (run && run.statusConceptId === CONCEPTS.AUTO_RUN_WAITING) {
          run.statusConceptId = approved
            ? CONCEPTS.AUTO_RUN_RUNNING
            : CONCEPTS.AUTO_RUN_FAILED;
          if (!approved) {
            run.finishedAt = new Date();
            run.errorText = 'Aprobación rechazada';
          }
          touch(run, actor.id);
        }
      }

      await this.outbox.publishDomainEvent(tx, {
        eventType: 'ApprovalDecided',
        aggregateType: 'automation.automation_approvals',
        aggregateId: approval.id,
        payloadJson: {
          agentRunId: agentRun.id,
          decision: dto.decision,
          agentRunStepId: approval.agentRunStepId ?? null,
        },
        actorUserId: actor.id,
      });

      this.logger.warn(
        {
          operation: 'automation.approval.decide',
          approvalId,
          agentRunId: agentRun.id,
          decision: dto.decision,
        },
        'Aprobación de automatización decidida',
      );

      return {
        id: approval.id,
        statusConceptId: approval.statusConceptId,
        agentRunId: agentRun.id,
        agentRunStatusConceptId: agentRun.statusConceptId,
        resolutionStepId: resolutionStep.id,
      };
    });
  }

  /**
   * UC-48-14: cerrar el run con el resumen de coste.
   *
   * Es idempotente: cerrar un run ya cerrado devuelve lo que hay sin volver a
   * sumar. Un worker que reintenta el cierre no debe duplicar la factura.
   *
   * No se cierra con aprobaciones pendientes: dejaría a un aprobador decidiendo
   * sobre una ejecución que ya no existe.
   */
  async finalizeWorkflowRun(
    workflowRunId: string,
    dto: FinalizeWorkflowRunDto,
    actor: AuthenticatedUser,
  ): Promise<FinalizeWorkflowRunResponseDto> {
    return this.em.transactional(async (tx) => {
      const run = await this.runsRepo.findWorkflowRunForUpdate(
        tx,
        workflowRunId,
      );
      if (!run) {
        throw new ResourceNotFoundException(
          'Ejecución de workflow no encontrada.',
          {
            workflowRunId,
          },
        );
      }

      if (!LIVE_RUN_STATUSES.includes(run.statusConceptId)) {
        return {
          id: run.id,
          statusConceptId: run.statusConceptId,
          totalCostAmount: run.totalCostAmount ?? '0',
          closedAgentRuns: 0,
          alreadyFinalized: true,
        };
      }

      const agentRuns = await this.runsRepo.findAgentRunsByWorkflowRunForUpdate(
        tx,
        workflowRunId,
      );

      const pending = await this.runsRepo.findPendingApprovalsByAgentRuns(
        tx,
        agentRuns.map((r) => r.id),
        CONCEPTS.AUTO_APPROVAL_PENDING,
      );
      if (pending.length > 0) {
        throw new PreconditionFailedException(
          'La ejecución tiene aprobaciones pendientes y no puede cerrarse.',
          { workflowRunId, pendingApprovals: pending.length },
        );
      }

      const now = new Date();
      let closedAgentRuns = 0;
      let anyFailed = false;
      let totalCost = '0';

      for (const agentRun of agentRuns) {
        if (OPEN_AGENT_RUN_STATUSES.includes(agentRun.statusConceptId)) {
          agentRun.statusConceptId = CONCEPTS.AUTO_AGENT_RUN_SUCCEEDED;
          agentRun.finishedAt = now;
          if (agentRun.startedAt) {
            agentRun.latencyMs = now.getTime() - agentRun.startedAt.getTime();
          }
          touch(agentRun, actor.id);
          closedAgentRuns += 1;
        }
        if (agentRun.statusConceptId === CONCEPTS.AUTO_AGENT_RUN_FAILED)
          anyFailed = true;
        if (agentRun.statusConceptId === CONCEPTS.AUTO_AGENT_RUN_CANCELLED)
          anyFailed = true;
        totalCost = this.addDecimals(totalCost, agentRun.costAmount ?? '0');
      }

      const failed = dto.failed === true || anyFailed;
      run.statusConceptId = failed
        ? CONCEPTS.AUTO_RUN_FAILED
        : CONCEPTS.AUTO_RUN_COMPLETED;
      run.totalCostAmount = totalCost;
      run.finishedAt = now;
      if (dto.errorText) run.errorText = dto.errorText;
      touch(run, actor.id);

      await this.outbox.publishDomainEvent(tx, {
        tenantId: run.tenantId,
        eventType: 'WorkflowRunCompleted',
        aggregateType: 'automation.workflow_runs',
        aggregateId: run.id,
        payloadJson: {
          runNumber: run.runNumber,
          statusConceptId: run.statusConceptId,
          totalCostAmount: totalCost,
          agentRuns: agentRuns.length,
        },
        actorUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'automation.run.finalize',
          workflowRunId,
          failed,
          totalCostAmount: totalCost,
        },
        'Ejecución de workflow cerrada',
      );

      return {
        id: run.id,
        statusConceptId: run.statusConceptId,
        totalCostAmount: totalCost,
        closedAgentRuns,
        alreadyFinalized: false,
      };
    });
  }

  // --- Piezas compartidas -------------------------------------------------

  /**
   * Decide si el paso tiene que detenerse. Devuelve el motivo, o `null` si puede
   * ejecutarse.
   *
   * Se comprueba primero la herramienta y después los guardrails, porque una
   * herramienta que escribe y exige aprobación no depende de ninguna política:
   * es una propiedad de la herramienta misma.
   */
  private async findBlocker(
    tx: EntityManager,
    agentRun: AgentRuns,
    dto: RecordAgentStepDto,
  ): Promise<{
    reason: string;
    approvalTypeConceptId: string;
    targetResourceType?: string;
  } | null> {
    if (dto.agentToolId) {
      const tool = await this.agentsRepo.findToolById(tx, dto.agentToolId);
      if (!tool) {
        throw new ResourceNotFoundException('Herramienta no encontrada.', {
          agentToolId: dto.agentToolId,
        });
      }

      const binding = await this.agentsRepo.findBinding(
        tx,
        agentRun.agentVersionId,
        dto.agentToolId,
      );
      if (!binding) {
        throw new PreconditionFailedException(
          'La herramienta no está enlazada a la versión que se está ejecutando.',
          {
            agentToolId: dto.agentToolId,
            agentVersionId: agentRun.agentVersionId,
          },
        );
      }
      // Un enlace que deniega es una decisión explícita del ingeniero; no se
      // convierte en aprobación pendiente, se rechaza.
      if (binding.permissionEffectConceptId === CONCEPTS.AUTO_PERMISSION_DENY) {
        throw new PreconditionFailedException(
          'El enlace deniega el uso de esa herramienta para esta versión.',
          { agentToolId: dto.agentToolId },
        );
      }
      if (
        binding.maxCallsPerRun !== undefined &&
        binding.maxCallsPerRun !== null
      ) {
        const used = await this.runsRepo.countToolCalls(
          tx,
          agentRun.id,
          dto.agentToolId,
        );
        if (used >= binding.maxCallsPerRun) {
          throw new PreconditionFailedException(
            'La herramienta agotó su tope de llamadas para esta ejecución.',
            {
              agentToolId: dto.agentToolId,
              maxCallsPerRun: binding.maxCallsPerRun,
            },
          );
        }
      }

      if (tool.isWrite === true && tool.requiresApproval === true) {
        return {
          reason: 'tool-requires-approval',
          approvalTypeConceptId: CONCEPTS.AUTO_APPROVAL_TYPE_TOOL_WRITE,
          targetResourceType: tool.targetResource,
        };
      }
    }

    const attachments = await this.governanceRepo.findEnabledGuardrailsByAgent(
      tx,
      agentRun.agentId,
    );
    for (const attachment of attachments) {
      const policy = await this.governanceRepo.findGuardrailPolicyById(
        tx,
        attachment.guardrailPolicyId,
      );
      // Sólo bloquea lo que está declarado para bloquear: `warn` y `log` dejan
      // constancia pero no detienen el paso.
      if (!policy || !policy.isActive) continue;
      if (policy.enforcementConceptId !== CONCEPTS.AUTO_ENFORCEMENT_BLOCK)
        continue;

      if (
        policy.policyTypeConceptId === CONCEPTS.AUTO_GUARDRAIL_COST &&
        policy.maxCostAmount &&
        dto.accruedCostAmount &&
        compareDecimals(dto.accruedCostAmount, policy.maxCostAmount) > 0
      ) {
        return {
          reason: 'cost-threshold-exceeded',
          approvalTypeConceptId: CONCEPTS.AUTO_APPROVAL_TYPE_COST,
        };
      }

      if (
        policy.policyTypeConceptId === CONCEPTS.AUTO_GUARDRAIL_PHI &&
        policy.piiPhiHandlingConceptId === CONCEPTS.AUTO_PHI_BLOCK
      ) {
        return {
          reason: 'phi-blocked',
          approvalTypeConceptId: CONCEPTS.AUTO_APPROVAL_TYPE_PHI_ACCESS,
        };
      }
    }

    return null;
  }

  /**
   * Crea la aprobación y deja el `agent_run` en pausa y el `workflow_run` en
   * espera. Los tres cambios van juntos: una aprobación pendiente con el run
   * corriendo dejaría al agente ejecutando lo que se acaba de bloquear.
   */
  private async pauseForApproval(
    tx: EntityManager,
    agentRun: AgentRuns,
    input: {
      approvalTypeConceptId: string;
      agentRunStepId?: string;
      requestedActionJson?: unknown;
      targetResourceType?: string;
      targetRefId?: string;
    },
    actorUserId: string,
  ) {
    const approval = this.runsRepo.createApproval(tx, {
      agentRunId: agentRun.id,
      agentRunStepId: input.agentRunStepId,
      approvalTypeConceptId: input.approvalTypeConceptId,
      requestedActionJson: input.requestedActionJson,
      targetResourceType: input.targetResourceType,
      targetRefId: input.targetRefId,
      statusConceptId: CONCEPTS.AUTO_APPROVAL_PENDING,
      actorUserId,
    });

    agentRun.statusConceptId = CONCEPTS.AUTO_AGENT_RUN_PAUSED;
    touch(agentRun, actorUserId);

    let run: WorkflowRuns | null = null;
    if (agentRun.workflowRunId) {
      run = await this.runsRepo.findWorkflowRunForUpdate(
        tx,
        agentRun.workflowRunId,
      );
      if (run && run.statusConceptId === CONCEPTS.AUTO_RUN_RUNNING) {
        run.statusConceptId = CONCEPTS.AUTO_RUN_WAITING;
        touch(run, actorUserId);
      }
    }

    await this.outbox.publishDomainEvent(tx, {
      tenantId: run?.tenantId,
      eventType: 'ApprovalRequested',
      aggregateType: 'automation.automation_approvals',
      aggregateId: approval.id,
      payloadJson: {
        agentRunId: agentRun.id,
        agentRunStepId: input.agentRunStepId ?? null,
        approvalTypeConceptId: input.approvalTypeConceptId,
      },
      actorUserId,
    });

    return approval;
  }

  /** Suma de importes decimales sin coma flotante, con la escala del más largo. */
  private addDecimals(left: string, right: string): string {
    const scaleOf = (value: string) => (value.split('.')[1] ?? '').length;
    const scale = Math.max(scaleOf(left), scaleOf(right));
    const toInteger = (value: string) => {
      const [whole, fraction = ''] = value.split('.');
      return BigInt(`${whole || '0'}${fraction.padEnd(scale, '0')}`);
    };
    const sum = (toInteger(left) + toInteger(right))
      .toString()
      .padStart(scale + 1, '0');
    if (scale === 0) return sum;
    return `${sum.slice(0, -scale)}.${sum.slice(-scale)}`;
  }
}
