import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  GuardrailPolicies,
  AgentGuardrails,
  Workflows,
  WorkflowSteps,
  AutomationTriggers,
  RecordAutomations,
} from '../entities';
import { createdBy } from '../../../common/persistence/audit-fields';

/**
 * Describe el contrato estructural de create guardrail policy data.
 */
export interface CreateGuardrailPolicyData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a policy type concept.
   */
  policyTypeConceptId: string;
  /**
   * Valor de rule json mantenido por la instancia.
   */
  ruleJson?: unknown;
  /**
   * Identificador asociado a pii phi handling concept.
   */
  piiPhiHandlingConceptId?: string;
  /**
   * Valor de max cost amount mantenido por la instancia.
   */
  maxCostAmount?: string;
  /**
   * Identificador asociado a enforcement concept.
   */
  enforcementConceptId: string;
  /**
   * Valor de is active mantenido por la instancia.
   */
  isActive: boolean;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create workflow data.
 */
export interface CreateWorkflowData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Valor de description mantenido por la instancia.
   */
  description?: string;
  /**
   * Identificador asociado a orchestration type concept.
   */
  orchestrationTypeConceptId: string;
  /**
   * Valor de definition json mantenido por la instancia.
   */
  definitionJson?: unknown;
  /**
   * Valor de current version mantenido por la instancia.
   */
  currentVersion: number;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create workflow step data.
 */
export interface CreateWorkflowStepData {
  /**
   * Identificador asociado a workflow.
   */
  workflowId: string;
  /**
   * Valor de step code mantenido por la instancia.
   */
  stepCode: string;
  /**
   * Identificador asociado a step type concept.
   */
  stepTypeConceptId: string;
  /**
   * Identificador asociado a agent.
   */
  agentId?: string;
  /**
   * Identificador asociado a agent tool.
   */
  agentToolId?: string;
  /**
   * Identificador asociado a on success step.
   */
  onSuccessStepId?: string;
  /**
   * Identificador asociado a on failure step.
   */
  onFailureStepId?: string;
  /**
   * Valor de config json mantenido por la instancia.
   */
  configJson?: unknown;
  /**
   * Valor de ordinal mantenido por la instancia.
   */
  ordinal?: number;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create trigger data.
 */
export interface CreateTriggerData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a trigger type concept.
   */
  triggerTypeConceptId: string;
  /**
   * Valor de event type mantenido por la instancia.
   */
  eventType?: string;
  /**
   * Valor de target resource type mantenido por la instancia.
   */
  targetResourceType?: string;
  /**
   * Valor de condition json mantenido por la instancia.
   */
  conditionJson?: unknown;
  /**
   * Valor de schedule cron mantenido por la instancia.
   */
  scheduleCron?: string;
  /**
   * Identificador asociado a workflow.
   */
  workflowId: string;
  /**
   * Valor de is enabled mantenido por la instancia.
   */
  isEnabled: boolean;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId: string;
  /**
   * Identificador asociado a campaign schedule.
   */
  campaignScheduleId?: string;
  /**
   * Identificador asociado a schedule source concept.
   */
  scheduleSourceConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso al gobierno de la automatización: guardrails y su adjunción a agentes,
 * definiciones de workflow con sus pasos, disparadores y automatizaciones de
 * registro.
 */
@Injectable()
export class AutomationGovernanceRepository {
  // --- Guardrails (UC-48-05, 09, 10) ---

