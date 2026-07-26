import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { type AuthenticatedUser } from '../../../common';
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
  constructor(
    private readonly em: EntityManager,
    private readonly documentsRepo: DocumentsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ChartDocumentsService.name);
  }

  /** UC-15-09: registra un documento y adjunta sus archivos gobernados. */
  async createDocument(
    dto: CreateDocumentDto,
    actor: AuthenticatedUser,
  ): Promise<DocumentResponseDto> {
    this.logger.info(
      { operation: 'chart.document.create', actorId: actor.id, files: dto.files?.length ?? 0 },
      'Attaching patient document',
    );
    return this.em.transactional(async (tx) => {
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
        confidentialityConceptId: dto.confidentialityConceptId ?? CHART.DOC_CONFIDENTIALITY_NORMAL,
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
}
