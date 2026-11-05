import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { createHash } from 'node:crypto';
import {
  ResourceNotFoundException,
  ConflictException,
  PreconditionFailedException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { DiagnosticOrdersRepository, ReportsRepository } from '../repositories';
import { DIAG } from '../diagnostics.concepts';
import { DiagnosticsScopeService } from './diagnostics-scope.service';
import {
  CreateReportVersionDto,
  ReleaseReportVersionDto,
  DetectCriticalResultDto,
  AcknowledgeCriticalResultDto,
  ResourceCreatedDto,
} from '../dto';

/**
 * Casos de uso del informe diagnóstico: crear/enmendar versión (UC-20-07),
 * validar y liberar (UC-20-08), detectar y notificar resultado crítico (UC-20-09)
 * y acusar recibo / escalar la notificación crítica (UC-20-10).
 *
 * Las versiones son inmutables: una corrección crea una versión nueva que apunta
 * a la anterior (`supersedesVersionId`), nunca sobrescribe.
 */
@Injectable()
export class DiagnosticsReportsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param repo - Valor de repo requerido por la operación.
   * @param ordersRepo - Acceso al informe en `clinical`, para marcarlo liberado.
   * @param scope - Resolvedor de recursos acotados al tenant activo.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: ReportsRepository,
    private readonly ordersRepo: DiagnosticOrdersRepository,
    private readonly scope: DiagnosticsScopeService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DiagnosticsReportsService.name);
  }

  /** UC-20-07: crea (o enmienda) una versión del informe diagnóstico. */
  async createReportVersion(
    reportId: string,
    dto: CreateReportVersionDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    this.logger.info(
      { operation: 'diagnostics.report.version', reportId },
      'Creating report version',
    );
    return this.em.transactional(async (tx) => {
      const tenantId = this.scope.activeTenantFor(dto.custodianTenantId);
      // El informe, sus observaciones y sus archivos son del tenant activo y del
      // mismo paciente; se resuelven antes de escribir la primera fila.
      const report = await this.scope.report(tx, reportId);
      for (const r of dto.results ?? []) {
        await this.scope.observation(
          tx,
          r.observationId,
          report.patientProfileId,
        );
      }
      for (const f of dto.files ?? []) {
        await this.scope.file(tx, f.fileId);
      }
      if (dto.supersedesVersionId) {
        const prev = await this.repo.findVersionInReport(
          tx,
          reportId,
          dto.supersedesVersionId,
        );
        if (!prev) {
          throw new ResourceNotFoundException(
            'La versión que se enmienda no existe en este informe',
            {
              reportId,
              supersedesVersionId: dto.supersedesVersionId,
            },
          );
        }
      }

      const nextNumber = (await this.repo.maxVersionNumber(tx, reportId)) + 1;
      const contentHash = createHash('sha256')
        .update(`${reportId}:${nextNumber}:${dto.conclusionText ?? ''}`)
        .digest('hex');

      const version = this.repo.createVersion(tx, {
        diagnosticReportId: reportId,
        versionNumber: nextNumber,
        clinicalStatusConceptId: DIAG.REPORT_PRELIMINARY,
        custodianTenantId: tenantId,
        conclusionText: dto.conclusionText,
        authorProfileId: this.scope.authorFor(actor, dto.authorProfileId),
        supersedesVersionId: dto.supersedesVersionId,
        amendmentReasonConceptId: dto.amendmentReasonConceptId,
        amendmentReasonText: dto.amendmentReasonText,
        contentHash,
        releaseEligibilityConceptId: DIAG.RELEASE_ELIGIBLE,
        recordedByUserId: actor.id,
      });
      await tx.flush();

      let ordinal = 0;
      for (const r of dto.results ?? []) {
        this.repo.addResult(tx, {
          diagnosticReportVersionId: version.id,
          observationId: r.observationId,
          resultRoleConceptId: r.resultRoleConceptId,
          ordinal: r.ordinal ?? ordinal++,
        });
      }
      let fileOrdinal = 0;
      for (const f of dto.files ?? []) {
        this.repo.addFile(tx, {
          diagnosticReportVersionId: version.id,
          fileId: f.fileId,
          contentRoleConceptId: f.contentRoleConceptId ?? DIAG.REPORT_FINAL,
          ordinal: f.ordinal ?? fileOrdinal++,
          createdByUserId: actor.id,
        });
      }
      await tx.flush();

      return { id: version.id, status: version.clinicalStatusConceptId };
    });
  }

  /** UC-20-08: valida y libera una versión del informe. */
  async releaseVersion(
    reportId: string,
    versionId: string,
    dto: ReleaseReportVersionDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    this.logger.info(
      { operation: 'diagnostics.report.release', reportId, versionId },
      'Releasing report version',
    );
    return this.em.transactional(async (tx) => {
      const report = await this.scope.report(tx, reportId);
      const version = await this.repo.findVersionInReport(
        tx,
        report.id,
        versionId,
      );
      if (!version) {
        throw new ResourceNotFoundException(
          'Versión de informe no encontrada',
          { reportId, versionId },
        );
      }
      if (version.releaseEligibilityConceptId !== DIAG.RELEASE_ELIGIBLE) {
        throw new PreconditionFailedException(
          'La versión no es elegible para liberación',
          { versionId },
        );
      }
      if (version.clinicalStatusConceptId === DIAG.REPORT_FINAL) {
        throw new ConflictException('La versión ya fue liberada', {
          versionId,
        });
      }

      const visibility =
        dto.patientVisibility === 'HIDDEN'
          ? DIAG.VISIBILITY_PATIENT_HIDDEN
          : DIAG.VISIBILITY_PATIENT_VISIBLE;

      this.repo.recordReleaseEvent(tx, {
        diagnosticReportVersionId: version.id,
        actionConceptId: DIAG.RELEASE_ACTION_RELEASE,
        patientVisibilityConceptId: visibility,
        reasonConceptId: dto.reasonConceptId,
        policyVersion: dto.policyVersion,
        recordedByUserId: actor.id,
      });

      version.clinicalStatusConceptId = DIAG.REPORT_FINAL;
      version.issuedAt = new Date();

      // El informe tiene que quedar sabiendo cuál es su versión liberada. Sin
      // esto, `current_released_version_id` seguía en `null` para siempre y la
      // única forma de saber si un resultado estaba liberado era recorrer sus
      // eventos — que es justo lo que la columna existe para evitar.
      this.ordersRepo.markReportReleased(
        tx,
        report,
        version.id,
        visibility,
        actor.id,
      );

      await tx.flush();

      return { id: version.id, status: version.clinicalStatusConceptId };
    });
  }

  /** UC-20-09: detecta y crea una notificación de resultado crítico. */
  async detectCritical(
    dto: DetectCriticalResultDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    this.logger.info(
      {
        operation: 'diagnostics.critical.detect',
        observationId: dto.observationId,
      },
      'Detecting critical result',
    );
    return this.em.transactional(async (tx) => {
      const tenantId = this.scope.activeTenantFor(dto.custodianTenantId);
      await this.scope.observation(tx, dto.observationId, dto.patientProfileId);
      if (dto.diagnosticReportId) {
        await this.scope.report(
          tx,
          dto.diagnosticReportId,
          dto.patientProfileId,
        );
      }
      // Evita doble alerta por observación.
      if (await this.repo.criticalExistsForObservation(tx, dto.observationId)) {
        throw new ConflictException(
          'Ya existe una notificación crítica para la observación',
          {
            observationId: dto.observationId,
          },
        );
      }

      const escalationDueAt = dto.escalationDueInMinutes
        ? new Date(Date.now() + dto.escalationDueInMinutes * 60_000)
        : undefined;

      const notification = this.repo.createCriticalNotification(tx, {
        custodianTenantId: tenantId,
        patientProfileId: dto.patientProfileId,
        observationId: dto.observationId,
        criticalityConceptId:
          dto.criticalityConceptId ?? DIAG.CRITICALITY_CRITICAL,
        notificationStatusConceptId: DIAG.CRITICAL_PENDING,
        detectedAt: new Date(),
        diagnosticReportId: dto.diagnosticReportId,
        detectedByProfileId: dto.detectedByProfileId,
        escalationDueAt,
        actorUserId: actor.id,
      });
      await tx.flush();

      return {
        id: notification.id,
        status: notification.notificationStatusConceptId,
      };
    });
  }

  /** UC-20-10: acusa recibo (o escala si venció el SLA) de una notificación crítica. */
  async acknowledgeCritical(
    notificationId: string,
    dto: AcknowledgeCriticalResultDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    this.logger.info(
      { operation: 'diagnostics.critical.acknowledge', notificationId },
      'Acknowledging critical notification',
    );
    return this.em.transactional(async (tx) => {
      const notification = await this.scope.criticalNotification(
        tx,
        notificationId,
      );
      if (
        notification.notificationStatusConceptId === DIAG.CRITICAL_ACKNOWLEDGED
      ) {
        throw new ConflictException('La notificación ya fue reconocida', {
          notificationId,
        });
      }

      const now = new Date();
      const escalated =
        !!notification.escalationDueAt && notification.escalationDueAt < now;
      notification.notificationStatusConceptId = escalated
        ? DIAG.CRITICAL_ESCALATED
        : DIAG.CRITICAL_ACKNOWLEDGED;
      notification.acknowledgedByProfileId = this.scope.authorFor(
        actor,
        dto.acknowledgedByProfileId,
      );
      notification.acknowledgedAt = now;
      notification.communicationEvidenceId = dto.communicationEvidenceId;
      touch(notification, actor.id);
      await tx.flush();

      return {
        id: notification.id,
        status: notification.notificationStatusConceptId,
      };
    });
  }
}
