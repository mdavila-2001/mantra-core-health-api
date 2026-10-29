import {
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../../../common';
import { BlockedBookingsCanceller } from '../support/blocked-bookings-canceller';
import {
  CARE_SPACE_TEMPLATE_GUARD_PORT,
  type CareSpaceTemplateGuardPort,
} from '../../ports/care-space-template-guard.port';
import { CatalogAccess } from '../support/catalog-access';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
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
    @Inject(CARE_SPACE_TEMPLATE_GUARD_PORT)
    private readonly careSpaces: CareSpaceTemplateGuardPort,
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
    // Trae nombres de pacientes: una agenda de otra organización responde 404 a todos.
    this.careSpaces.assertResourceInActiveTenant(resource);
    this.access.assertActorResource(resource, actor);
    // Trae nombres de pacientes: dueño de la agenda, o de su organización.
    this.access.assertMayReadAgendaBookings(resource, actor);

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
