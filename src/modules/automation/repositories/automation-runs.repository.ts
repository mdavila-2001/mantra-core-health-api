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

/**
 * Describe el contrato estructural de create workflow run data.
 */
export interface CreateWorkflowRunData {
  /**
   * Identificador asociado a workflow.
   */
  workflowId: string;
  /**
   * Identificador asociado a trigger.
   */
  triggerId?: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Valor de run number mantenido por la instancia.
   */
  runNumber: string;
  /**
   * Identificador asociado a trigger source concept.
   */
  triggerSourceConceptId: string;
  /**
   * Valor de input json mantenido por la instancia.
   */
  inputJson?: unknown;
  /**
   * Valor de context ref type mantenido por la instancia.
   */
  contextRefType?: string;
  /**
   * Identificador asociado a context ref.
   */
  contextRefId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de started at mantenido por la instancia.
   */
  startedAt?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create agent run data.
 */
export interface CreateAgentRunData {
  /**
   * Identificador asociado a workflow run.
   */
  workflowRunId?: string;
  /**
   * Identificador asociado a agent.
   */
  agentId: string;
  /**
   * Identificador asociado a agent version.
   */
  agentVersionId: string;
  /**
   * Identificador asociado a task type concept.
   */
  taskTypeConceptId: string;
  /**
   * Valor de input json mantenido por la instancia.
   */
  inputJson?: unknown;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de started at mantenido por la instancia.
   */
  startedAt?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create agent run step data.
 */
export interface CreateAgentRunStepData {
  /**
   * Identificador asociado a agent run.
   */
  agentRunId: string;
  /**
   * Valor de sequence no mantenido por la instancia.
   */
  sequenceNo: number;
  /**
   * Identificador asociado a step kind concept.
   */
  stepKindConceptId: string;
  /**
   * Identificador asociado a agent tool.
   */
  agentToolId?: string;
  /**
   * Valor de thought text mantenido por la instancia.
   */
  thoughtText?: string;
  /**
   * Valor de tool input json mantenido por la instancia.
   */
  toolInputJson?: unknown;
  /**
   * Valor de tool output json mantenido por la instancia.
   */
  toolOutputJson?: unknown;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de error text mantenido por la instancia.
   */
  errorText?: string;
  /**
   * Valor de occurred at mantenido por la instancia.
   */
  occurredAt?: Date;
  /**
   * Identificador asociado a recorded by user.
   */
  recordedByUserId?: string;
}

/**
 * Describe el contrato estructural de create approval data.
 */
export interface CreateApprovalData {
  /**
   * Identificador asociado a agent run.
   */
  agentRunId: string;
  /**
   * Identificador asociado a agent run step.
   */
  agentRunStepId?: string;
  /**
   * Identificador asociado a approval type concept.
   */
  approvalTypeConceptId: string;
  /**
   * Valor de requested action json mantenido por la instancia.
   */
  requestedActionJson?: unknown;
  /**
   * Valor de target resource type mantenido por la instancia.
   */
  targetResourceType?: string;
  /**
   * Identificador asociado a target ref.
   */
  targetRefId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a la ejecución: `workflow_runs`, `agent_runs`, la traza append-only de
 * `agent_run_steps` y las aprobaciones que la detienen.
 */
@Injectable()
export class AutomationRunsRepository {
  // --- Runs de workflow (UC-48-08, 14) ---

  /**
   * Crea create workflow run.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create workflow run conforme al contrato `WorkflowRuns`.
   */
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

  /**
   * Obtiene find workflow run by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find workflow run by id conforme al contrato `Promise<WorkflowRuns | null>`.
   */
  findWorkflowRunById(
    em: EntityManager,
    id: string,
  ): Promise<WorkflowRuns | null> {
    return em.findOne(WorkflowRuns, { id });
  }

  /**
   * Obtiene find workflow run for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find workflow run for update conforme al contrato `Promise<WorkflowRuns | null>`.
   */
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

  /**
   * Obtiene find workflow run by number.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param runNumber - Valor de run number requerido por la operación.
   * @returns Resultado de find workflow run by number conforme al contrato `Promise<WorkflowRuns | null>`.
   */
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

  /**
   * Crea create agent run.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create agent run conforme al contrato `AgentRuns`.
   */
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

  /**
   * Obtiene find agent run by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find agent run by id conforme al contrato `Promise<AgentRuns | null>`.
   */
  findAgentRunById(em: EntityManager, id: string): Promise<AgentRuns | null> {
    return em.findOne(AgentRuns, { id });
  }

  /**
   * Obtiene find agent run for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find agent run for update conforme al contrato `Promise<AgentRuns | null>`.
   */
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

  /**
   * Obtiene find agent runs by workflow run for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param workflowRunId - Identificador de workflow run.
   * @returns Resultado de find agent runs by workflow run for update conforme al contrato `Promise<AgentRuns[]>`.
   */
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

  /**
   * Obtiene find step by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find step by id conforme al contrato `Promise<AgentRunSteps | null>`.
   */
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

  /**
   * Crea create approval.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create approval conforme al contrato `AutomationApprovals`.
   */
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

  /**
   * Obtiene find approval for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find approval for update conforme al contrato `Promise<AutomationApprovals | null>`.
   */
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
