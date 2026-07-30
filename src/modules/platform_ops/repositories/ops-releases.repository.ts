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

/**
 * Describe el contrato estructural de create change request data.
 */
export interface CreateChangeRequestData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Identificador asociado a service component.
   */
  serviceComponentId: string;
  /**
   * Valor de change number mantenido por la instancia.
   */
  changeNumber: string;
  /**
   * Valor de title mantenido por la instancia.
   */
  title: string;
  /**
   * Valor de description mantenido por la instancia.
   */
  description?: string;
  /**
   * Identificador asociado a change type concept.
   */
  changeTypeConceptId: string;
  /**
   * Identificador asociado a risk level concept.
   */
  riskLevelConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a requested by user.
   */
  requestedByUserId: string;
  /**
   * Valor de planned start at mantenido por la instancia.
   */
  plannedStartAt?: Date;
  /**
   * Valor de planned end at mantenido por la instancia.
   */
  plannedEndAt?: Date;
  /**
   * Valor de rollback plan text mantenido por la instancia.
   */
  rollbackPlanText?: string;
  /**
   * Valor de validation plan text mantenido por la instancia.
   */
  validationPlanText?: string;
  /**
   * Identificador asociado a maintenance window.
   */
  maintenanceWindowId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create artifact data.
 */
export interface CreateArtifactData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Identificador asociado a service component.
   */
  serviceComponentId: string;
  /**
   * Identificador asociado a produced by tool.
   */
  producedByToolId?: string;
  /**
   * Valor de artifact ref mantenido por la instancia.
   */
  artifactRef: string;
  /**
   * Identificador asociado a artifact type concept.
   */
  artifactTypeConceptId: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Valor de version mantenido por la instancia.
   */
  version: string;
  /**
   * Valor de semver mantenido por la instancia.
   */
  semver?: string;
  /**
   * Valor de git ref mantenido por la instancia.
   */
  gitRef?: string;
  /**
   * Valor de commit sha mantenido por la instancia.
   */
  commitSha?: string;
  /**
   * Valor de content hash mantenido por la instancia.
   */
  contentHash: string;
  /**
   * Valor de storage uri mantenido por la instancia.
   */
  storageUri?: string;
  /**
   * Identificador asociado a file.
   */
  fileId?: string;
  /**
   * Valor de size bytes mantenido por la instancia.
   */
  sizeBytes?: number;
  /**
   * Valor de built at mantenido por la instancia.
   */
  builtAt?: Date;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create deployment data.
 */
export interface CreateDeploymentData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Identificador asociado a service component.
   */
  serviceComponentId: string;
  /**
   * Identificador asociado a artifact.
   */
  artifactId: string;
  /**
   * Identificador asociado a environment concept.
   */
  environmentConceptId: string;
  /**
   * Valor de deployment number mantenido por la instancia.
   */
  deploymentNumber: string;
  /**
   * Identificador asociado a strategy concept.
   */
  strategyConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a deployed by user.
   */
  deployedByUserId: string;
  /**
   * Valor de git ref mantenido por la instancia.
   */
  gitRef?: string;
  /**
   * Valor de started at mantenido por la instancia.
   */
  startedAt: Date;
  /**
   * Valor de finished at mantenido por la instancia.
   */
  finishedAt?: Date;
  /**
   * Valor de is current mantenido por la instancia.
   */
  isCurrent: boolean;
  /**
   * Identificador asociado a rollback of deployment.
   */
  rollbackOfDeploymentId?: string;
  /**
   * Identificador asociado a actor user.
   */
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

  /**
   * Obtiene find component by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find component by id conforme al contrato `Promise<ServiceComponents | null>`.
   */
  findComponentById(
    em: EntityManager,
    id: string,
  ): Promise<ServiceComponents | null> {
    return em.findOne(ServiceComponents, { id });
  }

  /**
   * Obtiene find tool by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find tool by id conforme al contrato `Promise<ToolRegistry | null>`.
   */
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

  /**
   * Crea create change request.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create change request conforme al contrato `ChangeRequests`.
   */
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

  /**
   * Obtiene find change request by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find change request by id conforme al contrato `Promise<ChangeRequests | null>`.
   */
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

  /**
   * Obtiene find change request by number.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Identificador de tenant.
   * @param changeNumber - Valor de change number requerido por la operación.
   * @returns Resultado de find change request by number conforme al contrato `Promise<ChangeRequests | null>`.
   */
  findChangeRequestByNumber(
    em: EntityManager,
    tenantId: string | undefined,
    changeNumber: string,
  ): Promise<ChangeRequests | null> {
    return em.findOne(ChangeRequests, { tenantId, changeNumber });
  }

  /**
   * Ejecuta la operación count change requests.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Identificador de tenant.
   * @returns Resultado de count change requests conforme al contrato `Promise<number>`.
   */
  countChangeRequests(em: EntityManager, tenantId?: string): Promise<number> {
    return em.count(ChangeRequests, { tenantId });
  }

  /** Log inmutable de decisiones del CAB: se inserta, nunca se corrige. */
  createApproval(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a change request.
       */
      changeRequestId: string;
      /**
       * Valor de approval step mantenido por la instancia.
       */
      approvalStep: number;
      /**
       * Identificador asociado a approver user.
       */
      approverUserId: string;
      /**
       * Identificador asociado a decision concept.
       */
      decisionConceptId: string;
      /**
       * Valor de decision reason mantenido por la instancia.
       */
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

  /**
   * Obtiene find approvals.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param changeRequestId - Identificador de change request.
   * @returns Resultado de find approvals conforme al contrato `Promise<ChangeApprovals[]>`.
   */
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

  /**
   * Crea create artifact.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create artifact conforme al contrato `Artifacts`.
   */
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

  /**
   * Obtiene find artifact by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find artifact by id conforme al contrato `Promise<Artifacts | null>`.
   */
  findArtifactById(em: EntityManager, id: string): Promise<Artifacts | null> {
    return em.findOne(Artifacts, { id });
  }

  /**
   * Obtiene find artifact by ref.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param artifactRef - Valor de artifact ref requerido por la operación.
   * @returns Resultado de find artifact by ref conforme al contrato `Promise<Artifacts | null>`.
   */
  findArtifactByRef(
    em: EntityManager,
    artifactRef: string,
  ): Promise<Artifacts | null> {
    return em.findOne(Artifacts, { artifactRef });
  }

  /**
   * Obtiene find artifact by version.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param serviceComponentId - Identificador de service component.
   * @param version - Valor de version requerido por la operación.
   * @returns Resultado de find artifact by version conforme al contrato `Promise<Artifacts | null>`.
   */
  findArtifactByVersion(
    em: EntityManager,
    serviceComponentId: string,
    version: string,
  ): Promise<Artifacts | null> {
    return em.findOne(Artifacts, { serviceComponentId, version });
  }

  // --- Despliegues (UC-46-04, 05) ---

  /**
   * Crea create deployment.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create deployment conforme al contrato `Deployments`.
   */
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

  /**
   * Obtiene find deployment by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find deployment by id conforme al contrato `Promise<Deployments | null>`.
   */
  findDeploymentById(
    em: EntityManager,
    id: string,
  ): Promise<Deployments | null> {
    return em.findOne(Deployments, { id });
  }

  /**
   * Obtiene find deployment for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find deployment for update conforme al contrato `Promise<Deployments | null>`.
   */
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

  /**
   * Obtiene find deployment by number.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param deploymentNumber - Valor de deployment number requerido por la operación.
   * @returns Resultado de find deployment by number conforme al contrato `Promise<Deployments | null>`.
   */
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
