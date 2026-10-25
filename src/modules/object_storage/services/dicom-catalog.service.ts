import { SEED, getCurrentTenantId, requireTenantId } from '../../../common';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { hasPrivilegedTenantRole } from '../../../common/tenant/tenant-resolution';
import { ClinicalReadService } from '../../clinical/services';
import { DicomRepository, ObjectStorageRepository } from '../repositories';
import {
  DICOM_STUDY_LIFECYCLE,
  DICOMWEB_OPERATION,
  DICOMWEB_OUTCOME,
  OBJECT_ACCESS_PURPOSES,
  OBJECT_LIFECYCLE,
} from '../constants';
import { ObjectStorageErrorReason } from '../object_storage.error-reasons';
import { findObjectAccessDenial } from './object-access.policy';
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
   * @param clinicalAccess - Política del expediente: autoriza la lectura de los
   *                         estudios de un paciente (OBJ-01).
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly dicomRepo: DicomRepository,
    private readonly storageRepo: ObjectStorageRepository,
    private readonly clinicalAccess: ClinicalReadService,
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
   *
   * **El tenant sale del contexto del gateway, no del cuerpo** (OBJ-01): el
   * cuerpo sólo puede confirmarlo. El paciente y el estudio de imagen que cita
   * deben existir y ser coherentes con ese tenant, y cada objeto que una
   * instancia referencia tiene que ser del mismo tenant; de lo contrario un
   * gateway catalogaría el píxel de otra organización en su propio estudio.
   */
  async catalogStudy(
    dto: CatalogDicomStudyDto,
    actor: AuthenticatedUser,
  ): Promise<CatalogDicomStudyResponseDto> {
    const tenantId = this.ownerTenantId(dto.tenantId, actor);
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
        tenantId,
        dto.studyInstanceUid,
      );
      const studyCreated = study === null;
      if (studyCreated) await this.assertClinicalReferences(tx, dto, tenantId);
      study ??= this.dicomRepo.createStudy(tx, {
        tenantId,
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
        if (seriesDto.thumbnailObjectManifestId) {
          await this.requireManifestInTenant(
            tx,
            seriesDto.thumbnailObjectManifestId,
            tenantId,
            { seriesInstanceUid: seriesDto.seriesInstanceUid },
          );
        }
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
          await this.requireManifestInTenant(
            tx,
            instanceDto.objectManifestId,
            tenantId,
            { sopInstanceUid: instanceDto.sopInstanceUid },
          );

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
      const deny = (
        reason: string,
        cause?: string,
      ): DicomInstanceAccessResponseDto => {
        const log = this.dicomRepo.createAccessLog(tx, {
          // `tenant_id` es NOT NULL: sin él, **denegar** el acceso fallaba con
          // 500 y el rechazo no quedaba registrado —justo el caso en el que la
          // traza importa—. Cuando la denegación es porque el estudio no
          // existe, no hay tenant del que tomarlo: se usa el del contexto de la
          // petición, que el interceptor ya verificó.
          tenantId: getCurrentTenantId() ?? SEED.tenantId,
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
            cause,
          },
          'DICOMweb access denied',
        );

        return {
          accessLogId: log.id,
          outcome: DICOMWEB_OUTCOME.DENIED,
          denialReason: reason,
        };
      };

      // Todo lo que queda fuera de alcance responde con el mismo motivo: ni la
      // finalidad, ni el tenant, ni la historia del paciente le dicen a quien
      // prueba UIDs cuál acertó. La causa concreta sólo va al registro.
      const denyOutOfScope = (cause: string) =>
        deny(ObjectStorageErrorReason.DICOM_ACCESS_DENIED, cause);

      // Sin una finalidad que la política entienda no se sirve imagen clínica: el
      // texto declarado por el consumidor no es autorización.
      if (
        !purposeOfUseCode ||
        !OBJECT_ACCESS_PURPOSES.includes(purposeOfUseCode)
      ) {
        return denyOutOfScope('PURPOSE_NOT_ALLOWED');
      }

      // El estudio se resuelve dentro del tenant activo: el UID de otra
      // organización responde igual que uno que no existe.
      const activeTenantId = getCurrentTenantId();
      const study = activeTenantId
        ? await this.dicomRepo.findStudyByUid(
            tx,
            activeTenantId,
            studyInstanceUid,
          )
        : null;
      if (!study) return denyOutOfScope('STUDY_NOT_AVAILABLE');

      // La misma política que la URL firmada: custodia del tenant y, para el
      // estudio de un paciente, la política del expediente (turno de hoy,
      // relación asistencial vigente, acceso autorizado o titularidad).
      const denial = await findObjectAccessDenial(
        this.clinicalAccess,
        study,
        actor,
        purposeOfUseCode,
      );
      if (denial) return denyOutOfScope(denial);

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
      // Un objeto de otro tenant colgando de este estudio no se sirve.
      if (manifest.tenantId !== study.tenantId) {
        return denyOutOfScope('MANIFEST_TENANT_MISMATCH');
      }
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

  /**
   * Tenant propietario de lo que el gateway cataloga: el del contexto. El
   * cuerpo sólo puede confirmarlo, y el actor tiene que pertenecer a él (o ser
   * de plataforma, que elige el tenant). Todo lo demás responde como recurso
   * fuera de alcance.
   */
  private ownerTenantId(
    declaredTenantId: string | undefined,
    actor: AuthenticatedUser,
  ): string {
    const tenantId = requireTenantId();
    const operates =
      hasPrivilegedTenantRole(actor) ||
      (actor.tenantIds ?? []).includes(tenantId);
    if (
      !operates ||
      (declaredTenantId !== undefined && declaredTenantId !== tenantId)
    ) {
      throw this.catalogOutOfScope();
    }
    return tenantId;
  }

  /** Excepción uniforme del catálogo: ausente y ajeno responden igual. */
  private catalogOutOfScope(
    details?: Record<string, unknown>,
  ): ResourceNotFoundException {
    return new ResourceNotFoundException(
      'El objeto de la instancia no existe',
      details,
      ObjectStorageErrorReason.DICOM_CATALOG_OUT_OF_SCOPE,
    );
  }

  /**
   * El objeto que una instancia o una miniatura referencia: tiene que existir y
   * ser del tenant del gateway.
   */
  private async requireManifestInTenant(
    tx: EntityManager,
    objectManifestId: string,
    tenantId: string,
    details: Record<string, unknown>,
  ): Promise<void> {
    const manifest = await this.storageRepo.findManifestById(
      tx,
      objectManifestId,
    );
    if (!manifest || manifest.tenantId !== tenantId) {
      throw this.catalogOutOfScope({ ...details, objectManifestId });
    }
  }

  /**
   * El paciente y el estudio de imagen que el cuerpo cita al crear el estudio
   * deben existir y ser coherentes con el tenant del gateway.
   *
   * Declarar un paciente exige el estudio de imagen que lo respalda: ese estudio
   * (en custodia del tenant y de ese mismo paciente) es la única prueba de que
   * la organización tiene relación con él. Con sólo `patientProfileId` un
   * gateway ataría imágenes al expediente de cualquier persona.
   */
  private async assertClinicalReferences(
    tx: EntityManager,
    dto: CatalogDicomStudyDto,
    tenantId: string,
  ): Promise<void> {
    if (
      dto.patientProfileId &&
      (!dto.imagingStudyId ||
        !(await this.dicomRepo.patientProfileExists(tx, dto.patientProfileId)))
    ) {
      throw this.catalogOutOfScope();
    }
    if (
      dto.imagingStudyId &&
      !(await this.dicomRepo.imagingStudyInScope(
        tx,
        dto.imagingStudyId,
        tenantId,
        dto.patientProfileId,
      ))
    ) {
      throw this.catalogOutOfScope();
    }
  }

  /** Modalidades distintas presentes en el estudio, en orden estable. */
  private modalityCodes(dto: CatalogDicomStudyDto): string[] {
    const codes = dto.series
      .map((series) => series.modality)
      .filter((modality): modality is string => modality !== undefined);

    return [...new Set(codes)].sort();
  }
}
