import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  ReportingDefinitionsRepository,
  ReportingRunsRepository,
} from '../repositories';
import {
  CreateDataSourceDto,
  DataSourceResponseDto,
  CreateDefinitionDto,
  DefinitionResponseDto,
  PublishReportVersionDto,
  ReportVersionResponseDto,
  CreateDashboardDto,
  DashboardResponseDto,
  DeprecateDefinitionDto,
  DeprecateDefinitionResponseDto,
  type SourceType,
  type ReportCategory,
  type Aggregation,
  type OutputFormat,
  type WidgetType,
  type Visualization,
} from '../dto';

const SOURCE_TYPE_CONCEPT: Readonly<Record<SourceType, string>> = {
  READ_MODEL: CONCEPTS.SOURCE_READ_MODEL,
  VIEW: CONCEPTS.SOURCE_VIEW,
};

const CATEGORY_CONCEPT: Readonly<Record<ReportCategory, string>> = {
  CLINICAL: CONCEPTS.REPORT_CATEGORY_CLINICAL,
  FINANCIAL: CONCEPTS.REPORT_CATEGORY_FINANCIAL,
  OPERATIONAL: CONCEPTS.REPORT_CATEGORY_OPERATIONAL,
};

const AGGREGATION_CONCEPT: Readonly<Record<Aggregation, string>> = {
  SUM: CONCEPTS.AGGREGATION_SUM,
  AVG: CONCEPTS.AGGREGATION_AVG,
  COUNT: CONCEPTS.AGGREGATION_COUNT,
  MIN: CONCEPTS.AGGREGATION_MIN,
  MAX: CONCEPTS.AGGREGATION_MAX,
};

export const OUTPUT_FORMAT_CONCEPT: Readonly<Record<OutputFormat, string>> = {
  CSV: CONCEPTS.OUTPUT_CSV,
  XLSX: CONCEPTS.OUTPUT_XLSX,
  PDF: CONCEPTS.OUTPUT_PDF,
  JSON: CONCEPTS.OUTPUT_JSON,
};

const WIDGET_TYPE_CONCEPT: Readonly<Record<WidgetType, string>> = {
  CHART: CONCEPTS.WIDGET_CHART,
  TABLE: CONCEPTS.WIDGET_TABLE,
  METRIC: CONCEPTS.WIDGET_METRIC,
};

const VISUALIZATION_CONCEPT: Readonly<Record<Visualization, string>> = {
  BAR: CONCEPTS.VISUALIZATION_BAR,
  LINE: CONCEPTS.VISUALIZATION_LINE,
  PIE: CONCEPTS.VISUALIZATION_PIE,
};

/**
 * Superficie declarativa de reportes: fuentes, definiciones, versiones,
 * tableros y deprecación (UC-39-01, 02, 03, 10, 12).
 */
