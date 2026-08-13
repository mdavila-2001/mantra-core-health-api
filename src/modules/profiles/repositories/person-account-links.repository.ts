import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PersonAccountLinks } from '../entities';
import { createdBy } from '../../../common';
import { PROF } from '../profiles.concepts';

/** Datos de un vínculo persona-cuenta de portal. */
export interface CreateAccountLinkData {
  /**
   * Identificador asociado a person.
   */
  personId: string;
  /**
   * Identificador asociado a user.
   */
  userId: string;
  /**
   * Identificador asociado a link type concept.
   */
  linkTypeConceptId: string;
  /**
   * Identificador asociado a verification status concept.
   */
  verificationStatusConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `profiles.person_account_links`. */
@Injectable()
export class PersonAccountLinksRepository {
  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `PersonAccountLinks`.
   */
  create(em: EntityManager, data: CreateAccountLinkData): PersonAccountLinks {
    return em.create(
      PersonAccountLinks,
      {
        personId: data.personId,
        userId: data.userId,
        linkTypeConceptId: data.linkTypeConceptId,
        verificationStatusConceptId: data.verificationStatusConceptId,
        statusConceptId: data.statusConceptId,
        validFrom: data.validFrom,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Vínculo ACTIVO de un usuario con su persona.
   *
   * Es lo que permite que un endpoint de autoservicio resuelva "la persona del
   * que llama" sin aceptar un id en el cuerpo — que sería pedirle al cliente que
   * declare a quién representa.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param userId - Cuenta autenticada.
   * @returns El vínculo activo, o `null` si la cuenta no tiene persona.
   */
  findActiveByUser(
    em: EntityManager,
    userId: string,
  ): Promise<PersonAccountLinks | null> {
    return em.findOne(PersonAccountLinks, {
      userId,
      statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
    });
  }

  /**
   * Vínculo activo de una persona con su cuenta (el titular, `SELF`).
   *
   * Es el camino de vuelta que faltaba: dado un perfil de profesional se
   * necesita saber qué usuario lo encarna para concederle su rol asistencial
   * cuando se verifica la matrícula.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param personId - Persona de la que se busca la cuenta.
   * @returns El vínculo activo, si lo hay.
   */
  findActiveByPerson(
    em: EntityManager,
    personId: string,
  ): Promise<PersonAccountLinks | null> {
    return em.findOne(PersonAccountLinks, {
      personId,
      statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
    });
  }

  /** Marca SUPERSEDED el vínculo activo previo del mismo usuario (uq active_user). */
  supersedeActiveForUser(
    em: EntityManager,
    userId: string,
    now: Date,
  ): Promise<number> {
    return em.nativeUpdate(
      PersonAccountLinks,
      { userId, statusConceptId: PROF.ACCOUNT_LINK_ACTIVE },
      {
        statusConceptId: PROF.ACCOUNT_LINK_SUPERSEDED,
        validTo: now,
        updatedAt: now,
      },
    );
  }

  /** Revoca los vínculos activos de una persona (p. ej. al registrar defunción). */
  revokeActiveForPerson(
    em: EntityManager,
    personId: string,
    now: Date,
  ): Promise<number> {
    return em.nativeUpdate(
      PersonAccountLinks,
      { personId, statusConceptId: PROF.ACCOUNT_LINK_ACTIVE },
      {
        statusConceptId: PROF.ACCOUNT_LINK_REVOKED,
        validTo: now,
        updatedAt: now,
      },
    );
  }
}
