import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { EmbeddingPipelineService, VectorGovernanceService } from '../services';
import {
  RegisterModelVersionDto,
  ModelVersionResponseDto,
  CreateCollectionDto,
  CollectionResponseDto,
  DefineRagPolicyDto,
  PublishRagPolicyDto,
  RagPolicyResponseDto,
  QueueEmbeddingJobDto,
  EmbeddingJobResponseDto,
  ReEmbedCollectionDto,
  ReEmbedResponseDto,
  RetireModelVersionDto,
  UpdateCollectionLifecycleDto,
  LifecycleResponseDto,
} from '../dto';

/**
 * Gobierno del catálogo vectorial (UC-59-01 … 04, 11, 13): qué modelos se pueden
 * usar, qué colecciones existen, bajo qué política se consultan y qué trabajo se
 * encola sobre ellas.
 */
@ApiTags('vector_rag')
@ApiBearerAuth()
@Controller('vector-rag')
export class VectorGovernanceController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param governanceService - Valor de governance service requerido por la operación.
   * @param pipelineService - Valor de pipeline service requerido por la operación.
   */
  constructor(
    private readonly governanceService: VectorGovernanceService,
    private readonly pipelineService: EmbeddingPipelineService,
  ) {}

  /** UC-59-01. */
  @Post('embedding-model-versions')
  @Roles('AI_GOVERNANCE_OFFICER', 'MLOPS_ENGINEER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar y aprobar una versión de modelo de embedding',
    description:
      'La aprobación para datos de paciente queda registrada con quién y cuándo.',
  })
  registerModelVersion(
    @Body() dto: RegisterModelVersionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ModelVersionResponseDto> {
    return this.governanceService.registerModelVersion(dto, actor);
  }

  /** UC-59-13 (retirada del modelo). */
  @Post('embedding-model-versions/:id/retire')
  @Roles('AI_GOVERNANCE_OFFICER', 'MLOPS_ENGINEER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retirar una versión de modelo',
    description:
      'No borra: marca `retired_at`. Se rechaza si hay jobs vivos que dependen de él.',
  })
  retireModelVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RetireModelVersionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ModelVersionResponseDto> {
    return this.governanceService.retireModelVersion(id, dto, actor);
  }

  /** UC-59-02. */
  @Post('collections')
  @Roles('RAG_COLLECTION_ADMIN', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una colección vectorial con su vínculo de tenant',
    description:
      'Dimensión y métrica salen del modelo; una colección con PHI exige un modelo aprobado para PHI.',
  })
  createCollection(
    @Body() dto: CreateCollectionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CollectionResponseDto> {
    return this.governanceService.createCollection(dto, actor);
  }

  /** UC-59-03 (definición). */
  @Post('rag-access-policies')
  @Roles('PRIVACY_OFFICER', 'DPO', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Definir una política de acceso RAG',
    description:
      'Nace en borrador; una política en borrador no gobierna ninguna consulta.',
  })
  defineRagPolicy(
    @Body() dto: DefineRagPolicyDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RagPolicyResponseDto> {
    return this.governanceService.defineRagPolicy(dto, actor);
  }

  /** UC-59-03 (publicación). */
  @Put('rag-access-policies/:id/publish')
  @Roles('PRIVACY_OFFICER', 'DPO', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Publicar la política y reenlazar colecciones',
    description:
      'Publicar es el momento en que la revisión de privacidad pasa a tener efecto.',
  })
  publishRagPolicy(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublishRagPolicyDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RagPolicyResponseDto> {
    return this.governanceService.publishRagPolicy(id, dto, actor);
  }

  /** UC-59-04. */
  @Post('collections/:id/embedding-jobs')
  @Roles('RAG_COLLECTION_ADMIN', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description: 'Si no se envía, se deriva del alcance del job.',
  })
  @ApiOperation({
    summary: 'Encolar un job de embedding',
    description:
      'Sólo sobre colección activa; el mismo alcance pedido dos veces no se duplica.',
  })
  queueEmbeddingJob(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: QueueEmbeddingJobDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<EmbeddingJobResponseDto> {
    return this.pipelineService.queueEmbeddingJob(
      id,
      dto,
      actor,
      idempotencyKey,
    );
  }

  /** UC-59-11. */
  @Post('collections/:id/re-embed')
  @Roles('AI_GOVERNANCE_OFFICER', 'MLOPS_ENGINEER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Migrar la colección a un modelo nuevo',
    description:
      'Los embeddings anteriores pasan a `superseded`, no se borran: la colección sigue sirviendo búsquedas mientras se re-embebe.',
  })
  reEmbedCollection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReEmbedCollectionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReEmbedResponseDto> {
    return this.pipelineService.reEmbedCollection(id, dto, actor);
  }

  /** UC-59-13 (sellado de la colección). */
  @Put('collections/:id/lifecycle')
  @Roles('AI_GOVERNANCE_OFFICER', 'RAG_COLLECTION_ADMIN', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sellar o deprecar la colección',
    description:
      'Sellar congela los vínculos del tenant, que es lo que bloquea escrituras nuevas.',
  })
  updateCollectionLifecycle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCollectionLifecycleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<LifecycleResponseDto> {
    return this.governanceService.updateCollectionLifecycle(id, dto, actor);
  }
}
