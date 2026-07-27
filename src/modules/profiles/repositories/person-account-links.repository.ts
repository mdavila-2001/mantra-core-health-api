import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PersonAccountLinks } from '../entities';
import { createdBy } from '../../../common';
import { PROF } from '../profiles.concepts';

/** Datos de un vínculo persona-cuenta de portal. */
export interface CreateAccountLinkData {
  personId: string;
  userId: string;
  linkTypeConceptId: string;
  verificationStatusConceptId: string;
  statusConceptId: string;
  validFrom: Date;
  actorUserId?: string;
}

/** Acceso a datos de `profiles.person_account_links`. */
@Injectable()
export class PersonAccountLinksRepository {
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
