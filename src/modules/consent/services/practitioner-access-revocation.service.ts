import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  PatientProfilesRepository,
  PersonAccountLinksRepository,
} from '../../profiles/infrastructure/repositories';
import { CONS } from '../consent.concepts';
import type { StatusResultDto } from '../dto';
import { ConsentsRepository } from '../repositories';
import { ConsentsService } from './consents.service';

/**
 * The patient revokes a granular access they accepted from a practitioner.
 *
 * Only the consent that backs a practitioner-access request qualifies: any
 * other consent keeps being withdrawn through its own routes. The withdrawal
 * itself (consent, event and its grants, in one transaction) is
 * `ConsentsService.withdrawAsOwner`.
 */
@Injectable()
export class PractitionerAccessRevocationService {
  /**
   * @param em - Persistence context.
   * @param consentsRepo - Consents.
   * @param accountLinksRepo - Account ↔ person links.
   * @param patientProfilesRepo - Patient profile of the person.
   * @param consents - Withdrawal use case.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly consentsRepo: ConsentsRepository,
    private readonly accountLinksRepo: PersonAccountLinksRepository,
    private readonly patientProfilesRepo: PatientProfilesRepository,
    private readonly consents: ConsentsService,
  ) {}

  /**
   * Revokes an accepted request.
   *
   * @param id - Consent that represents the request.
   * @param actor - The patient who owns it.
   * @returns `{ ok: true }` once the consent is withdrawn and its grants revoked.
   * @throws ResourceNotFoundException if it is not a request of this patient.
   * @throws ConflictException (from the withdrawal) if it is not active.
   */
  async revoke(id: string, actor: AuthenticatedUser): Promise<StatusResultDto> {
    const em = this.em.fork();
    const consent = await this.consentsRepo.findById(em, id);
    const link = await this.accountLinksRepo.findActiveByUser(em, actor.id);
    const profile = link
      ? await this.patientProfilesRepo.findById(em, link.personId)
      : null;
    // Missing, foreign and of another category all answer the same 404.
    if (
      !consent ||
      consent.categoryConceptId !== CONS.CATEGORY_PRACTITIONER_ACCESS ||
      !profile ||
      profile.profileId !== consent.patientProfileId
    ) {
      throw new ResourceNotFoundException('Solicitud no encontrada', { id });
    }
    return this.consents.withdrawAsOwner(id, profile.profileId, {}, actor);
  }
}
