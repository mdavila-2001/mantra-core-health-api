import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  OpsReleasesRepository,
  OpsReliabilityRepository,
  OpsPracticesRepository,
} from '../repositories';
import {
  CreateChangeRequestDto,
  ChangeRequestResponseDto,
  RecordApprovalDto,
  ApprovalResponseDto,
  PublishArtifactDto,
  ArtifactResponseDto,
  CreateDeploymentDto,
  DeploymentResponseDto,
  RollbackDeploymentDto,
  RollbackResponseDto,
  type ChangeType,
  type ChangeRisk,
  type ArtifactKind,
  type DeployStrategy,
  type OpsEnvironment,
} from '../dto';

const CHANGE_TYPE_CONCEPT: Readonly<Record<ChangeType, string>> = {
  STANDARD: CONCEPTS.CHANGE_TYPE_STANDARD,
  NORMAL: CONCEPTS.CHANGE_TYPE_NORMAL,
  EMERGENCY: CONCEPTS.CHANGE_TYPE_EMERGENCY,
};

const CHANGE_RISK_CONCEPT: Readonly<Record<ChangeRisk, string>> = {
  LOW: CONCEPTS.CHANGE_RISK_LOW,
  MEDIUM: CONCEPTS.CHANGE_RISK_MEDIUM,
  HIGH: CONCEPTS.CHANGE_RISK_HIGH,
  CRITICAL: CONCEPTS.CHANGE_RISK_CRITICAL,
};

const ARTIFACT_KIND_CONCEPT: Readonly<Record<ArtifactKind, string>> = {
  CONTAINER_IMAGE: CONCEPTS.OPS_ARTIFACT_CONTAINER_IMAGE,
  PACKAGE: CONCEPTS.OPS_ARTIFACT_PACKAGE,
  BINARY: CONCEPTS.OPS_ARTIFACT_BINARY,
  HELM_CHART: CONCEPTS.OPS_ARTIFACT_HELM_CHART,
  CONFIG_BUNDLE: CONCEPTS.OPS_ARTIFACT_CONFIG_BUNDLE,
};

export const OPS_ENVIRONMENT_CONCEPT: Readonly<Record<OpsEnvironment, string>> =
  {
    DEVELOPMENT: CONCEPTS.OPS_ENV_DEVELOPMENT,
    STAGING: CONCEPTS.OPS_ENV_STAGING,
    PRODUCTION: CONCEPTS.OPS_ENV_PRODUCTION,
  };

const DEPLOY_STRATEGY_CONCEPT: Readonly<Record<DeployStrategy, string>> = {
  ROLLING: CONCEPTS.DEPLOY_STRATEGY_ROLLING,
  BLUE_GREEN: CONCEPTS.DEPLOY_STRATEGY_BLUE_GREEN,
  CANARY: CONCEPTS.DEPLOY_STRATEGY_CANARY,
  RECREATE: CONCEPTS.DEPLOY_STRATEGY_RECREATE,
};

/** Estados desde los que una solicitud de cambio todavía admite decisiones. */
const DECIDABLE_CHANGE_STATES: readonly string[] = [
  CONCEPTS.CHANGE_REQUESTED,
  CONCEPTS.CHANGE_IN_REVIEW,
];

/**
 * Releases: solicitudes de cambio, aprobaciones del CAB, artefactos inmutables,
 * despliegues y reversiones (UC-46-01 … 05).
 */
