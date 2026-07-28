import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ClinicalMedia,
  MediaAnnotations,
  DiagnosticDataQualityEvents,
  DiagnosticProvenanceLinks,
} from '../entities';
import { createdBy } from '../../../common';

/** Datos de alta de media clínica. */
export interface CreateClinicalMediaData {
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a media type concept.
   */
  mediaTypeConceptId: string;
  /**
   * Identificador asociado a file.
   */
  fileId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a custodian tenant.
   */
  custodianTenantId: string;
  /**
   * Identificador asociado a encounter.
   */
  encounterId?: string;
  /**
   * Identificador asociado a diagnostic report.
   */
  diagnosticReportId?: string;
  /**
   * Identificador asociado a body site concept.
   */
  bodySiteConceptId?: string;
  /**
   * Identificador asociado a view concept.
   */
  viewConceptId?: string;
  /**
   * Valor de captured at mantenido por la instancia.
   */
  capturedAt?: Date;
  /**
   * Identificador asociado a captured by profile.
   */
  capturedByProfileId?: string;
  /**
   * Identificador asociado a patient visibility concept.
   */
  patientVisibilityConceptId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Datos de alta de un evento de calidad de datos. */
export interface CreateDataQualityEventData {
  /**
   * Identificador asociado a custodian tenant.
   */
  custodianTenantId: string;
  /**
   * Identificador asociado a target type concept.
   */
  targetTypeConceptId: string;
  /**
   * Identificador asociado a target.
   */
  targetId: string;
  /**
   * Valor de occurred at mantenido por la instancia.
   */
  occurredAt: Date;
  /**
   * Valor de rule code mantenido por la instancia.
   */
  ruleCode: string;
  /**
   * Identificador asociado a severity concept.
   */
  severityConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de details json mantenido por la instancia.
   */
  detailsJson?: unknown;
}

/**
 * Acceso a datos de media clínica (con anotaciones IA/manual) y del subdominio de
 * calidad de datos: eventos de calidad y enlaces de provenance (append-only).
 */
@Injectable()
export class MediaQualityRepository {
  /**
   * Obtiene find media.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find media conforme al contrato `Promise<ClinicalMedia | null>`.
   */
  findMedia(em: EntityManager, id: string): Promise<ClinicalMedia | null> {
    return em.findOne(ClinicalMedia, { id });
  }

  /**
   * Obtiene find media by file.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param fileId - Identificador de file.
   * @returns Resultado de find media by file conforme al contrato `Promise<ClinicalMedia | null>`.
   */
  findMediaByFile(
    em: EntityManager,
    fileId: string,
  ): Promise<ClinicalMedia | null> {
    return em.findOne(ClinicalMedia, { fileId });
  }

  /**
   * Crea create media.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create media conforme al contrato `ClinicalMedia`.
   */
  createMedia(em: EntityManager, data: CreateClinicalMediaData): ClinicalMedia {
    return em.create(
      ClinicalMedia,
      {
        patientProfileId: data.patientProfileId,
        mediaTypeConceptId: data.mediaTypeConceptId,
        fileId: data.fileId,
        statusConceptId: data.statusConceptId,
        custodianTenantId: data.custodianTenantId,
        encounterId: data.encounterId,
        diagnosticReportId: data.diagnosticReportId,
        bodySiteConceptId: data.bodySiteConceptId,
        viewConceptId: data.viewConceptId,
        capturedAt: data.capturedAt,
        capturedByProfileId: data.capturedByProfileId,
        patientVisibilityConceptId: data.patientVisibilityConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea add annotation.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de add annotation conforme al contrato `MediaAnnotations`.
   */
  addAnnotation(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a clinical media.
       */
      clinicalMediaId: string;
      /**
       * Identificador asociado a annotation type concept.
       */
      annotationTypeConceptId: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Valor de geometry json mantenido por la instancia.
       */
      geometryJson?: unknown;
      /**
       * Identificador asociado a label concept.
       */
      labelConceptId?: string;
      /**
       * Valor de label text mantenido por la instancia.
       */
      labelText?: string;
      /**
       * Valor de confidence score mantenido por la instancia.
       */
      confidenceScore?: string;
      /**
       * Identificador asociado a author profile.
       */
      authorProfileId?: string;
      /**
       * Valor de algorithm model reference mantenido por la instancia.
       */
      algorithmModelReference?: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): MediaAnnotations {
    return em.create(
      MediaAnnotations,
      {
        clinicalMediaId: data.clinicalMediaId,
        annotationTypeConceptId: data.annotationTypeConceptId,
        statusConceptId: data.statusConceptId,
        geometryJson: data.geometryJson,
        labelConceptId: data.labelConceptId,
        labelText: data.labelText,
        confidenceScore: data.confidenceScore,
        authorProfileId: data.authorProfileId,
        algorithmModelReference: data.algorithmModelReference,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create data quality event.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create data quality event conforme al contrato `DiagnosticDataQualityEvents`.
   */
  createDataQualityEvent(
    em: EntityManager,
    data: CreateDataQualityEventData,
  ): DiagnosticDataQualityEvents {
    return em.create(
      DiagnosticDataQualityEvents,
      {
        custodianTenantId: data.custodianTenantId,
        targetTypeConceptId: data.targetTypeConceptId,
        targetId: data.targetId,
        occurredAt: data.occurredAt,
        ruleCode: data.ruleCode,
        severityConceptId: data.severityConceptId,
        statusConceptId: data.statusConceptId,
        detailsJson: data.detailsJson,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /** Registra un enlace de provenance (append-only inmutable, sin flush). */
  addProvenanceLink(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a custodian tenant.
       */
      custodianTenantId: string;
      /**
       * Identificador asociado a target type concept.
       */
      targetTypeConceptId: string;
      /**
       * Identificador asociado a target.
       */
      targetId: string;
      /**
       * Identificador asociado a source type concept.
       */
      sourceTypeConceptId: string;
      /**
       * Identificador asociado a source.
       */
      sourceId: string;
      /**
       * Identificador asociado a activity concept.
       */
      activityConceptId: string;
      /**
       * Valor de content hash mantenido por la instancia.
       */
      contentHash: string;
      /**
       * Valor de recorded at mantenido por la instancia.
       */
      recordedAt: Date;
      /**
       * Identificador asociado a agent profile.
       */
      agentProfileId?: string;
    },
  ): DiagnosticProvenanceLinks {
    return em.create(
      DiagnosticProvenanceLinks,
      {
        custodianTenantId: data.custodianTenantId,
        targetTypeConceptId: data.targetTypeConceptId,
        targetId: data.targetId,
        sourceTypeConceptId: data.sourceTypeConceptId,
        sourceId: data.sourceId,
        activityConceptId: data.activityConceptId,
        contentHash: data.contentHash,
        recordedAt: data.recordedAt,
        agentProfileId: data.agentProfileId,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }
}
