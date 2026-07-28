import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { TrackingDisclosureVersions } from '../entities';

/** Datos de alta de una versión de disclosure (UC-28-03). */
export interface CreateDisclosureVersionData {
  /**
   * Valor de document code mantenido por la instancia.
   */
  documentCode: string;
  /**
   * Valor de version number mantenido por la instancia.
   */
  versionNumber: number;
  /**
   * Identificador asociado a jurisdiction concept.
   */
  jurisdictionConceptId: string;
  /**
   * Identificador asociado a file.
   */
  fileId?: string;
  /**
   * Valor de content hash mantenido por la instancia.
   */
  contentHash?: string;
  /**
   * Valor de effective from mantenido por la instancia.
   */
  effectiveFrom: Date;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a `telemetry.tracking_disclosure_versions`. */
@Injectable()
export class TrackingDisclosureVersionsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<TrackingDisclosureVersions | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<TrackingDisclosureVersions | null> {
    return em.findOne(TrackingDisclosureVersions, { id });
  }

  /**
   * Obtiene find by document version.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param documentCode - Valor de document code requerido por la operación.
   * @param versionNumber - Valor de version number requerido por la operación.
   * @returns Resultado de find by document version conforme al contrato `Promise<TrackingDisclosureVersions | null>`.
   */
  findByDocumentVersion(
    em: EntityManager,
    documentCode: string,
    versionNumber: number,
  ): Promise<TrackingDisclosureVersions | null> {
    return em.findOne(TrackingDisclosureVersions, {
      documentCode,
      versionNumber,
    });
  }

  /** Versiones abiertas (sin effective_to) del mismo documento, para superseder. */
  findOpenByDocument(
    em: EntityManager,
    documentCode: string,
  ): Promise<TrackingDisclosureVersions[]> {
    return em.find(TrackingDisclosureVersions, {
      documentCode,
      effectiveTo: null,
    });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `TrackingDisclosureVersions`.
   */
  create(
    em: EntityManager,
    data: CreateDisclosureVersionData,
  ): TrackingDisclosureVersions {
    return em.create(
      TrackingDisclosureVersions,
      {
        documentCode: data.documentCode,
        versionNumber: data.versionNumber,
        jurisdictionConceptId: data.jurisdictionConceptId,
        fileId: data.fileId,
        contentHash: data.contentHash,
        effectiveFrom: data.effectiveFrom,
        statusConceptId: data.statusConceptId,
        createdAt: new Date(),
        createdByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }
}
