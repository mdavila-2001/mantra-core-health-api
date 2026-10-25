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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  ParseOptionalLimitPipe,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import {
  EmbeddingPipelineService,
  RetrievalService,
  VectorMaintenanceService,
} from '../services';
import {
  RunEmbeddingJobDto,
  RunEmbeddingJobResponseDto,
  PendingEmbeddingJobsResponseDto,
  OpenRetrievalSessionDto,
  RetrievalSessionResponseDto,
  RankCandidatesDto,
  RankCandidatesResponseDto,
  MaterializeEvidenceDto,
  EvidenceResponseDto,
  CaptureFeedbackDto,
  FeedbackResponseDto,
  PropagateDeletionDto,
  DeletionResponseDto,
  ReconcileCollectionDto,
  ReconciliationResponseDto,
} from '../dto';

/**
 * Ejecución del módulo (UC-59-05 … 10, 12): embeber, consultar, citar, dar
 * feedback, purgar y reconciliar.
 */
@ApiTags('vector_rag')
@ApiBearerAuth()
@Controller('vector-rag')
export class VectorRuntimeController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param pipelineService - Valor de pipeline service requerido por la operación.
   * @param retrievalService - Valor de retrieval service requerido por la operación.
   * @param maintenanceService - Valor de maintenance service requerido por la operación.
   */
  constructor(
    private readonly pipelineService: EmbeddingPipelineService,
    private readonly retrievalService: RetrievalService,
    private readonly maintenanceService: VectorMaintenanceService,
  ) {}

  /**
   * Descubrimiento del worker de embeddings: `run` exige un `jobId` puntual y
   * no había forma de listar qué jobs en cola ejecutar.
   */
  @Get('embedding-jobs/pending')
  @Roles('SYSTEM', 'EMBEDDING_WORKER', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Listar jobs de embedding en cola' })
  listQueuedJobs(
    @CurrentUser() actor: AuthenticatedUser,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<PendingEmbeddingJobsResponseDto> {
    return this.pipelineService.listQueuedJobs(limit, actor);
  }

  /** UC-59-05. */
  @Audited({
    action: 'EMBEDDING_JOB_RUN',
    entity: 'embedding_job',
    entityId: 'param:id',
  })
  @Post('embedding-jobs/:id/run')
  @Roles('SYSTEM', 'EMBEDDING_WORKER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ejecutar un lote del job de embedding',
    description:
      'Documento, chunks y vectores en la misma transacción; reejecutar no duplica en ninguno de los tres niveles.',
  })
  runEmbeddingJob(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RunEmbeddingJobDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RunEmbeddingJobResponseDto> {
    return this.pipelineService.runEmbeddingJob(id, dto, actor);
  }

  /** UC-59-06. */
  @Audited({
    action: 'RETRIEVAL_SESSION_OPENED',
    entity: 'retrieval_session',
    entityId: 'result.id',
  })
  @Post('retrieval-sessions')
  @Roles('CLINICIAN', 'AGENT_RUNTIME', 'SYSTEM', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Abrir una sesión de retrieval gobernada por consentimiento',
    description:
      'Exige política publicada, propósito admitido y —si la política lo pide— paciente y consentimiento.',
  })
  openSession(
    @Body() dto: OpenRetrievalSessionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RetrievalSessionResponseDto> {
    return this.retrievalService.openSession(dto, actor);
  }

  /** UC-59-07. */
  @Audited({
    action: 'RETRIEVAL_CANDIDATES_RANKED',
    entity: 'retrieval_session',
    entityId: 'param:id',
  })
  @Post('retrieval-sessions/:id/search')
  @Roles('SYSTEM', 'RETRIEVAL_WORKER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Ranquear los candidatos y filtrarlos por consentimiento y etiquetas',
    description:
      'Cada candidato recibe una decisión y todas se guardan, también las denegadas y su motivo.',
  })
  rankCandidates(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RankCandidatesDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RankCandidatesResponseDto> {
    return this.retrievalService.rankCandidates(id, dto, actor);
  }

  /** UC-59-08. */
  @Audited({
    action: 'RETRIEVAL_EVIDENCE_MATERIALIZED',
    entity: 'retrieval_evidence',
    entityId: 'result.id',
  })
  @Post('retrieval-sessions/:id/evidence')
  @Roles('SYSTEM', 'RETRIEVAL_WORKER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Materializar la evidencia citable',
    description:
      'Sólo se cita lo seleccionado y autorizado; la versión fuente se copia del documento, no se recibe.',
  })
  materializeEvidence(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MaterializeEvidenceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<EvidenceResponseDto> {
    return this.retrievalService.materializeEvidence(id, dto, actor);
  }

  /** UC-59-09. */
  @Audited({
    action: 'RETRIEVAL_FEEDBACK_CAPTURED',
    entity: 'retrieval_feedback_event',
    entityId: 'result.id',
  })
  @Post('retrieval-sessions/:id/feedback')
  @Roles('CLINICIAN', 'AGENT_RUNTIME', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Capturar feedback de la sesión',
    description:
      'Un código de problema de seguridad marca la sesión y publica un evento aparte.',
  })
  captureFeedback(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CaptureFeedbackDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<FeedbackResponseDto> {
    return this.retrievalService.captureFeedback(id, dto, actor);
  }

  /** UC-59-10. */
  @Audited({
    action: 'VECTOR_DELETION_PROPAGATED',
    entity: 'vector_deletion_job',
    entityId: 'result.id',
  })
  @Post('deletion-jobs')
  @Roles('PRIVACY_OFFICER', 'DPO', 'SYSTEM', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Propagar el borrado de la fuente a los embeddings',
    description:
      'Borrado físico: un embedding marcado como borrado seguiría siendo el dato guardado.',
  })
  propagateDeletion(
    @Body() dto: PropagateDeletionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DeletionResponseDto> {
    return this.maintenanceService.propagateDeletion(dto, actor);
  }

  /** UC-59-12. */
  @Audited({
    action: 'VECTOR_COLLECTION_RECONCILED',
    entity: 'vector_reconciliation_run',
    entityId: 'result.id',
  })
  @Post('collections/:id/reconciliation')
  @Roles('SYSTEM', 'RECONCILIATION_WORKER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Reconciliar el manifiesto canónico contra el vectorial',
    description:
      'Distingue lo que falta, lo huérfano y lo descuadrado, y encola la reparación de cada uno.',
  })
  reconcileCollection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReconcileCollectionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReconciliationResponseDto> {
    return this.maintenanceService.reconcileCollection(id, dto, actor);
  }
}
