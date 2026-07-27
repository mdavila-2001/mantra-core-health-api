import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  Agents,
  AgentVersions,
  AgentTools,
  AgentToolBindings,
  AgentMemory,
} from '../entities';
import { createdBy } from '../../../common/persistence/audit-fields';

export interface CreateAgentData {
  tenantId?: string;
  code: string;
  name: string;
  agentTypeConceptId: string;
  description?: string;
  defaultModelConceptId?: string;
  systemServiceComponentId?: string;
  autonomyLevelConceptId: string;
  actsAsUserId?: string;
  currentVersion: number;
  stateConceptId: string;
  actorUserId?: string;
}

export interface CreateAgentVersionData {
  agentId: string;
  version: number;
  promptTemplate: string;
  modelConceptId?: string;
  modelParamsJson?: unknown;
  inputSchemaJson?: unknown;
  outputSchemaJson?: unknown;
  changelog?: string;
  statusConceptId: string;
  publishedAt?: Date;
  actorUserId?: string;
}

export interface CreateToolData {
  code: string;
  name: string;
  toolTypeConceptId: string;
  targetResource?: string;
  inputSchemaJson?: unknown;
  outputSchemaJson?: unknown;
  integrationEndpointId?: string;
  isWrite: boolean;
  requiresApproval: boolean;
  stateConceptId: string;
  actorUserId?: string;
}

export interface CreateBindingData {
  agentVersionId: string;
  agentToolId: string;
  scopeJson?: unknown;
  maxCallsPerRun?: number;
  permissionEffectConceptId: string;
  actorUserId?: string;
}

export interface UpsertMemoryData {
  agentId: string;
  scopeConceptId: string;
  scopeRefId?: string;
  memoryTypeConceptId: string;
  contentText: string;
  embeddingRef?: string;
  importance?: string;
  expiresAt?: Date;
  statusConceptId: string;
  actorUserId?: string;
}

/**
 * Acceso al catálogo de agentes: el agente, sus versiones, las herramientas
 * disponibles, qué herramientas puede usar cada versión y la memoria del agente.
 */
@Injectable()
export class AgentsRepository {
  // --- Agentes (UC-48-01, 02, 05, 12) ---

