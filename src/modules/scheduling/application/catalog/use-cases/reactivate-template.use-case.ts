import {
  CONCEPTS,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../../../common';
import { CatalogAccess } from '../support/catalog-access';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ReactivateTemplateResponseDto } from '../../../presentation/dto';
import { SchedulingCatalogRepository } from '../../../infrastructure/repositories';

/** Reactiva una plantilla retirada. */
@Injectable()
export class ReactivateTemplateUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly access: CatalogAccess,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ReactivateTemplateUseCase.name);
  }

  async execute(
    templateId: string,
    actor: AuthenticatedUser,
  ): Promise<ReactivateTemplateResponseDto> {
    this.logger.info(
      { operation: 'scheduling.template.reactivate', templateId },
      'Reactivating schedule template',
    );

    return this.em.transactional(async (tx) => {
      const template = await this.catalogRepo.findTemplateById(tx, templateId);
      if (!template) {
        throw new ResourceNotFoundException('Plantilla no encontrada', {
          templateId,
        });
      }

      const resource = await this.catalogRepo.findResourceById(
        tx,
        template.resourceId,
      );
      if (!resource) {
        throw new ResourceNotFoundException(
          'Recurso de la plantilla no encontrado',
          { resourceId: template.resourceId },
        );
      }
      this.access.assertActorResource(resource, actor);

      // Reactivar lo que ya está vigente no es un error del que haya que
      // avisar: es que alguien tocó dos veces. Se responde lo mismo.
      if (template.statusConceptId !== CONCEPTS.TEMPLATE_RETIRED) {
        return {
          id: templateId,
          statusConceptId: template.statusConceptId,
          slotsPendientes: false,
        };
      }

      await this.catalogRepo.reactivateTemplate(
        tx,
        templateId,
        CONCEPTS.TEMPLATE_PUBLISHED,
        actor.id,
      );

      return {
        id: templateId,
        statusConceptId: CONCEPTS.TEMPLATE_PUBLISHED,
        // Siempre true al volver de retirado: retirar borró los cupos libres.
        slotsPendientes: true,
      };
    });
  }
}
