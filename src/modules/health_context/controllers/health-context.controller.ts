import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { ContextCollectionService, CountryContextService } from '../services';
import {
  CreateAgentDto,
  AgentResponseDto,
  CreateSourceDto,
  SourceResponseDto,
  CreateScheduleDto,
  ScheduleResponseDto,
  RunDueSchedulesDto,
  RunDueSchedulesResponseDto,
  CreateContextDto,
  ContextResponseDto,
  StartCollectionRunDto,
  CollectionRunResponseDto,
  RecordObservationDto,
  ObservationResponseDto,
  DraftContextVersionDto,
  ContextVersionResponseDto,
  RecordQualityReviewDto,
  QualityReviewResponseDto,
  PublishVersionResponseDto,
  FinishCollectionRunDto,
  FinishRunResponseDto,
  SupersedeVersionDto,
  SupersedeVersionResponseDto,
  ResolvedContextResponseDto,
} from '../dto';

/** Endpoints de contexto de salud por país: recolección gobernada y publicación versionada. */
@ApiTags('health-context')
@ApiBearerAuth()
@Controller('health-context')
export class HealthContextController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param collectionService - Valor de collection service requerido por la operación.
   * @param countryContextService - Valor de country context service requerido por la operación.
   */
  constructor(
    private readonly collectionService: ContextCollectionService,
    private readonly countryContextService: CountryContextService,
  ) {}

  /** UC-44-01. */
  @Post('agents')
  @Roles('SOURCE_ADMIN', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un agente recolector gobernado' })
  createAgent(
    @Body() dto: CreateAgentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AgentResponseDto> {
    return this.collectionService.createAgent(dto, actor);
  }

  /** UC-44-02. */
  @Post('sources')
  @Roles('SOURCE_ADMIN', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar una fuente de contexto de salud',
    description: 'El nivel de confianza gobierna qué observaciones se aceptan.',
  })
  createSource(
    @Body() dto: CreateSourceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SourceResponseDto> {
    return this.collectionService.createSource(dto, actor);
  }

  /** UC-44-03. */
  @Post('schedules')
  @Roles('CONTEXT_CURATOR', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Programar la recolección de contexto de un país' })
  createSchedule(
    @Body() dto: CreateScheduleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ScheduleResponseDto> {
    return this.collectionService.createSchedule(dto, actor);
  }

  /**
   * Fase 2 del plan de corrección de workers: cierra el "Pendiente" del
   * README sobre la resolución de la expresión cron, que hoy no evaluaba
   * ningún proceso. Lo llama el worker en bucle, no la UI.
   */
  @Post('internal/schedules/run-due')
  @Roles('SYSTEM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Evaluar programaciones vencidas y encolar sus corridas',
    description: 'Toma el lote con SKIP LOCKED; avanza next_run_at siempre.',
  })
  runDueSchedules(
    @Body() dto: RunDueSchedulesDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RunDueSchedulesResponseDto> {
    return this.collectionService.runDueSchedules(dto, actor);
  }

  /** UC-44-04. */
  @Post('contexts')
  @Roles('CONTEXT_CURATOR', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear el contexto de salud de un país',
    description: 'Nace en borrador: la versión vigente llega al publicar.',
  })
  createContext(
    @Body() dto: CreateContextDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ContextResponseDto> {
    return this.countryContextService.createContext(dto, actor);
  }

  /** UC-44-05. */
  @Post('collection-runs')
  @Roles('SYSTEM', 'CONTEXT_CURATOR', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Disparar una corrida de recolección',
    description:
      'Idempotente por clave: el mismo disparo no se ejecuta dos veces.',
  })
  startCollectionRun(
    @Body() dto: StartCollectionRunDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CollectionRunResponseDto> {
    return this.collectionService.startCollectionRun(dto, actor);
  }

  /** UC-44-06. */
  @Post('collection-runs/:id/observations')
  @Roles('SYSTEM', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar una observación inmutable de fuente',
    description:
      'Sólo agregado de país; se deduplica por hash dentro de la corrida.',
  })
  recordObservation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordObservationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ObservationResponseDto> {
    return this.collectionService.recordObservation(id, dto, actor);
  }

  /** UC-44-07. */
  @Post('contexts/:id/versions')
  @Roles('SYSTEM', 'CONTEXT_CURATOR', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Materializar una versión borrador con hechos y evidencia',
    description: 'Un hecho sin evidencia de la misma corrida se rechaza.',
  })
  draftContextVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DraftContextVersionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ContextVersionResponseDto> {
    return this.countryContextService.draftVersion(id, dto, actor);
  }

  /** UC-44-08. */
  @Post('versions/:id/quality-reviews')
  @Roles('QUALITY_REVIEWER', 'SYSTEM', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Revisar la calidad de la versión',
    description: 'El desenlace mueve la versión a aprobada o rechazada.',
  })
  recordQualityReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordQualityReviewDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<QualityReviewResponseDto> {
    return this.countryContextService.recordQualityReview(id, dto, actor);
  }

  /** UC-44-09. */
  @Post('versions/:id/publish')
  @Roles('CONTEXT_CURATOR', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Publicar la versión aprobada y avanzar el contexto',
    description: 'Sólo puede haber una versión publicada por contexto.',
  })
  publishVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PublishVersionResponseDto> {
    return this.countryContextService.publishVersion(id, actor);
  }

  /** UC-44-10. */
  @Post('collection-runs/:id/finish')
  @Roles('SYSTEM', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cerrar la corrida conciliando sus contadores',
    description:
      'Los contadores se recuentan contra las observaciones registradas.',
  })
  finishCollectionRun(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FinishCollectionRunDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<FinishRunResponseDto> {
    return this.collectionService.finishCollectionRun(id, dto, actor);
  }

  /** UC-44-11. */
  @Post('versions/:id/supersede')
  @Roles('CONTEXT_CURATOR', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retirar la versión vigente, con reemplazo o por caducidad',
    description: 'Sin reemplazo el contexto queda marcado como obsoleto.',
  })
  supersedeVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SupersedeVersionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SupersedeVersionResponseDto> {
    return this.countryContextService.supersedeVersion(id, dto, actor);
  }

  /** UC-44-12. */
  @Get('contexts/resolve')
  @Roles('CONTEXT_CONSUMER', 'CONTEXT_CURATOR', 'SYSTEM', 'PLATFORM_ADMIN')
  @ApiOperation({
    summary: 'Resolver el contexto vigente para consumo',
    description:
      'Una versión caducada se devuelve marcada como obsoleta, no se oculta.',
  })
  @ApiQuery({
    name: 'country',
    format: 'uuid',
    description: 'Concepto de país',
  })
  @ApiQuery({
    name: 'domain',
    format: 'uuid',
    description: 'Concepto de dominio del contexto',
  })
  @ApiQuery({
    name: 'key',
    description: 'Clave del contexto dentro del dominio',
  })
  resolveContext(
    @Query('country', ParseUUIDPipe) country: string,
    @Query('domain', ParseUUIDPipe) domain: string,
    @Query('key') key: string,
  ): Promise<ResolvedContextResponseDto> {
    return this.countryContextService.resolveContext(country, domain, key);
  }
}
