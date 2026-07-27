import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  DicomStudyManifests,
  DicomSeriesManifests,
  DicomInstanceManifests,
  DicomwebAccessLogs,
} from '../entities';

/**
 * Acceso al catálogo DICOM de `object_storage.*`: jerarquía
 * estudio → serie → instancia y registro de accesos DICOMweb.
 */
@Injectable()
export class DicomRepository {
  // --- Estudios (UC-60-04, 05) ---

  createStudy(
    em: EntityManager,
    data: {
      tenantId?: string;
      patientProfileId?: string;
      imagingStudyId?: string;
      studyInstanceUid: string;
      accessionNumber?: string;
      studyDate?: Date;
      modalityCodes?: string[];
      lifecycleState: string;
    },
  ): DicomStudyManifests {
    return em.create(
      DicomStudyManifests,
      {
        tenantId: data.tenantId,
        patientProfileId: data.patientProfileId,
        imagingStudyId: data.imagingStudyId,
        studyInstanceUid: data.studyInstanceUid,
        accessionNumber: data.accessionNumber,
        studyDate: data.studyDate,
        modalityCodes: data.modalityCodes,
        seriesCount: 0,
        instanceCount: 0,
        lifecycleState: data.lifecycleState,
      },
      { partial: true },
    );
  }

  /**
   * Estudio por su UID dentro del tenant, bloqueado: catalogar recalcula sus
   * contadores, y dos routers subiendo series a la vez los dejarían mal.
   */
  findStudyByUidForUpdate(
    em: EntityManager,
    tenantId: string | undefined,
    studyInstanceUid: string,
  ): Promise<DicomStudyManifests | null> {
    return em.findOne(
      DicomStudyManifests,
      { tenantId, studyInstanceUid },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  findStudyByUid(
    em: EntityManager,
    studyInstanceUid: string,
  ): Promise<DicomStudyManifests | null> {
    return em.findOne(DicomStudyManifests, { studyInstanceUid });
  }

  // --- Series (UC-60-04, 05) ---

  createSeries(
    em: EntityManager,
    data: {
      dicomStudyManifestId: string;
      seriesInstanceUid: string;
      modality?: string;
      seriesNumber?: number;
      bodyPartExamined?: string;
      thumbnailObjectManifestId?: string;
    },
  ): DicomSeriesManifests {
    return em.create(
      DicomSeriesManifests,
      {
        dicomStudyManifestId: data.dicomStudyManifestId,
        seriesInstanceUid: data.seriesInstanceUid,
        modality: data.modality,
        seriesNumber: data.seriesNumber,
        bodyPartExamined: data.bodyPartExamined,
        instanceCount: 0,
        thumbnailObjectManifestId: data.thumbnailObjectManifestId,
      },
      { partial: true },
    );
  }

  findSeriesByUidForUpdate(
    em: EntityManager,
    dicomStudyManifestId: string,
    seriesInstanceUid: string,
  ): Promise<DicomSeriesManifests | null> {
    return em.findOne(
      DicomSeriesManifests,
      { dicomStudyManifestId, seriesInstanceUid },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  findSeriesByUid(
    em: EntityManager,
    dicomStudyManifestId: string,
    seriesInstanceUid: string,
  ): Promise<DicomSeriesManifests | null> {
    return em.findOne(DicomSeriesManifests, {
      dicomStudyManifestId,
      seriesInstanceUid,
    });
  }

  findSeriesByStudy(
    em: EntityManager,
    dicomStudyManifestId: string,
  ): Promise<DicomSeriesManifests[]> {
    return em.find(DicomSeriesManifests, { dicomStudyManifestId });
  }

  // --- Instancias (UC-60-04, 05) ---

  createInstance(
    em: EntityManager,
    data: {
      dicomSeriesManifestId: string;
      sopInstanceUid: string;
      sopClassUid?: string;
      instanceNumber?: number;
      transferSyntaxUid?: string;
      objectManifestId: string;
      frameCount?: number;
      metadataJson?: unknown;
    },
  ): DicomInstanceManifests {
    return em.create(
      DicomInstanceManifests,
      {
        dicomSeriesManifestId: data.dicomSeriesManifestId,
        sopInstanceUid: data.sopInstanceUid,
        sopClassUid: data.sopClassUid,
        instanceNumber: data.instanceNumber,
        transferSyntaxUid: data.transferSyntaxUid,
        objectManifestId: data.objectManifestId,
        frameCount: data.frameCount,
        metadataJson: data.metadataJson,
      },
      { partial: true },
    );
  }

  /** Reingreso de la misma instancia: el UID es único dentro de su serie. */
  findInstanceByUid(
    em: EntityManager,
    dicomSeriesManifestId: string,
    sopInstanceUid: string,
  ): Promise<DicomInstanceManifests | null> {
    return em.findOne(DicomInstanceManifests, {
      dicomSeriesManifestId,
      sopInstanceUid,
    });
  }

  countInstancesBySeries(
    em: EntityManager,
    dicomSeriesManifestId: string,
  ): Promise<number> {
    return em.count(DicomInstanceManifests, { dicomSeriesManifestId });
  }

  // --- Registro de accesos (UC-60-05, 09) ---

  /**
   * Log append-only de acceso a imagen clínica. Se escribe **también cuando se
   * deniega**: un intento rechazado es justo lo que hay que poder auditar.
   */
  createAccessLog(
    em: EntityManager,
    data: {
      tenantId?: string;
      principalId: string;
      operation: string;
      studyInstanceUid?: string;
      seriesInstanceUid?: string;
      sopInstanceUid?: string;
      purposeOfUseCode?: string;
      outcome: string;
    },
  ): DicomwebAccessLogs {
    return em.create(
      DicomwebAccessLogs,
      {
        tenantId: data.tenantId,
        principalId: data.principalId,
        operation: data.operation,
        studyInstanceUid: data.studyInstanceUid,
        seriesInstanceUid: data.seriesInstanceUid,
        sopInstanceUid: data.sopInstanceUid,
        purposeOfUseCode: data.purposeOfUseCode,
        outcome: data.outcome,
        occurredAt: new Date(),
      },
      { partial: true },
    );
  }
}
