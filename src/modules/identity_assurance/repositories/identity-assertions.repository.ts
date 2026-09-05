import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { IdentityAssertions } from '../entities';
import { IDA } from '../identity_assurance.concepts';

/** Sujetos cuya aserción prueba la identidad de una persona. */
const PERSON_SUBJECT_TYPES = [
  IDA.SUBJECT_PATIENT_IDENTITY,
  IDA.SUBJECT_PRACTITIONER_IDENTITY,
];

/**
 * Aserción de identidad vigente de una persona: emitida sobre ella como sujeto,
 * no revocada, y sin caducidad o con una caducidad todavía futura.
 *
 * Es **el** predicado de «identidad verificada» del sistema, y está aquí suelto
 * a propósito. Lo consultan dos consumidores que no comparten módulo — el guard
 * transversal `VerifiedIdentityGuard` (`common/auth`) y el resumen propio del
 * paciente (`profiles`) — y ninguno de los dos puede inyectar
 * `IdentityAssertionsRepository` sin reordenar módulos: el guard vive en un
 * módulo global que se carga antes que los de dominio, y `profiles` es el módulo
 * que `identity_assurance` importa, así que inyectarlo cerraría el ciclo. Una
 * función que recibe el `EntityManager` no necesita contenedor de DI, y dos
 * copias del mismo `$or` se separan solas con el tiempo.
 *
 * La vigencia se resuelve contra el reloj de cada llamada, no contra un valor
 * cacheado: una aserción revocada por fraude tiene que cerrar el acceso en la
 * petición siguiente.
 *
 * @param em - Contexto de persistencia o transacción activa.
 * @param personId - Identificador de la persona sujeto de la aserción.
 * @returns La aserción vigente, o `null` si la persona no tiene ninguna.
 */
export function findCurrentIdentityAssertionForPerson(
  em: EntityManager,
  personId: string,
): Promise<IdentityAssertions | null> {
  const now = new Date();
  return em.findOne(IdentityAssertions, {
    subjectTypeConceptId: { $in: PERSON_SUBJECT_TYPES },
    subjectEntityId: personId,
    revokedAt: null,
    // Una aserción sin caducidad no expira; con caducidad, debe estar vigente.
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  });
}

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
   * Obtiene la aserción de identidad vigente de una persona.
   *
   * Delega en `findCurrentIdentityAssertionForPerson`, que es la misma consulta
   * que usan los consumidores de fuera del módulo; este método es la puerta para
   * quien sí puede inyectar el repositorio.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param personId - Identificador de la persona sujeto de la aserción.
   * @returns La aserción vigente, o `null` si la persona no tiene ninguna.
   */
  findCurrentForPerson(
    em: EntityManager,
    personId: string,
  ): Promise<IdentityAssertions | null> {
    return findCurrentIdentityAssertionForPerson(em, personId);
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
