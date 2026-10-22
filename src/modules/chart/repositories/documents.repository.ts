import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DocumentRecords, DocumentRecordFiles } from '../entities';
import { createdBy } from '../../../common';

/** Datos de alta de un registro documental gobernado. */
export interface CreateDocumentRecordData {
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a encounter.
   */
  encounterId?: string;
  /**
   * Identificador asociado a category concept.
   */
  categoryConceptId: string;
  /**
   * Valor de title mantenido por la instancia.
   */
  title: string;
  /**
   * Identificador asociado a source concept.
   */
  sourceConceptId?: string;
  /**
   * Valor de document date mantenido por la instancia.
   */
  documentDate?: Date;
  /**
   * Valor de author text mantenido por la instancia.
   */
  authorText?: string;
  /**
   * Valor de is external mantenido por la instancia.
   */
  isExternal?: boolean;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a confidentiality concept.
   */
  confidentialityConceptId?: string;
  /**
   * Identificador asociado a patient visibility concept.
   */
  patientVisibilityConceptId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Datos de un archivo asociado (manifiesto en object_storage referenciado por id). */
export interface CreateDocumentFileData {
  /**
   * Identificador asociado a document record.
   */
  documentRecordId: string;
  /**
   * Identificador asociado a file.
   */
  fileId: string;
  /**
   * Identificador asociado a content role concept.
   */
  contentRoleConceptId: string;
  /**
   * Valor de ordinal mantenido por la instancia.
   */
  ordinal?: number;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos del agregado "documento gobernado": el registro y sus archivos.
 * Métodos stateless que reciben el `EntityManager` activo.
 */
@Injectable()
export class DocumentsRepository {
  /**
   * Documentos del paciente, del más reciente al más antiguo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientProfileId - Paciente cuyo expediente se lee.
   * @param limit - Tope de documentos.
   * @returns Documentos ordenados por fecha de alta descendente.
   */
  findRecordsByPatient(
    em: EntityManager,
    patientProfileId: string,
    limit: number,
  ): Promise<DocumentRecords[]> {
    return em.find(
      DocumentRecords,
      { patientProfileId },
      { orderBy: { createdAt: 'DESC' }, limit },
    );
  }

  /**
   * Un documento por id, sin sus archivos.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador del documento.
   * @returns El documento, o `null` si no existe.
   */
  findRecordById(
    em: EntityManager,
    id: string,
  ): Promise<DocumentRecords | null> {
    return em.findOne(DocumentRecords, { id });
  }

  /**
   * Documentos de un encuentro, con sus archivos (para el sello y el PDF
   * oficial del cierre: el hash tiene que ser determinista).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param encounterId - Encuentro cuyos documentos se leen.
   * @returns Documentos ordenados por `createdAt, id`, con `files` resuelto.
   */
  async findByEncounter(
    em: EntityManager,
    encounterId: string,
  ): Promise<Array<DocumentRecords & { files: DocumentRecordFiles[] }>> {
    const records = await em.find(
      DocumentRecords,
      { encounterId },
      { orderBy: { createdAt: 'ASC', id: 'ASC' } },
    );
    if (records.length === 0) return [];

    const files = await this.findFilesForRecords(
      em,
      records.map((record) => record.id),
    );
    const filesByRecord = new Map<string, DocumentRecordFiles[]>();
    for (const file of files) {
      const list = filesByRecord.get(file.documentRecordId) ?? [];
      list.push(file);
      filesByRecord.set(file.documentRecordId, list);
    }

    return records.map((record) =>
      Object.assign(record, { files: filesByRecord.get(record.id) ?? [] }),
    );
  }

  /**
   * Archivos gobernados de un lote de documentos, en una sola consulta.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param recordIds - Documentos cuyos archivos se resuelven.
   * @returns Archivos ordenados por `ordinal` ascendente; `[]` sin consultar
   *   si `recordIds` viene vacío.
   */
  findFilesForRecords(
    em: EntityManager,
    recordIds: readonly string[],
  ): Promise<DocumentRecordFiles[]> {
    if (recordIds.length === 0) return Promise.resolve([]);
    return em.find(
      DocumentRecordFiles,
      { documentRecordId: { $in: recordIds } },
      { orderBy: { ordinal: 'ASC' } },
    );
  }

  /**
   * Crea create record.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create record conforme al contrato `DocumentRecords`.
   */
  createRecord(
    em: EntityManager,
    data: CreateDocumentRecordData,
  ): DocumentRecords {
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

  /**
   * Crea create file.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create file conforme al contrato `DocumentRecordFiles`.
   */
  createFile(
    em: EntityManager,
    data: CreateDocumentFileData,
  ): DocumentRecordFiles {
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