  createAgent(em: EntityManager, data: CreateAgentData): Agents {
    return em.create(
      Agents,
      {
        tenantId: data.tenantId,
        code: data.code,
        name: data.name,
        agentTypeConceptId: data.agentTypeConceptId,
        description: data.description,
        defaultModelConceptId: data.defaultModelConceptId,
        systemServiceComponentId: data.systemServiceComponentId,
        autonomyLevelConceptId: data.autonomyLevelConceptId,
        actsAsUserId: data.actsAsUserId,
        currentVersion: data.currentVersion,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findAgentById(em: EntityManager, id: string): Promise<Agents | null> {
    return em.findOne(Agents, { id });
  }

  /** Publicar una versión y adjuntar un guardrail compiten por la misma fila. */
  findAgentForUpdate(em: EntityManager, id: string): Promise<Agents | null> {
    return em.findOne(Agents, { id }, { lockMode: LockMode.PESSIMISTIC_WRITE });
  }

  findAgentByCode(em: EntityManager, code: string): Promise<Agents | null> {
    return em.findOne(Agents, { code });
  }

  // --- Versiones (UC-48-01, 02, 04, 09) ---

  createAgentVersion(
    em: EntityManager,
    data: CreateAgentVersionData,
  ): AgentVersions {
    return em.create(
      AgentVersions,
      {
        agentId: data.agentId,
        version: data.version,
        promptTemplate: data.promptTemplate,
        modelConceptId: data.modelConceptId,
        modelParamsJson: data.modelParamsJson,
        inputSchemaJson: data.inputSchemaJson,
        outputSchemaJson: data.outputSchemaJson,
        changelog: data.changelog,
        statusConceptId: data.statusConceptId,
        publishedAt: data.publishedAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findVersionById(
    em: EntityManager,
    id: string,
  ): Promise<AgentVersions | null> {
    return em.findOne(AgentVersions, { id });
  }

  findVersion(
    em: EntityManager,
    agentId: string,
    version: number,
  ): Promise<AgentVersions | null> {
    return em.findOne(AgentVersions, { agentId, version });
  }

  /** Mayor número de versión emitido para el agente, para derivar el siguiente. */
  async findMaxVersion(em: EntityManager, agentId: string): Promise<number> {
    const rows = await em.find(
      AgentVersions,
      { agentId },
      { fields: ['version'], orderBy: { version: 'DESC' }, limit: 1 },
    );
    return rows.length > 0 ? rows[0].version : 0;
  }

  // --- Herramientas (UC-48-03, 04, 09, 10) ---

  createTool(em: EntityManager, data: CreateToolData): AgentTools {
    return em.create(
      AgentTools,
      {
        code: data.code,
        name: data.name,
        toolTypeConceptId: data.toolTypeConceptId,
        targetResource: data.targetResource,
        inputSchemaJson: data.inputSchemaJson,
        outputSchemaJson: data.outputSchemaJson,
        integrationEndpointId: data.integrationEndpointId,
        isWrite: data.isWrite,
        requiresApproval: data.requiresApproval,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findToolById(em: EntityManager, id: string): Promise<AgentTools | null> {
    return em.findOne(AgentTools, { id });
  }

  findToolByCode(em: EntityManager, code: string): Promise<AgentTools | null> {
    return em.findOne(AgentTools, { code });
  }

  // --- Enlaces herramienta ↔ versión (UC-48-04, 09) ---

  createBinding(em: EntityManager, data: CreateBindingData): AgentToolBindings {
    return em.create(
      AgentToolBindings,
      {
        agentVersionId: data.agentVersionId,
        agentToolId: data.agentToolId,
        scopeJson: data.scopeJson,
        maxCallsPerRun: data.maxCallsPerRun,
        permissionEffectConceptId: data.permissionEffectConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findBinding(
    em: EntityManager,
    agentVersionId: string,
    agentToolId: string,
  ): Promise<AgentToolBindings | null> {
    return em.findOne(AgentToolBindings, { agentVersionId, agentToolId });
  }

  findBindingsByVersion(
    em: EntityManager,
    agentVersionId: string,
  ): Promise<AgentToolBindings[]> {
    return em.find(AgentToolBindings, { agentVersionId });
  }

  // --- Memoria (UC-48-12) ---

  /**
   * La clave natural de la memoria es
   * `(agent_id, scope, scope_ref_id, memory_type)`. `scope_ref_id` es nulo en el
   * ámbito global, y en Postgres `null = null` es desconocido, así que el filtro
   * lo distingue explícitamente en vez de dejar que la comparación decida.
   */
  findMemoryForUpdate(
    em: EntityManager,
    key: {
      agentId: string;
      scopeConceptId: string;
      scopeRefId?: string;
      memoryTypeConceptId: string;
    },
  ): Promise<AgentMemory | null> {
    return em.findOne(
      AgentMemory,
      {
        agentId: key.agentId,
        scopeConceptId: key.scopeConceptId,
        scopeRefId: key.scopeRefId ?? null,
        memoryTypeConceptId: key.memoryTypeConceptId,
      },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  createMemory(em: EntityManager, data: UpsertMemoryData): AgentMemory {
    return em.create(
      AgentMemory,
      {
        agentId: data.agentId,
        scopeConceptId: data.scopeConceptId,
        scopeRefId: data.scopeRefId,
        memoryTypeConceptId: data.memoryTypeConceptId,
        contentText: data.contentText,
        embeddingRef: data.embeddingRef,
        importance: data.importance,
        expiresAt: data.expiresAt,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
