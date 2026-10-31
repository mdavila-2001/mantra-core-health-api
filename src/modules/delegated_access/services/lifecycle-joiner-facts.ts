import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../common';
import { MfaFactors } from '../../iam/entities';
// Del archivo concreto y no del barril `repositories/`: es el mismo criterio de
// `VerifiedIdentityGuard` y evita el ciclo de importación del barril.
import { findCurrentIdentityAssertionForPerson } from '../../identity_assurance/repositories/identity-assertions.repository';
import { PersonAccountLinks } from '../../profiles/entities';
import { PROF } from '../../profiles/profiles.concepts';
import { SupportAccessRepository } from '../repositories';
import { STATUS } from './concept-maps';

/** Hechos que la lista de ingreso deduce solos (CONTRATO-GOBIERNO §6.1). */
@Injectable()
export class JoinerFactsReader {
  /** @param access - Delegaciones de los vínculos. */
  constructor(private readonly access: SupportAccessRepository) {}

  /**
   * ¿La cuenta tiene identidad verificada por la plataforma? Mismo criterio de
   * `VerifiedIdentityGuard`: persona vinculada con una aserción de identidad vigente.
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param userId - Persona de apoyo.
   * @returns `true` si la plataforma ya verificó su identidad.
   */
  async platformIdentityVerified(
    em: EntityManager,
    userId: string,
  ): Promise<boolean> {
    const link = await em.findOne(PersonAccountLinks, {
      userId,
      statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
    });
    if (!link) return false;
    return !!(await findCurrentIdentityAssertionForPerson(em, link.personId));
  }

  /**
   * ¿Tiene verificación en dos pasos activa (un segundo factor verificado)?
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param userId - Persona de apoyo.
   * @returns `true` si tiene un factor verificado.
   */
  async mfaEnrolled(em: EntityManager, userId: string): Promise<boolean> {
    const factors = await em.find(MfaFactors, {
      userId,
      stateConceptId: CONCEPTS.STATE_VERIFIED,
    });
    return factors.length > 0;
  }

  /**
   * Doctores cubiertos y cuántos todavía no aceptaron (informativo).
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param engagementId - Vínculo.
   * @returns Pendientes y total de delegaciones vigentes.
   */
  async doctorAcceptances(
    em: EntityManager,
    engagementId: string,
  ): Promise<{ pending: number; total: number }> {
    const delegations = (
      await this.access.findDelegationsOfEngagements(em, [engagementId])
    ).filter(({ delegate }) => delegate.statusConceptId === STATUS.ACTIVE);
    return {
      total: delegations.length,
      pending: delegations.filter(({ delegate }) => !delegate.acceptedAt)
        .length,
    };
  }
}
