import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  getCurrentTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { FileUploadService } from '../../common/services';
import type { FileContentDto } from '../../common/dto';
// N-04 (BR-13/BR-15): toda lectura y descarga de la historia deja rastro en
// `audit.data_access_log`, mismo repositorio sin estado que ya usa
// `ClinicalReadService.getPatientSummary`.
import { DataAccessLogRepository } from '../../audit/repositories';
import { AUD } from '../../audit/audit.concepts';
import { ClinicalNotesRepository, DocumentsRepository } from '../repositories';
import { CHART } from '../chart.concepts';
import type {
  MyChartDocumentListResponseDto,
  MyChartNoteListResponseDto,
} from '../dto';

/** Recurso que se asienta en `audit.data_access_log` al leer la historia liberada. */
const NOTES_RESOURCE_TYPE = 'PATIENT_RELEASED_NOTES';
const DOCUMENTS_RESOURCE_TYPE = 'PATIENT_VISIBLE_DOCUMENTS';
const DOCUMENT_FILE_RESOURCE_TYPE = 'PATIENT_DOCUMENT_FILE';
/** Propósito de uso que respalda estas lecturas: el titular viendo su propia historia. */
const PURPOSE = 'PATIENT_ACCESS';

/**
 * BR-15 (CL-30, CL-36): la cara de lectura de `charts/me`.
 *
 * Archivo **nuevo e independiente** de `chart-read.service.ts` (el que arma
 * `GET /charts/patients/:id/chart` para el médico): reutiliza los mismos
 * repositorios de sólo lectura (`ClinicalNotesRepository`,
 * `DocumentsRepository` — sus métodos `findHeadersByPatient`/
 * `findRecordsByPatient` ya existen y no se modifican) pero con **otra
 * pregunta de autorización** (el titular sale del claim, nunca de la ruta,
 * patrón `forms-me.controller.ts`) y **otro recorte** (sólo lo liberado, sólo
 * lo visible). No se tocó `clinical-notes.repository.ts` (dueño M3).
 */
