import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ServiceComponents,
  ToolRegistry,
  MaintenanceWindows,
  ChangeRequests,
  ChangeApprovals,
  Artifacts,
  Deployments,
} from '../entities';
import { createdBy } from '../../../common';

export interface CreateChangeRequestData {
  tenantId?: string;
  serviceComponentId: string;
  changeNumber: string;
  title: string;
  description?: string;
  changeTypeConceptId: string;
  riskLevelConceptId: string;
  statusConceptId: string;
  requestedByUserId: string;
  plannedStartAt?: Date;
  plannedEndAt?: Date;
  rollbackPlanText?: string;
  validationPlanText?: string;
  maintenanceWindowId?: string;
  actorUserId?: string;
}

export interface CreateArtifactData {
  tenantId?: string;
  serviceComponentId: string;
  producedByToolId?: string;
  artifactRef: string;
  artifactTypeConceptId: string;
  name: string;
  version: string;
  semver?: string;
  gitRef?: string;
  commitSha?: string;
  contentHash: string;
  storageUri?: string;
  fileId?: string;
  sizeBytes?: number;
  builtAt?: Date;
  stateConceptId: string;
  actorUserId?: string;
}

export interface CreateDeploymentData {
  tenantId?: string;
  serviceComponentId: string;
  artifactId: string;
  environmentConceptId: string;
  deploymentNumber: string;
  strategyConceptId: string;
  statusConceptId: string;
  deployedByUserId: string;
  gitRef?: string;
  startedAt: Date;
  finishedAt?: Date;
  isCurrent: boolean;
  rollbackOfDeploymentId?: string;
  actorUserId?: string;
}

/**
 * Acceso a la parte de releases de `platform_ops.*`: componentes, herramientas,
 * ventanas de mantenimiento, solicitudes de cambio, aprobaciones, artefactos y
 * despliegues.
 */
@Injectable()
export class OpsReleasesRepository {
  // --- Catálogo (precondiciones) ---

  findComponentById(
    em: EntityManager,
    id: string,
  ): Promise<ServiceComponents | null> {
    return em.findOne(ServiceComponents, { id });
  }

  findToolById(em: EntityManager, id: string): Promise<ToolRegistry | null> {
    return em.findOne(ToolRegistry, { id });
  }

