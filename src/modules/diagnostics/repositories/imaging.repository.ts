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
  tenantId: string;
  endpointTypeConceptId: string;
  baseUri: string;
  statusConceptId: string;
  storageRegionConceptId?: string;
  actorUserId?: string;
}

/** Datos de alta de un estudio de imagen (STOW-RS). */
export interface CreateImagingStudyData {
  patientProfileId: string;
  imagingEndpointId: string;
  dicomStudyInstanceUid: string;
  statusConceptId: string;
  custodianTenantId: string;
  accessionNumber?: string;
  encounterId?: string;
  serviceRequestId?: string;
  numberOfSeries?: number;
  numberOfInstances?: number;
  actorUserId?: string;
}

/**
 * Acceso a datos del subdominio de imagen: endpoints DICOM, estudios (con
 * auditoría y `row_version`), series e instancias (append-only), ubicaciones de
 * objeto en almacenamiento y eventos de dosis de radiación (append-only).
 */
@Injectable()
export class ImagingRepository {
  findEndpoint(em: EntityManager, id: string): Promise<ImagingEndpoints | null> {
    return em.findOne(ImagingEndpoints, { id });
  }

  findStudy(em: EntityManager, id: string): Promise<ImagingStudies | null> {
    return em.findOne(ImagingStudies, { id });
  }

  findStudyByUid(em: EntityManager, dicomStudyInstanceUid: string): Promise<ImagingStudies | null> {
    return em.findOne(ImagingStudies, { dicomStudyInstanceUid });
  }

  createEndpoint(em: EntityManager, data: CreateImagingEndpointData): ImagingEndpoints {
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

  createSeries(
    em: EntityManager,
    data: {
      imagingStudyId: string;
      dicomSeriesInstanceUid: string;
      modalityConceptId: string;
      bodySiteConceptId?: string;
      seriesNumber?: number;
      description?: string;
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

  createInstance(
    em: EntityManager,
    data: {
      imagingSeriesId: string;
      dicomSopInstanceUid: string;
      sopClassConceptId: string;
      instanceNumber?: number;
      retrievalUri?: string;
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

  createObjectLocation(
    em: EntityManager,
    data: {
      imagingInstanceId: string;
      storageBackendId: string;
      objectKey: string;
      contentHash: string;
      sizeBytes: string;
      statusConceptId: string;
      transferSyntaxUid?: string;
      isPrimary?: boolean;
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
      custodianTenantId: string;
      patientProfileId: string;
      imagingStudyId: string;
      recordedAt: Date;
      imagingSeriesId?: string;
      doseLengthProduct?: string;
      computedTomographyDoseIndex?: string;
      doseAreaProduct?: string;
      effectiveDoseMsv?: string;
      unitConceptId?: string;
      sourceSopInstanceUid?: string;
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