@Injectable()
export class OpsReleasesService {
  constructor(
    private readonly em: EntityManager,
    private readonly releasesRepo: OpsReleasesRepository,
    private readonly reliabilityRepo: OpsReliabilityRepository,
    private readonly practicesRepo: OpsPracticesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OpsReleasesService.name);
  }

  /** UC-46-01: registrar la solicitud de cambio, opcionalmente atada a una ventana. */
  async createChangeRequest(
    dto: CreateChangeRequestDto,
    actor: AuthenticatedUser,
  ): Promise<ChangeRequestResponseDto> {
    this.logger.info(
      {
        operation: 'ops.change.create',
        serviceComponentId: dto.serviceComponentId,
      },
      'Registering change request',
    );

    const plannedStartAt = dto.plannedStartAt
      ? new Date(dto.plannedStartAt)
      : undefined;
    const plannedEndAt = dto.plannedEndAt
      ? new Date(dto.plannedEndAt)
      : undefined;
    if (plannedStartAt && plannedEndAt && plannedEndAt <= plannedStartAt) {
      throw new PreconditionFailedException(
        'La ventana planificada está invertida',
        {
          plannedStartAt: dto.plannedStartAt,
          plannedEndAt: dto.plannedEndAt,
        },
      );
    }

    return this.em.transactional(async (tx) => {
      const component = await this.releasesRepo.findComponentById(
        tx,
        dto.serviceComponentId,
      );
      if (!component) {
        throw new ResourceNotFoundException('Componente no encontrado', {
          serviceComponentId: dto.serviceComponentId,
        });
      }
      if (component.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException('El componente no está activo', {
          serviceComponentId: dto.serviceComponentId,
        });
      }

      if (dto.maintenanceWindowId) {
        const window = await this.releasesRepo.findWindowForUpdate(
          tx,
          dto.maintenanceWindowId,
        );
        if (!window) {
          throw new ResourceNotFoundException(
            'Ventana de mantenimiento no encontrada',
            {
              maintenanceWindowId: dto.maintenanceWindowId,
            },
          );
        }
        if (window.statusConceptId === CONCEPTS.MAINTENANCE_WINDOW_CLOSED) {
          throw new PreconditionFailedException(
            'La ventana de mantenimiento está cerrada',
            {
              maintenanceWindowId: dto.maintenanceWindowId,
            },
          );
        }
        // Atarse a una ventana y planificarse fuera de ella es contradictorio:
        // el cambio se ejecutaría sin la cobertura que dice tener.
        if (plannedStartAt && plannedStartAt < window.startsAt) {
          throw new PreconditionFailedException(
            'El cambio empieza antes que su ventana',
            {
              maintenanceWindowId: dto.maintenanceWindowId,
            },
          );
        }
        if (plannedEndAt && plannedEndAt > window.endsAt) {
          throw new PreconditionFailedException(
            'El cambio termina después que su ventana',
            {
              maintenanceWindowId: dto.maintenanceWindowId,
            },
          );
        }
      }

      const changeNumber = await this.nextChangeNumber(tx, dto.tenantId);
      const change = this.releasesRepo.createChangeRequest(tx, {
        tenantId: dto.tenantId,
        serviceComponentId: dto.serviceComponentId,
        changeNumber,
        title: dto.title,
        description: dto.description,
        changeTypeConceptId: CHANGE_TYPE_CONCEPT[dto.changeType],
        riskLevelConceptId: CHANGE_RISK_CONCEPT[dto.risk],
        statusConceptId: CONCEPTS.CHANGE_REQUESTED,
        requestedByUserId: actor.id,
        plannedStartAt,
        plannedEndAt,
        rollbackPlanText: dto.rollbackPlanText,
        validationPlanText: dto.validationPlanText,
        maintenanceWindowId: dto.maintenanceWindowId,
        actorUserId: actor.id,
      });

      return {
        id: change.id,
        changeNumber,
        statusConceptId: CONCEPTS.CHANGE_REQUESTED,
      };
    });
  }

  /**
   * UC-46-02: registrar la decisión del CAB. Quien pidió el cambio no lo aprueba
   * —segregación de deberes—, y los pasos se recorren en orden.
   */
  async recordApproval(
    changeRequestId: string,
    dto: RecordApprovalDto,
    actor: AuthenticatedUser,
  ): Promise<ApprovalResponseDto> {
    this.logger.info(
      {
        operation: 'ops.change.approve',
        changeRequestId,
        step: dto.approvalStep,
      },
      'Recording change approval',
    );

    return this.em.transactional(async (tx) => {
      const change = await this.releasesRepo.findChangeRequestForUpdate(
        tx,
        changeRequestId,
      );
      if (!change) {
        throw new ResourceNotFoundException(
          'Solicitud de cambio no encontrada',
          {
            changeRequestId,
          },
        );
      }
      if (!DECIDABLE_CHANGE_STATES.includes(change.statusConceptId)) {
        throw new PreconditionFailedException(
          'La solicitud ya no admite decisiones',
          {
            changeRequestId,
          },
        );
      }
      // Aprobar el propio cambio anularía el control: el CAB existe para que
      // alguien distinto de quien lo pide lo mire.
      if (change.requestedByUserId === actor.id) {
        throw new PreconditionFailedException(
          'Quien solicita el cambio no puede aprobarlo',
          { changeRequestId },
        );
      }

      const approvals = await this.releasesRepo.findApprovals(
        tx,
        changeRequestId,
      );
      const approvedSteps = approvals
        .filter(
          (approval) =>
            approval.decisionConceptId === CONCEPTS.CHANGE_DECISION_APPROVED,
        )
        .map((approval) => approval.approvalStep);

      if (
        approvals.some(
          (approval) =>
            approval.approvalStep === dto.approvalStep &&
            approval.approverUserId === actor.id,
        )
      ) {
        throw new ConflictException('Ese aprobador ya votó en este paso', {
          changeRequestId,
          approvalStep: dto.approvalStep,
        });
      }
      // Saltarse un paso dejaría aprobado un cambio que nadie miró en ese nivel.
      if (
        dto.approvalStep > 1 &&
        !approvedSteps.includes(dto.approvalStep - 1)
      ) {
        throw new PreconditionFailedException(
          'El paso anterior todavía no está aprobado',
          {
            changeRequestId,
            approvalStep: dto.approvalStep,
          },
        );
      }

      const approved = dto.decision === 'APPROVED';
      const decisionConceptId = approved
        ? CONCEPTS.CHANGE_DECISION_APPROVED
        : CONCEPTS.CHANGE_DECISION_REJECTED;

      const approval = this.releasesRepo.createApproval(tx, {
        changeRequestId,
        approvalStep: dto.approvalStep,
        approverUserId: actor.id,
        decisionConceptId,
        decisionReason: dto.decisionReason,
      });

      const totalApproved = approved
        ? approvedSteps.length + 1
        : approvedSteps.length;
      const requiredSteps = dto.requiredApprovalSteps ?? dto.approvalStep;

      if (!approved) {
        change.statusConceptId = CONCEPTS.CHANGE_REJECTED;
        this.logger.warn(
          {
            operation: 'ops.change.approve',
            changeRequestId,
            step: dto.approvalStep,
          },
          'Change request rejected',
        );
      } else {
        change.statusConceptId =
          totalApproved >= requiredSteps
            ? CONCEPTS.CHANGE_APPROVED
            : CONCEPTS.CHANGE_IN_REVIEW;
      }
      touch(change, actor.id);

      return {
        id: approval.id,
        changeRequestId,
        changeStatusConceptId: change.statusConceptId,
        approvedSteps: totalApproved,
      };
    });
  }

  /**
   * UC-46-03: publicar el artefacto. Es inmutable y direccionado por contenido:
   * republicar la misma referencia con otro contenido rompería la trazabilidad
   * de lo que hay desplegado.
   */
  async publishArtifact(
    dto: PublishArtifactDto,
    actor: AuthenticatedUser,
  ): Promise<ArtifactResponseDto> {
    this.logger.info(
      { operation: 'ops.artifact.publish', artifactRef: dto.artifactRef },
      'Publishing artifact',
    );

    return this.em.transactional(async (tx) => {
      const component = await this.releasesRepo.findComponentById(
        tx,
        dto.serviceComponentId,
      );
      if (!component) {
        throw new ResourceNotFoundException('Componente no encontrado', {
          serviceComponentId: dto.serviceComponentId,
        });
      }

      if (dto.producedByToolId) {
        const tool = await this.releasesRepo.findToolById(
          tx,
          dto.producedByToolId,
        );
        if (!tool) {
          throw new ResourceNotFoundException('Herramienta no encontrada', {
            producedByToolId: dto.producedByToolId,
          });
        }
        // Un artefacto construido con una herramienta no homologada no puede ir
        // a producción, y no marcarlo aquí lo dejaría pasar sin que nadie lo vea.
        if (!tool.isApproved) {
          throw new PreconditionFailedException(
            'La herramienta no está homologada',
            {
              producedByToolId: dto.producedByToolId,
            },
          );
        }
      }

      const duplicateRef = await this.releasesRepo.findArtifactByRef(
        tx,
        dto.artifactRef,
      );
      if (duplicateRef) {
        throw new ConflictException(
          'Ya existe un artefacto con esa referencia',
          {
            artifactRef: dto.artifactRef,
          },
        );
      }
      const duplicateVersion = await this.releasesRepo.findArtifactByVersion(
        tx,
        dto.serviceComponentId,
        dto.version,
      );
      if (duplicateVersion) {
        throw new ConflictException('El componente ya publicó esa versión', {
          serviceComponentId: dto.serviceComponentId,
          version: dto.version,
        });
      }

      const artifact = this.releasesRepo.createArtifact(tx, {
        tenantId: dto.tenantId,
        serviceComponentId: dto.serviceComponentId,
        producedByToolId: dto.producedByToolId,
        artifactRef: dto.artifactRef,
        artifactTypeConceptId: ARTIFACT_KIND_CONCEPT[dto.artifactKind],
        name: dto.name,
        version: dto.version,
        semver: dto.semver,
        gitRef: dto.gitRef,
        commitSha: dto.commitSha,
        contentHash: dto.contentHash.toLowerCase(),
        storageUri: dto.storageUri,
        fileId: dto.fileId,
        sizeBytes: dto.sizeBytes,
        builtAt: dto.builtAt ? new Date(dto.builtAt) : new Date(),
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });

      return {
        id: artifact.id,
        artifactRef: dto.artifactRef,
        contentHash: dto.contentHash.toLowerCase(),
        isImmutable: true,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      };
    });
  }

  /**
   * UC-46-04: desplegar. Tres puertas antes de tocar nada: cambio aprobado,
   * revisión de preparación con decisión "go" en producción, y ausencia de
   * congelamiento por error budget.
   */
  async createDeployment(
    dto: CreateDeploymentDto,
    actor: AuthenticatedUser,
  ): Promise<DeploymentResponseDto> {
    this.logger.info(
      {
        operation: 'ops.deployment.create',
        changeRequestId: dto.changeRequestId,
      },
      'Starting deployment',
    );

    return this.em.transactional(async (tx) => {
      const change = await this.releasesRepo.findChangeRequestForUpdate(
        tx,
        dto.changeRequestId,
      );
      if (!change) {
        throw new ResourceNotFoundException(
          'Solicitud de cambio no encontrada',
          {
            changeRequestId: dto.changeRequestId,
          },
        );
      }
      if (change.statusConceptId !== CONCEPTS.CHANGE_APPROVED) {
        throw new PreconditionFailedException('El cambio no está aprobado', {
          changeRequestId: dto.changeRequestId,
        });
      }

      const artifact = await this.releasesRepo.findArtifactById(
        tx,
        dto.artifactId,
      );
      if (!artifact) {
        throw new ResourceNotFoundException('Artefacto no encontrado', {
          artifactId: dto.artifactId,
        });
      }
      if (artifact.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException('El artefacto no está activo', {
          artifactId: dto.artifactId,
        });
      }
      // Desplegar el artefacto de otro componente pondría en marcha algo que
      // nadie revisó para este servicio.
      if (artifact.serviceComponentId !== change.serviceComponentId) {
        throw new PreconditionFailedException(
          'El artefacto pertenece a otro componente',
          {
            artifactId: dto.artifactId,
            serviceComponentId: change.serviceComponentId,
          },
        );
      }

      const environmentConceptId = OPS_ENVIRONMENT_CONCEPT[dto.environment];
      if (dto.environment === 'PRODUCTION') {
        const review = await this.practicesRepo.findGoReview(
          tx,
          change.serviceComponentId,
          CONCEPTS.ORR_COMPLETED,
          CONCEPTS.ORR_DECISION_GO,
        );
        if (!review) {
          throw new PreconditionFailedException(
            'Producción exige una revisión de preparación con decisión "go"',
            { serviceComponentId: change.serviceComponentId },
          );
        }
      }

      if (await this.deploymentsFrozen(tx)) {
        throw new PreconditionFailedException(
          'Los despliegues están congelados por agotamiento del error budget',
          { changeRequestId: dto.changeRequestId },
        );
      }

      const current = await this.releasesRepo.findCurrentDeploymentForUpdate(
        tx,
        change.serviceComponentId,
        environmentConceptId,
      );

      const succeeded = dto.outcome === 'SUCCEEDED';
      const failed = dto.outcome === 'FAILED';
      const now = new Date();
      const deploymentNumber = await this.nextDeploymentNumber(tx);

      const deployment = this.releasesRepo.createDeployment(tx, {
        tenantId: change.tenantId,
        serviceComponentId: change.serviceComponentId,
        artifactId: dto.artifactId,
        environmentConceptId,
        deploymentNumber,
        strategyConceptId: DEPLOY_STRATEGY_CONCEPT[dto.strategy],
        statusConceptId: succeeded
          ? CONCEPTS.DEPLOY_SUCCEEDED
          : failed
            ? CONCEPTS.DEPLOY_FAILED
            : CONCEPTS.DEPLOY_IN_PROGRESS,
        deployedByUserId: actor.id,
        gitRef: dto.gitRef ?? artifact.gitRef,
        startedAt: now,
        finishedAt: dto.outcome ? now : undefined,
        // El testigo de "vigente" sólo cambia de manos cuando el despliegue sale
        // bien: uno fallido no representa lo que está corriendo.
        isCurrent: succeeded,
        actorUserId: actor.id,
      });

      let supersededDeploymentId: string | undefined;
      if (succeeded && current) {
        current.isCurrent = false;
        touch(current, actor.id);
        supersededDeploymentId = current.id;
      }

      if (succeeded) {
        change.deploymentId = deployment.id;
        change.implementedAt = now;
        change.statusConceptId = CONCEPTS.CHANGE_IMPLEMENTED;
        touch(change, actor.id);
      }
      if (failed) {
        this.logger.warn(
          {
            operation: 'ops.deployment.create',
            deploymentNumber,
            changeRequestId: change.id,
          },
          'Deployment failed',
        );
      }

      return {
        id: deployment.id,
        deploymentNumber,
        statusConceptId: deployment.statusConceptId,
        isCurrent: succeeded,
        supersededDeploymentId,
      };
    });
  }

  /**
   * UC-46-05: revertir. Se crea un despliegue nuevo apuntando al artefacto
   * estable anterior; el fallido queda marcado como revertido. Reescribirlo
   * borraría la evidencia de que hubo que volver atrás.
   */
  async rollbackDeployment(
    deploymentId: string,
    dto: RollbackDeploymentDto,
    actor: AuthenticatedUser,
  ): Promise<RollbackResponseDto> {
    this.logger.info(
      { operation: 'ops.deployment.rollback', deploymentId },
      'Rolling back deployment',
    );

    return this.em.transactional(async (tx) => {
      const source = await this.releasesRepo.findDeploymentForUpdate(
        tx,
        deploymentId,
      );
      if (!source) {
        throw new ResourceNotFoundException('Despliegue no encontrado', {
          deploymentId,
        });
      }
      if (
        source.statusConceptId !== CONCEPTS.DEPLOY_SUCCEEDED &&
        source.statusConceptId !== CONCEPTS.DEPLOY_FAILED
      ) {
        throw new PreconditionFailedException(
          'El despliegue no está en un estado reversible',
          {
            deploymentId,
          },
        );
      }
      if (!source.isCurrent) {
        throw new PreconditionFailedException(
          'El despliegue ya no es el vigente',
          {
            deploymentId,
          },
        );
      }

      const target = dto.targetDeploymentId
        ? await this.releasesRepo.findDeploymentById(tx, dto.targetDeploymentId)
        : await this.releasesRepo.findPreviousSucceededDeployment(
            tx,
            source.serviceComponentId,
            source.environmentConceptId,
            CONCEPTS.DEPLOY_SUCCEEDED,
            source.id,
          );
      if (!target) {
        throw new PreconditionFailedException(
          'No hay un despliegue estable anterior al que volver',
          { deploymentId },
        );
      }
      if (
        target.serviceComponentId !== source.serviceComponentId ||
        target.environmentConceptId !== source.environmentConceptId
      ) {
        throw new PreconditionFailedException(
          'El destino de la reversión es de otro componente o entorno',
          { deploymentId, targetDeploymentId: target.id },
        );
      }

      const now = new Date();
      const deploymentNumber = await this.nextDeploymentNumber(tx);
      const rollback = this.releasesRepo.createDeployment(tx, {
        tenantId: source.tenantId,
        serviceComponentId: source.serviceComponentId,
        artifactId: target.artifactId,
        environmentConceptId: source.environmentConceptId,
        deploymentNumber,
        // Volver atrás recrea el estado anterior: no es un despliegue progresivo.
        strategyConceptId: CONCEPTS.DEPLOY_STRATEGY_RECREATE,
        statusConceptId: CONCEPTS.DEPLOY_SUCCEEDED,
        deployedByUserId: actor.id,
        gitRef: target.gitRef,
        startedAt: now,
        finishedAt: now,
        isCurrent: true,
        rollbackOfDeploymentId: source.id,
        actorUserId: actor.id,
      });

      source.statusConceptId = CONCEPTS.DEPLOY_ROLLED_BACK;
      source.isCurrent = false;
      touch(source, actor.id);

      this.logger.warn(
        {
          operation: 'ops.deployment.rollback',
          deploymentId,
          rollbackDeploymentId: rollback.id,
          reason: dto.reason,
        },
        'Deployment rolled back',
      );

      return {
        id: rollback.id,
        deploymentNumber,
        rolledBackDeploymentId: source.id,
        artifactId: target.artifactId,
      };
    });
  }

  // --- Apoyo ---

  /**
   * Hay congelamiento si alguna política activa que congela al agotarse tiene
   * su último evento de quema con el presupuesto en cero o negativo. El
   * congelamiento no es una fila propia: es la lectura del último evento, y así
   * no puede quedarse desincronizado con lo que realmente pasó.
   */
  private async deploymentsFrozen(tx: EntityManager): Promise<boolean> {
    const policies = await this.reliabilityRepo.findFreezingPolicies(
      tx,
      CONCEPTS.STATE_ACTIVE,
    );
    for (const policy of policies) {
      const latest = await this.reliabilityRepo.findLatestBurnEvent(
        tx,
        policy.id,
      );
      if (latest && Number(latest.remainingBudgetPercent) <= 0) {
        return true;
      }
    }
    return false;
  }

  private async nextChangeNumber(
    tx: EntityManager,
    tenantId?: string,
  ): Promise<string> {
    const count = await this.releasesRepo.countChangeRequests(tx, tenantId);
    for (let offset = 1; offset <= 50; offset += 1) {
      const candidate = `CHG-${String(count + offset).padStart(6, '0')}`;
      const taken = await this.releasesRepo.findChangeRequestByNumber(
        tx,
        tenantId,
        candidate,
      );
      if (!taken) return candidate;
    }
    throw new ConflictException(
      'No se pudo asignar un número de cambio libre',
      { tenantId },
    );
  }

  private async nextDeploymentNumber(tx: EntityManager): Promise<string> {
    const count = await this.releasesRepo.countDeployments(tx);
    for (let offset = 1; offset <= 50; offset += 1) {
      const candidate = `DEP-${String(count + offset).padStart(6, '0')}`;
      const taken = await this.releasesRepo.findDeploymentByNumber(
        tx,
        candidate,
      );
      if (!taken) return candidate;
    }
    throw new ConflictException(
      'No se pudo asignar un número de despliegue libre',
      {},
    );
  }
}
