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
  patientProfileId: string;
  mediaTypeConceptId: string;
  fileId: string;
  statusConceptId: string;
  custodianTenantId: string;
  encounterId?: string;
  diagnosticReportId?: string;
  bodySiteConceptId?: string;
  viewConceptId?: string;
  capturedAt?: Date;
  capturedByProfileId?: string;
  patientVisibilityConceptId?: string;
  actorUserId?: string;
}

/** Datos de alta de un evento de calidad de datos. */
export interface CreateDataQualityEventData {
  custodianTenantId: string;
  targetTypeConceptId: string;
  targetId: string;
  occurredAt: Date;
  ruleCode: string;
  severityConceptId: string;
  statusConceptId: string;
  detailsJson?: unknown;
}

/**
 * Acceso a datos de media clínica (con anotaciones IA/manual) y del subdominio de
 * calidad de datos: eventos de calidad y enlaces de provenance (append-only).
 */
@Injectable()
export class MediaQualityRepository {
  findMedia(em: EntityManager, id: string): Promise<ClinicalMedia | null> {
    return em.findOne(ClinicalMedia, { id });
  }

  findMediaByFile(
    em: EntityManager,
    fileId: string,
  ): Promise<ClinicalMedia | null> {
    return em.findOne(ClinicalMedia, { fileId });
  }

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

  addAnnotation(
    em: EntityManager,
    data: {
      clinicalMediaId: string;
      annotationTypeConceptId: string;
      statusConceptId: string;
      geometryJson?: unknown;
      labelConceptId?: string;
      labelText?: string;
      confidenceScore?: string;
      authorProfileId?: string;
      algorithmModelReference?: string;
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
      custodianTenantId: string;
      targetTypeConceptId: string;
      targetId: string;
      sourceTypeConceptId: string;
      sourceId: string;
      activityConceptId: string;
      contentHash: string;
      recordedAt: Date;
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
