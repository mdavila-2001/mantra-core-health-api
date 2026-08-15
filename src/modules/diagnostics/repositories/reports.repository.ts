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
  /**
   * Identificador asociado a diagnostic report.
   */
  diagnosticReportId: string;
  /**
   * Valor de version number mantenido por la instancia.
   */
  versionNumber: number;
  /**
   * Identificador asociado a clinical status concept.
   */
  clinicalStatusConceptId: string;
  /**
   * Identificador asociado a custodian tenant.
   */
  custodianTenantId: string;
  /**
   * Valor de conclusion text mantenido por la instancia.
   */
  conclusionText?: string;
  /**
   * Identificador asociado a author profile.
   */
  authorProfileId?: string;
  /**
   * Identificador asociado a supersedes version.
   */
  supersedesVersionId?: string;
  /**
   * Identificador asociado a amendment reason concept.
   */
  amendmentReasonConceptId?: string;
  /**
   * Valor de amendment reason text mantenido por la instancia.
   */
  amendmentReasonText?: string;
  /**
   * Valor de content hash mantenido por la instancia.
   */
  contentHash?: string;
  /**
   * Identificador asociado a release eligibility concept.
   */
  releaseEligibilityConceptId?: string;
  /**
   * Identificador asociado a recorded by user.
   */
  recordedByUserId?: string;
}

/** Datos de una notificación de resultado crítico. */
export interface CreateCriticalNotificationData {
  /**
   * Identificador asociado a custodian tenant.
   */
  custodianTenantId: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a observation.
   */
  observationId: string;
  /**
   * Identificador asociado a criticality concept.
   */
  criticalityConceptId: string;
  /**
   * Identificador asociado a notification status concept.
   */
  notificationStatusConceptId: string;
  /**
   * Valor de detected at mantenido por la instancia.
   */
  detectedAt: Date;
  /**
   * Identificador asociado a diagnostic report.
   */
  diagnosticReportId?: string;
  /**
   * Identificador asociado a detected by profile.
   */
  detectedByProfileId?: string;
  /**
   * Valor de escalation due at mantenido por la instancia.
   */
  escalationDueAt?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos del informe diagnóstico: versiones inmutables con sus resultados
 * y archivos enlazados, el log de eventos de liberación y las notificaciones de
 * resultado crítico (con auditoría y `row_version`).
 */
@Injectable()
export class ReportsRepository {
  /**
   * Obtiene find version.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find version conforme al contrato `Promise<DiagnosticReportVersions | null>`.
   */
  findVersion(
    em: EntityManager,
    id: string,
  ): Promise<DiagnosticReportVersions | null> {
    return em.findOne(DiagnosticReportVersions, { id });
  }

  /**
   * Obtiene find version in report.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param diagnosticReportId - Identificador de diagnostic report.
   * @param id - Identificador de id.
   * @returns Resultado de find version in report conforme al contrato `Promise<DiagnosticReportVersions | null>`.
   */
  findVersionInReport(
    em: EntityManager,
    diagnosticReportId: string,
    id: string,
  ): Promise<DiagnosticReportVersions | null> {
    return em.findOne(DiagnosticReportVersions, { id, diagnosticReportId });
  }

  /**
   * Obtiene find critical notification.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find critical notification conforme al contrato `Promise<CriticalResultNotifications | null>`.
   */
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

  /**
   * Crea create version.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create version conforme al contrato `DiagnosticReportVersions`.
   */
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

