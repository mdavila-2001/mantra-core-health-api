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

export interface CreateGuardrailPolicyData {
  tenantId?: string;
  code: string;
  name: string;
  policyTypeConceptId: string;
  ruleJson?: unknown;
  piiPhiHandlingConceptId?: string;
  maxCostAmount?: string;
  enforcementConceptId: string;
  isActive: boolean;
  actorUserId?: string;
}

export interface CreateWorkflowData {
  tenantId?: string;
  code: string;
  name: string;
  description?: string;
  orchestrationTypeConceptId: string;
  definitionJson?: unknown;
  currentVersion: number;
  stateConceptId: string;
  actorUserId?: string;
}

export interface CreateWorkflowStepData {
  workflowId: string;
  stepCode: string;
  stepTypeConceptId: string;
  agentId?: string;
  agentToolId?: string;
  onSuccessStepId?: string;
  onFailureStepId?: string;
  configJson?: unknown;
  ordinal?: number;
  actorUserId?: string;
}

export interface CreateTriggerData {
  tenantId?: string;
  code: string;
  name: string;
  triggerTypeConceptId: string;
  eventType?: string;
  targetResourceType?: string;
  conditionJson?: unknown;
  scheduleCron?: string;
  workflowId: string;
  isEnabled: boolean;
  stateConceptId: string;
  campaignScheduleId?: string;
  scheduleSourceConceptId: string;
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

  findGuardrailPolicyById(
    em: EntityManager,
    id: string,
  ): Promise<GuardrailPolicies | null> {
    return em.findOne(GuardrailPolicies, { id });
  }

  findGuardrailPolicyByCode(
    em: EntityManager,
    code: string,
  ): Promise<GuardrailPolicies | null> {
    return em.findOne(GuardrailPolicies, { code });
  }

  createAgentGuardrail(
    em: EntityManager,
    data: {
      agentId: string;
      guardrailPolicyId: string;
      isEnabled: boolean;
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

  findWorkflowById(em: EntityManager, id: string): Promise<Workflows | null> {
    return em.findOne(Workflows, { id });
  }

  findWorkflowByCode(
    em: EntityManager,
    code: string,
  ): Promise<Workflows | null> {
    return em.findOne(Workflows, { code });
  }

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

  findTriggerById(
    em: EntityManager,
    id: string,
  ): Promise<AutomationTriggers | null> {
    return em.findOne(AutomationTriggers, { id });
  }

  findTriggerByCode(
    em: EntityManager,
    code: string,
  ): Promise<AutomationTriggers | null> {
    return em.findOne(AutomationTriggers, { code });
  }

  // --- Automatizaciones de registro (UC-48-13) ---

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
