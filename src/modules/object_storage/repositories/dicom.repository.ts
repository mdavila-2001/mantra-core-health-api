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

  /**
   * Crea create study.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create study conforme al contrato `DicomStudyManifests`.
   */
  createStudy(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId?: string;
      /**
       * Identificador asociado a patient profile.
       */
      patientProfileId?: string;
      /**
       * Identificador asociado a imaging study.
       */
      imagingStudyId?: string;
      /**
       * Valor de study instance uid mantenido por la instancia.
       */
      studyInstanceUid: string;
      /**
       * Valor de accession number mantenido por la instancia.
       */
      accessionNumber?: string;
      /**
       * Valor de study date mantenido por la instancia.
       */
      studyDate?: Date;
      /**
       * Valor de modality codes mantenido por la instancia.
       */
      modalityCodes?: string[];
      /**
       * Valor de lifecycle state mantenido por la instancia.
       */
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

  /**
   * Obtiene find study by uid.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param studyInstanceUid - Identificador de study instance uid.
   * @returns Resultado de find study by uid conforme al contrato `Promise<DicomStudyManifests | null>`.
   */
  findStudyByUid(
    em: EntityManager,
    studyInstanceUid: string,
  ): Promise<DicomStudyManifests | null> {
    return em.findOne(DicomStudyManifests, { studyInstanceUid });
  }

  // --- Series (UC-60-04, 05) ---

  /**
   * Crea create series.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create series conforme al contrato `DicomSeriesManifests`.
   */
  createSeries(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a dicom study manifest.
       */
      dicomStudyManifestId: string;
      /**
       * Valor de series instance uid mantenido por la instancia.
       */
      seriesInstanceUid: string;
      /**
       * Valor de modality mantenido por la instancia.
       */
      modality?: string;
      /**
       * Valor de series number mantenido por la instancia.
       */
      seriesNumber?: number;
      /**
       * Valor de body part examined mantenido por la instancia.
       */
      bodyPartExamined?: string;
      /**
       * Identificador asociado a thumbnail object manifest.
       */
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

  /**
   * Obtiene find series by uid for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param dicomStudyManifestId - Identificador de dicom study manifest.
   * @param seriesInstanceUid - Identificador de series instance uid.
   * @returns Resultado de find series by uid for update conforme al contrato `Promise<DicomSeriesManifests | null>`.
   */
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

  /**
   * Obtiene find series by uid.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param dicomStudyManifestId - Identificador de dicom study manifest.
   * @param seriesInstanceUid - Identificador de series instance uid.
   * @returns Resultado de find series by uid conforme al contrato `Promise<DicomSeriesManifests | null>`.
   */
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

  /**
   * Obtiene find series by study.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param dicomStudyManifestId - Identificador de dicom study manifest.
   * @returns Resultado de find series by study conforme al contrato `Promise<DicomSeriesManifests[]>`.
   */
  findSeriesByStudy(
    em: EntityManager,
    dicomStudyManifestId: string,
  ): Promise<DicomSeriesManifests[]> {
    return em.find(DicomSeriesManifests, { dicomStudyManifestId });
  }

  // --- Instancias (UC-60-04, 05) ---

  /**
   * Crea create instance.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create instance conforme al contrato `DicomInstanceManifests`.
   */
  createInstance(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a dicom series manifest.
       */
      dicomSeriesManifestId: string;
      /**
       * Valor de sop instance uid mantenido por la instancia.
       */
      sopInstanceUid: string;
      /**
       * Valor de sop class uid mantenido por la instancia.
       */
      sopClassUid?: string;
      /**
       * Valor de instance number mantenido por la instancia.
       */
      instanceNumber?: number;
      /**
       * Valor de transfer syntax uid mantenido por la instancia.
       */
      transferSyntaxUid?: string;
      /**
       * Identificador asociado a object manifest.
       */
      objectManifestId: string;
      /**
       * Valor de frame count mantenido por la instancia.
       */
      frameCount?: number;
      /**
       * Valor de metadata json mantenido por la instancia.
       */
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

  /**
   * Ejecuta la operación count instances by series.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param dicomSeriesManifestId - Identificador de dicom series manifest.
   * @returns Resultado de count instances by series conforme al contrato `Promise<number>`.
   */
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
      /**
       * Identificador asociado a tenant.
       */
      tenantId?: string;
      /**
       * Identificador asociado a principal.
       */
      principalId: string;
      /**
       * Valor de operation mantenido por la instancia.
       */
      operation: string;
      /**
       * Valor de study instance uid mantenido por la instancia.
       */
      studyInstanceUid?: string;
      /**
       * Valor de series instance uid mantenido por la instancia.
       */
      seriesInstanceUid?: string;
      /**
       * Valor de sop instance uid mantenido por la instancia.
       */
      sopInstanceUid?: string;
      /**
       * Valor de purpose of use code mantenido por la instancia.
       */
      purposeOfUseCode?: string;
      /**
       * Valor de outcome mantenido por la instancia.
       */
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
