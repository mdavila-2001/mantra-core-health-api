import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { IdentityVerificationPolicies } from '../entities';

/** Alta de una política de verificación de identidad (soporte de UC-27-02). */
export interface CreatePolicyData {
  /**
   * Valor de policy code mantenido por la instancia.
   */
  policyCode: string;
  /**
   * Identificador asociado a subject type concept.
   */
  subjectTypeConceptId: string;
  /**
   * Identificador asociado a transaction risk concept.
   */
  transactionRiskConceptId: string;
  /**
   * Identificador asociado a required identity assurance level concept.
   */
  requiredIdentityAssuranceLevelConceptId: string;
  /**
   * Identificador asociado a required authenticator assurance level concept.
   */
  requiredAuthenticatorAssuranceLevelConceptId?: string;
  /**
   * Identificador asociado a required federation assurance level concept.
   */
  requiredFederationAssuranceLevelConceptId?: string;
  /**
   * Valor de evidence requirements json mantenido por la instancia.
   */
  evidenceRequirementsJson?: unknown;
  /**
   * Valor de fraud controls json mantenido por la instancia.
   */
  fraudControlsJson?: unknown;
  /**
   * Valor de version number mantenido por la instancia.
   */
  versionNumber: number;
  /**
   * Valor de effective from mantenido por la instancia.
   */
  effectiveFrom: Date;
  /**
   * Valor de effective to mantenido por la instancia.
   */
  effectiveTo?: Date;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `identity_assurance.identity_verification_policies`. */
@Injectable()
export class IdentityVerificationPoliciesRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<IdentityVerificationPolicies | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<IdentityVerificationPolicies | null> {
    return em.findOne(IdentityVerificationPolicies, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `IdentityVerificationPolicies`.
   */
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
