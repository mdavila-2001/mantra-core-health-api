import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { PlatformOpsCollectionsService } from '../services';
import {
  ArtifactPageDto,
  ChangeRequestPageDto,
  DeploymentPageDto,
  HealthIncidentPageDto,
  ListArtifactsQueryDto,
  ListChangeRequestsQueryDto,
  ListDeploymentsQueryDto,
  ListIncidentsQueryDto,
  ListResilienceExercisesQueryDto,
  ResilienceExercisePageDto,
} from '../dto';

/**
 * `GET` de colección de `platform_ops` que el catálogo de vistas esperaba.
 *
 * Cada handler declara su `@Roles(...)`: el mismo que exigen las escrituras
 * del recurso. La página la acota al tenant del contexto el servicio.
 */
@ApiTags('platform-ops-collections')
@ApiBearerAuth()
@Controller()
export class PlatformOpsCollectionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param collections - Lecturas de colección del módulo.
   */
  constructor(private readonly collections: PlatformOpsCollectionsService) {}

  /** V46-01: listar despliegues del tenant. */
  @Get('ops/deployments')
  @Roles('RELEASE_MANAGER', 'DEPLOY_PIPELINE', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Listar despliegues del tenant' })
  @ApiOkResponse({ type: DeploymentPageDto })
  listDeployments(
    @Query() query: ListDeploymentsQueryDto,
  ): Promise<DeploymentPageDto> {
    return this.collections.listDeployments(query);
  }

  /** V46-02: listar artefactos del tenant. */
  @Get('ops/artifacts')
  @Roles('DEPLOY_PIPELINE', 'RELEASE_MANAGER', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Listar artefactos del tenant' })
  @ApiOkResponse({ type: ArtifactPageDto })
  listArtifacts(
    @Query() query: ListArtifactsQueryDto,
  ): Promise<ArtifactPageDto> {
    return this.collections.listArtifacts(query);
  }

  /** V46-04: listar solicitudes de cambio del tenant. */
  @Get('ops/change-requests')
  @Roles('RELEASE_MANAGER', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Listar solicitudes de cambio del tenant' })
  @ApiOkResponse({ type: ChangeRequestPageDto })
  listChangeRequests(
    @Query() query: ListChangeRequestsQueryDto,
  ): Promise<ChangeRequestPageDto> {
    return this.collections.listChangeRequests(query);
  }

  /** V46-08: listar incidentes de salud del tenant. */
  @Get('ops/incidents')
  @Roles('INCIDENT_COMMANDER', 'SRE', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Listar incidentes de salud del tenant' })
  @ApiOkResponse({ type: HealthIncidentPageDto })
  listIncidents(
    @Query() query: ListIncidentsQueryDto,
  ): Promise<HealthIncidentPageDto> {
    return this.collections.listIncidents(query);
  }

  /** V46-11: listar ejercicios de resiliencia del tenant. */
  @Get('ops/resilience-exercises')
  @Roles('SRE', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Listar ejercicios de resiliencia del tenant' })
  @ApiOkResponse({ type: ResilienceExercisePageDto })
  listResilienceExercises(
    @Query() query: ListResilienceExercisesQueryDto,
  ): Promise<ResilienceExercisePageDto> {
    return this.collections.listResilienceExercises(query);
  }
}
