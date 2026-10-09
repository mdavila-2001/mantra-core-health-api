import { CONCEPTS, type AuthenticatedUser } from '../../../../../common';
import { CatalogAccess } from '../support/catalog-access';
import {
  CreateResourceDto,
  ResourceResponseDto,
} from '../../../presentation/dto';
import {
  DEFAULT_SLOT_CAPACITY,
  RESOURCE_TYPE_CONCEPT,
  canonicalRefType,
} from '../../../domain/catalog/catalog-concepts';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { SchedulingCatalogRepository } from '../../../infrastructure/repositories';

/** UC-41-01: define un recurso agendable. */
@Injectable()
export class CreateResourceUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly access: CatalogAccess,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CreateResourceUseCase.name);
  }

  /** UC-41-01: da de alta un recurso agendable. */
  async execute(
    dto: CreateResourceDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceResponseDto> {
    this.access.assertMayCreateResource(dto, actor);
    await this.access.assertAffiliationWithOrganization(dto.tenantId, actor);
    this.logger.info(
      { operation: 'scheduling.resource.create', tenantId: dto.tenantId },
      'Creating schedulable resource',
    );

    return this.em.transactional(async (tx) => {
      const resource = this.catalogRepo.createResource(tx, {
        tenantId: dto.tenantId,
        practiceId: dto.practiceId,
        resourceTypeConceptId: RESOURCE_TYPE_CONCEPT[dto.resourceType],
        resourceRefType: canonicalRefType(dto.resourceRefType),
        resourceRefId: dto.resourceRefId,
        name: dto.name,
        timeZone: dto.timeZone,
        capacity: dto.capacity ?? DEFAULT_SLOT_CAPACITY,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });

      return {
        id: resource.id,
        name: dto.name,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      };
    });
  }
}
