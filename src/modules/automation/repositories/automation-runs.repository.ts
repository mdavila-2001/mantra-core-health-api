import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  WorkflowRuns,
  AgentRuns,
  AgentRunSteps,
  AutomationApprovals,
} from '../entities';
import { createdBy } from '../../../common/persistence/audit-fields';

export interface CreateWorkflowRunData {
  workflowId: string;
  triggerId?: string;
  tenantId?: string;
  runNumber: string;
  triggerSourceConceptId: string;
  inputJson?: unknown;
  contextRefType?: string;
  contextRefId?: string;
  statusConceptId: string;
  startedAt?: Date;
  actorUserId?: string;
}

export interface CreateAgentRunData {
  workflowRunId?: string;
  agentId: string;
  agentVersionId: string;
  taskTypeConceptId: string;
  inputJson?: unknown;
  statusConceptId: string;
  startedAt?: Date;
  actorUserId?: string;
}

export interface CreateAgentRunStepData {
  agentRunId: string;
  sequenceNo: number;
  stepKindConceptId: string;
  agentToolId?: string;
  thoughtText?: string;
  toolInputJson?: unknown;
  toolOutputJson?: unknown;
  statusConceptId: string;
  errorText?: string;
  occurredAt?: Date;
  recordedByUserId?: string;
}

export interface CreateApprovalData {
  agentRunId: string;
  agentRunStepId?: string;
  approvalTypeConceptId: string;
  requestedActionJson?: unknown;
  targetResourceType?: string;
  targetRefId?: string;
  statusConceptId: string;
  actorUserId?: string;
}

/**
 * Acceso a la ejecución: `workflow_runs`, `agent_runs`, la traza append-only de
 * `agent_run_steps` y las aprobaciones que la detienen.
 */
@Injectable()
export class AutomationRunsRepository {
  // --- Runs de workflow (UC-48-08, 14) ---

  createWorkflowRun(
    em: EntityManager,
    data: CreateWorkflowRunData,
  ): WorkflowRuns {
    return em.create(
      WorkflowRuns,
      {
        workflowId: data.workflowId,
        triggerId: data.triggerId,
        tenantId: data.tenantId,
        runNumber: data.runNumber,
        triggerSourceConceptId: data.triggerSourceConceptId,
        inputJson: data.inputJson,
        contextRefType: data.contextRefType,
        contextRefId: data.contextRefId,
        statusConceptId: data.statusConceptId,
        startedAt: data.startedAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findWorkflowRunById(
    em: EntityManager,
    id: string,
  ): Promise<WorkflowRuns | null> {
    return em.findOne(WorkflowRuns, { id });
  }

  findWorkflowRunForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<WorkflowRuns | null> {
    return em.findOne(
      WorkflowRuns,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  findWorkflowRunByNumber(
    em: EntityManager,
    runNumber: string,
  ): Promise<WorkflowRuns | null> {
    return em.findOne(WorkflowRuns, { runNumber });
  }

  /**
   * Run vivo del workflow sobre el mismo contexto. Es el sustituto local del
   * bloqueo distribuido que el caso de uso pide en Redis: sin él, dos disparos del
   * mismo evento arrancarían dos ejecuciones sobre el mismo expediente.
   */
  findLiveRunByContext(
    em: EntityManager,
    workflowId: string,
    contextRefId: string,
    liveStatusConceptIds: string[],
  ): Promise<WorkflowRuns | null> {
    return em.findOne(WorkflowRuns, {
      workflowId,
      contextRefId,
      statusConceptId: { $in: liveStatusConceptIds },
    });
  }

  /** Cuántos runs lleva el workflow, para derivar el número del siguiente. */
  countRunsByWorkflow(em: EntityManager, workflowId: string): Promise<number> {
    return em.count(WorkflowRuns, { workflowId });
  }

  // --- Runs de agente (UC-48-09, 10, 11, 14) ---

  createAgentRun(em: EntityManager, data: CreateAgentRunData): AgentRuns {
    return em.create(
      AgentRuns,
      {
        workflowRunId: data.workflowRunId,
        agentId: data.agentId,
        agentVersionId: data.agentVersionId,
        taskTypeConceptId: data.taskTypeConceptId,
        inputJson: data.inputJson,
        statusConceptId: data.statusConceptId,
        startedAt: data.startedAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findAgentRunById(em: EntityManager, id: string): Promise<AgentRuns | null> {
    return em.findOne(AgentRuns, { id });
  }

  findAgentRunForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<AgentRuns | null> {
    return em.findOne(
      AgentRuns,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  findAgentRunsByWorkflowRunForUpdate(
    em: EntityManager,
    workflowRunId: string,
  ): Promise<AgentRuns[]> {
    return em.find(
      AgentRuns,
      { workflowRunId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  // --- Traza de pasos (UC-48-09, 10, 11, 13) ---

  /**
   * Append-only: no hay `update*` ni `delete*`. La traza es lo que permite
   * reconstruir por qué el agente hizo lo que hizo; editable, no permitiría nada.
   */
  createAgentRunStep(
    em: EntityManager,
    data: CreateAgentRunStepData,
  ): AgentRunSteps {
    return em.create(
      AgentRunSteps,
      {
        agentRunId: data.agentRunId,
        sequenceNo: data.sequenceNo,
        stepKindConceptId: data.stepKindConceptId,
        agentToolId: data.agentToolId,
        thoughtText: data.thoughtText,
        toolInputJson: data.toolInputJson,
        toolOutputJson: data.toolOutputJson,
        statusConceptId: data.statusConceptId,
        errorText: data.errorText,
        occurredAt: data.occurredAt ?? new Date(),
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  findStepById(em: EntityManager, id: string): Promise<AgentRunSteps | null> {
    return em.findOne(AgentRunSteps, { id });
  }

  /** Último número de secuencia del run, para que el siguiente paso lo continúe. */
  async findMaxSequenceNo(
    em: EntityManager,
    agentRunId: string,
  ): Promise<number> {
    const rows = await em.find(
      AgentRunSteps,
      { agentRunId },
      { fields: ['sequenceNo'], orderBy: { sequenceNo: 'DESC' }, limit: 1 },
    );
    return rows.length > 0 ? rows[0].sequenceNo : 0;
  }

  /** Cuántas veces ha usado el run una herramienta, para el tope del binding. */
  countToolCalls(
    em: EntityManager,
    agentRunId: string,
    agentToolId: string,
  ): Promise<number> {
    return em.count(AgentRunSteps, { agentRunId, agentToolId });
  }

  // --- Aprobaciones (UC-48-10, 11, 14) ---

  createApproval(
    em: EntityManager,
    data: CreateApprovalData,
  ): AutomationApprovals {
    return em.create(
      AutomationApprovals,
      {
        agentRunId: data.agentRunId,
        agentRunStepId: data.agentRunStepId,
        approvalTypeConceptId: data.approvalTypeConceptId,
        requestedActionJson: data.requestedActionJson,
        targetResourceType: data.targetResourceType,
        targetRefId: data.targetRefId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findApprovalForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<AutomationApprovals | null> {
    return em.findOne(
      AutomationApprovals,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Aprobaciones pendientes de un run: bloquean su cierre. */
  findPendingApprovalsByAgentRuns(
    em: EntityManager,
    agentRunIds: string[],
    pendingStatusConceptId: string,
  ): Promise<AutomationApprovals[]> {
    if (agentRunIds.length === 0) return Promise.resolve([]);
    return em.find(AutomationApprovals, {
      agentRunId: { $in: agentRunIds },
      statusConceptId: pendingStatusConceptId,
    });
  }
}
