import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { IdentityEvidenceRecords } from '../entities';

/** Aporte de evidencia documental bajo consentimiento (UC-27-03). */
export interface CreateEvidenceData {
  identityVerificationCaseId: string;
  evidenceTypeConceptId: string;
  issuerAuthorityId?: string;
  evidenceIdentifierHash?: string;
  evidenceFileId?: string;
  encryptedEvidenceReference?: string;
  evidenceQualityConceptId?: string;
  issuedAt?: Date;
  expiresAt?: Date;
  collectedUnderConsentId?: string;
  verificationStatusConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de `identity_assurance.identity_evidence_records`. */
@Injectable()
export class IdentityEvidenceRecordsRepository {
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
