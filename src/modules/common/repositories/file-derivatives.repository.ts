import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { FileDerivatives } from '../entities';

/**
 * Datos para vincular una versión derivada (miniatura, OCR) a su versión fuente.
 * Fila de estilo *append*: solo `created_at` + autor, sin `updated_at`/`row_version`.
 */
export interface CreateFileDerivativeData {
  sourceFileVersionId: string;
  derivativeFileVersionId: string;
  derivativeTypeConceptId: string;
  generationProfile?: string;
  actorUserId?: string;
}

/**
 * Acceso a datos de `common.file_derivatives`.
 *
 * Repositorio sin estado: recibe el `EntityManager` activo por parámetro.
 */
@Injectable()
export class FileDerivativesRepository {
  /** Construye la entidad en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreateFileDerivativeData): FileDerivatives {
    return em.create(FileDerivatives, {
      sourceFileVersionId: data.sourceFileVersionId,
      derivativeFileVersionId: data.derivativeFileVersionId,
      derivativeTypeConceptId: data.derivativeTypeConceptId,
      generationProfile: data.generationProfile,
      createdAt: new Date(),
      createdByUserId: data.actorUserId,
    });
  }
}
