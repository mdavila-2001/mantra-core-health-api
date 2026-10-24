import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { GraphIntelligenceCollectionsService } from '../services';
import {
  GraphAccessScopePageDto,
  GraphDeletionJobPageDto,
  GraphProjectionRunPageDto,
  GraphRuleHitPageDto,
  ListAccessScopesQueryDto,
  ListDefinitionRunsQueryDto,
  ListDeletionJobsQueryDto,
  ListProjectionRunsQueryDto,
  ListRuleHitsQueryDto,
} from '../dto';

/**
 * `GET` de colección de `graph_intelligence` que el catálogo de vistas esperaba.
 *
 * Cada handler declara su `@Roles(...)`: el mismo que exigen las escrituras
 * del recurso. La página la acota al tenant del contexto el servicio.
 */
@ApiTags('graph-intelligence-collections')
@ApiBearerAuth()
@Controller()
export class GraphIntelligenceCollectionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param collections - Lecturas de colección del módulo.
   */
  constructor(
    private readonly collections: GraphIntelligenceCollectionsService,
  ) {}

  /** V61-02: listar alcances de acceso al grafo del tenant. */
  @Get('graph/access-scopes')
  @Roles('DATA_GOVERNANCE_ADMIN', 'COMPLIANCE_OFFICER', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Listar alcances de acceso al grafo del tenant' })
  @ApiOkResponse({ type: GraphAccessScopePageDto })
  listAccessScopes(
    @Query() query: ListAccessScopesQueryDto,
  ): Promise<GraphAccessScopePageDto> {
    return this.collections.listAccessScopes(query);
  }

  /** V61-05: listar trabajos de borrado del grafo del tenant. */
  @Get('graph/deletion-jobs')
  @Roles('DATA_GOVERNANCE_ADMIN', 'SYSTEM', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Listar trabajos de borrado del grafo del tenant' })
  @ApiOkResponse({ type: GraphDeletionJobPageDto })
  listDeletionJobs(
    @Query() query: ListDeletionJobsQueryDto,
  ): Promise<GraphDeletionJobPageDto> {
    return this.collections.listDeletionJobs(query);
  }

  /** V61-08: listar ejecuciones de una proyección del tenant. */
  @Get('graph/projection-definitions/:id/runs')
  @Roles('SYSTEM', 'GRAPH_ANALYST', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Listar ejecuciones de una proyección del tenant' })
  @ApiOkResponse({ type: GraphProjectionRunPageDto })
  listDefinitionRuns(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ListDefinitionRunsQueryDto,
  ): Promise<GraphProjectionRunPageDto> {
    return this.collections.listDefinitionRuns(id, query);
  }

  /** V61-09: listar ejecuciones de proyección del tenant. */
  @Get('graph/projection-runs')
  @Roles('SYSTEM', 'GRAPH_PROJECTION_WORKER', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Listar ejecuciones de proyección del tenant' })
  @ApiOkResponse({ type: GraphProjectionRunPageDto })
  listProjectionRuns(
    @Query() query: ListProjectionRunsQueryDto,
  ): Promise<GraphProjectionRunPageDto> {
    return this.collections.listProjectionRuns(query);
  }

  /** V61-11: listar coincidencias de reglas del grafo del tenant. */
  @Get('graph/rule-hits')
  @Roles('COMPLIANCE_OFFICER', 'GRAPH_ANALYST', 'PLATFORM_ADMIN')
  @ApiOperation({
    summary: 'Listar coincidencias de reglas del grafo del tenant',
  })
  @ApiOkResponse({ type: GraphRuleHitPageDto })
  listRuleHits(
    @Query() query: ListRuleHitsQueryDto,
  ): Promise<GraphRuleHitPageDto> {
    return this.collections.listRuleHits(query);
  }
}