  /**
   * Ventana de mantenimiento bloqueada: atarle un cambio obliga a comprobar el
   * solape contra los que ya la ocupan.
   */
  findWindowForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<MaintenanceWindows | null> {
    return em.findOne(
      MaintenanceWindows,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Cambios ya atados a la ventana, para detectar solape de horario. */
  findChangesInWindow(
    em: EntityManager,
    maintenanceWindowId: string,
  ): Promise<ChangeRequests[]> {
    return em.find(ChangeRequests, { maintenanceWindowId });
  }

  // --- Solicitud de cambio (UC-46-01, 02) ---

  createChangeRequest(
    em: EntityManager,
    data: CreateChangeRequestData,
  ): ChangeRequests {
    return em.create(
      ChangeRequests,
      {
        tenantId: data.tenantId,
        serviceComponentId: data.serviceComponentId,
        changeNumber: data.changeNumber,
        title: data.title,
        description: data.description,
        changeTypeConceptId: data.changeTypeConceptId,
        riskLevelConceptId: data.riskLevelConceptId,
        statusConceptId: data.statusConceptId,
        requestedByUserId: data.requestedByUserId,
        plannedStartAt: data.plannedStartAt,
        plannedEndAt: data.plannedEndAt,
        rollbackPlanText: data.rollbackPlanText,
        validationPlanText: data.validationPlanText,
        maintenanceWindowId: data.maintenanceWindowId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findChangeRequestById(
    em: EntityManager,
    id: string,
  ): Promise<ChangeRequests | null> {
    return em.findOne(ChangeRequests, { id });
  }

  /** El cambio se bloquea para que la transición de estado sea atómica. */
  findChangeRequestForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<ChangeRequests | null> {
    return em.findOne(
      ChangeRequests,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  findChangeRequestByNumber(
    em: EntityManager,
    tenantId: string | undefined,
    changeNumber: string,
  ): Promise<ChangeRequests | null> {
    return em.findOne(ChangeRequests, { tenantId, changeNumber });
  }

  countChangeRequests(em: EntityManager, tenantId?: string): Promise<number> {
    return em.count(ChangeRequests, { tenantId });
  }

  /** Log inmutable de decisiones del CAB: se inserta, nunca se corrige. */
  createApproval(
    em: EntityManager,
    data: {
      changeRequestId: string;
      approvalStep: number;
      approverUserId: string;
      decisionConceptId: string;
      decisionReason?: string;
    },
  ): ChangeApprovals {
    return em.create(
      ChangeApprovals,
      {
        changeRequestId: data.changeRequestId,
        approvalStep: data.approvalStep,
        approverUserId: data.approverUserId,
        decisionConceptId: data.decisionConceptId,
        decisionReason: data.decisionReason,
        decidedAt: new Date(),
      },
      { partial: true },
    );
  }

  findApprovals(
    em: EntityManager,
    changeRequestId: string,
  ): Promise<ChangeApprovals[]> {
    return em.find(
      ChangeApprovals,
      { changeRequestId },
      { orderBy: { approvalStep: 'ASC' } },
    );
  }

  // --- Artefactos (UC-46-03) ---

  createArtifact(em: EntityManager, data: CreateArtifactData): Artifacts {
    return em.create(
      Artifacts,
      {
        tenantId: data.tenantId,
        serviceComponentId: data.serviceComponentId,
        producedByToolId: data.producedByToolId,
        artifactRef: data.artifactRef,
        artifactTypeConceptId: data.artifactTypeConceptId,
        name: data.name,
        version: data.version,
        semver: data.semver,
        gitRef: data.gitRef,
        commitSha: data.commitSha,
        contentHash: data.contentHash,
        storageUri: data.storageUri,
        fileId: data.fileId,
        sizeBytes: data.sizeBytes,
        // El artefacto publicado es inmutable: su hash direcciona el contenido.
        isImmutable: true,
        builtAt: data.builtAt,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findArtifactById(em: EntityManager, id: string): Promise<Artifacts | null> {
    return em.findOne(Artifacts, { id });
  }

  findArtifactByRef(
    em: EntityManager,
    artifactRef: string,
  ): Promise<Artifacts | null> {
    return em.findOne(Artifacts, { artifactRef });
  }

  findArtifactByVersion(
    em: EntityManager,
    serviceComponentId: string,
    version: string,
  ): Promise<Artifacts | null> {
    return em.findOne(Artifacts, { serviceComponentId, version });
  }

  // --- Despliegues (UC-46-04, 05) ---

  createDeployment(em: EntityManager, data: CreateDeploymentData): Deployments {
    return em.create(
      Deployments,
      {
        tenantId: data.tenantId,
        serviceComponentId: data.serviceComponentId,
        artifactId: data.artifactId,
        environmentConceptId: data.environmentConceptId,
        deploymentNumber: data.deploymentNumber,
        strategyConceptId: data.strategyConceptId,
        statusConceptId: data.statusConceptId,
        deployedByUserId: data.deployedByUserId,
        gitRef: data.gitRef,
        startedAt: data.startedAt,
        finishedAt: data.finishedAt,
        isCurrent: data.isCurrent,
        rollbackOfDeploymentId: data.rollbackOfDeploymentId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findDeploymentById(
    em: EntityManager,
    id: string,
  ): Promise<Deployments | null> {
    return em.findOne(Deployments, { id });
  }

  findDeploymentForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<Deployments | null> {
    return em.findOne(
      Deployments,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Despliegue vigente del par componente+entorno, bloqueado. Sólo puede haber
   * uno, así que ceder el testigo y tomarlo deben verse en la misma transacción.
   */
  findCurrentDeploymentForUpdate(
    em: EntityManager,
    serviceComponentId: string,
    environmentConceptId: string,
  ): Promise<Deployments | null> {
    return em.findOne(
      Deployments,
      { serviceComponentId, environmentConceptId, isCurrent: true },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  findDeploymentByNumber(
    em: EntityManager,
    deploymentNumber: string,
  ): Promise<Deployments | null> {
    return em.findOne(Deployments, { deploymentNumber });
  }

  /** El número de despliegue es único en todo el módulo, no por componente. */
  countDeployments(em: EntityManager): Promise<number> {
    return em.count(Deployments, {});
  }

  /** Último despliegue correcto anterior al dado: el artefacto al que volver. */
  findPreviousSucceededDeployment(
    em: EntityManager,
    serviceComponentId: string,
    environmentConceptId: string,
    succeededStateConceptId: string,
    beforeId: string,
  ): Promise<Deployments | null> {
    return em.findOne(
      Deployments,
      {
        serviceComponentId,
        environmentConceptId,
        statusConceptId: succeededStateConceptId,
        id: { $ne: beforeId },
      },
      { orderBy: { startedAt: 'DESC' } },
    );
  }
}
