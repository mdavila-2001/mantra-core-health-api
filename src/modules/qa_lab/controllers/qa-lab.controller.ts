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
import { QaCatalogService, QaRunsService } from '../services';
import {
  CreateEnvironmentDto,
  EnvironmentResponseDto,
  CreateTestCaseDto,
  TestCaseResponseDto,
  PublishSuiteDto,
  PublishSuiteResponseDto,
  CreateRunDto,
  RunResponseDto,
  ExecuteCaseDto,
  ExecuteCaseResponseDto,
  EvaluateResultResponseDto,
  FinalizeRunResponseDto,
  AttachArtifactDto,
  ArtifactResponseDto,
  RegisterDefectDto,
  DefectResponseDto,
  TriageDefectDto,
  TriageDefectResponseDto,
  CreateTestScheduleDto,
  TestScheduleResponseDto,
  LinkReleaseDto,
  LinkReleaseResponseDto,
} from '../dto';

/** Endpoints de laboratorio de pruebas: entornos, suites, corridas y defectos. */
@ApiTags('qa')
@ApiBearerAuth()
@Controller('qa')
export class QaLabController {
  constructor(
    private readonly catalogService: QaCatalogService,
    private readonly runsService: QaRunsService,
  ) {}

  /** UC-36-01. */
  @Post('environments')
  @Roles('QA_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un entorno de pruebas gobernado',
    description:
      '`isProductionSafe` decide si los payloads capturados se guardan en claro.',
  })
  createEnvironment(
    @Body() dto: CreateEnvironmentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<EnvironmentResponseDto> {
    return this.catalogService.createEnvironment(dto, actor);
  }

  /** UC-36-02. */
  @Post('suites/:suiteId/cases')
  @Roles('QA_ADMIN', 'QA_ENGINEER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Definir un caso de prueba con sus aserciones',
    description: 'Nace en borrador; publicar la suite es lo que lo activa.',
  })
  createTestCase(
    @Param('suiteId', ParseUUIDPipe) suiteId: string,
    @Body() dto: CreateTestCaseDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TestCaseResponseDto> {
    return this.catalogService.createTestCase(suiteId, dto, actor);
  }

  /** UC-36-03. */
  @Post('suites/:suiteId/publish')
  @Roles('QA_ADMIN', 'QA_ENGINEER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Publicar la suite y activar sus casos',
    description:
      'Sube la versión: lo que se ejecute a partir de aquí es este conjunto.',
  })
  publishSuite(
    @Param('suiteId', ParseUUIDPipe) suiteId: string,
    @Body() dto: PublishSuiteDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PublishSuiteResponseDto> {
    return this.catalogService.publishSuite(suiteId, dto, actor);
  }

  /** UC-36-04. */
  @Post('runs')
  @Roles('QA_ADMIN', 'QA_ENGINEER', 'SYSTEM')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Disparar una corrida de pruebas',
    description:
      'La política de concurrencia decide qué hacer si la suite ya está corriendo.',
  })
  createRun(
    @Body() dto: CreateRunDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RunResponseDto> {
    return this.runsService.createRun(dto, actor);
  }

  /** UC-36-05. */
  @Post('runs/:runId/cases/:caseId/execute')
  @Roles('SYSTEM', 'QA_ENGINEER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar la ejecución del caso con sus payloads',
    description:
      'Evidencia inmutable con hash; enmascarada si el entorno no es seguro.',
  })
  executeCase(
    @Param('runId', ParseUUIDPipe) runId: string,
    @Param('caseId', ParseUUIDPipe) caseId: string,
    @Body() dto: ExecuteCaseDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ExecuteCaseResponseDto> {
    return this.runsService.executeCase(runId, caseId, dto, actor);
  }

  /** UC-36-06. */
  @Post('case-results/:resultId/evaluate')
  @Roles('SYSTEM', 'QA_ENGINEER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Evaluar las aserciones y fijar el resultado del caso',
    description:
      'De los fallos sale la firma con la que se deduplican defectos.',
  })
  evaluateResult(
    @Param('resultId', ParseUUIDPipe) resultId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<EvaluateResultResponseDto> {
    return this.runsService.evaluateResult(resultId, actor);
  }

  /** UC-36-07. */
  @Post('runs/:runId/finalize')
  @Roles('SYSTEM', 'QA_ENGINEER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cerrar la corrida y consolidar totales',
    description: 'Los totales se agregan de los resultados reales.',
  })
  finalizeRun(
    @Param('runId', ParseUUIDPipe) runId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<FinalizeRunResponseDto> {
    return this.runsService.finalizeRun(runId, actor);
  }

  /** UC-36-08. */
  @Post('runs/:runId/artifacts')
  @Roles('SYSTEM', 'QA_ENGINEER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Adjuntar un artefacto de evidencia a la corrida' })
  attachArtifact(
    @Param('runId', ParseUUIDPipe) runId: string,
    @Body() dto: AttachArtifactDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ArtifactResponseDto> {
    return this.runsService.attachArtifact(runId, dto, actor);
  }

  /** UC-36-09. */
  @Post('defects')
  @Roles('SYSTEM', 'QA_ENGINEER', 'QA_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un defecto detectado',
    description:
      'Deduplica por firma de fallo: el mismo fallo sube el contador.',
  })
  registerDefect(
    @Body() dto: RegisterDefectDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DefectResponseDto> {
    return this.runsService.registerDefect(dto, actor);
  }

  /** UC-36-10. */
  @Patch('defects/:defectId')
  @Roles('QA_ADMIN', 'QA_ENGINEER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Triage y transición de estado del defecto',
    description: 'Las transiciones no admitidas se rechazan.',
  })
  triageDefect(
    @Param('defectId', ParseUUIDPipe) defectId: string,
    @Body() dto: TriageDefectDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TriageDefectResponseDto> {
    return this.runsService.triageDefect(defectId, dto, actor);
  }

  /** UC-36-11. */
  @Post('schedules')
  @Roles('QA_ADMIN', 'QA_ENGINEER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Programar la ejecución automática de la suite' })
  createSchedule(
    @Body() dto: CreateTestScheduleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TestScheduleResponseDto> {
    return this.catalogService.createSchedule(dto, actor);
  }

  /** UC-36-12. */
  @Post('runs/:runId/link-release')
  @Roles('RELEASE_MANAGER', 'QA_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enlazar la evidencia de la corrida a un release',
    description: 'Sólo una corrida que pasó puede respaldar un despliegue.',
  })
  linkRelease(
    @Param('runId', ParseUUIDPipe) runId: string,
    @Body() dto: LinkReleaseDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<LinkReleaseResponseDto> {
    return this.runsService.linkRelease(runId, dto, actor);
  }
}
