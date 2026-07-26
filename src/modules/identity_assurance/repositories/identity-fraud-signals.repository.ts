import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { IdentityFraudSignals } from '../entities';

/** Registro append-only de una señal de fraude (UC-27-07). */
export interface CreateFraudSignalData {
  identityVerificationCaseId: string;
  signalTypeConceptId: string;
  severityConceptId: string;
  confidenceScore?: string;
  sourceConceptId?: string;
  evidenceReference?: string;
  detectedAt?: Date;
  resolutionConceptId: string;
}

/** Acceso a datos de `identity_assurance.identity_fraud_signals` (log append-only). */
@Injectable()
export class IdentityFraudSignalsRepository {
  create(em: EntityManager, data: CreateFraudSignalData): IdentityFraudSignals {
    return em.create(
      IdentityFraudSignals,
      {
        identityVerificationCaseId: data.identityVerificationCaseId,
        signalTypeConceptId: data.signalTypeConceptId,
        severityConceptId: data.severityConceptId,
        confidenceScore: data.confidenceScore,
        sourceConceptId: data.sourceConceptId,
        evidenceReference: data.evidenceReference,
        detectedAt: data.detectedAt ?? new Date(),
        resolutionConceptId: data.resolutionConceptId,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /** Cierra las señales abiertas del caso al resolver la revisión (UC-27-09). */
  async resolveOpenForCase(
    em: EntityManager,
    caseId: string,
    openResolutionConceptId: string,
    resolvedResolutionConceptId: string,
  ): Promise<number> {
    const open = await em.find(IdentityFraudSignals, {
      identityVerificationCaseId: caseId,
      resolutionConceptId: openResolutionConceptId,
    });
    const now = new Date();
    for (const s of open) {
      s.resolutionConceptId = resolvedResolutionConceptId;
      s.resolvedAt = now;
    }
    return open.length;
  }
}
