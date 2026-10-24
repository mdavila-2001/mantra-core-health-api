import {
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../../../common';
import { BlockedBookingsCanceller } from '../support/blocked-bookings-canceller';
import { CatalogAccess } from '../support/catalog-access';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { SchedulingCatalogRepository } from '../../../infrastructure/repositories';
import { TemplateLiveBookingsResponseDto } from '../../../presentation/dto';

/**
 * Las citas vivas de un horario, **antes** de retirarlo.
 *
 * Es la vista previa del retiro (pedido del propietario, 24/10/2026): la
 * pantalla la pide, muestra a quién alcanza —nombre y hora— y recién entonces
 * pregunta si cancelarlas y avisar o conservarlas. Sólo la lee quien administra
 * la agenda: trae nombres de pacientes.
 */
@Injectable()
export class ListTemplateLiveBookingsUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly access: CatalogAccess,
    private readonly blockedBookings: BlockedBookingsCanceller,
  ) {}

  async execute(
    templateId: string,
    actor: AuthenticatedUser,
  ): Promise<TemplateLiveBookingsResponseDto> {
    const em = this.em.fork();
    const template = await this.catalogRepo.findTemplateById(em, templateId);
    if (!template) {
      throw new ResourceNotFoundException('Plantilla no encontrada', {
        templateId,
      });
    }
    const resource = await this.catalogRepo.findResourceById(
      em,
      template.resourceId,
    );
    if (!resource) {
      throw new ResourceNotFoundException(
        'Recurso de la plantilla no encontrado',
        { resourceId: template.resourceId },
      );
    }
    this.access.assertActorResource(resource, actor);

    const slots = await this.catalogRepo.findSlotsOfTemplate(em, templateId);
    const affected = await this.blockedBookings.describe(em, slots);
    return {
      templateId,
      total: affected.cancellable.length + affected.present.length,
      bookings: [...affected.cancellable],
      present: [...affected.present],
    };
  }
}