@Injectable()
export class ReportingDefinitionsService {
  constructor(
    private readonly em: EntityManager,
    private readonly definitionsRepo: ReportingDefinitionsRepository,
    private readonly runsRepo: ReportingRunsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ReportingDefinitionsService.name);
  }

  /**
   * UC-39-01: registrar la fuente. Es gobernada: o apunta a un read model
   * declarado o a una vista nombrada, nunca a una consulta libre.
   */
  async createDataSource(
    dto: CreateDataSourceDto,
    actor: AuthenticatedUser,
  ): Promise<DataSourceResponseDto> {
    this.logger.info(
      { operation: 'reporting.data-source.create', code: dto.code },
      'Registering report data source',
    );

    const duplicate = await this.definitionsRepo.findDataSourceByCode(
      this.em,
      dto.code,
    );
    if (duplicate) {
      throw new ConflictException('Ya existe una fuente con ese código', {
        code: dto.code,
      });
    }
    if (dto.sourceType === 'READ_MODEL' && !dto.readModelDefinitionId) {
      throw new PreconditionFailedException(
        'Una fuente READ_MODEL necesita su read model gobernado',
        { code: dto.code },
      );
    }
    if (dto.sourceType === 'VIEW' && !dto.viewName) {
      throw new PreconditionFailedException(
        'Una fuente VIEW necesita el nombre de la vista',
        {
          code: dto.code,
        },
      );
    }

    return this.em.transactional(async (tx) => {
      const source = this.definitionsRepo.createDataSource(tx, {
        tenantId: dto.tenantId,
        code: dto.code,
        name: dto.name,
        sourceTypeConceptId: SOURCE_TYPE_CONCEPT[dto.sourceType],
        readModelDefinitionId: dto.readModelDefinitionId,
        viewName: dto.viewName,
        specJson: dto.specJson,
        rowSecurityJson: dto.rowSecurityJson,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });

      return {
        id: source.id,
        code: dto.code,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      };
    });
  }

  /**
   * UC-39-02: autorar la definición con sus parámetros y columnas en una sola
   * transacción. Nace en borrador: publicar una versión es lo que la activa.
   */
  async createDefinition(
    dto: CreateDefinitionDto,
    actor: AuthenticatedUser,
  ): Promise<DefinitionResponseDto> {
    this.logger.info(
      { operation: 'reporting.definition.create', code: dto.code },
      'Authoring report definition',
    );

    const duplicate = await this.definitionsRepo.findDefinitionByCode(
      this.em,
      dto.code,
    );
    if (duplicate) {
      throw new ConflictException('Ya existe una definición con ese código', {
        code: dto.code,
      });
    }
    // Un reporte que no es público y no exige permiso lo vería cualquiera: es
    // exactamente lo que el campo `required_permission_id` está para impedir.
    if (!dto.isPublic && !dto.requiredPermissionId) {
      throw new PreconditionFailedException(
        'Un reporte no público necesita declarar el permiso que exige',
        { code: dto.code },
      );
    }
    this.assertUniqueCodes(
      dto.parameters?.map((p) => p.code) ?? [],
      'parámetro',
    );
    this.assertUniqueCodes(
      dto.columns.map((c) => c.code),
      'columna',
    );

    return this.em.transactional(async (tx) => {
      const source = await this.definitionsRepo.findDataSourceById(
        tx,
        dto.dataSourceId,
      );
      if (!source) {
        throw new ResourceNotFoundException('Fuente de datos no encontrada', {
          dataSourceId: dto.dataSourceId,
        });
      }
      if (source.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException(
          'La fuente de datos no está activa',
          {
            dataSourceId: dto.dataSourceId,
          },
        );
      }

      const definition = this.definitionsRepo.createDefinition(tx, {
        tenantId: dto.tenantId,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        categoryConceptId: dto.category
          ? CATEGORY_CONCEPT[dto.category]
          : undefined,
        dataSourceId: dto.dataSourceId,
        querySpecJson: dto.querySpecJson,
        defaultOutputFormatConceptId:
          OUTPUT_FORMAT_CONCEPT[dto.defaultOutputFormat ?? 'CSV'],
        requiredPermissionId: dto.requiredPermissionId,
        isPublic: dto.isPublic ?? false,
        stateConceptId: CONCEPTS.REPORT_DRAFT,
        actorUserId: actor.id,
      });

      const parameterIds = (dto.parameters ?? []).map(
        (parameter, index) =>
          this.definitionsRepo.createParameter(tx, {
            reportDefinitionId: definition.id,
            code: parameter.code,
            name: parameter.name,
            dataType: parameter.dataType,
            required: parameter.required ?? false,
            defaultValueJson: parameter.defaultValueJson,
            valueSetId: parameter.valueSetId,
            ordinal: index + 1,
            actorUserId: actor.id,
          }).id,
      );

      const columnIds = dto.columns.map(
        (column, index) =>
          this.definitionsRepo.createColumn(tx, {
            reportDefinitionId: definition.id,
            code: column.code,
            label: column.label,
            expression: column.expression,
            dataType: column.dataType,
            aggregationConceptId: column.aggregation
              ? AGGREGATION_CONCEPT[column.aggregation]
              : undefined,
            formatMask: column.formatMask,
            isVisible: column.isVisible ?? true,
            ordinal: index + 1,
            actorUserId: actor.id,
          }).id,
      );

      return {
        id: definition.id,
        code: dto.code,
        stateConceptId: CONCEPTS.REPORT_DRAFT,
        parameterIds,
        columnIds,
      };
    });
  }

  /**
   * UC-39-03: publicar una versión. La definición pasa a activa y su
   * `current_version` apunta a la nueva, que es la que ejecutará toda corrida.
   */
  async publishVersion(
    definitionId: string,
    dto: PublishReportVersionDto,
    actor: AuthenticatedUser,
  ): Promise<ReportVersionResponseDto> {
    this.logger.info(
      { operation: 'reporting.version.publish', definitionId },
      'Publishing report version',
    );

    return this.em.transactional(async (tx) => {
      // Bloquear la cabecera es lo que serializa el versionado.
      const definition = await this.definitionsRepo.findDefinitionForUpdate(
        tx,
        definitionId,
      );
      if (!definition) {
        throw new ResourceNotFoundException('Definición no encontrada', {
          definitionId,
        });
      }
      if (definition.stateConceptId === CONCEPTS.REPORT_DEPRECATED) {
        throw new PreconditionFailedException(
          'Una definición deprecada no admite versiones',
          {
            definitionId,
          },
        );
      }

      // La primera publicación estrena la versión 1, que ya lleva la cabecera;
      // las siguientes incrementan.
      const isFirst = definition.stateConceptId === CONCEPTS.REPORT_DRAFT;
      const version = isFirst
        ? definition.currentVersion
        : definition.currentVersion + 1;

      const existing = await this.definitionsRepo.findVersion(
        tx,
        definitionId,
        version,
      );
      if (existing) {
        throw new ConflictException('Esa versión ya está publicada', {
          definitionId,
          version,
        });
      }

      const parameters = await this.definitionsRepo.findParametersByDefinition(
        tx,
        definitionId,
      );
      const created = this.definitionsRepo.createVersion(tx, {
        reportDefinitionId: definitionId,
        version,
        // La versión congela la consulta y los parámetros: ejecutar una corrida
        // vieja tiene que dar lo mismo aunque la definición haya cambiado.
        specJson: {
          querySpec: definition.querySpecJson,
          parameters: parameters.map((p) => ({
            code: p.code,
            dataType: p.dataType,
            required: p.required,
          })),
        },
        changeNote: dto.changeNote,
        statusConceptId: CONCEPTS.REPORT_VERSION_PUBLISHED,
        actorUserId: actor.id,
      });

      definition.currentVersion = version;
      definition.stateConceptId = CONCEPTS.REPORT_STATE_ACTIVE;
      touch(definition, actor.id);

      return {
        id: created.id,
        version,
        definitionStateConceptId: CONCEPTS.REPORT_STATE_ACTIVE,
      };
    });
  }

  /** UC-39-10: componer el tablero con sus widgets en una sola transacción. */
  async createDashboard(
    dto: CreateDashboardDto,
    actor: AuthenticatedUser,
  ): Promise<DashboardResponseDto> {
    this.logger.info(
      { operation: 'reporting.dashboard.create', code: dto.code },
      'Composing dashboard',
    );

    const duplicate = await this.definitionsRepo.findDashboardByCode(
      this.em,
      dto.code,
    );
    if (duplicate) {
      throw new ConflictException('Ya existe un tablero con ese código', {
        code: dto.code,
      });
    }
    const chartWithoutVisualization = dto.widgets.find(
      (w) => w.widgetType === 'CHART' && !w.visualization,
    );
    if (chartWithoutVisualization) {
      throw new PreconditionFailedException(
        'Un widget CHART necesita su tipo de gráfico',
        {
          title: chartWithoutVisualization.title,
        },
      );
    }

    return this.em.transactional(async (tx) => {
      for (const widget of dto.widgets) {
        if (!widget.reportDefinitionId) continue;
        const definition = await this.definitionsRepo.findDefinitionById(
          tx,
          widget.reportDefinitionId,
        );
        if (!definition) {
          throw new ResourceNotFoundException(
            'Definición del widget no encontrada',
            {
              reportDefinitionId: widget.reportDefinitionId,
            },
          );
        }
        // Colgar un widget de un reporte deprecado dejaría el tablero mostrando
        // algo que la organización decidió dejar de publicar.
        if (definition.stateConceptId === CONCEPTS.REPORT_DEPRECATED) {
          throw new PreconditionFailedException(
            'El widget apunta a un reporte deprecado',
            {
              reportDefinitionId: widget.reportDefinitionId,
            },
          );
        }
      }

      const dashboard = this.definitionsRepo.createDashboard(tx, {
        tenantId: dto.tenantId,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        layoutJson: dto.layoutJson,
        requiredPermissionId: dto.requiredPermissionId,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });

      const widgetIds = dto.widgets.map(
        (widget, index) =>
          this.definitionsRepo.createWidget(tx, {
            dashboardId: dashboard.id,
            reportDefinitionId: widget.reportDefinitionId,
            widgetTypeConceptId: WIDGET_TYPE_CONCEPT[widget.widgetType],
            title: widget.title,
            visualizationConceptId: widget.visualization
              ? VISUALIZATION_CONCEPT[widget.visualization]
              : undefined,
            configJson: widget.configJson,
            positionJson: widget.positionJson,
            ordinal: index + 1,
            actorUserId: actor.id,
          }).id,
      );

      return {
        id: dashboard.id,
        code: dto.code,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        widgetIds,
      };
    });
  }

  /**
   * UC-39-12: deprecar la definición. Suspender sus programaciones en la misma
   * transacción es lo que impide disparos huérfanos de un reporte retirado.
   */
  async deprecateDefinition(
    definitionId: string,
    dto: DeprecateDefinitionDto,
    actor: AuthenticatedUser,
  ): Promise<DeprecateDefinitionResponseDto> {
    this.logger.warn(
      { operation: 'reporting.definition.deprecate', definitionId },
      'Deprecating report definition',
    );

    return this.em.transactional(async (tx) => {
      const definition = await this.definitionsRepo.findDefinitionForUpdate(
        tx,
        definitionId,
      );
      if (!definition) {
        throw new ResourceNotFoundException('Definición no encontrada', {
          definitionId,
        });
      }
      if (definition.stateConceptId === CONCEPTS.REPORT_DEPRECATED) {
        throw new ConflictException('La definición ya está deprecada', {
          definitionId,
        });
      }

      const schedules = await this.runsRepo.findSchedulesByDefinitionForUpdate(
        tx,
        definitionId,
      );
      let schedulesSuspended = 0;
      for (const schedule of schedules) {
        if (schedule.stateConceptId === CONCEPTS.SCHEDULE_SUSPENDED) continue;
        schedule.isEnabled = false;
        schedule.stateConceptId = CONCEPTS.SCHEDULE_SUSPENDED;
        touch(schedule, actor.id);
        schedulesSuspended += 1;
      }

      definition.stateConceptId = CONCEPTS.REPORT_DEPRECATED;
      touch(definition, actor.id);

      this.logger.warn(
        {
          operation: 'reporting.definition.deprecate',
          definitionId,
          reason: dto.reason,
          schedulesSuspended,
        },
        'Report definition deprecated and schedules suspended',
      );

      return {
        id: definitionId,
        stateConceptId: CONCEPTS.REPORT_DEPRECATED,
        schedulesSuspended,
      };
    });
  }

  /** Los códigos repetidos romperían el índice único por definición. */
  private assertUniqueCodes(codes: string[], kind: string): void {
    const seen = new Set<string>();
    for (const code of codes) {
      if (seen.has(code)) {
        throw new PreconditionFailedException(
          `El código de ${kind} está repetido`,
          { code },
        );
      }
      seen.add(code);
    }
  }
}
