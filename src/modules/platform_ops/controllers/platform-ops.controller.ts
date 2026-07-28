import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import {
  OpsReleasesService,
  OpsIncidentsService,
  OpsReliabilityService,
  OpsPracticesService,
} from '../services';
import {
  CreateChangeRequestDto,
  ChangeRequestResponseDto,
  RecordApprovalDto,
  ApprovalResponseDto,
  PublishArtifactDto,
  ArtifactResponseDto,
  CreateDeploymentDto,
  DeploymentResponseDto,
  RollbackDeploymentDto,
  RollbackResponseDto,
  RecordHealthRunDto,
  HealthRunResponseDto,
  UpdateIncidentDto,
  IncidentResponseDto,
  OpenPostmortemDto,
  PostmortemResponseDto,
  RecordSloMeasurementDto,
  SloMeasurementResponseDto,
  RecordBurnEventDto,
  BurnEventResponseDto,
  RecordCapacityMeasurementDto,
  CapacityMeasurementResponseDto,
  CompleteReadinessReviewDto,
  ReadinessReviewResponseDto,
  PublishRunbookVersionDto,
  RunbookVersionResponseDto,
  RecordRunbookExecutionDto,
  RunbookExecutionResponseDto,
  CompleteResilienceExerciseDto,
  ResilienceExerciseResponseDto,
} from '../dto';

