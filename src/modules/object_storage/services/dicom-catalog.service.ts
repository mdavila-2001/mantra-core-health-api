import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { DicomRepository, ObjectStorageRepository } from '../repositories';
import {
  DICOM_STUDY_LIFECYCLE,
  DICOMWEB_OPERATION,
  DICOMWEB_OUTCOME,
  OBJECT_LIFECYCLE,
} from '../constants';
import {
  CatalogDicomStudyDto,
  CatalogDicomStudyResponseDto,
  DicomInstanceAccessResponseDto,
} from '../dto';

/**
 * Catálogo DICOM: jerarquía estudio → serie → instancia y registro de accesos
 * DICOMweb (UC-60-04, UC-60-05).
 *
 * El módulo cataloga **referencias**: el píxel vive como objeto ya
 * materializado, y aquí sólo se guarda qué instancia DICOM apunta a cuál.
 */
@Injectable()
export class DicomCatalogService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param dicomRepo - Valor de dicom repo requerido por la operación.
   * @param storageRepo - Valor de storage repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly dicomRepo: DicomRepository,
    private readonly storageRepo: ObjectStorageRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DicomCatalogService.name);
  }

  /**
   * UC-60-04: catalogar la jerarquía del estudio.
   *
   * Es reentrante: un router DICOM que reenvía el mismo estudio no duplica nada,
   * porque los UID son únicos en su nivel. Los contadores se **recuentan** al
   * final en lugar de irse sumando, para que un reenvío parcial no los deje
   * inflados.
   */
  async catalogStudy(
    dto: CatalogDicomStudyDto,
    _actor: AuthenticatedUser,
  ): Promise<CatalogDicomStudyResponseDto> {
    this.logger.info(
      {
        operation: 'object-storage.dicom.catalog',
        studyInstanceUid: dto.studyInstanceUid,
        series: dto.series.length,
      },
      'Cataloguing DICOM study',
    );

    return this.em.transactional(async (tx) => {
      let study = await this.dicomRepo.findStudyByUidForUpdate(
        tx,
        dto.tenantId,
        dto.studyInstanceUid,
      );
      const studyCreated = study === null;
      study ??= this.dicomRepo.createStudy(tx, {
        tenantId: dto.tenantId,
        patientProfileId: dto.patientProfileId,
        imagingStudyId: dto.imagingStudyId,
        studyInstanceUid: dto.studyInstanceUid,
        accessionNumber: dto.accessionNumber,
        studyDate: dto.studyDate ? new Date(dto.studyDate) : undefined,
        modalityCodes: this.modalityCodes(dto),
        lifecycleState: DICOM_STUDY_LIFECYCLE.AVAILABLE,
      });

      let instancesAdded = 0;
      let instancesSkipped = 0;
      let instanceCount = 0;

      for (const seriesDto of dto.series) {
        let series = await this.dicomRepo.findSeriesByUidForUpdate(
          tx,
          study.id,
          seriesDto.seriesInstanceUid,
        );
        series ??= this.dicomRepo.createSeries(tx, {
          dicomStudyManifestId: study.id,
          seriesInstanceUid: seriesDto.seriesInstanceUid,
          modality: seriesDto.modality,
          seriesNumber: seriesDto.seriesNumber,
          bodyPartExamined: seriesDto.bodyPartExamined,
          thumbnailObjectManifestId: seriesDto.thumbnailObjectManifestId,
        });

        for (const instanceDto of seriesDto.instances) {
          const already = await this.dicomRepo.findInstanceByUid(
            tx,
            series.id,
            instanceDto.sopInstanceUid,
          );
          if (already) {
            instancesSkipped += 1;
            continue;
          }

          // La instancia referencia un objeto que ya tiene que existir: sin él,
          // el catálogo apuntaría a un píxel que nadie subió.
          const manifest = await this.storageRepo.findManifestById(
            tx,
            instanceDto.objectManifestId,
          );
          if (!manifest) {
            throw new ResourceNotFoundException(
              'El objeto de la instancia no existe',
              {
                sopInstanceUid: instanceDto.sopInstanceUid,
                objectManifestId: instanceDto.objectManifestId,
              },
            );
          }

          this.dicomRepo.createInstance(tx, {
            dicomSeriesManifestId: series.id,
            sopInstanceUid: instanceDto.sopInstanceUid,
            sopClassUid: instanceDto.sopClassUid,
            instanceNumber: instanceDto.instanceNumber,
            transferSyntaxUid: instanceDto.transferSyntaxUid,
            objectManifestId: instanceDto.objectManifestId,
            frameCount: instanceDto.frameCount,
            metadataJson: instanceDto.metadataJson,
          });
          instancesAdded += 1;
        }

        const seriesInstances = await this.dicomRepo.countInstancesBySeries(
          tx,
          series.id,
        );
        series.instanceCount = seriesInstances;
        instanceCount += seriesInstances;
      }

      const seriesList = await this.dicomRepo.findSeriesByStudy(tx, study.id);
      study.seriesCount = seriesList.length;
      study.instanceCount = instanceCount;

      return {
        studyId: study.id,
        studyInstanceUid: dto.studyInstanceUid,
        seriesCount: seriesList.length,
        instanceCount,
        instancesAdded,
        instancesSkipped,
        studyCreated,
      };
    });
  }

  /**
   * UC-60-05: resolver una instancia por su jerarquía DICOMweb y registrar el
   * acceso.
   *
   * **El intento denegado también se registra.** Un log que sólo guarda los
   * accesos que salieron bien no sirve para vigilar accesos indebidos, que es
   * justo para lo que existe.
   */
  async resolveInstance(
    studyInstanceUid: string,
    seriesInstanceUid: string,
    sopInstanceUid: string,
    purposeOfUseCode: string | undefined,
    actor: AuthenticatedUser,
  ): Promise<DicomInstanceAccessResponseDto> {
    this.logger.warn(
      {
        operation: 'object-storage.dicomweb.access',
        studyInstanceUid,
        actorUserId: actor.id,
        purposeOfUseCode,
      },
      'DICOMweb instance access',
    );

    return this.em.transactional(async (tx) => {
      /**
       * Ejecuta la operación deny.
       *
       * @param reason - Valor de reason requerido por la operación.
       * @returns Resultado de deny conforme al contrato `DicomInstanceAccessResponseDto`.
       */
      const deny = (reason: string): DicomInstanceAccessResponseDto => {
        const log = this.dicomRepo.createAccessLog(tx, {
          principalId: actor.id,
          operation: DICOMWEB_OPERATION.WADO_RS,
          studyInstanceUid,
          seriesInstanceUid,
          sopInstanceUid,
          purposeOfUseCode,
          outcome: DICOMWEB_OUTCOME.DENIED,
        });

        this.logger.warn(
          {
            operation: 'object-storage.dicomweb.access',
            studyInstanceUid,
            reason,
          },
          'DICOMweb access denied',
        );

        return {
          accessLogId: log.id,
          outcome: DICOMWEB_OUTCOME.DENIED,
          denialReason: reason,
        };
      };

      // Sin propósito de uso no se sirve imagen clínica: es el dato que después
      // permite juzgar si el acceso estaba justificado.
      if (!purposeOfUseCode) {
        return deny('No se declaró el propósito de uso');
      }

      const study = await this.dicomRepo.findStudyByUid(tx, studyInstanceUid);
      if (!study) return deny('El estudio no existe');

      const series = await this.dicomRepo.findSeriesByUid(
        tx,
        study.id,
        seriesInstanceUid,
      );
      if (!series) return deny('La serie no existe en el estudio');

      const instance = await this.dicomRepo.findInstanceByUid(
        tx,
        series.id,
        sopInstanceUid,
      );
      if (!instance) return deny('La instancia no existe en la serie');

      const manifest = await this.storageRepo.findManifestById(
        tx,
        instance.objectManifestId,
      );
      if (!manifest) return deny('El objeto de la instancia no existe');
      if (
        manifest.lifecycleState === OBJECT_LIFECYCLE.PENDING_DELETION ||
        manifest.lifecycleState === OBJECT_LIFECYCLE.CORRUPT
      ) {
        return deny('El objeto no está disponible');
      }

      const log = this.dicomRepo.createAccessLog(tx, {
        tenantId: study.tenantId,
        principalId: actor.id,
        operation: DICOMWEB_OPERATION.WADO_RS,
        studyInstanceUid,
        seriesInstanceUid,
        sopInstanceUid,
        purposeOfUseCode,
        outcome: DICOMWEB_OUTCOME.ALLOWED,
      });

      return {
        accessLogId: log.id,
        outcome: DICOMWEB_OUTCOME.ALLOWED,
        objectManifestId: manifest.id,
        currentVersionId: manifest.currentVersionId,
      };
    });
  }

  // --- Apoyo ---

  /** Modalidades distintas presentes en el estudio, en orden estable. */
  private modalityCodes(dto: CatalogDicomStudyDto): string[] {
    const codes = dto.series
      .map((series) => series.modality)
      .filter((modality): modality is string => modality !== undefined);

    return [...new Set(codes)].sort();
  }
}
