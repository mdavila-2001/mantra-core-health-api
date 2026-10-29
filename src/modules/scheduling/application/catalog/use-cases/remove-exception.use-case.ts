import {
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../../../common';
import { CatalogAccess } from '../support/catalog-access';
import {
  CARE_SPACE_TEMPLATE_GUARD_PORT,
  type CareSpaceTemplateGuardPort,
} from '../../ports/care-space-template-guard.port';
import { assertManualException } from '../support/exception-source';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { SchedulingCatalogRepository } from '../../../infrastructure/repositories';

/** Quita una excepción de disponibilidad. */
@Injectable()
export class RemoveExceptionUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly access: CatalogAccess,
    private readonly logger: PinoLogger,
    @Inject(CARE_SPACE_TEMPLATE_GUARD_PORT)
    private readonly careSpaces: CareSpaceTemplateGuardPort,
  ) {
    this.logger.setContext(RemoveExceptionUseCase.name);
  }

  async execute(exceptionId: string, actor: AuthenticatedUser): Promise<void> {
    await this.em.transactional(async (tx) => {
      const exception = await this.catalogRepo.findExceptionById(
        tx,
        exceptionId,
      );
      if (!exception) {
        throw new ResourceNotFoundException('Excepción no encontrada', {
          exceptionId,
        });
      }
      const resource = await this.catalogRepo.findResourceById(
        tx,
        exception.resourceId,
      );
      if (resource) {
        this.careSpaces.assertResourceInActiveTenant(resource);
        this.access.assertActorResource(resource, actor);
        await this.careSpaces.assertMayManageBound(
          tx,
          resource,
          [resource.careSpaceId],
          actor,
        );
      }
      assertManualException(exception.sourceKindConceptId);

      this.logger.info(
        { operation: 'scheduling.exception.remove', exceptionId },
        'Removing availability exception',
      );
      this.catalogRepo.removeException(tx, exception);
    });
  }
}
