import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { IdentityAssertions } from '../entities';

/** Emisión inmutable de una aserción de identidad (UC-27-10). */
export interface CreateAssertionData {
  /**
   * Identificador asociado a identity verification case.
   */
  identityVerificationCaseId: string;
  /**
   * Identificador asociado a issuer identity authority.
   */
  issuerIdentityAuthorityId: string;
  /**
   * Identificador asociado a subject type concept.
   */
  subjectTypeConceptId: string;
  /**
   * Identificador asociado a subject entity.
   */
  subjectEntityId: string;
  /**
   * Identificador asociado a assertion type concept.
   */
  assertionTypeConceptId: string;
  /**
   * Identificador asociado a assurance level concept.
   */
  assuranceLevelConceptId: string;
  /**
   * Valor de assertion identifier mantenido por la instancia.
   */
  assertionIdentifier?: string;
  /**
   * Valor de assertion hash mantenido por la instancia.
   */
  assertionHash?: string;
  /**
   * Valor de issued at mantenido por la instancia.
   */
  issuedAt?: Date;
  /**
   * Valor de expires at mantenido por la instancia.
   */
  expiresAt?: Date;
}

/** Acceso a datos de `identity_assurance.identity_assertions` (inmutable salvo revocación). */
@Injectable()
export class IdentityAssertionsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<IdentityAssertions | null>`.
   */
  findById(em: EntityManager, id: string): Promise<IdentityAssertions | null> {
    return em.findOne(IdentityAssertions, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `IdentityAssertions`.
   */
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