@Injectable()
export class ChartMeReadService {
  constructor(
    private readonly em: EntityManager,
    private readonly notesRepo: ClinicalNotesRepository,
    private readonly documentsRepo: DocumentsRepository,
    private readonly fileUpload: FileUploadService,
    private readonly dataAccessLogRepo: DataAccessLogRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ChartMeReadService.name);
  }

  /** El `patientProfileId` de la sesión, o 412 si no hay uno (mismo criterio que `forms-me`). */
  private requirePatientProfile(actor: AuthenticatedUser): string {
    if (!actor.patientProfileId) {
      throw new PreconditionFailedException(
        'La sesión no tiene perfil de paciente asociado',
        { userId: actor.id },
      );
    }
    return actor.patientProfileId;
  }

  /**
   * GET `/charts/me/notes`: sólo notas con una versión liberada
   * (`currentReleasedVersionId`) — nunca un borrador ni una retenida.
   */
  async listMyNotes(
    actor: AuthenticatedUser,
    limit: number,
  ): Promise<MyChartNoteListResponseDto> {
    const patientProfileId = this.requirePatientProfile(actor);
    this.logger.info(
      { operation: 'chart.me.notes.list', limit },
      'Leyendo evoluciones liberadas del titular',
    );
    const em = this.em.fork();

    // Se pide de más para poder declarar el recorte tras filtrar por
    // liberación: un header sin versión liberada no cuenta para el `limit`
    // del titular.
    const headers = await this.notesRepo.findHeadersByPatient(
      em,
      patientProfileId,
      limit * 4 + 20,
    );
    const released = headers.filter(
      (header) =>
        header.patientReleaseStatusConceptId === CHART.RELEASE_RELEASED &&
        header.currentReleasedVersionId,
    );
    const truncated = released.length > limit;
    const page = released.slice(0, limit);

    const versionsById = await this.notesRepo.findVersionsByIds(
      em,
      page.map((header) => header.currentReleasedVersionId as string),
    );

    this.dataAccessLogRepo.record(em, {
      userId: actor.id,
      actionConceptId: AUD.ACTION_READ,
      patientProfileId,
      tenantId: getCurrentTenantId(),
      purpose: PURPOSE,
      resourceType: NOTES_RESOURCE_TYPE,
      resourceId: patientProfileId,
      recordedByUserId: actor.id,
    });
    await em.flush();

    return {
      items: page.map((header) => {
        const version = versionsById.get(
          header.currentReleasedVersionId as string,
        );
        return {
          id: header.id,
          encounterId: header.encounterId,
          noteTypeConceptId: header.noteTypeConceptId,
          chiefComplaintText: version?.chiefComplaintText,
          subjectiveText: version?.subjectiveText,
          objectiveText: version?.objectiveText,
          assessmentText: version?.assessmentText,
          planText: version?.planText,
          releasedAt: version?.signedAt,
          createdAt: header.createdAt,
        };
      }),
      limit,
      truncated,
    };
  }

  /**
   * GET `/charts/me/documents`: sólo documentos con visibilidad al paciente.
   */
  async listMyDocuments(
    actor: AuthenticatedUser,
    limit: number,
  ): Promise<MyChartDocumentListResponseDto> {
    const patientProfileId = this.requirePatientProfile(actor);
    this.logger.info(
      { operation: 'chart.me.documents.list', limit },
      'Leyendo documentos visibles del titular',
    );
    const em = this.em.fork();

    const records = await this.documentsRepo.findRecordsByPatient(
      em,
      patientProfileId,
      limit * 4 + 20,
    );
    const visible = records.filter(
      (record) =>
        record.patientVisibilityConceptId === CHART.VISIBILITY_PATIENT_VISIBLE,
    );
    const truncated = visible.length > limit;
    const page = visible.slice(0, limit);

    const files = await this.documentsRepo.findFilesForRecords(
      em,
      page.map((record) => record.id),
    );
    const filesByRecord = new Map<string, typeof files>();
    for (const file of files) {
      const bucket = filesByRecord.get(file.documentRecordId) ?? [];
      bucket.push(file);
      filesByRecord.set(file.documentRecordId, bucket);
    }

    this.dataAccessLogRepo.record(em, {
      userId: actor.id,
      actionConceptId: AUD.ACTION_READ,
      patientProfileId,
      tenantId: getCurrentTenantId(),
      purpose: PURPOSE,
      resourceType: DOCUMENTS_RESOURCE_TYPE,
      resourceId: patientProfileId,
      recordedByUserId: actor.id,
    });
    await em.flush();

    return {
      items: page.map((record) => ({
        id: record.id,
        encounterId: record.encounterId,
        title: record.title,
        categoryConceptId: record.categoryConceptId,
        createdAt: record.createdAt,
        files: (filesByRecord.get(record.id) ?? []).map((file) => ({
          fileId: file.fileId,
          contentRole:
            file.contentRoleConceptId === CHART.CONTENT_ROLE_PRIMARY
              ? ('PRIMARY' as const)
              : ('ATTACHMENT' as const),
          ordinal: file.ordinal,
        })),
      })),
      limit,
      truncated,
    };
  }

  /**
   * GET `/charts/me/documents/:documentId/files/:fileId/content`.
   *
   * **El mismo 404** para: el documento no existe, no es del titular, no es
   * visible para el paciente, o el archivo no cuelga de ese documento — regla
   * explícita de BR-15 §5, mismo criterio que `forms/me`.
   */
  async getMyDocumentFileContent(
    documentId: string,
    fileId: string,
    actor: AuthenticatedUser,
  ): Promise<FileContentDto> {
    const patientProfileId = this.requirePatientProfile(actor);
    const em = this.em.fork();

    const record = await this.documentsRepo.findRecordById(em, documentId);
    const noExiste = () =>
      new ResourceNotFoundException('Documento no encontrado', {
        documentId,
      });
    if (
      !record ||
      record.patientProfileId !== patientProfileId ||
      record.patientVisibilityConceptId !== CHART.VISIBILITY_PATIENT_VISIBLE
    ) {
      throw noExiste();
    }

    const files = await this.documentsRepo.findFilesForRecords(em, [
      documentId,
    ]);
    if (!files.some((f) => f.fileId === fileId)) {
      throw noExiste();
    }

    this.dataAccessLogRepo.record(em, {
      userId: actor.id,
      actionConceptId: AUD.ACTION_READ,
      patientProfileId,
      tenantId: getCurrentTenantId(),
      purpose: PURPOSE,
      resourceType: DOCUMENT_FILE_RESOURCE_TYPE,
      resourceId: documentId,
      recordedByUserId: actor.id,
    });
    await em.flush();

    return this.fileUpload.downloadForAuthorizedContext(
      fileId,
      'chart.me.document.file.content',
    );
  }
}
