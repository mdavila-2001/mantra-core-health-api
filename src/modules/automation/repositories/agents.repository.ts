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

/**
 * Describe el contrato estructural de create agent data.
 */
export interface CreateAgentData {
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
   * Identificador asociado a agent type concept.
   */
  agentTypeConceptId: string;
  /**
   * Valor de description mantenido por la instancia.
   */
  description?: string;
  /**
   * Identificador asociado a default model concept.
   */
  defaultModelConceptId?: string;
  /**
   * Identificador asociado a system service component.
   */
  systemServiceComponentId?: string;
  /**
   * Identificador asociado a autonomy level concept.
   */
  autonomyLevelConceptId: string;
  /**
   * Identificador asociado a acts as user.
   */
  actsAsUserId?: string;
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
 * Describe el contrato estructural de create agent version data.
 */
export interface CreateAgentVersionData {
  /**
   * Identificador asociado a agent.
   */
  agentId: string;
  /**
   * Valor de version mantenido por la instancia.
   */
  version: number;
  /**
   * Valor de prompt template mantenido por la instancia.
   */
  promptTemplate: string;
  /**
   * Identificador asociado a model concept.
   */
  modelConceptId?: string;
  /**
   * Valor de model params json mantenido por la instancia.
   */
  modelParamsJson?: unknown;
  /**
   * Valor de input schema json mantenido por la instancia.
   */
  inputSchemaJson?: unknown;
  /**
   * Valor de output schema json mantenido por la instancia.
   */
  outputSchemaJson?: unknown;
  /**
   * Valor de changelog mantenido por la instancia.
   */
  changelog?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de published at mantenido por la instancia.
   */
  publishedAt?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create tool data.
 */
export interface CreateToolData {
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a tool type concept.
   */
  toolTypeConceptId: string;
  /**
   * Valor de target resource mantenido por la instancia.
   */
  targetResource?: string;
  /**
   * Valor de input schema json mantenido por la instancia.
   */
  inputSchemaJson?: unknown;
  /**
   * Valor de output schema json mantenido por la instancia.
   */
  outputSchemaJson?: unknown;
  /**
   * Identificador asociado a integration endpoint.
   */
  integrationEndpointId?: string;
  /**
   * Valor de is write mantenido por la instancia.
   */
  isWrite: boolean;
  /**
   * Valor de requires approval mantenido por la instancia.
   */
  requiresApproval: boolean;
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
 * Describe el contrato estructural de create binding data.
 */
export interface CreateBindingData {
  /**
   * Identificador asociado a agent version.
   */
  agentVersionId: string;
  /**
   * Identificador asociado a agent tool.
   */
  agentToolId: string;
  /**
   * Valor de scope json mantenido por la instancia.
   */
  scopeJson?: unknown;
  /**
   * Valor de max calls per run mantenido por la instancia.
   */
  maxCallsPerRun?: number;
  /**
   * Identificador asociado a permission effect concept.
   */
  permissionEffectConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de upsert memory data.
 */
export interface UpsertMemoryData {
  /**
   * Identificador asociado a agent.
   */
  agentId: string;
  /**
   * Identificador asociado a scope concept.
   */
  scopeConceptId: string;
  /**
   * Identificador asociado a scope ref.
   */
  scopeRefId?: string;
  /**
   * Identificador asociado a memory type concept.
   */
  memoryTypeConceptId: string;
  /**
   * Valor de content text mantenido por la instancia.
   */
  contentText: string;
  /**
   * Valor de embedding ref mantenido por la instancia.
   */
  embeddingRef?: string;
  /**
   * Valor de importance mantenido por la instancia.
   */
  importance?: string;
  /**
   * Valor de expires at mantenido por la instancia.
   */
  expiresAt?: Date;
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
 * Acceso al catálogo de agentes: el agente, sus versiones, las herramientas
 * disponibles, qué herramientas puede usar cada versión y la memoria del agente.
 */
@Injectable()
export class AgentsRepository {
  // --- Agentes (UC-48-01, 02, 05, 12) ---

  /**
   * Crea create agent.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create agent conforme al contrato `Agents`.
   */
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

  /**
   * Obtiene find agent by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find agent by id conforme al contrato `Promise<Agents | null>`.
   */
  findAgentById(em: EntityManager, id: string): Promise<Agents | null> {
    return em.findOne(Agents, { id });
  }

  /** Publicar una versión y adjuntar un guardrail compiten por la misma fila. */
  findAgentForUpdate(em: EntityManager, id: string): Promise<Agents | null> {
    return em.findOne(Agents, { id }, { lockMode: LockMode.PESSIMISTIC_WRITE });
  }

  /**
   * Obtiene find agent by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find agent by code conforme al contrato `Promise<Agents | null>`.
   */
  findAgentByCode(em: EntityManager, code: string): Promise<Agents | null> {
    return em.findOne(Agents, { code });
  }

  // --- Versiones (UC-48-01, 02, 04, 09) ---

  /**
   * Crea create agent version.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create agent version conforme al contrato `AgentVersions`.
   */
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

  /**
   * Obtiene find version by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find version by id conforme al contrato `Promise<AgentVersions | null>`.
   */
  findVersionById(
    em: EntityManager,
    id: string,
  ): Promise<AgentVersions | null> {
    return em.findOne(AgentVersions, { id });
  }

  /**
   * Obtiene find version.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param agentId - Identificador de agent.
   * @param version - Valor de version requerido por la operación.
   * @returns Resultado de find version conforme al contrato `Promise<AgentVersions | null>`.
   */
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

  /**
   * Crea create tool.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create tool conforme al contrato `AgentTools`.
   */
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

  /**
   * Obtiene find tool by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find tool by id conforme al contrato `Promise<AgentTools | null>`.
   */
  findToolById(em: EntityManager, id: string): Promise<AgentTools | null> {
    return em.findOne(AgentTools, { id });
  }

  /**
   * Obtiene find tool by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find tool by code conforme al contrato `Promise<AgentTools | null>`.
   */
  findToolByCode(em: EntityManager, code: string): Promise<AgentTools | null> {
    return em.findOne(AgentTools, { code });
  }

  // --- Enlaces herramienta ↔ versión (UC-48-04, 09) ---

  /**
   * Crea create binding.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create binding conforme al contrato `AgentToolBindings`.
   */
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

  /**
   * Obtiene find binding.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param agentVersionId - Identificador de agent version.
   * @param agentToolId - Identificador de agent tool.
   * @returns Resultado de find binding conforme al contrato `Promise<AgentToolBindings | null>`.
   */
  findBinding(
    em: EntityManager,
    agentVersionId: string,
    agentToolId: string,
  ): Promise<AgentToolBindings | null> {
    return em.findOne(AgentToolBindings, { agentVersionId, agentToolId });
  }

  /**
   * Obtiene find bindings by version.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param agentVersionId - Identificador de agent version.
   * @returns Resultado de find bindings by version conforme al contrato `Promise<AgentToolBindings[]>`.
   */
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
      /**
       * Identificador asociado a agent.
       */
      agentId: string;
      /**
       * Identificador asociado a scope concept.
       */
      scopeConceptId: string;
      /**
       * Identificador asociado a scope ref.
       */
      scopeRefId?: string;
      /**
       * Identificador asociado a memory type concept.
       */
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

  /**
   * Crea create memory.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create memory conforme al contrato `AgentMemory`.
   */
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
