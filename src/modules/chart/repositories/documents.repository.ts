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
