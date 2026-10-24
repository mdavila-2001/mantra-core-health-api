import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { ReportingCollectionsService } from '../services';
import {
  DashboardPageDto,
  ListDashboardsQueryDto,
  ListDataSourcesQueryDto,
  ListDefinitionExecutionsQueryDto,
  ListDefinitionsQueryDto,
  ListExecutionsQueryDto,
  ListSchedulesQueryDto,
  ReportDataSourcePageDto,
  ReportDefinitionPageDto,
  ReportExecutionPageDto,
  ReportSchedulePageDto,
} from '../dto';

/**
 * `GET` de colección de `reporting` que el catálogo de vistas esperaba.
 *
 * Cada handler declara su `@Roles(...)`: el mismo que exigen las escrituras
 * del recurso. La página la acota al tenant del contexto el servicio.
 */
@ApiTags('reporting-collections')
@ApiBearerAuth()
@Controller()
export class ReportingCollectionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param collections - Lecturas de colección del módulo.
   */
  constructor(private readonly collections: ReportingCollectionsService) {}

  /** V39-01: listar definiciones de reporte del tenant. */
  @Get('reporting/definitions')
  @Roles('REPORTING_ADMIN', 'REPORT_AUTHOR')
  @ApiOperation({ summary: 'Listar definiciones de reporte del tenant' })
  @ApiOkResponse({ type: ReportDefinitionPageDto })
  listDefinitions(
    @Query() query: ListDefinitionsQueryDto,
  ): Promise<ReportDefinitionPageDto> {
    return this.collections.listDefinitions(query);
  }

  /** V39-02: listar ejecuciones de una definición del tenant. */
  @Get('reporting/definitions/:id/executions')
  @Roles('REPORTING_ADMIN', 'REPORT_VIEWER')
  @ApiOperation({ summary: 'Listar ejecuciones de una definición del tenant' })
  @ApiOkResponse({ type: ReportExecutionPageDto })
  listDefinitionExecutions(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ListDefinitionExecutionsQueryDto,
  ): Promise<ReportExecutionPageDto> {
    return this.collections.listDefinitionExecutions(id, query);
  }

  /** V39-03: listar agendas de una definición del tenant. */
  @Get('reporting/definitions/:id/schedules')
  @Roles('REPORTING_ADMIN', 'REPORT_AUTHOR')
  @ApiOperation({ summary: 'Listar agendas de una definición del tenant' })
  @ApiOkResponse({ type: ReportSchedulePageDto })
  listSchedules(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ListSchedulesQueryDto,
  ): Promise<ReportSchedulePageDto> {
    return this.collections.listSchedules(id, query);
  }

  /** V39-05: listar ejecuciones de reporte del tenant. */
  @Get('reporting/executions')
  @Roles('REPORTING_ADMIN')
  @ApiOperation({ summary: 'Listar ejecuciones de reporte del tenant' })
  @ApiOkResponse({ type: ReportExecutionPageDto })
  listExecutions(
    @Query() query: ListExecutionsQueryDto,
  ): Promise<ReportExecutionPageDto> {
    return this.collections.listExecutions(query);
  }

  /** V39-07: listar tableros del tenant. */
  @Get('reporting/dashboards')
  @Roles('REPORTING_ADMIN', 'REPORT_AUTHOR')
  @ApiOperation({ summary: 'Listar tableros del tenant' })
  @ApiOkResponse({ type: DashboardPageDto })
  listDashboards(
    @Query() query: ListDashboardsQueryDto,
  ): Promise<DashboardPageDto> {
    return this.collections.listDashboards(query);
  }

  /** V39-08: listar fuentes de datos de reporte del tenant. */
  @Get('reporting/data-sources')
  @Roles('REPORTING_ADMIN', 'DATA_STEWARD')
  @ApiOperation({ summary: 'Listar fuentes de datos de reporte del tenant' })
  @ApiOkResponse({ type: ReportDataSourcePageDto })
  listDataSources(
    @Query() query: ListDataSourcesQueryDto,
  ): Promise<ReportDataSourcePageDto> {
    return this.collections.listDataSources(query);
  }
}
