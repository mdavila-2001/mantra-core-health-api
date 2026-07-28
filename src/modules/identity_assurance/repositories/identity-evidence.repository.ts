import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { IdentityEvidenceRecords } from '../entities';

/** Aporte de evidencia documental bajo consentimiento (UC-27-03). */
export interface CreateEvidenceData {
  /**
   * Identificador asociado a identity verification case.
   */
  identityVerificationCaseId: string;
  /**
   * Identificador asociado a evidence type concept.
   */
  evidenceTypeConceptId: string;
  /**
   * Identificador asociado a issuer authority.
   */
  issuerAuthorityId?: string;
  /**
   * Valor de evidence identifier hash mantenido por la instancia.
   */
  evidenceIdentifierHash?: string;
  /**
   * Identificador asociado a evidence file.
   */
  evidenceFileId?: string;
  /**
   * Valor de encrypted evidence reference mantenido por la instancia.
   */
  encryptedEvidenceReference?: string;
  /**
   * Identificador asociado a evidence quality concept.
   */
  evidenceQualityConceptId?: string;
  /**
   * Valor de issued at mantenido por la instancia.
   */
  issuedAt?: Date;
  /**
   * Valor de expires at mantenido por la instancia.
   */
  expiresAt?: Date;
  /**
   * Identificador asociado a collected under consent.
   */
  collectedUnderConsentId?: string;
  /**
   * Identificador asociado a verification status concept.
   */
  verificationStatusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `identity_assurance.identity_evidence_records`. */
@Injectable()
export class IdentityEvidenceRecordsRepository {
  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `IdentityEvidenceRecords`.
   */
  create(em: EntityManager, data: CreateEvidenceData): IdentityEvidenceRecords {
    return em.create(
      IdentityEvidenceRecords,
      {
        identityVerificationCaseId: data.identityVerificationCaseId,
        evidenceTypeConceptId: data.evidenceTypeConceptId,
        issuerAuthorityId: data.issuerAuthorityId,
        evidenceIdentifierHash: data.evidenceIdentifierHash,
        evidenceFileId: data.evidenceFileId,
        encryptedEvidenceReference: data.encryptedEvidenceReference,
        evidenceQualityConceptId: data.evidenceQualityConceptId,
        issuedAt: data.issuedAt,
        expiresAt: data.expiresAt,
        collectedUnderConsentId: data.collectedUnderConsentId,
        verificationStatusConceptId: data.verificationStatusConceptId,
        createdAt: new Date(),
        createdByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }
}
