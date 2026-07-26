import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { TrackingDisclosureVersions } from '../entities';

/** Datos de alta de una versión de disclosure (UC-28-03). */
export interface CreateDisclosureVersionData {
  documentCode: string;
  versionNumber: number;
  jurisdictionConceptId: string;
  fileId?: string;
  contentHash?: string;
  effectiveFrom: Date;
  statusConceptId: string;
  actorUserId?: string;
}

/** Acceso a `telemetry.tracking_disclosure_versions`. */
@Injectable()
export class TrackingDisclosureVersionsRepository {
  findById(em: EntityManager, id: string): Promise<TrackingDisclosureVersions | null> {
    return em.findOne(TrackingDisclosureVersions, { id });
  }

  findByDocumentVersion(
    em: EntityManager,
    documentCode: string,
    versionNumber: number,
  ): Promise<TrackingDisclosureVersions | null> {
    return em.findOne(TrackingDisclosureVersions, { documentCode, versionNumber });
  }

  /** Versiones abiertas (sin effective_to) del mismo documento, para superseder. */
  findOpenByDocument(em: EntityManager, documentCode: string): Promise<TrackingDisclosureVersions[]> {
    return em.find(TrackingDisclosureVersions, { documentCode, effectiveTo: null });
  }

  create(em: EntityManager, data: CreateDisclosureVersionData): TrackingDisclosureVersions {
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
