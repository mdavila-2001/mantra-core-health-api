import { CONCEPTS, type AuthenticatedUser } from '../../../../../common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { MyResourcesResponseDto } from '../../../presentation/dto';
import { PRACTITIONER_PROFILE_TABLES } from '../../../domain/resource/practitioner-profile-tables';
import { SchedulingAgendaRepository } from '../../../infrastructure/repositories';

/**
 * The caller's own active agendas in a tenant and how each receives booking
 * requests (v4.2.88). Without a practitioner profile the list is empty: there
 * is nothing of theirs to configure.
 */
@Injectable()
export class ListMyResourcesUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly agendaRepo: SchedulingAgendaRepository,
  ) {}

  async execute(
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<MyResourcesResponseDto> {
    const profileId = actor.practitionerProfileId;
    if (profileId === undefined) return { items: [] };
    const resources = await this.agendaRepo.findResources(this.em.fork(), {
      tenantId,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
    return {
      items: resources
        .filter(
          (r) =>
            r.resourceRefId === profileId &&
            PRACTITIONER_PROFILE_TABLES.includes(r.resourceRefType),
        )
        .map((r) => ({
          id: r.id,
          name: r.name,
          requiresApproval: r.requiresApproval,
        })),
    };
  }
}
