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
import { GraphProjectionService } from '../services';
import {
  UpsertNodeDto,
  NodeResponseDto,
  UpsertEdgeDto,
  EdgeResponseDto,
  StartProjectionRunDto,
  AdvanceProjectionRunDto,
  ProjectionRunResponseDto,
  ExpireEdgeDto,
  ExpireEdgeResponseDto,
  ReconcileSourceVersionDto,
  ReconcileResponseDto,
} from '../dto';

/**
 * Proyección del grafo desde los eventos canónicos (UC-61-01, 02, 03, 10, 12).
 *
 * Todo lo de aquí lo llaman workers: el grafo es una proyección, y nadie lo
 * escribe a mano.
 */
@ApiTags('graph_intelligence')
@ApiBearerAuth()
@Controller('graph')
export class GraphProjectionController {
  constructor(private readonly projectionService: GraphProjectionService) {}

  /** UC-61-01. */
  @Post('projections/nodes/upsert')
  @Roles('SYSTEM', 'GRAPH_PROJECTION_WORKER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Proyectar un nodo y sus identificadores',
    description:
      'Idempotente por la clave de origen. Un evento con versión anterior se descarta (`stale`). Los identificadores entran sólo hasheados.',
  })
  upsertNode(
    @Body() dto: UpsertNodeDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<NodeResponseDto> {
    return this.projectionService.upsertNode(dto, actor);
  }

  /** UC-61-02. */
  @Post('projections/edges/upsert')
  @Roles('SYSTEM', 'GRAPH_PROJECTION_WORKER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Proyectar una arista con su evidencia',
    description:
      'La confianza se calcula como base + suma de deltas, acotada a [0,1]; la evidencia repetida se descarta por su hash.',
  })
  upsertEdge(
    @Body() dto: UpsertEdgeDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<EdgeResponseDto> {
    return this.projectionService.upsertEdge(dto, actor);
  }

  /** UC-61-12. */
  @Post('projections/reconcile')
  @Roles('SYSTEM', 'GRAPH_PROJECTION_WORKER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reconciliar la versión canónica del nodo',
    description:
      'Actualiza el nodo, invalida las rutas cacheadas y caduca sus puntajes de riesgo. Si el evento es un borrado, abre el job de purga.',
  })
  reconcileSourceVersion(
    @Body() dto: ReconcileSourceVersionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReconcileResponseDto> {
    return this.projectionService.reconcileSourceVersion(dto, actor);
  }

  /** UC-61-03 (arranque). */
  @Post('projection-definitions/:id/runs')
  @Roles('SYSTEM', 'GRAPH_ANALYST', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Arrancar una corrida de proyección',
    description:
      'Una sola corrida viva por definición; si ya hay una, se devuelve ésa.',
  })
  startProjectionRun(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: StartProjectionRunDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ProjectionRunResponseDto> {
    return this.projectionService.startProjectionRun(id, dto, actor);
  }

  /** UC-61-03 (avance). */
  @Post('projection-runs/:id/advance')
  @Roles('SYSTEM', 'GRAPH_PROJECTION_WORKER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Avanzar el checkpoint de la corrida',
    description: 'El checkpoint es monótono: no puede retroceder.',
  })
  advanceProjectionRun(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdvanceProjectionRunDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ProjectionRunResponseDto> {
    return this.projectionService.advanceProjectionRun(id, dto, actor);
  }

  /** UC-61-10. */
  @Post('edges/:id/expire')
  @Roles('SYSTEM', 'GRAPH_PROJECTION_WORKER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Expirar la arista y decaer su confianza',
    description:
      'No borra: la relación existió. Deja de recorrerse e invalida las rutas cacheadas que pasaban por ella.',
  })
  expireEdge(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExpireEdgeDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ExpireEdgeResponseDto> {
    return this.projectionService.expireEdge(id, dto, actor);
  }
}
