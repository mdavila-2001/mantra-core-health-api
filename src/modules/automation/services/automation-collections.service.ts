import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PageResponseDto,
  definedFilters,
  listTenantCollection,
} from '../../../common';
import { Agents, AutomationTriggers, Workflows } from '../entities';
import type {
  AgentItemDto,
  AutomationTriggerItemDto,
  ListAgentsQueryDto,
  ListTriggersQueryDto,
  ListWorkflowsQueryDto,
  WorkflowItemDto,
} from '../dto';

/**
 * Lecturas de colección de `automation`.
 *
 * Cada listado se arma con `listTenantCollection`: el tenant sale del
 * contexto del request, los filtros del cliente se componen con él y la
 * salida pasa por un mapeo explícito. El rol lo exige el controlador.
 */
@Injectable()
export class AutomationCollectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Listar agentes de automatización del tenant (V48-04).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listAgents(
    query: ListAgentsQueryDto,
  ): Promise<PageResponseDto<AgentItemDto>> {
    return listTenantCollection(this.em.fork(), Agents, {
      query,
      sortable: ['createdAt', 'updatedAt', 'name', 'code'],
      where: definedFilters({ stateConceptId: query.stateConceptId }),
      map: (row): AgentItemDto => ({
        id: row.id,
        tenantId: row.tenantId ?? null,
        code: row.code,
        name: row.name,
        agentTypeConceptId: row.agentTypeConceptId,
        description: row.description ?? null,
        defaultModelConceptId: row.defaultModelConceptId ?? null,
        systemServiceComponentId: row.systemServiceComponentId ?? null,
        autonomyLevelConceptId: row.autonomyLevelConceptId,
        actsAsUserId: row.actsAsUserId ?? null,
        currentVersion: row.currentVersion,
        stateConceptId: row.stateConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar disparadores de automatización del tenant (V48-13).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listTriggers(
    query: ListTriggersQueryDto,
  ): Promise<PageResponseDto<AutomationTriggerItemDto>> {
    return listTenantCollection(this.em.fork(), AutomationTriggers, {
      query,
      sortable: ['createdAt', 'updatedAt', 'name', 'code'],
      where: definedFilters({ stateConceptId: query.stateConceptId }),
      map: (row): AutomationTriggerItemDto => ({
        id: row.id,
        tenantId: row.tenantId ?? null,
        code: row.code,
        name: row.name,
        triggerTypeConceptId: row.triggerTypeConceptId,
        eventType: row.eventType ?? null,
        targetResourceType: row.targetResourceType ?? null,
        conditionJson: row.conditionJson ?? null,
        scheduleCron: row.scheduleCron ?? null,
        workflowId: row.workflowId,
        isEnabled: row.isEnabled ?? null,
        stateConceptId: row.stateConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        campaignScheduleId: row.campaignScheduleId ?? null,
        scheduleSourceConceptId: row.scheduleSourceConceptId,
      }),
    });
  }

  /**
   * Listar flujos de automatización del tenant (V48-15).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listWorkflows(
    query: ListWorkflowsQueryDto,
  ): Promise<PageResponseDto<WorkflowItemDto>> {
    return listTenantCollection(this.em.fork(), Workflows, {
      query,
      sortable: ['createdAt', 'updatedAt', 'name', 'code'],
      where: definedFilters({ stateConceptId: query.stateConceptId }),
      map: (row): WorkflowItemDto => ({
        id: row.id,
        tenantId: row.tenantId ?? null,
        code: row.code,
        name: row.name,
        description: row.description ?? null,
        orchestrationTypeConceptId: row.orchestrationTypeConceptId,
        definitionJson: row.definitionJson ?? null,
        currentVersion: row.currentVersion,
        stateConceptId: row.stateConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }
}
