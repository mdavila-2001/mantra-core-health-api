import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DocumentRecords, DocumentRecordFiles } from '../entities';
import { createdBy } from '../../../common';

/** Datos de alta de un registro documental gobernado. */
export interface CreateDocumentRecordData {
  patientProfileId: string;
  tenantId: string;
  encounterId?: string;
  categoryConceptId: string;
  title: string;
  sourceConceptId?: string;
  documentDate?: Date;
  authorText?: string;
  isExternal?: boolean;
  statusConceptId: string;
  confidentialityConceptId?: string;
  patientVisibilityConceptId?: string;
  actorUserId?: string;
}

/** Datos de un archivo asociado (manifiesto en object_storage referenciado por id). */
export interface CreateDocumentFileData {
  documentRecordId: string;
  fileId: string;
  contentRoleConceptId: string;
  ordinal?: number;
  actorUserId?: string;
}

/**
 * Acceso a datos del agregado "documento gobernado": el registro y sus archivos.
 * Métodos stateless que reciben el `EntityManager` activo.
 */
@Injectable()
export class DocumentsRepository {
  createRecord(em: EntityManager, data: CreateDocumentRecordData): DocumentRecords {
    return em.create(
      DocumentRecords,
      {
        patientProfileId: data.patientProfileId,
        tenantId: data.tenantId,
        encounterId: data.encounterId,
        categoryConceptId: data.categoryConceptId,
        title: data.title,
        sourceConceptId: data.sourceConceptId,
        documentDate: data.documentDate,
        authorText: data.authorText,
        isExternal: data.isExternal,
        statusConceptId: data.statusConceptId,
        confidentialityConceptId: data.confidentialityConceptId,
        patientVisibilityConceptId: data.patientVisibilityConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  createFile(em: EntityManager, data: CreateDocumentFileData): DocumentRecordFiles {
    return em.create(
      DocumentRecordFiles,
      {
        documentRecordId: data.documentRecordId,
        fileId: data.fileId,
        contentRoleConceptId: data.contentRoleConceptId,
        ordinal: data.ordinal,
        createdAt: new Date(),
        createdByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }
}
