import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ImagingEndpoints,
  ImagingStudies,
  ImagingSeries,
  ImagingInstances,
  DicomObjectLocations,
  RadiationDoseEvents,
} from '../entities';
import { createdBy } from '../../../common';

/** Datos de alta de un endpoint DICOM (endpoint de soporte). */
export interface CreateImagingEndpointData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a endpoint type concept.
   */
  endpointTypeConceptId: string;
  /**
   * Valor de base uri mantenido por la instancia.
   */
  baseUri: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a storage region concept.
   */
  storageRegionConceptId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Datos de alta de un estudio de imagen (STOW-RS). */
export interface CreateImagingStudyData {
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a imaging endpoint.
   */
  imagingEndpointId: string;
  /**
   * Valor de dicom study instance uid mantenido por la instancia.
   */
  dicomStudyInstanceUid: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a custodian tenant.
   */
  custodianTenantId: string;
  /**
   * Valor de accession number mantenido por la instancia.
   */
  accessionNumber?: string;
  /**
   * Identificador asociado a encounter.
   */
  encounterId?: string;
  /**
   * Identificador asociado a service request.
   */
  serviceRequestId?: string;
  /**
   * Valor de number of series mantenido por la instancia.
   */
  numberOfSeries?: number;
  /**
   * Valor de number of instances mantenido por la instancia.
   */
  numberOfInstances?: number;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos del subdominio de imagen: endpoints DICOM, estudios (con
 * auditoría y `row_version`), series e instancias (append-only), ubicaciones de
 * objeto en almacenamiento y eventos de dosis de radiación (append-only).
 */
@Injectable()
export class ImagingRepository {
  /**
   * Obtiene find endpoint.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find endpoint conforme al contrato `Promise<ImagingEndpoints | null>`.
   */
  findEndpoint(
    em: EntityManager,
    id: string,
  ): Promise<ImagingEndpoints | null> {
    return em.findOne(ImagingEndpoints, { id });
  }

  /**
   * Obtiene find study.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find study conforme al contrato `Promise<ImagingStudies | null>`.
   */
  /**
   * Estudios de imagen de un paciente, acotados al tenant custodio.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param custodianTenantId - Tenant custodio, obligatorio.
   * @param patientProfileId - Paciente.
   * @param limit - Tamaño de página.
   * @param offset - Desplazamiento.
   * @returns Sus estudios, del más reciente al más antiguo.
   */
  findStudiesByPatient(
    em: EntityManager,
    custodianTenantId: string,
    patientProfileId: string,
    limit: number,
    offset: number,
  ): Promise<ImagingStudies[]> {
    return em.find(
      ImagingStudies,
      { custodianTenantId, patientProfileId },
      { orderBy: { createdAt: 'DESC', id: 'ASC' }, limit, offset },
    );
  }

  findStudy(em: EntityManager, id: string): Promise<ImagingStudies | null> {
    return em.findOne(ImagingStudies, { id });
  }

  /**
   * Obtiene find study by uid.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param dicomStudyInstanceUid - Identificador de dicom study instance uid.
   * @returns Resultado de find study by uid conforme al contrato `Promise<ImagingStudies | null>`.
   */
  findStudyByUid(
    em: EntityManager,
    dicomStudyInstanceUid: string,
  ): Promise<ImagingStudies | null> {
    return em.findOne(ImagingStudies, { dicomStudyInstanceUid });
  }