  /**
   * Crea create guardrail policy.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create guardrail policy conforme al contrato `GuardrailPolicies`.
   */
  createGuardrailPolicy(
    em: EntityManager,
    data: CreateGuardrailPolicyData,
  ): GuardrailPolicies {
    return em.create(
      GuardrailPolicies,
      {
        tenantId: data.tenantId,
        code: data.code,
        name: data.name,
        policyTypeConceptId: data.policyTypeConceptId,
        ruleJson: data.ruleJson,
        piiPhiHandlingConceptId: data.piiPhiHandlingConceptId,
        maxCostAmount: data.maxCostAmount,
        enforcementConceptId: data.enforcementConceptId,
        isActive: data.isActive,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find guardrail policy by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find guardrail policy by id conforme al contrato `Promise<GuardrailPolicies | null>`.
   */
  findGuardrailPolicyById(
    em: EntityManager,
    id: string,
  ): Promise<GuardrailPolicies | null> {
    return em.findOne(GuardrailPolicies, { id });
  }

  /**
   * Obtiene find guardrail policy by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find guardrail policy by code conforme al contrato `Promise<GuardrailPolicies | null>`.
   */
  findGuardrailPolicyByCode(
    em: EntityManager,
    code: string,
  ): Promise<GuardrailPolicies | null> {
    return em.findOne(GuardrailPolicies, { code });
  }

  /**
   * Crea create agent guardrail.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create agent guardrail conforme al contrato `AgentGuardrails`.
   */
  createAgentGuardrail(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a agent.
       */
      agentId: string;
      /**
       * Identificador asociado a guardrail policy.
       */
      guardrailPolicyId: string;
      /**
       * Valor de is enabled mantenido por la instancia.
       */
      isEnabled: boolean;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): AgentGuardrails {
    return em.create(
      AgentGuardrails,
      {
        agentId: data.agentId,
        guardrailPolicyId: data.guardrailPolicyId,
        isEnabled: data.isEnabled,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find agent guardrail.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param agentId - Identificador de agent.
   * @param guardrailPolicyId - Identificador de guardrail policy.
   * @returns Resultado de find agent guardrail conforme al contrato `Promise<AgentGuardrails | null>`.
   */
  findAgentGuardrail(
    em: EntityManager,
    agentId: string,
    guardrailPolicyId: string,
  ): Promise<AgentGuardrails | null> {
    return em.findOne(AgentGuardrails, { agentId, guardrailPolicyId });
  }

  /** Guardrails habilitados del agente: son los que se evalúan en cada paso. */
  findEnabledGuardrailsByAgent(
    em: EntityManager,
    agentId: string,
  ): Promise<AgentGuardrails[]> {
    return em.find(AgentGuardrails, { agentId, isEnabled: true });
  }

  // --- Workflows y pasos (UC-48-06, 07, 08) ---

  /**
   * Crea create workflow.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create workflow conforme al contrato `Workflows`.
   */
  createWorkflow(em: EntityManager, data: CreateWorkflowData): Workflows {
    return em.create(
      Workflows,
      {
        tenantId: data.tenantId,
        code: data.code,
        name: data.name,
        description: data.description,
        orchestrationTypeConceptId: data.orchestrationTypeConceptId,
        definitionJson: data.definitionJson,
        currentVersion: data.currentVersion,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find workflow by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find workflow by id conforme al contrato `Promise<Workflows | null>`.
   */
  findWorkflowById(em: EntityManager, id: string): Promise<Workflows | null> {
    return em.findOne(Workflows, { id });
  }

  /**
   * Obtiene find workflow by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find workflow by code conforme al contrato `Promise<Workflows | null>`.
   */
  findWorkflowByCode(
    em: EntityManager,
    code: string,
  ): Promise<Workflows | null> {
    return em.findOne(Workflows, { code });
  }

  /**
   * Crea create workflow step.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create workflow step conforme al contrato `WorkflowSteps`.
   */
  createWorkflowStep(
    em: EntityManager,
    data: CreateWorkflowStepData,
  ): WorkflowSteps {
    return em.create(
      WorkflowSteps,
      {
        workflowId: data.workflowId,
        stepCode: data.stepCode,
        stepTypeConceptId: data.stepTypeConceptId,
        agentId: data.agentId,
        agentToolId: data.agentToolId,
        onSuccessStepId: data.onSuccessStepId,
        onFailureStepId: data.onFailureStepId,
        configJson: data.configJson,
        ordinal: data.ordinal,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find steps by workflow.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param workflowId - Identificador de workflow.
   * @returns Resultado de find steps by workflow conforme al contrato `Promise<WorkflowSteps[]>`.
   */
  findStepsByWorkflow(
    em: EntityManager,
    workflowId: string,
  ): Promise<WorkflowSteps[]> {
    return em.find(
      WorkflowSteps,
      { workflowId },
      { orderBy: { ordinal: 'ASC' } },
    );
  }

  // --- Disparadores (UC-48-07, 08) ---

  /**
   * Crea create trigger.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create trigger conforme al contrato `AutomationTriggers`.
   */
  createTrigger(
    em: EntityManager,
    data: CreateTriggerData,
  ): AutomationTriggers {
    return em.create(
      AutomationTriggers,
      {
        tenantId: data.tenantId,
        code: data.code,
        name: data.name,
        triggerTypeConceptId: data.triggerTypeConceptId,
        eventType: data.eventType,
        targetResourceType: data.targetResourceType,
        conditionJson: data.conditionJson,
        scheduleCron: data.scheduleCron,
        workflowId: data.workflowId,
        isEnabled: data.isEnabled,
        stateConceptId: data.stateConceptId,
        campaignScheduleId: data.campaignScheduleId,
        scheduleSourceConceptId: data.scheduleSourceConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find trigger by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find trigger by id conforme al contrato `Promise<AutomationTriggers | null>`.
   */
  findTriggerById(
    em: EntityManager,
    id: string,
  ): Promise<AutomationTriggers | null> {
    return em.findOne(AutomationTriggers, { id });
  }

  /**
   * Obtiene find trigger by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find trigger by code conforme al contrato `Promise<AutomationTriggers | null>`.
   */
  findTriggerByCode(
    em: EntityManager,
    code: string,
  ): Promise<AutomationTriggers | null> {
    return em.findOne(AutomationTriggers, { code });
  }

  /**
   * Disparadores de calendario activos y habilitados, tomados con
   * `FOR UPDATE SKIP LOCKED`: varios ticks del worker pueden solaparse, y
   * saltar lo que otro ya tiene tomado es lo que da un disparo por marca y no
   * dos (mismo patrón que `ReportingRunsRepository.findDueSchedules`).
   *
   * A diferencia de `report_schedules`, `automation_triggers` no declara una
   * columna `next_run_at`: quien llama usa `updated_at` como referencia de la
   * última vez que se evaluó el cron, el mismo recurso que ya documenta
   * `findRecordAutomationForUpdate` para `record_automations` ("su
   * `updated_at` es la métrica de último uso"). El filtro por vencimiento no
   * puede vivir en SQL sin interpretar el cron, así que este método sólo
   * acota el lote; calcular la próxima marca es responsabilidad de quien
   * llama.
   */
  findEnabledCalendarTriggers(
    em: EntityManager,
    triggerTypeConceptId: string,
    activeStateConceptId: string,
    limit: number,
  ): Promise<AutomationTriggers[]> {
    return em.find(
      AutomationTriggers,
      {
        triggerTypeConceptId,
        stateConceptId: activeStateConceptId,
        isEnabled: true,
        scheduleCron: { $ne: null },
      },
      {
        limit,
        orderBy: { updatedAt: 'ASC' },
        lockMode: LockMode.PESSIMISTIC_PARTIAL_WRITE,
      },
    );
  }

  // --- Automatizaciones de registro (UC-48-13) ---

  /**
   * Obtiene find record automation by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find record automation by id conforme al contrato `Promise<RecordAutomations | null>`.
   */
  findRecordAutomationById(
    em: EntityManager,
    id: string,
  ): Promise<RecordAutomations | null> {
    return em.findOne(RecordAutomations, { id });
  }

  /** Bloquea la automatización: su `updated_at` es la métrica de último uso. */
  findRecordAutomationForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<RecordAutomations | null> {
    return em.findOne(
      RecordAutomations,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }
}
