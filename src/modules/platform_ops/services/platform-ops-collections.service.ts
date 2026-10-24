import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PageResponseDto,
  definedFilters,
  listTenantCollection,
} from '../../../common';
import {
  Artifacts,
  ChangeRequests,
  Deployments,
  HealthIncidents,
  ResilienceExercises,
} from '../entities';
import type {
  ArtifactItemDto,
  ChangeRequestItemDto,
  DeploymentItemDto,
  HealthIncidentItemDto,
  ListArtifactsQueryDto,
  ListChangeRequestsQueryDto,
  ListDeploymentsQueryDto,
  ListIncidentsQueryDto,
  ListResilienceExercisesQueryDto,
  ResilienceExerciseItemDto,
} from '../dto';

/**
 * Lecturas de colección de `platform_ops`.
 *
 * Cada listado se arma con `listTenantCollection`: el tenant sale del
 * contexto del request, los filtros del cliente se componen con él y la
 * salida pasa por un mapeo explícito. El rol lo exige el controlador.
 */
@Injectable()
export class PlatformOpsCollectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Listar despliegues del tenant (V46-01).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listDeployments(
    query: ListDeploymentsQueryDto,
  ): Promise<PageResponseDto<DeploymentItemDto>> {
    return listTenantCollection(this.em.fork(), Deployments, {
      query,
      sortable: ['createdAt', 'startedAt', 'updatedAt'],
      where: definedFilters({ statusConceptId: query.statusConceptId }),
      map: (row): DeploymentItemDto => ({
        id: row.id,
        tenantId: row.tenantId ?? null,
        serviceComponentId: row.serviceComponentId,
        artifactId: row.artifactId,
        environmentConceptId: row.environmentConceptId,
        deploymentNumber: row.deploymentNumber,
        strategyConceptId: row.strategyConceptId ?? null,
        statusConceptId: row.statusConceptId,
        deployedByUserId: row.deployedByUserId ?? null,
        gitRef: row.gitRef ?? null,
        startedAt: row.startedAt ?? null,
        finishedAt: row.finishedAt ?? null,
        isCurrent: row.isCurrent ?? null,
        rollbackOfDeploymentId: row.rollbackOfDeploymentId ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar artefactos del tenant (V46-02).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listArtifacts(
    query: ListArtifactsQueryDto,
  ): Promise<PageResponseDto<ArtifactItemDto>> {
    return listTenantCollection(this.em.fork(), Artifacts, {
      query,
      sortable: ['createdAt', 'updatedAt', 'name'],
      where: definedFilters({ stateConceptId: query.stateConceptId }),
      map: (row): ArtifactItemDto => ({
        id: row.id,
        tenantId: row.tenantId ?? null,
        serviceComponentId: row.serviceComponentId ?? null,
        producedByToolId: row.producedByToolId ?? null,
        artifactRef: row.artifactRef,
        artifactTypeConceptId: row.artifactTypeConceptId,
        name: row.name,
        version: row.version ?? null,
        semver: row.semver ?? null,
        gitRef: row.gitRef ?? null,
        commitSha: row.commitSha ?? null,
        storageUri: row.storageUri ?? null,
        fileId: row.fileId ?? null,
        sizeBytes: row.sizeBytes ?? null,
        isImmutable: row.isImmutable ?? null,
        builtAt: row.builtAt ?? null,
        stateConceptId: row.stateConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar solicitudes de cambio del tenant (V46-04).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listChangeRequests(
    query: ListChangeRequestsQueryDto,
  ): Promise<PageResponseDto<ChangeRequestItemDto>> {
    return listTenantCollection(this.em.fork(), ChangeRequests, {
      query,
      sortable: ['createdAt', 'updatedAt'],
      where: definedFilters({ statusConceptId: query.statusConceptId }),
      map: (row): ChangeRequestItemDto => ({
        id: row.id,
        tenantId: row.tenantId ?? null,
        serviceComponentId: row.serviceComponentId,
        deploymentId: row.deploymentId ?? null,
        changeNumber: row.changeNumber,
        title: row.title,
        description: row.description ?? null,
        changeTypeConceptId: row.changeTypeConceptId,
        riskLevelConceptId: row.riskLevelConceptId,
        statusConceptId: row.statusConceptId,
        requestedByUserId: row.requestedByUserId ?? null,
        plannedStartAt: row.plannedStartAt ?? null,
        plannedEndAt: row.plannedEndAt ?? null,
        rollbackPlanText: row.rollbackPlanText ?? null,
        validationPlanText: row.validationPlanText ?? null,
        maintenanceWindowId: row.maintenanceWindowId ?? null,
        implementedAt: row.implementedAt ?? null,
        closedAt: row.closedAt ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar incidentes de salud del tenant (V46-08).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listIncidents(
    query: ListIncidentsQueryDto,
  ): Promise<PageResponseDto<HealthIncidentItemDto>> {
    return listTenantCollection(this.em.fork(), HealthIncidents, {
      query,
      sortable: ['createdAt', 'updatedAt'],
      where: definedFilters({ statusConceptId: query.statusConceptId }),
      map: (row): HealthIncidentItemDto => ({
        id: row.id,
        tenantId: row.tenantId ?? null,
        serviceComponentId: row.serviceComponentId,
        healthCheckId: row.healthCheckId ?? null,
        incidentNumber: row.incidentNumber,
        severityConceptId: row.severityConceptId,
        statusConceptId: row.statusConceptId,
        title: row.title,
        detectedByRunId: row.detectedByRunId ?? null,
        openedAt: row.openedAt ?? null,
        acknowledgedAt: row.acknowledgedAt ?? null,
        resolvedAt: row.resolvedAt ?? null,
        rootCauseText: row.rootCauseText ?? null,
        resolutionText: row.resolutionText ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar ejercicios de resiliencia del tenant (V46-11).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listResilienceExercises(
    query: ListResilienceExercisesQueryDto,
  ): Promise<PageResponseDto<ResilienceExerciseItemDto>> {
    return listTenantCollection(this.em.fork(), ResilienceExercises, {
      query,
      sortable: ['createdAt', 'startedAt', 'updatedAt'],
      map: (row): ResilienceExerciseItemDto => ({
        id: row.id,
        tenantId: row.tenantId ?? null,
        serviceComponentId: row.serviceComponentId,
        exerciseTypeConceptId: row.exerciseTypeConceptId,
        scenarioName: row.scenarioName,
        hypothesisText: row.hypothesisText ?? null,
        plannedAt: row.plannedAt ?? null,
        startedAt: row.startedAt ?? null,
        endedAt: row.endedAt ?? null,
        resultConceptId: row.resultConceptId,
        observedRtoSeconds: row.observedRtoSeconds ?? null,
        observedRpoSeconds: row.observedRpoSeconds ?? null,
        evidenceUri: row.evidenceUri ?? null,
        findingsJson: row.findingsJson ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }
}
