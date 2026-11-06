import {
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../../../common';
import { CatalogAccess } from '../support/catalog-access';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import {
  ResourceApprovalDto,
  UpdateResourceDto,
} from '../../../presentation/dto';
import { SchedulingCatalogRepository } from '../../../infrastructure/repositories';
import { SchedulingErrorReason } from '../../../scheduling.error-reasons';

/**
 * Edits an existing schedulable resource (v4.2.88): whether booking requests
 * wait for the practitioner. The practitioner edits their own agenda and the
 * scheduling admins any (`assertActorResource`). It applies to requests made
 * from now on; pending ones keep waiting. Concurrent edits are guarded by the
 * entity's `row_version`.
 */
@Injectable()
export class UpdateResourceUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly access: CatalogAccess,
  ) {}

  async execute(
    resourceId: string,
    dto: UpdateResourceDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceApprovalDto> {
    return this.em.transactional(async (tx) => {
      const resource = await this.catalogRepo.findResourceById(tx, resourceId);
      if (!resource) {
        throw new ResourceNotFoundException(
          'Recurso no encontrado',
          { resourceId },
          SchedulingErrorReason.RESOURCE_NOT_FOUND,
        );
      }
      this.access.assertActorResource(resource, actor);
      if (dto.requiresApproval !== undefined) {
        resource.requiresApproval = dto.requiresApproval;
      }
      touch(resource, actor.id);
      await tx.flush();
      return {
        id: resource.id,
        name: resource.name,
        requiresApproval: resource.requiresApproval,
      };
    });
  }
}
