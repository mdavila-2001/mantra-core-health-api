import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { IdentityFraudSignals } from '../entities';

/** Registro append-only de una señal de fraude (UC-27-07). */
export interface CreateFraudSignalData {
  /**
   * Identificador asociado a identity verification case.
   */
  identityVerificationCaseId: string;
  /**
   * Identificador asociado a signal type concept.
   */
  signalTypeConceptId: string;
  /**
   * Identificador asociado a severity concept.
   */
  severityConceptId: string;
  /**
   * Valor de confidence score mantenido por la instancia.
   */
  confidenceScore?: string;
  /**
   * Identificador asociado a source concept.
   */
  sourceConceptId?: string;
  /**
   * Valor de evidence reference mantenido por la instancia.
   */
  evidenceReference?: string;
  /**
   * Valor de detected at mantenido por la instancia.
   */
  detectedAt?: Date;
  /**
   * Identificador asociado a resolution concept.
   */
  resolutionConceptId: string;
}

/** Acceso a datos de `identity_assurance.identity_fraud_signals` (log append-only). */
@Injectable()
export class IdentityFraudSignalsRepository {
  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `IdentityFraudSignals`.
   */
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
