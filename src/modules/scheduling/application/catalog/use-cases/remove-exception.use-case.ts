import {
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../../../common';
import { CatalogAccess } from '../support/catalog-access';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { SchedulingCatalogRepository } from '../../../infrastructure/repositories';
import { SchedulingErrorReason } from '../../../scheduling.error-reasons';

/** Quita una excepción de disponibilidad. */
@Injectable()
export class RemoveExceptionUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly access: CatalogAccess,
    private readonly logger: PinoLogger,
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
        throw new ResourceNotFoundException(
          'Excepción no encontrada',
          {
            exceptionId,
          },
          SchedulingErrorReason.EXCEPTION_NOT_FOUND,
        );
      }
      const resource = await this.catalogRepo.findResourceById(
        tx,
        exception.resourceId,
      );
      if (resource) this.access.assertActorResource(resource, actor);

      this.logger.info(
        { operation: 'scheduling.exception.remove', exceptionId },
        'Removing availability exception',
      );
      this.catalogRepo.removeException(tx, exception);
    });
  }
}
