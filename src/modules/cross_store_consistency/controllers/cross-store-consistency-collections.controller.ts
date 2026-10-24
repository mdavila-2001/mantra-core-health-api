import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { CrossStoreConsistencyCollectionsService } from '../services';
import {
  CacheInvalidationJobPageDto,
  CrossStoreDeletionRequestPageDto,
  DataMovementJobPageDto,
  ListDataMovementJobsQueryDto,
  ListDeadLettersQueryDto,
  ListDeletionRequestsQueryDto,
  ListInvalidationsQueryDto,
  ListRepairJobsQueryDto,
  ListWorkerDeadLettersQueryDto,
  ListWorkerDeletionRequestsQueryDto,
  ProjectionDeadLetterPageDto,
  ProjectionRepairJobPageDto,
} from '../dto';

/**
 * `GET` de colección de `cross_store_consistency` que el catálogo de vistas esperaba.
 *
 * Cada handler declara su `@Roles(...)`: el mismo que exigen las escrituras
 * del recurso. La página la acota al tenant del contexto el servicio.
 */
@ApiTags('cross-store-consistency-collections')
@ApiBearerAuth()
@Controller()
export class CrossStoreConsistencyCollectionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param collections - Lecturas de colección del módulo.
   */
  constructor(
    private readonly collections: CrossStoreConsistencyCollectionsService,
  ) {}

  /** V62-02: listar trabajos de movimiento de datos del tenant. */
  @Get('admin/data-movement-jobs')
  @Roles('DATA_GOVERNANCE_ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({
    summary: 'Listar trabajos de movimiento de datos del tenant',
  })
  @ApiOkResponse({ type: DataMovementJobPageDto })
  listDataMovementJobs(
    @Query() query: ListDataMovementJobsQueryDto,
  ): Promise<DataMovementJobPageDto> {
    return this.collections.listDataMovementJobs(query);
  }

  /** V62-03: listar solicitudes de borrado del tenant. */
  @Get('admin/deletion-requests')
  @Roles('PRIVACY_OFFICER', 'DPO', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Listar solicitudes de borrado del tenant' })
  @ApiOkResponse({ type: CrossStoreDeletionRequestPageDto })
  listDeletionRequests(
    @Query() query: ListDeletionRequestsQueryDto,
  ): Promise<CrossStoreDeletionRequestPageDto> {
    return this.collections.listDeletionRequests(query);
  }

  /** V62-04: listar mensajes fallidos de proyección del tenant. */
  @Get('admin/projections/dead-letters')
  @Roles('DATA_GOVERNANCE_ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({
    summary: 'Listar mensajes fallidos de proyección del tenant',
  })
  @ApiOkResponse({ type: ProjectionDeadLetterPageDto })
  listDeadLetters(
    @Query() query: ListDeadLettersQueryDto,
  ): Promise<ProjectionDeadLetterPageDto> {
    return this.collections.listDeadLetters(query);
  }

  /** V62-06: listar trabajos de reparación de una deriva del tenant. */
  @Get('admin/projections/drift/:id/repair-jobs')
  @Roles('DATA_GOVERNANCE_ADMIN', 'SYSTEM', 'PLATFORM_ADMIN')
  @ApiOperation({
    summary: 'Listar trabajos de reparación de una deriva del tenant',
  })
  @ApiOkResponse({ type: ProjectionRepairJobPageDto })
  listRepairJobs(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ListRepairJobsQueryDto,
  ): Promise<ProjectionRepairJobPageDto> {
    return this.collections.listRepairJobs(id, query);
  }

  /** V62-08: listar invalidaciones de caché del tenant. */
  @Get('workers/cache/invalidations')
  @Roles('SYSTEM', 'MAINTENANCE_WORKER', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Listar invalidaciones de caché del tenant' })
  @ApiOkResponse({ type: CacheInvalidationJobPageDto })
  listInvalidations(
    @Query() query: ListInvalidationsQueryDto,
  ): Promise<CacheInvalidationJobPageDto> {
    return this.collections.listInvalidations(query);
  }

  /** V62-09: listar solicitudes de borrado para workers del tenant. */
  @Get('workers/deletion-requests')
  @Roles('SYSTEM', 'DELETION_WORKER', 'PLATFORM_ADMIN')
  @ApiOperation({
    summary: 'Listar solicitudes de borrado para workers del tenant',
  })
  @ApiOkResponse({ type: CrossStoreDeletionRequestPageDto })
  listWorkerDeletionRequests(
    @Query() query: ListWorkerDeletionRequestsQueryDto,
  ): Promise<CrossStoreDeletionRequestPageDto> {
    return this.collections.listWorkerDeletionRequests(query);
  }

  /** V62-14: listar mensajes fallidos de proyección para workers del tenant. */
  @Get('workers/projections/dead-letters')
  @Roles('SYSTEM', 'PROJECTION_WORKER', 'PLATFORM_ADMIN')
  @ApiOperation({
    summary: 'Listar mensajes fallidos de proyección para workers del tenant',
  })
  @ApiOkResponse({ type: ProjectionDeadLetterPageDto })
  listWorkerDeadLetters(
    @Query() query: ListWorkerDeadLettersQueryDto,
  ): Promise<ProjectionDeadLetterPageDto> {
    return this.collections.listWorkerDeadLetters(query);
  }
}
