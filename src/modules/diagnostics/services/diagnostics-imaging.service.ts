import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { ImagingRepository } from '../repositories';
import { DIAG } from '../diagnostics.concepts';
import { DiagnosticsScopeService } from './diagnostics-scope.service';
import { DiagnosticsPatientAccessService } from './diagnostics-patient-access.service';
import {
  CreateImagingEndpointDto,
  StoreImagingStudyDto,
  RecordDoseEventDto,
  ResourceCreatedDto,
  ImagingStudyStoredDto,
  ImagingStudySummaryDto,
} from '../dto';

/**
 * Casos de uso de imagen médica: ingesta de estudio DICOM vía STOW-RS con sus
 * series, instancias y ubicaciones de objeto (UC-20-11) y registro de evento de
 * dosis de radiación (UC-20-13). Incluye el endpoint de soporte de alta de
 * endpoint DICOM (padre obligatorio del estudio).
 */
@Injectable()
export class DiagnosticsImagingService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param repo - Valor de repo requerido por la operación.
   * @param scope - Resolvedor de recursos acotados al tenant activo.
   * @param patientAccess - Política clínica profesional–paciente.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: ImagingRepository,
    private readonly scope: DiagnosticsScopeService,
    private readonly patientAccess: DiagnosticsPatientAccessService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DiagnosticsImagingService.name);
  }

  /** Soporte: da de alta un endpoint DICOM (STOW-RS/WADO). */
  /**
   * Estudios de imagen de un paciente.
   *
   * Sin esta lectura, un estudio almacenado sólo era accesible por el uuid que
   * devolvía su POST: el clínico que pidió la prueba no tenía forma de
   * encontrar su resultado.
   *
   * @param tenantId - Tenant custodio (del contexto de la petición).
   * @param patientProfileId - Paciente consultado.
   * @param actor - Profesional que lee: necesita vínculo vigente con el paciente.
   * @param limit - Tamaño de página.
   * @param offset - Desplazamiento.
   * @returns Sus estudios, del más reciente al más antiguo.
   */
  async listStudiesByPatient(
    tenantId: string,
    patientProfileId: string,
    actor: AuthenticatedUser,
    limit = 50,
    offset = 0,
  ): Promise<ImagingStudySummaryDto[]> {
    await this.patientAccess.assertCanReadPatient(patientProfileId, actor);
    const studies = await this.repo.findStudiesByPatient(
      this.em,
      tenantId,
      patientProfileId,
      limit,
      offset,
    );
    return studies.map((s) => ({
      id: s.id,
      patientProfileId: s.patientProfileId,
      serviceRequestId: s.serviceRequestId,
      statusConceptId: s.statusConceptId,
      studyInstanceUid: s.dicomStudyInstanceUid,
    }));
  }

  async createEndpoint(
    dto: CreateImagingEndpointDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    this.logger.info(
      { operation: 'diagnostics.imagingEndpoint.create', actorId: actor.id },
      'Creating imaging endpoint',
    );
    // El propietario sale del contexto verificado, nunca del cuerpo.
    const tenantId = this.scope.activeTenantFor(dto.tenantId);
    return this.em.transactional(async (tx) => {
      const endpoint = this.repo.createEndpoint(tx, {
        tenantId,
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
      // Toda la cadena se resuelve dentro del tenant antes de escribir nada.
      const custodianTenantId = this.scope.activeTenantFor(
        dto.custodianTenantId,
      );
      const endpoint = await this.scope.endpoint(tx, dto.imagingEndpointId);
      if (dto.encounterId) {
        await this.scope.encounter(tx, dto.encounterId, dto.patientProfileId);
      }
      if (dto.serviceRequestId) {
        await this.scope.serviceRequest(
          tx,
          dto.serviceRequestId,
          dto.patientProfileId,
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
        custodianTenantId,
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
      const study = await this.scope.study(tx, imagingStudyId);
      if (dto.imagingSeriesId) {
        await this.scope.seriesOfStudy(tx, study, dto.imagingSeriesId);
      }

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
