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
import {
  HealthIngestionService,
  CanonicalResourcesService,
  HealthValidationService,
  PatientIdentityService,
  DataReleaseService,
} from '../services';
import {
  OpenIngestionBatchDto,
  IngestionBatchResponseDto,
  RecordIngestionRecordDto,
  IngestionRecordResponseDto,
  CloseIngestionBatchDto,
  CloseBatchResponseDto,
  ProjectCanonicalResourceDto,
  CanonicalResourceVersionResponseDto,
  RegisterIdentifierDto,
  IdentifierResponseDto,
  CreateRelationshipDto,
  RelationshipResponseDto,
  CreateResourceBindingDto,
  ResourceBindingResponseDto,
  ValidateVersionDto,
  ValidationRunResponseDto,
  RecordQualityRunDto,
  QualityRunResponseDto,
  ResolveMatchCandidateDto,
  MatchDecisionResponseDto,
  ProjectTimelineEntryDto,
  TimelineEntryResponseDto,
  RecordDeidRunDto,
  DeidRunResponseDto,
  RetireResourceDto,
  RetireResourceResponseDto,
} from '../dto';

/**
 * Endpoints de la plataforma de datos de salud: ingesta, recurso canónico,
 * validación, identidad longitudinal y de-identificación.
 *
 * Los casos de uso escriben `canonical-resources:project` y `{id}:retire`;
 * Nest 11 trata `:` como inicio de parámetro en cualquier punto del segmento,
 * así que las rutas publicadas usan segmentos planos, como en el resto del
 * proyecto.
 */
