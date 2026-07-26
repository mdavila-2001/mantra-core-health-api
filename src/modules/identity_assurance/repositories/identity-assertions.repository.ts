import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { IdentityAssertions } from '../entities';

/** Emisión inmutable de una aserción de identidad (UC-27-10). */
export interface CreateAssertionData {
  identityVerificationCaseId: string;
  issuerIdentityAuthorityId: string;
  subjectTypeConceptId: string;
  subjectEntityId: string;
  assertionTypeConceptId: string;
  assuranceLevelConceptId: string;
  assertionIdentifier?: string;
  assertionHash?: string;
  issuedAt?: Date;
  expiresAt?: Date;
}

/** Acceso a datos de `identity_assurance.identity_assertions` (inmutable salvo revocación). */
@Injectable()
export class IdentityAssertionsRepository {
  findById(em: EntityManager, id: string): Promise<IdentityAssertions | null> {
    return em.findOne(IdentityAssertions, { id });
  }

  create(em: EntityManager, data: CreateAssertionData): IdentityAssertions {
    return em.create(
      IdentityAssertions,
      {
        identityVerificationCaseId: data.identityVerificationCaseId,
        issuerIdentityAuthorityId: data.issuerIdentityAuthorityId,
        subjectTypeConceptId: data.subjectTypeConceptId,
        subjectEntityId: data.subjectEntityId,
        assertionTypeConceptId: data.assertionTypeConceptId,
        assuranceLevelConceptId: data.assuranceLevelConceptId,
        assertionIdentifier: data.assertionIdentifier,
        assertionHash: data.assertionHash,
        issuedAt: data.issuedAt ?? new Date(),
        expiresAt: data.expiresAt,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }
}
