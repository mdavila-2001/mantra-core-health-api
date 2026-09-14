import { Injectable, Optional } from '@nestjs/common';
import {
  StoragePublicationService,
  guardStorageMutation,
} from '../../../common/storage/storage-publication.service';
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
  constructor(
    @Optional() private readonly publication?: StoragePublicationService,
  ) {}
  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `IdentityEvidenceRecords`.
   */
  async create(
    em: EntityManager,
    data: CreateEvidenceData,
  ): Promise<IdentityEvidenceRecords> {
    await guardStorageMutation(em, this.publication);
    if (data.evidenceFileId)
      await this.publication?.guardFile(em, data.evidenceFileId);
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

  /**
   * La evidencia más reciente aportada para el caso.
   *
   * El autoservicio abre exactamente un registro de evidencia por caso
   * (`openVerification`), pero esto trae "la más reciente" y no "la única"
   * porque nada en el esquema lo garantiza a nivel de constraint.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param caseId - Caso al que pertenece la evidencia.
   * @returns La evidencia más reciente del caso, o `null` si no aportó ninguna.
   */
  findLatestByCase(
    em: EntityManager,
    caseId: string,
  ): Promise<IdentityEvidenceRecords | null> {
    return em.findOne(
      IdentityEvidenceRecords,
      { identityVerificationCaseId: caseId },
      { orderBy: { createdAt: 'DESC' } },
    );
  }
}
