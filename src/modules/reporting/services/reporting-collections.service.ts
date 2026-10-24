import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PageResponseDto,
  definedFilters,
  listTenantCollection,
} from '../../../common';
import {
  Dashboards,
  ReportDataSources,
  ReportDefinitions,
  ReportExecutions,
  ReportSchedules,
} from '../entities';
import type {
  DashboardItemDto,
  ListDashboardsQueryDto,
  ListDataSourcesQueryDto,
  ListDefinitionExecutionsQueryDto,
  ListDefinitionsQueryDto,
  ListExecutionsQueryDto,
  ListSchedulesQueryDto,
  ReportDataSourceItemDto,
  ReportDefinitionItemDto,
  ReportExecutionItemDto,
  ReportScheduleItemDto,
} from '../dto';

/**
 * Lecturas de colección de `reporting`.
 *
 * Cada listado se arma con `listTenantCollection`: el tenant sale del
 * contexto del request, los filtros del cliente se componen con él y la
 * salida pasa por un mapeo explícito. El rol lo exige el controlador.
 */
@Injectable()
export class ReportingCollectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Listar definiciones de reporte del tenant (V39-01).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listDefinitions(
    query: ListDefinitionsQueryDto,
  ): Promise<PageResponseDto<ReportDefinitionItemDto>> {
    return listTenantCollection(this.em.fork(), ReportDefinitions, {
      query,
      sortable: ['createdAt', 'updatedAt', 'name', 'code'],
      where: definedFilters({ stateConceptId: query.stateConceptId }),
      map: (row): ReportDefinitionItemDto => ({
        id: row.id,
        tenantId: row.tenantId ?? null,
        code: row.code,
        name: row.name,
        description: row.description ?? null,
        categoryConceptId: row.categoryConceptId ?? null,
        dataSourceId: row.dataSourceId,
        querySpecJson: row.querySpecJson ?? null,
        defaultOutputFormatConceptId: row.defaultOutputFormatConceptId ?? null,
        requiredPermissionId: row.requiredPermissionId ?? null,
        isPublic: row.isPublic ?? null,
        currentVersion: row.currentVersion,
        stateConceptId: row.stateConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar ejecuciones de una definición del tenant (V39-02).
   *
   * @param id - Recurso padre de la ruta.
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listDefinitionExecutions(
    id: string,
    query: ListDefinitionExecutionsQueryDto,
  ): Promise<PageResponseDto<ReportExecutionItemDto>> {
    return listTenantCollection(this.em.fork(), ReportExecutions, {
      query,
      sortable: ['createdAt', 'startedAt', 'updatedAt'],
      where: definedFilters({
        reportDefinitionId: id,
        statusConceptId: query.statusConceptId,
      }),
      map: (row): ReportExecutionItemDto => ({
        id: row.id,
        reportDefinitionId: row.reportDefinitionId,
        reportVersionId: row.reportVersionId ?? null,
        scheduleId: row.scheduleId ?? null,
        tenantId: row.tenantId ?? null,
        triggerConceptId: row.triggerConceptId,
        requestedByUserId: row.requestedByUserId ?? null,
        parametersJson: row.parametersJson ?? null,
        statusConceptId: row.statusConceptId,
        startedAt: row.startedAt ?? null,
        finishedAt: row.finishedAt ?? null,
        rowCount: row.rowCount ?? null,
        outputFormatConceptId: row.outputFormatConceptId ?? null,
        outputFileId: row.outputFileId ?? null,
        errorText: row.errorText ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar agendas de una definición del tenant (V39-03).
   *
   * @param id - Recurso padre de la ruta.
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listSchedules(
    id: string,
    query: ListSchedulesQueryDto,
  ): Promise<PageResponseDto<ReportScheduleItemDto>> {
    return listTenantCollection(this.em.fork(), ReportSchedules, {
      query,
      sortable: ['createdAt', 'updatedAt', 'name'],
      where: definedFilters({
        reportDefinitionId: id,
        stateConceptId: query.stateConceptId,
      }),
      map: (row): ReportScheduleItemDto => ({
        id: row.id,
        reportDefinitionId: row.reportDefinitionId,
        tenantId: row.tenantId ?? null,
        name: row.name,
        cronExpression: row.cronExpression,
        timeZone: row.timeZone ?? null,
        parametersJson: row.parametersJson ?? null,
        outputFormatConceptId: row.outputFormatConceptId,
        isEnabled: row.isEnabled ?? null,
        nextRunAt: row.nextRunAt ?? null,
        lastRunAt: row.lastRunAt ?? null,
        stateConceptId: row.stateConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar ejecuciones de reporte del tenant (V39-05).
   *
   * Sólo `REPORTING_ADMIN`: las escrituras de esta ruta son de `SYSTEM` (snapshot) y de `REPORTING_ADMIN` (distribución).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listExecutions(
    query: ListExecutionsQueryDto,
  ): Promise<PageResponseDto<ReportExecutionItemDto>> {
    return listTenantCollection(this.em.fork(), ReportExecutions, {
      query,
      sortable: ['createdAt', 'startedAt', 'updatedAt'],
      where: definedFilters({
        reportDefinitionId: query.reportDefinitionId,
        statusConceptId: query.statusConceptId,
      }),
      map: (row): ReportExecutionItemDto => ({
        id: row.id,
        reportDefinitionId: row.reportDefinitionId,
        reportVersionId: row.reportVersionId ?? null,
        scheduleId: row.scheduleId ?? null,
        tenantId: row.tenantId ?? null,
        triggerConceptId: row.triggerConceptId,
        requestedByUserId: row.requestedByUserId ?? null,
        parametersJson: row.parametersJson ?? null,
        statusConceptId: row.statusConceptId,
        startedAt: row.startedAt ?? null,
        finishedAt: row.finishedAt ?? null,
        rowCount: row.rowCount ?? null,
        outputFormatConceptId: row.outputFormatConceptId ?? null,
        outputFileId: row.outputFileId ?? null,
        errorText: row.errorText ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar tableros del tenant (V39-07).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listDashboards(
    query: ListDashboardsQueryDto,
  ): Promise<PageResponseDto<DashboardItemDto>> {
    return listTenantCollection(this.em.fork(), Dashboards, {
      query,
      sortable: ['createdAt', 'updatedAt', 'name', 'code'],
      where: definedFilters({ stateConceptId: query.stateConceptId }),
      map: (row): DashboardItemDto => ({
        id: row.id,
        tenantId: row.tenantId ?? null,
        code: row.code,
        name: row.name,
        description: row.description ?? null,
        layoutJson: row.layoutJson ?? null,
        requiredPermissionId: row.requiredPermissionId ?? null,
        stateConceptId: row.stateConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar fuentes de datos de reporte del tenant (V39-08).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listDataSources(
    query: ListDataSourcesQueryDto,
  ): Promise<PageResponseDto<ReportDataSourceItemDto>> {
    return listTenantCollection(this.em.fork(), ReportDataSources, {
      query,
      sortable: ['createdAt', 'updatedAt', 'name', 'code'],
      where: definedFilters({ stateConceptId: query.stateConceptId }),
      map: (row): ReportDataSourceItemDto => ({
        id: row.id,
        tenantId: row.tenantId ?? null,
        code: row.code,
        name: row.name,
        sourceTypeConceptId: row.sourceTypeConceptId,
        readModelDefinitionId: row.readModelDefinitionId ?? null,
        viewName: row.viewName ?? null,
        specJson: row.specJson ?? null,
        rowSecurityJson: row.rowSecurityJson ?? null,
        stateConceptId: row.stateConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }
}