/** Endpoints de operaciones de plataforma: releases, observabilidad, fiabilidad y prácticas. */
@ApiTags('platform-ops')
@ApiBearerAuth()
@Controller('ops')
export class PlatformOpsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param releasesService - Valor de releases service requerido por la operación.
   * @param incidentsService - Valor de incidents service requerido por la operación.
   * @param reliabilityService - Valor de reliability service requerido por la operación.
   * @param practicesService - Valor de practices service requerido por la operación.
   */
  constructor(
    private readonly releasesService: OpsReleasesService,
    private readonly incidentsService: OpsIncidentsService,
    private readonly reliabilityService: OpsReliabilityService,
    private readonly practicesService: OpsPracticesService,
  ) {}

  /** UC-46-01. */
  @Post('change-requests')
  @Roles('RELEASE_MANAGER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar una solicitud de cambio',
    description:
      'Atarla a una ventana obliga a que el cambio quepa dentro de ella.',
  })
  createChangeRequest(
    @Body() dto: CreateChangeRequestDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ChangeRequestResponseDto> {
    return this.releasesService.createChangeRequest(dto, actor);
  }

  /** UC-46-02. */
  @Post('change-requests/:id/approvals')
  @Roles('CHANGE_APPROVER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar la decisión del CAB',
    description:
      'Quien solicita el cambio no lo aprueba, y los pasos se recorren en orden.',
  })
  recordApproval(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordApprovalDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ApprovalResponseDto> {
    return this.releasesService.recordApproval(id, dto, actor);
  }

  /** UC-46-03. */
  @Post('artifacts')
  @Roles('DEPLOY_PIPELINE', 'RELEASE_MANAGER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Publicar un artefacto inmutable',
    description:
      'Direccionado por contenido: la misma referencia no se republica.',
  })
  publishArtifact(
    @Body() dto: PublishArtifactDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ArtifactResponseDto> {
    return this.releasesService.publishArtifact(dto, actor);
  }

  /** UC-46-04. */
  @Post('deployments')
  @Roles('RELEASE_MANAGER', 'DEPLOY_PIPELINE', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Ejecutar un despliegue',
    description:
      'Exige cambio aprobado, revisión de preparación con "go" en producción y ausencia de congelamiento.',
  })
  createDeployment(
    @Body() dto: CreateDeploymentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DeploymentResponseDto> {
    return this.releasesService.createDeployment(dto, actor);
  }

  /** UC-46-05. */
  @Post('deployments/:id/rollback')
  @Roles('SRE', 'RELEASE_MANAGER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Revertir un despliegue',
    description:
      'Crea un despliegue nuevo al artefacto estable anterior; el fallido queda revertido.',
  })
  rollbackDeployment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RollbackDeploymentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RollbackResponseDto> {
    return this.releasesService.rollbackDeployment(id, dto, actor);
  }

  /** UC-46-06. */
  @Post('health-checks/:id/runs')
  @Roles('SYSTEM', 'SRE', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar una corrida de health check',
    description:
      'Alcanzar el umbral de fallos consecutivos abre el incidente, sin duplicarlo.',
  })
  recordHealthRun(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordHealthRunDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<HealthRunResponseDto> {
    return this.incidentsService.recordHealthRun(id, dto, actor);
  }

  /** UC-46-07. */
  @Patch('incidents/:id')
  @Roles('INCIDENT_COMMANDER', 'SRE', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Mover el incidente, sumar respondientes y publicar comunicaciones',
    description: 'Resolver exige causa raíz y descripción de la resolución.',
  })
  updateIncident(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIncidentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IncidentResponseDto> {
    return this.incidentsService.updateIncident(id, dto, actor);
  }

  /** UC-46-08. */
  @Post('incidents/:id/postmortem')
  @Roles('SRE', 'INCIDENT_COMMANDER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Abrir el postmortem del incidente resuelto',
    description:
      'Cada acción entra además al backlog de mejoras para su seguimiento.',
  })
  openPostmortem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: OpenPostmortemDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PostmortemResponseDto> {
    return this.incidentsService.openPostmortem(id, dto, actor);
  }

  /** UC-46-09. */
  @Post('slo/:id/measurements')
  @Roles('SYSTEM', 'SRE', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar la medición de una ventana del SLO',
    description:
      'Idempotente por fin de ventana: reintentar no duplica el histórico.',
  })
  recordSloMeasurement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordSloMeasurementDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SloMeasurementResponseDto> {
    return this.reliabilityService.recordSloMeasurement(id, dto, actor);
  }

  /** UC-46-10. */
  @Post('error-budget/:policyId/burn-events')
  @Roles('SYSTEM', 'SRE', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar la quema del presupuesto de error',
    description:
      'Agotarlo con la política puesta a congelar bloquea los despliegues.',
  })
  recordBurnEvent(
    @Param('policyId', ParseUUIDPipe) policyId: string,
    @Body() dto: RecordBurnEventDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<BurnEventResponseDto> {
    return this.reliabilityService.recordBurnEvent(policyId, dto, actor);
  }

  /** UC-46-11. */
  @Post('capacity-plans/:id/measurements')
  @Roles('CAPACITY_PLANNER', 'SRE', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar una medición de capacidad',
    description:
      'Cruzar el guardrail declarado permite recomputar el plan en la misma operación.',
  })
  recordCapacityMeasurement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordCapacityMeasurementDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CapacityMeasurementResponseDto> {
    return this.reliabilityService.recordCapacityMeasurement(id, dto, actor);
  }

  /** UC-46-12. */
  @Post('readiness-reviews/:id/complete')
  @Roles('RELEASE_MANAGER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cerrar la revisión de preparación con su decisión',
    description: 'Un hallazgo crítico o alto sin resolver impide el "go".',
  })
  completeReadinessReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteReadinessReviewDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReadinessReviewResponseDto> {
    return this.practicesService.completeReadinessReview(id, dto, actor);
  }

  /** UC-46-13. */
  @Post('runbooks/:id/versions')
  @Roles('SRE', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Publicar una versión del runbook',
    description: 'La versión es inmutable y pasa a ser la vigente.',
  })
  publishRunbookVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublishRunbookVersionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RunbookVersionResponseDto> {
    return this.practicesService.publishRunbookVersion(id, dto, actor);
  }

  /** UC-46-13. */
  @Post('runbook-executions')
  @Roles('SRE', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar la ejecución de un runbook',
    description: 'Si se ejecutó en un incidente, queda también en su timeline.',
  })
  recordRunbookExecution(
    @Body() dto: RecordRunbookExecutionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RunbookExecutionResponseDto> {
    return this.practicesService.recordRunbookExecution(dto, actor);
  }

  /** UC-46-14. */
  @Post('resilience-exercises/:id/complete')
  @Roles('SRE', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cerrar un ejercicio de resiliencia',
    description:
      'El resultado se deriva de comparar lo observado con el objetivo de recuperación.',
  })
  completeResilienceExercise(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteResilienceExerciseDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResilienceExerciseResponseDto> {
    return this.practicesService.completeResilienceExercise(id, dto, actor);
  }
}
