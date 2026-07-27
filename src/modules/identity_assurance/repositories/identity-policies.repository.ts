import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { IdentityVerificationPolicies } from '../entities';

/** Alta de una política de verificación de identidad (soporte de UC-27-02). */
export interface CreatePolicyData {
  policyCode: string;
  subjectTypeConceptId: string;
  transactionRiskConceptId: string;
  requiredIdentityAssuranceLevelConceptId: string;
  requiredAuthenticatorAssuranceLevelConceptId?: string;
  requiredFederationAssuranceLevelConceptId?: string;
  evidenceRequirementsJson?: unknown;
  fraudControlsJson?: unknown;
  versionNumber: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
  statusConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de `identity_assurance.identity_verification_policies`. */
@Injectable()
export class IdentityVerificationPoliciesRepository {
  findById(
    em: EntityManager,
    id: string,
  ): Promise<IdentityVerificationPolicies | null> {
    return em.findOne(IdentityVerificationPolicies, { id });
  }

  create(
    em: EntityManager,
    data: CreatePolicyData,
  ): IdentityVerificationPolicies {
    return em.create(
      IdentityVerificationPolicies,
      {
        policyCode: data.policyCode,
        subjectTypeConceptId: data.subjectTypeConceptId,
        transactionRiskConceptId: data.transactionRiskConceptId,
        requiredIdentityAssuranceLevelConceptId:
          data.requiredIdentityAssuranceLevelConceptId,
        requiredAuthenticatorAssuranceLevelConceptId:
          data.requiredAuthenticatorAssuranceLevelConceptId,
        requiredFederationAssuranceLevelConceptId:
          data.requiredFederationAssuranceLevelConceptId,
        evidenceRequirementsJson: data.evidenceRequirementsJson,
        fraudControlsJson: data.fraudControlsJson,
        versionNumber: data.versionNumber,
        effectiveFrom: data.effectiveFrom,
        effectiveTo: data.effectiveTo,
        statusConceptId: data.statusConceptId,
        createdAt: new Date(),
        createdByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }
}