  /**
   * Crea create endpoint.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create endpoint conforme al contrato `ImagingEndpoints`.
   */
  createEndpoint(
    em: EntityManager,
    data: CreateImagingEndpointData,
  ): ImagingEndpoints {
    return em.create(
      ImagingEndpoints,
      {
        tenantId: data.tenantId,
        endpointTypeConceptId: data.endpointTypeConceptId,
        baseUri: data.baseUri,
        statusConceptId: data.statusConceptId,
        storageRegionConceptId: data.storageRegionConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create study.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create study conforme al contrato `ImagingStudies`.
   */
  createStudy(em: EntityManager, data: CreateImagingStudyData): ImagingStudies {
    return em.create(
      ImagingStudies,
      {
        patientProfileId: data.patientProfileId,
        imagingEndpointId: data.imagingEndpointId,
        dicomStudyInstanceUid: data.dicomStudyInstanceUid,
        statusConceptId: data.statusConceptId,
        custodianTenantId: data.custodianTenantId,
        accessionNumber: data.accessionNumber,
        encounterId: data.encounterId,
        serviceRequestId: data.serviceRequestId,
        numberOfSeries: data.numberOfSeries,
        numberOfInstances: data.numberOfInstances,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create series.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create series conforme al contrato `ImagingSeries`.
   */
  createSeries(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a imaging study.
       */
      imagingStudyId: string;
      /**
       * Valor de dicom series instance uid mantenido por la instancia.
       */
      dicomSeriesInstanceUid: string;
      /**
       * Identificador asociado a modality concept.
       */
      modalityConceptId: string;
      /**
       * Identificador asociado a body site concept.
       */
      bodySiteConceptId?: string;
      /**
       * Valor de series number mantenido por la instancia.
       */
      seriesNumber?: number;
      /**
       * Valor de description mantenido por la instancia.
       */
      description?: string;
      /**
       * Valor de number of instances mantenido por la instancia.
       */
      numberOfInstances?: number;
    },
  ): ImagingSeries {
    return em.create(
      ImagingSeries,
      {
        imagingStudyId: data.imagingStudyId,
        dicomSeriesInstanceUid: data.dicomSeriesInstanceUid,
        modalityConceptId: data.modalityConceptId,
        bodySiteConceptId: data.bodySiteConceptId,
        seriesNumber: data.seriesNumber,
        description: data.description,
        numberOfInstances: data.numberOfInstances,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Crea create instance.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create instance conforme al contrato `ImagingInstances`.
   */
  createInstance(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a imaging series.
       */
      imagingSeriesId: string;
      /**
       * Valor de dicom sop instance uid mantenido por la instancia.
       */
      dicomSopInstanceUid: string;
      /**
       * Identificador asociado a sop class concept.
       */
      sopClassConceptId: string;
      /**
       * Valor de instance number mantenido por la instancia.
       */
      instanceNumber?: number;
      /**
       * Valor de retrieval uri mantenido por la instancia.
       */
      retrievalUri?: string;
      /**
       * Valor de metadata hash mantenido por la instancia.
       */
      metadataHash?: string;
    },
  ): ImagingInstances {
    return em.create(
      ImagingInstances,
      {
        imagingSeriesId: data.imagingSeriesId,
        dicomSopInstanceUid: data.dicomSopInstanceUid,
        sopClassConceptId: data.sopClassConceptId,
        instanceNumber: data.instanceNumber,
        retrievalUri: data.retrievalUri,
        metadataHash: data.metadataHash,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Crea create object location.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create object location conforme al contrato `DicomObjectLocations`.
   */
  createObjectLocation(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a imaging instance.
       */
      imagingInstanceId: string;
      /**
       * Identificador asociado a storage backend.
       */
      storageBackendId: string;
      /**
       * Valor de object key mantenido por la instancia.
       */
      objectKey: string;
      /**
       * Valor de content hash mantenido por la instancia.
       */
      contentHash: string;
      /**
       * Valor de size bytes mantenido por la instancia.
       */
      sizeBytes: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Valor de transfer syntax uid mantenido por la instancia.
       */
      transferSyntaxUid?: string;
      /**
       * Valor de is primary mantenido por la instancia.
       */
      isPrimary?: boolean;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): DicomObjectLocations {
    return em.create(
      DicomObjectLocations,
      {
        imagingInstanceId: data.imagingInstanceId,
        storageBackendId: data.storageBackendId,
        objectKey: data.objectKey,
        contentHash: data.contentHash,
        sizeBytes: data.sizeBytes,
        statusConceptId: data.statusConceptId,
        transferSyntaxUid: data.transferSyntaxUid,
        isPrimary: data.isPrimary,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Registra un evento de dosis de radiación (append-only, sin flush). */
  recordDoseEvent(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a custodian tenant.
       */
      custodianTenantId: string;
      /**
       * Identificador asociado a patient profile.
       */
      patientProfileId: string;
      /**
       * Identificador asociado a imaging study.
       */
      imagingStudyId: string;
      /**
       * Valor de recorded at mantenido por la instancia.
       */
      recordedAt: Date;
      /**
       * Identificador asociado a imaging series.
       */
      imagingSeriesId?: string;
      /**
       * Valor de dose length product mantenido por la instancia.
       */
      doseLengthProduct?: string;
      /**
       * Valor de computed tomography dose index mantenido por la instancia.
       */
      computedTomographyDoseIndex?: string;
      /**
       * Valor de dose area product mantenido por la instancia.
       */
      doseAreaProduct?: string;
      /**
       * Valor de effective dose msv mantenido por la instancia.
       */
      effectiveDoseMsv?: string;
      /**
       * Identificador asociado a unit concept.
       */
      unitConceptId?: string;
      /**
       * Valor de source sop instance uid mantenido por la instancia.
       */
      sourceSopInstanceUid?: string;
      /**
       * Identificador asociado a device.
       */
      deviceId?: string;
    },
  ): RadiationDoseEvents {
    return em.create(
      RadiationDoseEvents,
      {
        custodianTenantId: data.custodianTenantId,
        patientProfileId: data.patientProfileId,
        imagingStudyId: data.imagingStudyId,
        recordedAt: data.recordedAt,
        imagingSeriesId: data.imagingSeriesId,
        doseLengthProduct: data.doseLengthProduct,
        computedTomographyDoseIndex: data.computedTomographyDoseIndex,
        doseAreaProduct: data.doseAreaProduct,
        effectiveDoseMsv: data.effectiveDoseMsv,
        unitConceptId: data.unitConceptId,
        sourceSopInstanceUid: data.sourceSopInstanceUid,
        deviceId: data.deviceId,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }
}
