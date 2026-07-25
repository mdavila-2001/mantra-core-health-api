import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ConsentEvidence } from '../entities';

/** Datos de una fila de evidencia inmutable (append-only). */
export interface RecordEvidenceData {
  subjectTypeConceptId: string;
  subjectId: string;
  evidenceTypeConceptId: string;
  documentFileId?: string;
  signatureId?: string;
  capturedChannelConceptId?: string;
  policySnapshotHash?: string;
  evidenceHash?: string;
  recordedByUserId?: string;
}

/**
 * Acceso a datos de `consent.consent_evidence`. Tabla IMMUTABLE append-only: solo
 * INSERT (sin `row_version`, sin UPDATE/DELETE). La integridad reproducible se
 * apoya en `evidence_hash` y `policy_snapshot_hash`.
 */
@Injectable()
export class ConsentEvidenceRepository {
  create(em: EntityManager, data: RecordEvidenceData): ConsentEvidence {
    return em.create(
      ConsentEvidence,
      {
        subjectTypeConceptId: data.subjectTypeConceptId,
        subjectId: data.subjectId,
        evidenceTypeConceptId: data.evidenceTypeConceptId,
        documentFileId: data.documentFileId,
        signatureId: data.signatureId,
        capturedChannelConceptId: data.capturedChannelConceptId,
        policySnapshotHash: data.policySnapshotHash,
        evidenceHash: data.evidenceHash,
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }
}
