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

/**
 * Describe el contrato estructural de create data source data.
 */
export interface CreateDataSourceData {
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
   * Identificador asociado a source type concept.
   */
  sourceTypeConceptId: string;
  /**
   * Identificador asociado a read model definition.
   */
  readModelDefinitionId?: string;
  /**
   * Valor de view name mantenido por la instancia.
   */
  viewName?: string;
  /**
   * Valor de spec json mantenido por la instancia.
   */
  specJson?: unknown;
  /**
   * Valor de row security json mantenido por la instancia.
   */
  rowSecurityJson?: unknown;
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
 * Describe el contrato estructural de create definition data.
 */
export interface CreateDefinitionData {
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
   * Identificador asociado a category concept.
   */
  categoryConceptId?: string;
  /**
   * Identificador asociado a data source.
   */
  dataSourceId: string;
  /**
   * Valor de query spec json mantenido por la instancia.
   */
  querySpecJson?: unknown;
  /**
   * Identificador asociado a default output format concept.
   */
  defaultOutputFormatConceptId?: string;
  /**
   * Identificador asociado a required permission.
   */
  requiredPermissionId?: string;
  /**
   * Valor de is public mantenido por la instancia.
   */
  isPublic: boolean;
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
 * Acceso a la parte declarativa de `reporting.*`: fuentes, definiciones,
 * parámetros, columnas, versiones y tableros.
 */
@Injectable()
export class ReportingDefinitionsRepository {
  // --- Fuentes de datos (UC-39-01) ---

  /**
   * Crea create data source.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create data source conforme al contrato `ReportDataSources`.
   */
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

  /**
   * Obtiene find data source by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find data source by id conforme al contrato `Promise<ReportDataSources | null>`.
   */
  findDataSourceById(
    em: EntityManager,
    id: string,
  ): Promise<ReportDataSources | null> {
    return em.findOne(ReportDataSources, { id });
  }

  /**
   * Obtiene find data source by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find data source by code conforme al contrato `Promise<ReportDataSources | null>`.
   */
  findDataSourceByCode(
    em: EntityManager,
    code: string,
  ): Promise<ReportDataSources | null> {
    return em.findOne(ReportDataSources, { code });
  }

  // --- Definiciones (UC-39-02, UC-39-03, UC-39-12) ---

  /**
   * Crea create definition.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create definition conforme al contrato `ReportDefinitions`.
   */
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

  /**
   * Obtiene find definition by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find definition by id conforme al contrato `Promise<ReportDefinitions | null>`.
   */
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

  /**
   * Obtiene find definition by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find definition by code conforme al contrato `Promise<ReportDefinitions | null>`.
   */
  findDefinitionByCode(
    em: EntityManager,
    code: string,
  ): Promise<ReportDefinitions | null> {
    return em.findOne(ReportDefinitions, { code });
  }

  /**
   * Crea create parameter.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create parameter conforme al contrato `ReportParameters`.
   */
  createParameter(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a report definition.
       */
      reportDefinitionId: string;
      /**
       * Valor de code mantenido por la instancia.
       */
      code: string;
      /**
       * Valor de name mantenido por la instancia.
       */
      name: string;
      /**
       * Valor de data type mantenido por la instancia.
       */
      dataType: string;
      /**
       * Valor de required mantenido por la instancia.
       */
      required: boolean;
      /**
       * Valor de default value json mantenido por la instancia.
       */
      defaultValueJson?: unknown;
      /**
       * Identificador asociado a value set.
       */
      valueSetId?: string;
      /**
       * Valor de ordinal mantenido por la instancia.
       */
      ordinal: number;
      /**
       * Identificador asociado a actor user.
       */
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

  /**
   * Crea create column.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create column conforme al contrato `ReportColumns`.
   */
  createColumn(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a report definition.
       */
      reportDefinitionId: string;
      /**
       * Valor de code mantenido por la instancia.
       */
      code: string;
      /**
       * Valor de label mantenido por la instancia.
       */
      label: string;
      /**
       * Valor de expression mantenido por la instancia.
       */
      expression?: string;
      /**
       * Valor de data type mantenido por la instancia.
       */
      dataType?: string;
      /**
       * Identificador asociado a aggregation concept.
       */
      aggregationConceptId?: string;
      /**
       * Valor de format mask mantenido por la instancia.
       */
      formatMask?: string;
      /**
       * Valor de is visible mantenido por la instancia.
       */
      isVisible: boolean;
      /**
       * Valor de ordinal mantenido por la instancia.
       */
      ordinal: number;
      /**
       * Identificador asociado a actor user.
       */
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

  /**
   * Crea create version.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create version conforme al contrato `ReportVersions`.
   */
  createVersion(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a report definition.
       */
      reportDefinitionId: string;
      /**
       * Valor de version mantenido por la instancia.
       */
      version: number;
      /**
       * Valor de spec json mantenido por la instancia.
       */
      specJson: unknown;
      /**
       * Valor de change note mantenido por la instancia.
       */
      changeNote?: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
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

  /**
   * Obtiene find version.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param reportDefinitionId - Identificador de report definition.
   * @param version - Valor de version requerido por la operación.
   * @returns Resultado de find version conforme al contrato `Promise<ReportVersions | null>`.
   */
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

  /**
   * Crea create dashboard.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create dashboard conforme al contrato `Dashboards`.
   */
  createDashboard(
    em: EntityManager,
    data: {
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
       * Valor de layout json mantenido por la instancia.
       */
      layoutJson?: unknown;
      /**
       * Identificador asociado a required permission.
       */
      requiredPermissionId?: string;
      /**
       * Identificador asociado a state concept.
       */
      stateConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
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

  /**
   * Obtiene find dashboard by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find dashboard by code conforme al contrato `Promise<Dashboards | null>`.
   */
  findDashboardByCode(
    em: EntityManager,
    code: string,
  ): Promise<Dashboards | null> {
    return em.findOne(Dashboards, { code });
  }

  /**
   * Crea create widget.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create widget conforme al contrato `DashboardWidgets`.
   */
  createWidget(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a dashboard.
       */
      dashboardId: string;
      /**
       * Identificador asociado a report definition.
       */
      reportDefinitionId?: string;
      /**
       * Identificador asociado a widget type concept.
       */
      widgetTypeConceptId: string;
      /**
       * Valor de title mantenido por la instancia.
       */
      title: string;
      /**
       * Identificador asociado a visualization concept.
       */
      visualizationConceptId?: string;
      /**
       * Valor de config json mantenido por la instancia.
       */
      configJson?: unknown;
      /**
       * Valor de position json mantenido por la instancia.
       */
      positionJson?: unknown;
      /**
       * Valor de ordinal mantenido por la instancia.
       */
      ordinal: number;
      /**
       * Identificador asociado a actor user.
       */
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
