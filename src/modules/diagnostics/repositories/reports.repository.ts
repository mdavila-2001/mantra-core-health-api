import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  DiagnosticReportVersions,
  DiagnosticReportResults,
  DiagnosticReportFiles,
  DiagnosticReleaseEvents,
  CriticalResultNotifications,
} from '../entities';
import { createdBy } from '../../../common';

/** Datos de una versión de informe (append-only / inmutable). */
export interface CreateReportVersionData {
  diagnosticReportId: string;
  versionNumber: number;
  clinicalStatusConceptId: string;
  custodianTenantId: string;
  conclusionText?: string;
  authorProfileId?: string;
  supersedesVersionId?: string;
  amendmentReasonConceptId?: string;
  amendmentReasonText?: string;
  contentHash?: string;
  releaseEligibilityConceptId?: string;
  recordedByUserId?: string;
}

/** Datos de una notificación de resultado crítico. */
export interface CreateCriticalNotificationData {
  custodianTenantId: string;
  patientProfileId: string;
  observationId: string;
  criticalityConceptId: string;
  notificationStatusConceptId: string;
  detectedAt: Date;
  diagnosticReportId?: string;
  detectedByProfileId?: string;
  escalationDueAt?: Date;
  actorUserId?: string;
}

/**
 * Acceso a datos del informe diagnóstico: versiones inmutables con sus resultados
 * y archivos enlazados, el log de eventos de liberación y las notificaciones de
 * resultado crítico (con auditoría y `row_version`).
 */
@Injectable()
export class ReportsRepository {
  findVersion(
    em: EntityManager,
    id: string,
  ): Promise<DiagnosticReportVersions | null> {
    return em.findOne(DiagnosticReportVersions, { id });
  }

  findVersionInReport(
    em: EntityManager,
    diagnosticReportId: string,
    id: string,
  ): Promise<DiagnosticReportVersions | null> {
    return em.findOne(DiagnosticReportVersions, { id, diagnosticReportId });
  }

  findCriticalNotification(
    em: EntityManager,
    id: string,
  ): Promise<CriticalResultNotifications | null> {
    return em.findOne(CriticalResultNotifications, { id });
  }

  /** Mayor número de versión existente para un informe (0 si no hay). */
  async maxVersionNumber(
    em: EntityManager,
    diagnosticReportId: string,
  ): Promise<number> {
    const rows = await em.find(
      DiagnosticReportVersions,
      { diagnosticReportId },
      {
        fields: ['versionNumber'],
        orderBy: { versionNumber: 'desc' },
        limit: 1,
      },
    );
    return rows.length ? rows[0].versionNumber : 0;
  }

  createVersion(
    em: EntityManager,
    data: CreateReportVersionData,
  ): DiagnosticReportVersions {
    // Tabla sin created_at/updated_at: usa recorded_at + recorded_by_user_id.
    return em.create(
      DiagnosticReportVersions,
      {
        diagnosticReportId: data.diagnosticReportId,
        versionNumber: data.versionNumber,
        clinicalStatusConceptId: data.clinicalStatusConceptId,
        custodianTenantId: data.custodianTenantId,
        conclusionText: data.conclusionText,
        authorProfileId: data.authorProfileId,
        supersedesVersionId: data.supersedesVersionId,
        amendmentReasonConceptId: data.amendmentReasonConceptId,
        amendmentReasonText: data.amendmentReasonText,
        contentHash: data.contentHash,
        releaseEligibilityConceptId: data.releaseEligibilityConceptId,
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  addResult(
    em: EntityManager,
    data: {
      diagnosticReportVersionId: string;
      observationId: string;
      resultRoleConceptId?: string;
      ordinal?: number;
    },
  ): DiagnosticReportResults {
    return em.create(
      DiagnosticReportResults,
      {
        diagnosticReportVersionId: data.diagnosticReportVersionId,
        observationId: data.observationId,
        resultRoleConceptId: data.resultRoleConceptId,
        ordinal: data.ordinal,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  addFile(
    em: EntityManager,
    data: {
      diagnosticReportVersionId: string;
      fileId: string;
      contentRoleConceptId: string;
      presentationFormatConceptId?: string;
      ordinal?: number;
      createdByUserId?: string;
    },
  ): DiagnosticReportFiles {
    return em.create(
      DiagnosticReportFiles,
      {
        diagnosticReportVersionId: data.diagnosticReportVersionId,
        fileId: data.fileId,
        contentRoleConceptId: data.contentRoleConceptId,
        presentationFormatConceptId: data.presentationFormatConceptId,
        ordinal: data.ordinal,
        createdAt: new Date(),
        createdByUserId: data.createdByUserId,
      },
      { partial: true },
    );
  }

  recordReleaseEvent(
    em: EntityManager,
    data: {
      diagnosticReportVersionId?: string;
      imagingStudyId?: string;
      actionConceptId: string;
      patientVisibilityConceptId: string;
      reasonConceptId?: string;
      policyVersion?: string;
      recordedByUserId?: string;
    },
  ): DiagnosticReleaseEvents {
    return em.create(
      DiagnosticReleaseEvents,
      {
        diagnosticReportVersionId: data.diagnosticReportVersionId,
        imagingStudyId: data.imagingStudyId,
        actionConceptId: data.actionConceptId,
        patientVisibilityConceptId: data.patientVisibilityConceptId,
        reasonConceptId: data.reasonConceptId,
        policyVersion: data.policyVersion,
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  createCriticalNotification(
    em: EntityManager,
    data: CreateCriticalNotificationData,
  ): CriticalResultNotifications {
    return em.create(
      CriticalResultNotifications,
      {
        custodianTenantId: data.custodianTenantId,
        patientProfileId: data.patientProfileId,
        observationId: data.observationId,
        criticalityConceptId: data.criticalityConceptId,
        notificationStatusConceptId: data.notificationStatusConceptId,
        detectedAt: data.detectedAt,
        diagnosticReportId: data.diagnosticReportId,
        detectedByProfileId: data.detectedByProfileId,
        escalationDueAt: data.escalationDueAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** ¿Existe ya una notificación crítica para esa observación? (evita doble alerta). */
  async criticalExistsForObservation(
    em: EntityManager,
    observationId: string,
  ): Promise<boolean> {
    const n = await em.count(CriticalResultNotifications, { observationId });
    return n > 0;
  }
}
