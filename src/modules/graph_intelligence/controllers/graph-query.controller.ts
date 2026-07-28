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
import { GraphAnalyticsService, GraphTraversalService } from '../services';
import {
  DefineAccessScopeDto,
  UpdateAccessScopeDto,
  AccessScopeResponseDto,
  TraverseDto,
  TraverseResponseDto,
  FindPathDto,
  PathResponseDto,
  DetectCommunitiesDto,
  CommunitiesResponseDto,
  ComputeRiskScoresDto,
  RiskScoresResponseDto,
  EvaluateRuleDto,
  EvaluateRuleResponseDto,
  TriageRuleHitDto,
  RuleHitResponseDto,
  RequestGraphDeletionDto,
  GraphDeletionResponseDto,
} from '../dto';

/**
 * Gobierno del acceso, consulta y analítica del grafo (UC-61-04 … 09, 11).
 */
@ApiTags('graph_intelligence')
@ApiBearerAuth()
@Controller('graph')
export class GraphQueryController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param traversalService - Valor de traversal service requerido por la operación.
   * @param analyticsService - Valor de analytics service requerido por la operación.
   */
  constructor(
    private readonly traversalService: GraphTraversalService,
    private readonly analyticsService: GraphAnalyticsService,
  ) {}

  /** UC-61-04 (alta). */
  @Post('access-scopes')
  @Roles('DATA_GOVERNANCE_ADMIN', 'COMPLIANCE_OFFICER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Definir un alcance de acceso al grafo',
    description:
      'Acota tipos de nodo, tipos de relación, propósitos de uso y profundidad máxima.',
  })
  defineAccessScope(
    @Body() dto: DefineAccessScopeDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AccessScopeResponseDto> {
    return this.traversalService.defineAccessScope(dto, actor);
  }

  /** UC-61-04 (cambio). */
  @Patch('access-scopes/:id')
  @Roles('DATA_GOVERNANCE_ADMIN', 'COMPLIANCE_OFFICER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ajustar o suspender el alcance de acceso',
    description:
      'Cualquier cambio publica el evento que invalida las cachés de sesión.',
  })
  updateAccessScope(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAccessScopeDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AccessScopeResponseDto> {
    return this.traversalService.updateAccessScope(id, dto, actor);
  }

  /** UC-61-05 (recorrido). */
  @Post('traverse')
  @Roles(
    'GRAPH_ANALYST',
    'API_CONSUMER',
    'COMPLIANCE_OFFICER',
    'PLATFORM_ADMIN',
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recorrer el grafo desde un nodo',
    description:
      'El scoping se aplica dentro del recorrido: un nodo fuera de alcance no se visita, así que tampoco se llega a lo que hay detrás.',
  })
  traverse(
    @Body() dto: TraverseDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TraverseResponseDto> {
    return this.traversalService.traverse(dto, actor);
  }

  /** UC-61-05 (ruta). */
  @Post('paths')
  @Roles(
    'GRAPH_ANALYST',
    'API_CONSUMER',
    'COMPLIANCE_OFFICER',
    'PLATFORM_ADMIN',
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Buscar el camino entre dos nodos',
    description:
      'La caché se consulta después de validar el alcance, nunca antes.',
  })
  findPath(
    @Body() dto: FindPathDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PathResponseDto> {
    return this.traversalService.findPath(dto, actor);
  }

  /** UC-61-06. */
  @Post('analytics/community-detection')
  @Roles('SYSTEM', 'GRAPH_ANALYTICS_WORKER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar las comunidades detectadas',
    description:
      'El resultado de una versión de algoritmo se reemplaza entero; las versiones conviven.',
  })
  detectCommunities(
    @Body() dto: DetectCommunitiesDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CommunitiesResponseDto> {
    return this.analyticsService.detectCommunities(dto, actor);
  }

  /** UC-61-07. */
  @Post('analytics/risk-scoring')
  @Roles('SYSTEM', 'GRAPH_ANALYTICS_WORKER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar puntajes de riesgo por nodo',
    description:
      'Cada puntaje caduca; sólo se publica alerta por encima del umbral.',
  })
  computeRiskScores(
    @Body() dto: ComputeRiskScoresDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RiskScoresResponseDto> {
    return this.analyticsService.computeRiskScores(dto, actor);
  }

  /** UC-61-08. */
  @Post('rules/:id/evaluate')
  @Roles(
    'SYSTEM',
    'GRAPH_ANALYTICS_WORKER',
    'COMPLIANCE_OFFICER',
    'PLATFORM_ADMIN',
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar los hallazgos de una regla',
    description:
      'Deduplica por (regla, nodo principal) mientras haya un hallazgo vivo; exige alcance de acceso activo.',
  })
  evaluateRule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EvaluateRuleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<EvaluateRuleResponseDto> {
    return this.analyticsService.evaluateRule(id, dto, actor);
  }

  /** UC-61-09. */
  @Patch('rule-hits/:id')
  @Roles('COMPLIANCE_OFFICER', 'GRAPH_ANALYST', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mover el hallazgo por su triage',
    description:
      'Un hallazgo cerrado no se reabre: si el patrón vuelve, la regla abre uno nuevo.',
  })
  triageRuleHit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TriageRuleHitDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RuleHitResponseDto> {
    return this.analyticsService.triageRuleHit(id, dto, actor);
  }

  /** UC-61-11. */
  @Post('deletion-jobs')
  @Roles('DATA_GOVERNANCE_ADMIN', 'SYSTEM', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Propagar el borrado al grafo (derecho al olvido)',
    description:
      'Purga nodo, identificadores, aristas con su evidencia, riesgo, rutas cacheadas y la pertenencia a comunidades.',
  })
  requestDeletion(
    @Body() dto: RequestGraphDeletionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<GraphDeletionResponseDto> {
    return this.analyticsService.requestDeletion(dto, actor);
  }
}
