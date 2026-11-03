import { Injectable } from '@nestjs/common';
import { PersonAccountLinksRepository } from '../../../profiles/infrastructure/repositories';
import type { PersonAccountLinksPort } from '../../application/ports/person-account-links.port';
import type { UnitOfWork } from '../../application/ports/unit-of-work';

/** Adaptador al vínculo activo de cuenta provisto por el contexto profiles. */
@Injectable()
export class ProfilesPersonAccountLinksAdapter implements PersonAccountLinksPort {
  constructor(private readonly links: PersonAccountLinksRepository) {}

  async findActiveByPerson(uow: UnitOfWork, personId: string) {
    const link = await this.links.findActiveByPerson(uow, personId);
    return link ? { userId: link.userId } : null;
  }
}