@ApiTags('health-data')
@ApiBearerAuth()
@Controller('health-data')
export class HealthDataController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param ingestionService - Valor de ingestion service requerido por la operación.
   * @param resourcesService - Valor de resources service requerido por la operación.
   * @param validationService - Valor de validation service requerido por la operación.
   * @param identityService - Valor de identity service requerido por la operación.
   * @param releaseService - Valor de release service requerido por la operación.
   */
  constructor(
    private readonly ingestionService: HealthIngestionService,
    private readonly resourcesService: CanonicalResourcesService,
    private readonly validationService: HealthValidationService,
    private readonly identityService: PatientIdentityService,
    private readonly releaseService: DataReleaseService,
  ) {}

  /** UC-52-01. */
  @Post('ingestion-batches')
  @Roles('INGESTION_WORKER', 'HEALTH_DATA_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Abrir un lote de ingesta desde una conexión de origen',
    description:
      'El mismo identificador en la misma conexión es el mismo lote: no se reabre.',
  })
  openBatch(
    @Body() dto: OpenIngestionBatchDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IngestionBatchResponseDto> {
    return this.ingestionService.openBatch(dto, actor);
  }

  /** UC-52-02. */
  @Post('ingestion-batches/:id/records')
  @Roles('INGESTION_WORKER', 'HEALTH_DATA_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un registro crudo del lote',
    description:
      'Se deduplica por lote, identificador de origen y versión de origen.',
  })
  recordIngestionRecord(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordIngestionRecordDto,
  ): Promise<IngestionRecordResponseDto> {
    return this.ingestionService.recordIngestionRecord(id, dto);
  }

  /** UC-52-02. */
  @Post('ingestion-batches/:id/close')
  @Roles('INGESTION_WORKER', 'HEALTH_DATA_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cerrar el lote conciliando sus contadores',
    description: 'Los contadores se cuentan contra la tabla de registros.',
  })
  closeBatch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CloseIngestionBatchDto,
  ): Promise<CloseBatchResponseDto> {
    return this.ingestionService.closeBatch(id, dto);
  }

  /** UC-52-03. */
  @Post('canonical-resources/project')
  @Roles('INGESTION_WORKER', 'HEALTH_DATA_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Proyectar el registro a recurso canónico y versionarlo',
    description: 'Un payload idéntico al vigente no genera versión nueva.',
  })
  projectResource(
    @Body() dto: ProjectCanonicalResourceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CanonicalResourceVersionResponseDto> {
    return this.ingestionService.projectResource(dto, actor);
  }

  /** UC-52-04. */
  @Post('canonical-resources/:id/identifiers')
  @Roles('INGESTION_WORKER', 'CLINICAL_INFORMATICIAN', 'HEALTH_DATA_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un identificador de negocio del recurso',
    description: 'Sólo un identificador principal vigente por sistema emisor.',
  })
  registerIdentifier(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegisterIdentifierDto,
  ): Promise<IdentifierResponseDto> {
    return this.resourcesService.registerIdentifier(id, dto);
  }

  /** UC-52-05. */
  @Post('canonical-resources/:id/relationships')
  @Roles('DATA_STEWARD', 'CLINICAL_INFORMATICIAN', 'HEALTH_DATA_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Relacionar dos recursos canónicos',
    description: 'Una relación nueva del mismo par y tipo cierra la anterior.',
  })
  createRelationship(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateRelationshipDto,
  ): Promise<RelationshipResponseDto> {
    return this.resourcesService.createRelationship(id, dto);
  }

  /** UC-52-06. */
  @Post('canonical-resources/:id/bindings')
  @Roles('CLINICAL_INFORMATICIAN', 'HEALTH_DATA_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Enlazar el recurso a una entidad de dominio',
    description:
      'Es una referencia: la tabla clínica sigue siendo la fuente operativa.',
  })
  createBinding(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateResourceBindingDto,
  ): Promise<ResourceBindingResponseDto> {
    return this.resourcesService.createBinding(id, dto);
  }

  /** UC-52-07. */
  @Post('versions/:id/validate')
  @Roles('INGESTION_WORKER', 'HEALTH_DATA_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Validar la versión contra un perfil FHIR R5',
    description:
      'El resultado se deriva de las severidades; un error manda el recurso a cuarentena.',
  })
  validateVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ValidateVersionDto,
  ): Promise<ValidationRunResponseDto> {
    return this.validationService.validateVersion(id, dto);
  }

  /** UC-52-08. */
  @Post('quality-runs')
  @Roles('DATA_STEWARD', 'HEALTH_DATA_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Ejecutar reglas de calidad y abrir incidencias',
    description: 'Una incidencia idéntica ya abierta no se duplica.',
  })
  recordQualityRun(
    @Body() dto: RecordQualityRunDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<QualityRunResponseDto> {
    return this.validationService.recordQualityRun(dto, actor);
  }

  /** UC-52-09. */
  @Post('identity/candidates/:id/decision')
  @Roles('MPI_STEWARD', 'HEALTH_DATA_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Resolver un candidato de identidad longitudinal',
    description: 'Nunca hay fusión automática: siempre decide una persona.',
  })
  resolveCandidate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveMatchCandidateDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MatchDecisionResponseDto> {
    return this.identityService.resolveCandidate(id, dto, actor);
  }

  /** UC-52-10. */
  @Post('timeline-entries')
  @Roles('SYSTEM', 'HEALTH_DATA_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Proyectar una entrada de la línea de tiempo del paciente',
    description: 'Idempotente por entidad de origen y tipo de evento.',
  })
  projectTimelineEntry(
    @Body() dto: ProjectTimelineEntryDto,
  ): Promise<TimelineEntryResponseDto> {
    return this.identityService.projectTimelineEntry(dto);
  }

  /** UC-52-11. */
  @Post('deidentification-runs')
  @Roles('PRIVACY_OFFICER', 'HEALTH_DATA_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar una corrida de de-identificación',
    description:
      'La clave de re-identificación vive en el vault; aquí sólo su referencia.',
  })
  recordDeidRun(
    @Body() dto: RecordDeidRunDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DeidRunResponseDto> {
    return this.releaseService.recordDeidRun(dto, actor);
  }

  /** UC-52-14. */
  @Post('canonical-resources/:id/retire')
  @Roles('CLINICAL_INFORMATICIAN', 'HEALTH_DATA_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retirar el recurso canónico (borrado lógico)',
    description:
      'Las versiones nunca se borran; se cierran enlaces y relaciones vigentes.',
  })
  retireResource(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RetireResourceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RetireResourceResponseDto> {
    return this.resourcesService.retireResource(id, dto, actor);
  }
}
