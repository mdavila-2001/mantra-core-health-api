import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { ReportingDefinitionsService, ReportingRunsService } from '../services';
import {
  CreateDataSourceDto,
  DataSourceResponseDto,
  CreateDefinitionDto,
  DefinitionResponseDto,
  PublishReportVersionDto,
  ReportVersionResponseDto,
  CreateExecutionDto,
  ExecutionResponseDto,
  MaterializeSnapshotDto,
  SnapshotResponseDto,
  CreateScheduleDto,
  ScheduleResponseDto,
  SchedulerTickDto,
  SchedulerTickResponseDto,
  DispatchDistributionDto,
  DispatchResponseDto,
  SubscribeDto,
  SubscriptionResponseDto,
  CreateDashboardDto,
  DashboardResponseDto,
  RetryExecutionDto,
  RetryExecutionResponseDto,
  DeprecateDefinitionDto,
  DeprecateDefinitionResponseDto,
} from '../dto';

/** Endpoints de reportes: fuentes, definiciones, corridas, distribución y tableros. */
@ApiTags('reporting')
@ApiBearerAuth()
@Controller('reporting')
export class ReportingController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param definitionsService - Valor de definitions service requerido por la operación.
   * @param runsService - Valor de runs service requerido por la operación.
   */
  constructor(
    private readonly definitionsService: ReportingDefinitionsService,
    private readonly runsService: ReportingRunsService,
  ) {}

  /** UC-39-01. */
  @Post('data-sources')
  @Roles('REPORTING_ADMIN', 'DATA_STEWARD')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar una fuente de datos gobernada',
    description:
      'Apunta a un read model declarado o a una vista nombrada, nunca a consulta libre.',
  })
  createDataSource(
    @Body() dto: CreateDataSourceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DataSourceResponseDto> {
    return this.definitionsService.createDataSource(dto, actor);
  }

  /** UC-39-02. */
  @Post('definitions')
  @Roles('REPORTING_ADMIN', 'REPORT_AUTHOR')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Autorar una definición con sus parámetros y columnas',
    description: 'Nace en borrador; publicar una versión es lo que la activa.',
  })
  createDefinition(
    @Body() dto: CreateDefinitionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DefinitionResponseDto> {
    return this.definitionsService.createDefinition(dto, actor);
  }

  /** UC-39-03. */
  @Post('definitions/:id/versions/publish')
  @Roles('REPORTING_ADMIN', 'REPORT_AUTHOR')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Publicar una versión del reporte',
    description:
      'La versión congela consulta y parámetros; la definición pasa a activa.',
  })
  publishVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublishReportVersionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReportVersionResponseDto> {
    return this.definitionsService.publishVersion(id, dto, actor);
  }

  /** UC-39-04. */
  @Post('definitions/:id/executions')
  @Roles('REPORTING_ADMIN', 'REPORT_VIEWER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Encolar una corrida parametrizada',
    description:
      'Se ejecuta contra la versión vigente; los parámetros se validan antes de encolar.',
  })
  createExecution(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateExecutionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ExecutionResponseDto> {
    return this.runsService.createExecution(id, dto, actor);
  }

  /** UC-39-05. */
  @Post('executions/:id/snapshot')
  @Roles('SYSTEM')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar el artefacto materializado y cerrar la corrida',
    description:
      'El hash del contenido permite reconocer artefactos idénticos.',
  })
  materializeSnapshot(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MaterializeSnapshotDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SnapshotResponseDto> {
    return this.runsService.materializeSnapshot(id, dto, actor);
  }

  /** UC-39-06. */
  @Post('definitions/:id/schedules')
  @Roles('REPORTING_ADMIN', 'REPORT_AUTHOR')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Programar la distribución periódica del reporte' })
  createSchedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateScheduleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ScheduleResponseDto> {
    return this.runsService.createSchedule(id, dto, actor);
  }

  /** UC-39-07. */
  @Post('scheduler/tick')
  @Roles('SYSTEM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Disparar las programaciones vencidas',
    description:
      'Toma con SKIP LOCKED: un disparo por ventana aunque los ticks se solapen.',
  })
  schedulerTick(
    @Body() dto: SchedulerTickDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SchedulerTickResponseDto> {
    return this.runsService.schedulerTick(dto, actor);
  }

  /** UC-39-08. */
  @Post('executions/:id/distributions')
  @Roles('SYSTEM', 'REPORTING_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear las distribuciones del reporte por destinatario',
    description: 'Una fila por destinatario; el envío real lo hace messaging.',
  })
  dispatchDistributions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DispatchDistributionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DispatchResponseDto> {
    return this.runsService.dispatchDistributions(id, dto, actor);
  }

  /** UC-39-09. */
  @Post('schedules/:id/subscriptions')
  @Roles('REPORT_VIEWER', 'REPORTING_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Suscribirse a una programación',
    description:
      'El suscriptor es el usuario autenticado; volver a suscribirse reactiva.',
  })
  subscribe(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubscribeDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SubscriptionResponseDto> {
    return this.runsService.subscribe(id, dto, actor);
  }

  /** UC-39-10. */
  @Post('dashboards')
  @Roles('REPORTING_ADMIN', 'REPORT_AUTHOR')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Componer un tablero con sus widgets' })
  createDashboard(
    @Body() dto: CreateDashboardDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DashboardResponseDto> {
    return this.definitionsService.createDashboard(dto, actor);
  }

  /** UC-39-11. */
  @Post('executions/:id/retry')
  @Roles('SYSTEM', 'REPORTING_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Devolver a la cola una corrida fallida',
    description: 'Limpia el error y, si se pide, reencola sus distribuciones.',
  })
  retryExecution(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RetryExecutionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RetryExecutionResponseDto> {
    return this.runsService.retryExecution(id, dto, actor);
  }

  /** UC-39-12. */
  @Post('definitions/:id/deprecate')
  @Roles('REPORTING_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deprecar la definición y suspender sus programaciones',
    description:
      'Ambas cosas ocurren en la misma transacción, para no dejar disparos huérfanos.',
  })
  deprecateDefinition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DeprecateDefinitionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DeprecateDefinitionResponseDto> {
    return this.definitionsService.deprecateDefinition(id, dto, actor);
  }
}
