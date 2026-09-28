import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { UPLOAD_MIME_ALLOWLIST } from '../../../common/storage/upload-content-type';
import {
  AttachableFileService,
  FileUploadService,
} from '../../common/services';
import type { FileContentDto } from '../../common/dto';
import {
  ClinicalReadService,
  // BR-14 (CL-07): un encuentro sellado no admite más escrituras que lo
  // referencien. Servicio nuevo, independiente, exportado por `ClinicalModule`.
  EncounterSealGuardService,
} from '../../clinical/services';
import { DocumentsRepository } from '../repositories';
import { CHART } from '../chart.concepts';
import { CreateDocumentDto, DocumentResponseDto } from '../dto';

/**
 * Caso de uso de documentos gobernados (UC-15-09). Una transacción crea el
 * `document_records` y sus `document_record_files` (1..n); los payloads viven en
 * object_storage y aquí solo se referencian por `file_id`. El servicio hace
 * `flush` del registro antes de crear los archivos (FK planas).
 */
@Injectable()
export class ChartDocumentsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param documentsRepo - Valor de documents repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   * @param attachableFiles - Comprueba que un archivo referenciado es usable.
   * @param clinicalRead - Resuelve si el actor puede leer la historia del paciente dueño del documento.
   * @param fileUpload - Sirve los bytes de un archivo ya autorizado por contexto.
   * @param encounterSealGuard - Rechaza la escritura si el encuentro está sellado (BR-14/CL-07).
   */
  constructor(
    private readonly em: EntityManager,
    private readonly documentsRepo: DocumentsRepository,
    private readonly logger: PinoLogger,
    private readonly attachableFiles: AttachableFileService,
    private readonly clinicalRead: ClinicalReadService,
    private readonly fileUpload: FileUploadService,
    private readonly encounterSealGuard: EncounterSealGuardService,
  ) {
    this.logger.setContext(ChartDocumentsService.name);
  }

  /** UC-15-09: registra un documento y adjunta sus archivos gobernados. */
  async createDocument(
    dto: CreateDocumentDto,
    actor: AuthenticatedUser,
  ): Promise<DocumentResponseDto> {
    this.logger.info(
      {
        operation: 'chart.document.create',
        actorId: actor.id,
        files: dto.files?.length ?? 0,
      },
      'Attaching patient document',
    );
    return this.em.transactional(async (tx) => {
      // BR-14 (CL-07): un documento no puede nacer contra un encuentro ya
      // sellado.
      if (dto.encounterId) {
        await this.encounterSealGuard.assertEncounterWritable(
          tx,
          dto.encounterId,
        );
      }
      // El vínculo se gobierna acá: cada archivo referenciado tiene que
      // existir, ser del actor y de un tipo admitido para un documento del
      // expediente. En serie (no `Promise.all`) para que el primer rechazo
      // corte antes de tocar la base — no hay registro que revertir.
      for (const f of dto.files ?? []) {
        await this.attachableFiles.assertUsableBy(
          tx,
          f.fileId,
          actor,
          {
            allowedMimeTypes: UPLOAD_MIME_ALLOWLIST.DOCUMENT,
            operation: 'chart.document.create',
          },
          {
            subject: 'El archivo del documento',
            notFound: 'El archivo del documento no existe',
          },
        );
      }

      const record = this.documentsRepo.createRecord(tx, {
        patientProfileId: dto.patientProfileId,
        tenantId: dto.tenantId,
        encounterId: dto.encounterId,
        categoryConceptId: dto.categoryConceptId ?? CHART.DOC_CATEGORY_GENERAL,
        title: dto.title,
        sourceConceptId: dto.sourceConceptId,
        authorText: dto.authorText,
        isExternal: dto.isExternal,
        statusConceptId: CHART.DOC_STATUS_ACTIVE,
        confidentialityConceptId:
          dto.confidentialityConceptId ?? CHART.DOC_CONFIDENTIALITY_NORMAL,
        patientVisibilityConceptId:
          dto.patientVisibilityConceptId ?? CHART.VISIBILITY_PROVIDER_ONLY,
        actorUserId: actor.id,
      });
      // FK planas: persistir el registro antes de sus archivos.
      await tx.flush();

      const files = dto.files ?? [];
      files.forEach((f, index) => {
        this.documentsRepo.createFile(tx, {
          documentRecordId: record.id,
          fileId: f.fileId,
          contentRoleConceptId:
            f.contentRole === 'ATTACHMENT'
              ? CHART.CONTENT_ROLE_ATTACHMENT
              : f.contentRole === 'PRIMARY'
                ? CHART.CONTENT_ROLE_PRIMARY
                : index === 0
                  ? CHART.CONTENT_ROLE_PRIMARY
                  : CHART.CONTENT_ROLE_ATTACHMENT,
          ordinal: f.ordinal ?? index,
          actorUserId: actor.id,
        });
      });

      this.logger.info(
        { operation: 'chart.document.create', documentId: record.id },
        'Patient document attached',
      );
      return {
        id: record.id,
        statusConceptId: record.statusConceptId,
        fileCount: files.length,
        createdAt: record.createdAt,
      };
    });
  }

  /**
   * Bytes de un archivo colgado de un documento del expediente, para quien
   * puede leer la historia del paciente dueño.
   *
   * No confirma cuál de las dos cosas falló —el documento o el archivo— con
   * el mismo mensaje: a quien enumera uuids no se le regala esa distinción.
   *
   * @param documentId - Documento al que el archivo debe pertenecer.
   * @param fileId - Archivo pedido.
   * @param actor - Sesión que pide los bytes.
   * @returns Bytes y tipo MIME para servir por HTTP.
   * @throws ResourceNotFoundException si el documento no existe o el archivo
   *   no cuelga de él.
   * @throws ForbiddenException si el actor no puede leer la historia del paciente.
   */
  async getDocumentFileContent(
    documentId: string,
    fileId: string,
    actor: AuthenticatedUser,
  ): Promise<FileContentDto> {
    const em = this.em.fork();
    const record = await this.documentsRepo.findRecordById(em, documentId);
    if (!record) {
      throw new ResourceNotFoundException('Documento no encontrado', {
        documentId,
      });
    }

    const files = await this.documentsRepo.findFilesForRecords(em, [
      documentId,
    ]);
    if (!files.some((f) => f.fileId === fileId)) {
      throw new ResourceNotFoundException('Documento no encontrado', {
        documentId,
      });
    }

    await this.clinicalRead.assertPuedeLeerHistoria(
      record.patientProfileId,
      actor,
    );

    return this.fileUpload.downloadForAuthorizedContext(
      fileId,
      'chart.document.file.content',
    );
  }
}
