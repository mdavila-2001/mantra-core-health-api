import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createdBy } from '../../../common';
import {
  RegulatoryDocumentAccessLog,
  RegulatoryDocumentVersions,
  RegulatoryDocuments,
} from '../entities';
import { PHL } from '../pharma_lab.concepts';

/** Acceso a datos del repositorio documental legal y regulatorio. */
@Injectable()
export class RegulatoryRepository {
  /**
   * Obtiene un documento.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador del documento.
   * @returns El documento, o `null` si no existe.
   */
  findDocument(
    em: EntityManager,
    id: string,
  ): Promise<RegulatoryDocuments | null> {
    return em.findOne(RegulatoryDocuments, { id });
  }

  /**
   * Lista los documentos de un laboratorio.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param pharmaLabId - Laboratorio.
   * @returns Documentos ordenados por nombre.
   */
  listDocuments(
    em: EntityManager,
    pharmaLabId: string,
  ): Promise<RegulatoryDocuments[]> {
    return em.find(
      RegulatoryDocuments,
      { pharmaLabId },
      { orderBy: { name: 'asc' } },
    );
  }

  /**
   * Lista los documentos que vencen dentro de un horizonte.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param pharmaLabId - Laboratorio.
   * @param through - Fecha límite, en formato `YYYY-MM-DD`.
   * @returns Documentos vigentes con vencimiento dentro del horizonte.
   */
  listExpiringDocuments(
    em: EntityManager,
    pharmaLabId: string,
    through: string,
  ): Promise<RegulatoryDocuments[]> {
    return em.find(
      RegulatoryDocuments,
      {
        pharmaLabId,
        statusConceptId: { $in: [PHL.DOC_VALID, PHL.DOC_EXPIRING] },
        expiresOn: { $ne: null, $lte: through },
      },
      { orderBy: { expiresOn: 'asc' } },
    );
  }

  /**
   * Crea un documento.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos de la nueva fila.
   * @returns La entidad creada, aún sin `flush`.
   */
  createDocument(
    em: EntityManager,
    data: Record<string, unknown>,
  ): RegulatoryDocuments {
    return em.create(
      RegulatoryDocuments,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }

  /**
   * Crea una versión de documento.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos de la nueva fila.
   * @returns La entidad creada, aún sin `flush`.
   */
  createVersion(
    em: EntityManager,
    data: Record<string, unknown>,
  ): RegulatoryDocumentVersions {
    return em.create(
      RegulatoryDocumentVersions,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }

  /**
   * Obtiene la versión vigente de un documento.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param regulatoryDocumentId - Documento.
   * @returns La versión vigente, o `null` si todas fueron sustituidas.
   */
  findCurrentVersion(
    em: EntityManager,
    regulatoryDocumentId: string,
  ): Promise<RegulatoryDocumentVersions | null> {
    return em.findOne(RegulatoryDocumentVersions, {
      regulatoryDocumentId,
      statusConceptId: PHL.DOC_VALID,
    });
  }

  /**
   * Lista todas las versiones de un documento.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param regulatoryDocumentId - Documento.
   * @returns Versiones de la más reciente a la más antigua.
   */
  listVersions(
    em: EntityManager,
    regulatoryDocumentId: string,
  ): Promise<RegulatoryDocumentVersions[]> {
    return em.find(
      RegulatoryDocumentVersions,
      { regulatoryDocumentId },
      { orderBy: { createdAt: 'desc' } },
    );
  }

  /**
   * Registra una consulta o descarga del repositorio documental.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos del acceso.
   * @returns La entidad creada, aún sin `flush`.
   */
  appendAccess(
    em: EntityManager,
    data: Record<string, unknown>,
  ): RegulatoryDocumentAccessLog {
    const now = new Date();
    return em.create(
      RegulatoryDocumentAccessLog,
      { accessedAt: now, createdAt: now, ...data },
      { partial: true },
    );
  }

  /**
   * Lista los accesos registrados sobre un documento.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param regulatoryDocumentId - Documento.
   * @returns Accesos del más reciente al más antiguo.
   */
  listAccesses(
    em: EntityManager,
    regulatoryDocumentId: string,
  ): Promise<RegulatoryDocumentAccessLog[]> {
    return em.find(
      RegulatoryDocumentAccessLog,
      { regulatoryDocumentId },
      { orderBy: { accessedAt: 'desc' }, limit: 500 },
    );
  }
}
