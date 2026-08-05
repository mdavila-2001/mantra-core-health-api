import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ConsentEvidence } from '../entities';

/** Datos de una fila de evidencia inmutable (append-only). */
export interface RecordEvidenceData {
  /**
   * Identificador asociado a subject type concept.
   */
  subjectTypeConceptId: string;
  /**
   * Identificador asociado a subject.
   */
  subjectId: string;
  /**
   * Identificador asociado a evidence type concept.
   */
  evidenceTypeConceptId: string;
  /**
   * Identificador asociado a document file.
   */
  documentFileId?: string;
  /**
   * Identificador asociado a signature.
   */
  signatureId?: string;
  /**
   * Identificador asociado a captured channel concept.
   */
  capturedChannelConceptId?: string;
  /**
   * Valor de policy snapshot hash mantenido por la instancia.
   */
  policySnapshotHash?: string;
  /**
   * Valor de evidence hash mantenido por la instancia.
   */
  evidenceHash?: string;
  /**
   * Identificador asociado a recorded by user.
   */
  recordedByUserId?: string;
}

/**
 * Acceso a datos de `consent.consent_evidence`. Tabla IMMUTABLE append-only: solo
 * INSERT (sin `row_version`, sin UPDATE/DELETE). La integridad reproducible se
 * apoya en `evidence_hash` y `policy_snapshot_hash`.
 */
@Injectable()
export class ConsentEvidenceRepository {
  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `ConsentEvidence`.
   */
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