  /**
   * Crea add result.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de add result conforme al contrato `DiagnosticReportResults`.
   */
  addResult(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a diagnostic report version.
       */
      diagnosticReportVersionId: string;
      /**
       * Identificador asociado a observation.
       */
      observationId: string;
      /**
       * Identificador asociado a result role concept.
       */
      resultRoleConceptId?: string;
      /**
       * Valor de ordinal mantenido por la instancia.
       */
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

  /**
   * Crea add file.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de add file conforme al contrato `DiagnosticReportFiles`.
   */
  addFile(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a diagnostic report version.
       */
      diagnosticReportVersionId: string;
      /**
       * Identificador asociado a file.
       */
      fileId: string;
      /**
       * Identificador asociado a content role concept.
       */
      contentRoleConceptId: string;
      /**
       * Identificador asociado a presentation format concept.
       */
      presentationFormatConceptId?: string;
      /**
       * Valor de ordinal mantenido por la instancia.
       */
      ordinal?: number;
      /**
       * Identificador asociado a created by user.
       */
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

  /**
   * Ejecuta la operación record release event.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de record release event conforme al contrato `DiagnosticReleaseEvents`.
   */
  recordReleaseEvent(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a diagnostic report version.
       */
      diagnosticReportVersionId?: string;
      /**
       * Identificador asociado a imaging study.
       */
      imagingStudyId?: string;
      /**
       * Identificador asociado a action concept.
       */
      actionConceptId: string;
      /**
       * Identificador asociado a patient visibility concept.
       */
      patientVisibilityConceptId: string;
      /**
       * Identificador asociado a reason concept.
       */
      reasonConceptId?: string;
      /**
       * Valor de policy version mantenido por la instancia.
       */
      policyVersion?: string;
      /**
       * Identificador asociado a recorded by user.
       */
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

  /**
   * Crea create critical notification.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create critical notification conforme al contrato `CriticalResultNotifications`.
   */
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

  /* ---- lectura del informe ya liberado ------------------------------------
     Las tres consultas que necesita quien mira un resultado —el paciente o el
     profesional autorizado— y que hasta ahora no existían: el módulo sabía
     escribir versiones, archivos y eventos de liberación, y no sabía leerlos. */

  /**
   * Versiones de varios informes a la vez.
   *
   * En lote y no una por informe porque la lista de resultados del paciente pide
   * las versiones de todos sus informes en la misma pantalla: una consulta por
   * fila convierte una lista de treinta en treinta y una consultas.
   *
   * @param em - Contexto de persistencia.
   * @param diagnosticReportIds - Informes cuyos versionados se leen.
   * @returns Las versiones, de la más nueva a la más vieja.
   */
  findVersionsByReports(
    em: EntityManager,
    diagnosticReportIds: readonly string[],
  ): Promise<DiagnosticReportVersions[]> {
    if (diagnosticReportIds.length === 0) {
      return Promise.resolve([]);
    }
    return em.find(
      DiagnosticReportVersions,
      { diagnosticReportId: { $in: [...diagnosticReportIds] } },
      { orderBy: { versionNumber: 'DESC' } },
    );
  }

  /**
   * Eventos de liberación de un conjunto de versiones.
   *
   * Son la **fuente de verdad de la visibilidad del paciente**: liberar una
   * versión escribe acá si el resultado es visible u oculto para la persona, y
   * ninguna otra tabla lo registra. Se devuelven del más nuevo al más viejo para
   * que el llamador se quede con el último de cada versión, que es el que manda.
   *
   * @param em - Contexto de persistencia.
   * @param versionIds - Versiones cuyos eventos se leen.
   * @returns Los eventos, del más nuevo al más viejo.
   */
  findReleaseEventsByVersions(
    em: EntityManager,
    versionIds: readonly string[],
  ): Promise<DiagnosticReleaseEvents[]> {
    if (versionIds.length === 0) {
      return Promise.resolve([]);
    }
    return em.find(
      DiagnosticReleaseEvents,
      { diagnosticReportVersionId: { $in: [...versionIds] } },
      { orderBy: { recordedAt: 'DESC' } },
    );
  }

  /**
   * Archivos enlazados a un conjunto de versiones.
   *
   * Son lo que se descarga: el `fileId` va a `GET /common/files/{id}/content`,
   * que ya resuelve el contenido y su autorización. Este módulo no vuelve a
   * implementar la descarga; sólo dice qué archivos cuelgan del informe.
   *
   * @param em - Contexto de persistencia.
   * @param versionIds - Versiones cuyos archivos se leen.
   * @returns Los archivos, en el orden declarado por el informe.
   */
  findFilesByVersions(
    em: EntityManager,
    versionIds: readonly string[],
  ): Promise<DiagnosticReportFiles[]> {
    if (versionIds.length === 0) {
      return Promise.resolve([]);
    }
    return em.find(
      DiagnosticReportFiles,
      { diagnosticReportVersionId: { $in: [...versionIds] } },
      { orderBy: { ordinal: 'ASC' } },
    );
  }

  /**
   * Resultados (observaciones) enlazados a un conjunto de versiones.
   *
   * @param em - Contexto de persistencia.
   * @param versionIds - Versiones cuyos resultados se leen.
   * @returns Los resultados, en el orden declarado por el informe.
   */
  findResultsByVersions(
    em: EntityManager,
    versionIds: readonly string[],
  ): Promise<DiagnosticReportResults[]> {
    if (versionIds.length === 0) {
      return Promise.resolve([]);
    }
    return em.find(
      DiagnosticReportResults,
      { diagnosticReportVersionId: { $in: [...versionIds] } },
      { orderBy: { ordinal: 'ASC' } },
    );
  }
}
