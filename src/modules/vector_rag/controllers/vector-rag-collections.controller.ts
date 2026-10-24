import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { VectorRagCollectionsService } from '../services';
import {
  ListCollectionEmbeddingJobsQueryDto,
  ListCollectionReconciliationsQueryDto,
  ListCollectionsQueryDto,
  ListDeletionJobsQueryDto,
  ListEmbeddingJobsQueryDto,
  ListRagAccessPoliciesQueryDto,
  RagAccessPolicyPageDto,
  VectorCollectionPageDto,
  VectorDeletionJobPageDto,
  VectorEmbeddingJobPageDto,
  VectorReconciliationRunPageDto,
} from '../dto';

/**
 * `GET` de colección de `vector_rag` que el catálogo de vistas esperaba.
 *
 * Cada handler declara su `@Roles(...)`: el mismo que exigen las escrituras
 * del recurso. La página la acota al tenant del contexto el servicio.
 */
@ApiTags('vector-rag-collections')
@ApiBearerAuth()
@Controller()
export class VectorRagCollectionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param collections - Lecturas de colección del módulo.
   */
  constructor(private readonly collections: VectorRagCollectionsService) {}

  /** V59-01: listar colecciones vectoriales del tenant. */
  @Get('vector-rag/collections')
  @Roles('RAG_COLLECTION_ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Listar colecciones vectoriales del tenant' })
  @ApiOkResponse({ type: VectorCollectionPageDto })
  listCollections(
    @Query() query: ListCollectionsQueryDto,
  ): Promise<VectorCollectionPageDto> {
    return this.collections.listCollections(query);
  }

  /** V59-02: listar trabajos de embedding de una colección del tenant. */
  @Get('vector-rag/collections/:id/embedding-jobs')
  @Roles('RAG_COLLECTION_ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({
    summary: 'Listar trabajos de embedding de una colección del tenant',
  })
  @ApiOkResponse({ type: VectorEmbeddingJobPageDto })
  listCollectionEmbeddingJobs(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ListCollectionEmbeddingJobsQueryDto,
  ): Promise<VectorEmbeddingJobPageDto> {
    return this.collections.listCollectionEmbeddingJobs(id, query);
  }

  /** V59-04: listar conciliaciones de una colección del tenant. */
  @Get('vector-rag/collections/:id/reconciliation')
  @Roles('SYSTEM', 'RECONCILIATION_WORKER', 'PLATFORM_ADMIN')
  @ApiOperation({
    summary: 'Listar conciliaciones de una colección del tenant',
  })
  @ApiOkResponse({ type: VectorReconciliationRunPageDto })
  listCollectionReconciliations(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ListCollectionReconciliationsQueryDto,
  ): Promise<VectorReconciliationRunPageDto> {
    return this.collections.listCollectionReconciliations(id, query);
  }

  /** V59-06: listar políticas de acceso rag del tenant. */
  @Get('vector-rag/rag-access-policies')
  @Roles('PRIVACY_OFFICER', 'DPO', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Listar políticas de acceso RAG del tenant' })
  @ApiOkResponse({ type: RagAccessPolicyPageDto })
  listRagAccessPolicies(
    @Query() query: ListRagAccessPoliciesQueryDto,
  ): Promise<RagAccessPolicyPageDto> {
    return this.collections.listRagAccessPolicies(query);
  }

  /** V59-10: listar trabajos de borrado vectorial del tenant. */
  @Get('vector-rag/deletion-jobs')
  @Roles('PRIVACY_OFFICER', 'DPO', 'SYSTEM', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Listar trabajos de borrado vectorial del tenant' })
  @ApiOkResponse({ type: VectorDeletionJobPageDto })
  listDeletionJobs(
    @Query() query: ListDeletionJobsQueryDto,
  ): Promise<VectorDeletionJobPageDto> {
    return this.collections.listDeletionJobs(query);
  }

  /** V59-11: listar trabajos de embedding del tenant. */
  @Get('vector-rag/embedding-jobs')
  @Roles('SYSTEM', 'EMBEDDING_WORKER', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Listar trabajos de embedding del tenant' })
  @ApiOkResponse({ type: VectorEmbeddingJobPageDto })
  listEmbeddingJobs(
    @Query() query: ListEmbeddingJobsQueryDto,
  ): Promise<VectorEmbeddingJobPageDto> {
    return this.collections.listEmbeddingJobs(query);
  }
}
