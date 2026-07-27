import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ResourceNotFoundException,
  ConflictException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { ImagingRepository } from '../repositories';
import { DIAG } from '../diagnostics.concepts';
import {
  CreateImagingEndpointDto,
  StoreImagingStudyDto,
  RecordDoseEventDto,
  ResourceCreatedDto,
  ImagingStudyStoredDto,
} from '../dto';

/**
 * Casos de uso de imagen médica: ingesta de estudio DICOM vía STOW-RS con sus
 * series, instancias y ubicaciones de objeto (UC-20-11) y registro de evento de
 * dosis de radiación (UC-20-13). Incluye el endpoint de soporte de alta de
 * endpoint DICOM (padre obligatorio del estudio).
 */
@Injectable()
export class DiagnosticsImagingService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: ImagingRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DiagnosticsImagingService.name);
  }

  /** Soporte: da de alta un endpoint DICOM (STOW-RS/WADO). */
  async createEndpoint(
    dto: CreateImagingEndpointDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    this.logger.info(
      { operation: 'diagnostics.imagingEndpoint.create', actorId: actor.id },
      'Creating imaging endpoint',
    );
    return this.em.transactional(async (tx) => {
      if (!dto.tenantId) {
        throw new ConflictException(
          'Falta el tenant del endpoint de imagen',
          {},
        );
      }
      const endpoint = this.repo.createEndpoint(tx, {
        tenantId: dto.tenantId,
        endpointTypeConceptId:
          dto.endpointTypeConceptId ?? DIAG.IMAGING_ENDPOINT_STOW,
        baseUri: dto.baseUri,
        statusConceptId: DIAG.IMAGING_ENDPOINT_ACTIVE,
        storageRegionConceptId: dto.storageRegionConceptId,
        actorUserId: actor.id,
      });
      await tx.flush();
      return { id: endpoint.id, status: endpoint.statusConceptId };
    });
  }

  /** UC-20-11: ingesta idempotente de un estudio DICOM (STOW-RS). */
  async storeStudy(
    dto: StoreImagingStudyDto,
    actor: AuthenticatedUser,
  ): Promise<ImagingStudyStoredDto> {
    this.logger.info(
      {
        operation: 'diagnostics.imagingStudy.store',
        studyUid: dto.dicomStudyInstanceUid,
      },
      'Storing DICOM study',
    );
    return this.em.transactional(async (tx) => {
      const endpoint = await this.repo.findEndpoint(tx, dto.imagingEndpointId);
      if (!endpoint) {
        throw new ResourceNotFoundException(
          'Endpoint de imagen no encontrado',
          {
            imagingEndpointId: dto.imagingEndpointId,
          },
        );
      }
      // Reenvío idempotente: un mismo Study UID no se duplica.
      const existing = await this.repo.findStudyByUid(
        tx,
        dto.dicomStudyInstanceUid,
      );
      if (existing) {
        throw new ConflictException('El estudio DICOM ya fue almacenado', {
          dicomStudyInstanceUid: dto.dicomStudyInstanceUid,
        });
      }

      let instanceTotal = 0;
      for (const s of dto.series) instanceTotal += s.instances?.length ?? 0;

      const study = this.repo.createStudy(tx, {
        patientProfileId: dto.patientProfileId,
        imagingEndpointId: endpoint.id,
        dicomStudyInstanceUid: dto.dicomStudyInstanceUid,
        statusConceptId: DIAG.IMAGING_STUDY_STORED,
        custodianTenantId: dto.custodianTenantId ?? endpoint.tenantId,
        accessionNumber: dto.accessionNumber,
        encounterId: dto.encounterId,
        serviceRequestId: dto.serviceRequestId,
        numberOfSeries: dto.series.length,
        numberOfInstances: instanceTotal,
        actorUserId: actor.id,
      });
      await tx.flush();

      for (const s of dto.series) {
        const series = this.repo.createSeries(tx, {
          imagingStudyId: study.id,
          dicomSeriesInstanceUid: s.dicomSeriesInstanceUid,
          modalityConceptId: s.modalityConceptId ?? DIAG.IMAGING_MODALITY_OTHER,
          seriesNumber: s.seriesNumber,
          numberOfInstances: s.instances?.length ?? 0,
        });
        await tx.flush();

        for (const inst of s.instances ?? []) {
          const instance = this.repo.createInstance(tx, {
            imagingSeriesId: series.id,
            dicomSopInstanceUid: inst.dicomSopInstanceUid,
            sopClassConceptId: inst.sopClassConceptId ?? DIAG.SOP_CLASS_OTHER,
            instanceNumber: inst.instanceNumber,
            retrievalUri: inst.retrievalUri,
          });
          await tx.flush();

          // La ubicación de objeto solo se persiste si viene un backend válido.
          if (inst.storageBackendId && inst.objectKey) {
            this.repo.createObjectLocation(tx, {
              imagingInstanceId: instance.id,
              storageBackendId: inst.storageBackendId,
              objectKey: inst.objectKey,
              contentHash: inst.contentHash ?? '',
              sizeBytes: inst.sizeBytes ?? '0',
              statusConceptId: DIAG.OBJECT_LOCATION_ACTIVE,
              isPrimary: true,
              actorUserId: actor.id,
            });
          }
        }
      }
      await tx.flush();

      return {
        id: study.id,
        status: study.statusConceptId,
        numberOfSeries: dto.series.length,
        numberOfInstances: instanceTotal,
      };
    });
  }

  /** UC-20-13: registra un evento de dosis de radiación sobre un estudio. */
  async recordDoseEvent(
    imagingStudyId: string,
    dto: RecordDoseEventDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    this.logger.info(
      { operation: 'diagnostics.dose.record', imagingStudyId },
      'Recording radiation dose event',
    );
    return this.em.transactional(async (tx) => {
      const study = await this.repo.findStudy(tx, imagingStudyId);
      if (!study)
        throw new ResourceNotFoundException('Estudio de imagen no encontrado', {
          imagingStudyId,
        });

      const event = this.repo.recordDoseEvent(tx, {
        custodianTenantId: study.custodianTenantId,
        patientProfileId: study.patientProfileId,
        imagingStudyId: study.id,
        recordedAt: new Date(),
        imagingSeriesId: dto.imagingSeriesId,
        doseLengthProduct: dto.doseLengthProduct,
        computedTomographyDoseIndex: dto.computedTomographyDoseIndex,
        doseAreaProduct: dto.doseAreaProduct,
        effectiveDoseMsv: dto.effectiveDoseMsv,
        unitConceptId: dto.unitConceptId ?? DIAG.DOSE_UNIT_MGYCM,
        sourceSopInstanceUid: dto.sourceSopInstanceUid,
        deviceId: dto.deviceId,
      });
      // Marca de actualización agregada sobre el estudio.
      touch(study, actor.id);
      await tx.flush();

      return { id: event.id, status: study.statusConceptId };
    });
  }
}
