import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { FileVersions } from '../entities';

/**
 * Datos para registrar una versión de archivo. Es una fila de estilo *append*:
 * no tiene `updated_at` ni `row_version`, solo `recorded_at` + autor.
 */
export interface CreateFileVersionData {
  /**
   * Identificador asociado a file.
   */
  fileId: string;
  /**
   * Valor de version number mantenido por la instancia.
   */
  versionNumber: number;
  /**
   * Identificador asociado a storage provider concept.
   */
  storageProviderConceptId: string;
  /**
   * Identificador asociado a storage region concept.
   */
  storageRegionConceptId: string;
  /**
   * Valor de storage uri mantenido por la instancia.
   */
  storageUri: string;
  /**
   * Valor de mime type mantenido por la instancia.
   */
  mimeType: string;
  /** La columna `size_bytes` es bigint → se materializa como string. */
  sizeBytes: string;
  /**
   * Identificador asociado a checksum algorithm concept.
   */
  checksumAlgorithmConceptId: string;
  /**
   * Valor de content hash mantenido por la instancia.
   */
  contentHash: string;
  /**
   * Identificador asociado a encryption status concept.
   */
  encryptionStatusConceptId: string;
  /**
   * Identificador asociado a malware scan status concept.
   */
  malwareScanStatusConceptId: string;
  /**
   * Valor de recorded at mantenido por la instancia.
   */
  recordedAt: Date;
  /**
   * Identificador asociado a recorded by user.
   */
  recordedByUserId?: string;
}

/**
 * Acceso a datos de `common.file_versions`.
 *
 * Repositorio sin estado: recibe el `EntityManager` activo por parámetro.
 */
@Injectable()
export class FileVersionsRepository {
  /** Busca una versión por id; `null` si no existe. */
  findById(em: EntityManager, id: string): Promise<FileVersions | null> {
    return em.findOne(FileVersions, { id });
  }

  /** Busca una versión concreta acotada a su archivo (validación de pertenencia). */
  findByFileAndId(
    em: EntityManager,
    fileId: string,
    id: string,
  ): Promise<FileVersions | null> {
    return em.findOne(FileVersions, { id, fileId });
  }

  /**
   * Devuelve el mayor `version_number` existente para un archivo (0 si no hay
   * ninguna). El servicio lo usa para calcular el siguiente número de versión.
   */
  async maxVersionNumber(em: EntityManager, fileId: string): Promise<number> {
    const latest = await em.findOne(
      FileVersions,
      { fileId },
      { orderBy: { versionNumber: 'DESC' } },
    );
    return latest?.versionNumber ?? 0;
  }

  /** Construye la entidad en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreateFileVersionData): FileVersions {
    return em.create(FileVersions, {
      fileId: data.fileId,
      versionNumber: data.versionNumber,
      storageProviderConceptId: data.storageProviderConceptId,
      storageRegionConceptId: data.storageRegionConceptId,
      storageUri: data.storageUri,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
      checksumAlgorithmConceptId: data.checksumAlgorithmConceptId,
      contentHash: data.contentHash,
      encryptionStatusConceptId: data.encryptionStatusConceptId,
      malwareScanStatusConceptId: data.malwareScanStatusConceptId,
      recordedAt: data.recordedAt,
      recordedByUserId: data.recordedByUserId,
    });
  }
}
