import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ReportDataSources,
  ReportDefinitions,
  ReportParameters,
  ReportColumns,
  ReportVersions,
  Dashboards,
  DashboardWidgets,
} from '../entities';
import { createdBy } from '../../../common';

export interface CreateDataSourceData {
  tenantId?: string;
  code: string;
  name: string;
  sourceTypeConceptId: string;
  readModelDefinitionId?: string;
  viewName?: string;
  specJson?: unknown;
  rowSecurityJson?: unknown;
  stateConceptId: string;
  actorUserId?: string;
}

export interface CreateDefinitionData {
  tenantId?: string;
  code: string;
  name: string;
  description?: string;
  categoryConceptId?: string;
  dataSourceId: string;
  querySpecJson?: unknown;
  defaultOutputFormatConceptId?: string;
  requiredPermissionId?: string;
  isPublic: boolean;
  stateConceptId: string;
  actorUserId?: string;
}

/**
 * Acceso a la parte declarativa de `reporting.*`: fuentes, definiciones,
 * parámetros, columnas, versiones y tableros.
 */
@Injectable()
export class ReportingDefinitionsRepository {
  // --- Fuentes de datos (UC-39-01) ---

  createDataSource(
    em: EntityManager,
    data: CreateDataSourceData,
  ): ReportDataSources {
    return em.create(
      ReportDataSources,
      {
        tenantId: data.tenantId,
        code: data.code,
        name: data.name,
        sourceTypeConceptId: data.sourceTypeConceptId,
        readModelDefinitionId: data.readModelDefinitionId,
        viewName: data.viewName,
        specJson: data.specJson,
        rowSecurityJson: data.rowSecurityJson,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findDataSourceById(
    em: EntityManager,
    id: string,
  ): Promise<ReportDataSources | null> {
    return em.findOne(ReportDataSources, { id });
  }

  findDataSourceByCode(
    em: EntityManager,
    code: string,
  ): Promise<ReportDataSources | null> {
    return em.findOne(ReportDataSources, { code });
  }

  // --- Definiciones (UC-39-02, UC-39-03, UC-39-12) ---

  createDefinition(
    em: EntityManager,
    data: CreateDefinitionData,
  ): ReportDefinitions {
    return em.create(
      ReportDefinitions,
      {
        tenantId: data.tenantId,
        code: data.code,
        name: data.name,
        description: data.description,
        categoryConceptId: data.categoryConceptId,
        dataSourceId: data.dataSourceId,
        querySpecJson: data.querySpecJson,
        defaultOutputFormatConceptId: data.defaultOutputFormatConceptId,
        requiredPermissionId: data.requiredPermissionId,
        isPublic: data.isPublic,
        currentVersion: 1,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findDefinitionById(
    em: EntityManager,
    id: string,
  ): Promise<ReportDefinitions | null> {
    return em.findOne(ReportDefinitions, { id });
  }

  /** Publicar versión y deprecar exigen la cabecera bloqueada. */
  findDefinitionForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<ReportDefinitions | null> {
    return em.findOne(
      ReportDefinitions,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  findDefinitionByCode(
    em: EntityManager,
    code: string,
  ): Promise<ReportDefinitions | null> {
    return em.findOne(ReportDefinitions, { code });
  }

  createParameter(
    em: EntityManager,
    data: {
      reportDefinitionId: string;
      code: string;
      name: string;
      dataType: string;
      required: boolean;
      defaultValueJson?: unknown;
      valueSetId?: string;
      ordinal: number;
      actorUserId?: string;
    },
  ): ReportParameters {
    return em.create(
      ReportParameters,
      {
        reportDefinitionId: data.reportDefinitionId,
        code: data.code,
        name: data.name,
        dataType: data.dataType,
        required: data.required,
        defaultValueJson: data.defaultValueJson,
        valueSetId: data.valueSetId,
        ordinal: data.ordinal,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Parámetros declarados: la ejecución valida contra ellos lo que recibe. */
  findParametersByDefinition(
    em: EntityManager,
    reportDefinitionId: string,
  ): Promise<ReportParameters[]> {
    return em.find(
      ReportParameters,
      { reportDefinitionId },
      { orderBy: { ordinal: 'ASC' } },
    );
  }

  createColumn(
    em: EntityManager,
    data: {
      reportDefinitionId: string;
      code: string;
      label: string;
      expression?: string;
      dataType?: string;
      aggregationConceptId?: string;
      formatMask?: string;
      isVisible: boolean;
      ordinal: number;
      actorUserId?: string;
    },
  ): ReportColumns {
    return em.create(
      ReportColumns,
      {
        reportDefinitionId: data.reportDefinitionId,
        code: data.code,
        label: data.label,
        expression: data.expression,
        dataType: data.dataType,
        aggregationConceptId: data.aggregationConceptId,
        formatMask: data.formatMask,
        isVisible: data.isVisible,
        ordinal: data.ordinal,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  // --- Versiones (UC-39-03) ---

  createVersion(
    em: EntityManager,
    data: {
      reportDefinitionId: string;
      version: number;
      specJson: unknown;
      changeNote?: string;
      statusConceptId: string;
      actorUserId?: string;
    },
  ): ReportVersions {
    return em.create(
      ReportVersions,
      {
        reportDefinitionId: data.reportDefinitionId,
        version: data.version,
        specJson: data.specJson,
        changeNote: data.changeNote,
        statusConceptId: data.statusConceptId,
        publishedAt: new Date(),
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findVersion(
    em: EntityManager,
    reportDefinitionId: string,
    version: number,
  ): Promise<ReportVersions | null> {
    return em.findOne(ReportVersions, { reportDefinitionId, version });
  }

  /** Versión vigente de la definición: es la que ejecuta cualquier corrida. */
  findActiveVersion(
    em: EntityManager,
    reportDefinitionId: string,
    currentVersion: number,
  ): Promise<ReportVersions | null> {
    return em.findOne(ReportVersions, {
      reportDefinitionId,
      version: currentVersion,
    });
  }

  // --- Tableros (UC-39-10) ---

  createDashboard(
    em: EntityManager,
    data: {
      tenantId?: string;
      code: string;
      name: string;
      description?: string;
      layoutJson?: unknown;
      requiredPermissionId?: string;
      stateConceptId: string;
      actorUserId?: string;
    },
  ): Dashboards {
    return em.create(
      Dashboards,
      {
        tenantId: data.tenantId,
        code: data.code,
        name: data.name,
        description: data.description,
        layoutJson: data.layoutJson,
        requiredPermissionId: data.requiredPermissionId,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findDashboardByCode(
    em: EntityManager,
    code: string,
  ): Promise<Dashboards | null> {
    return em.findOne(Dashboards, { code });
  }

  createWidget(
    em: EntityManager,
    data: {
      dashboardId: string;
      reportDefinitionId?: string;
      widgetTypeConceptId: string;
      title: string;
      visualizationConceptId?: string;
      configJson?: unknown;
      positionJson?: unknown;
      ordinal: number;
      actorUserId?: string;
    },
  ): DashboardWidgets {
    return em.create(
      DashboardWidgets,
      {
        dashboardId: data.dashboardId,
        reportDefinitionId: data.reportDefinitionId,
        widgetTypeConceptId: data.widgetTypeConceptId,
        title: data.title,
        visualizationConceptId: data.visualizationConceptId,
        configJson: data.configJson,
        positionJson: data.positionJson,
        ordinal: data.ordinal,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
