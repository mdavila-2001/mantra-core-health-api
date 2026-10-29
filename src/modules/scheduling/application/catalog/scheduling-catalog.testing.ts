import { SchedulingCatalogService } from './scheduling-catalog.service';
import {
  AgendaOverlapGuard,
  CatalogAccess,
  SlotMoveNotifier,
  type SpaceResourceLinker,
} from './support';
import { BlockedBookingsCanceller } from './support/blocked-bookings-canceller';
import { CloseSlotsUseCase } from './use-cases/close-slots.use-case';
import { ListTemplateLiveBookingsUseCase } from './use-cases/list-template-live-bookings.use-case';
import { CreateBookingPolicyUseCase } from './use-cases/create-booking-policy.use-case';
import { CreateExceptionUseCase } from './use-cases/create-exception.use-case';
import { CreateResourceUseCase } from './use-cases/create-resource.use-case';
import { CreateTemplateUseCase } from './use-cases/create-template.use-case';
import { GenerateSlotsUseCase } from './use-cases/generate-slots.use-case';
import { GetResourceAgendaUseCase } from './use-cases/get-resource-agenda.use-case';
import { ListCatalogLookupsUseCase } from './use-cases/list-catalog-lookups.use-case';
import { ListExceptionsUseCase } from './use-cases/list-exceptions.use-case';
import { ListTemplatesUseCase } from './use-cases/list-templates.use-case';
import { ReactivateTemplateUseCase } from './use-cases/reactivate-template.use-case';
import { RemoveExceptionUseCase } from './use-cases/remove-exception.use-case';
import { RetireTemplateUseCase } from './use-cases/retire-template.use-case';
import { ShiftSlotsUseCase } from './use-cases/shift-slots.use-case';
import { UpdateExceptionUseCase } from './use-cases/update-exception.use-case';
import { UpdateTemplateUseCase } from './use-cases/update-template.use-case';

/** Las dependencias crudas del catálogo, tal como las simulan las pruebas. */
export interface CatalogServiceDoubles {
  em: any;
  catalogRepo: any;
  logger: any;
  affiliations: any;
  professionalTime: any;
  noticeRepo: any;
  notices: any;
  /**
   * El caso de uso de cancelar, simulado. Opcional: las pruebas que no
   * bloquean ratos con citas no lo tocan, y un doble que no cancela nada
   * basta para ellas.
   */
  cancelBooking?: any;
  /** Vínculo con un espacio de infraestructura (R0). Sólo lo usan las pruebas de `care_spaces`. */
  spaceLinker?: any;
}

/**
 * Arma la fachada del catálogo con todos sus casos de uso a partir de dobles.
 * Vive en un `.testing.ts` para que el build de producción lo excluya.
 */
export function createCatalogService(d: CatalogServiceDoubles) {
  const access = new CatalogAccess(d.affiliations);
  const overlapGuard = new AgendaOverlapGuard(d.catalogRepo);
  const moveNotifier = new SlotMoveNotifier(
    d.em,
    d.catalogRepo,
    d.noticeRepo,
    d.notices,
    d.logger,
  );
  const { em, catalogRepo, logger, professionalTime } = d;
  const noticeRepo = {
    findDisplayNameForProfile: async () => null,
    ...d.noticeRepo,
  };
  const blockedBookings = new BlockedBookingsCanceller(
    catalogRepo,
    noticeRepo,
    d.cancelBooking ?? {
      cancelInTransaction: async () => {
        throw new Error('la prueba no esperaba cancelar ninguna cita');
      },
      announceChange: async () => undefined,
    },
  );

  return new SchedulingCatalogService(
    new CreateResourceUseCase(
      em,
      catalogRepo,
      access,
      logger,
      d.spaceLinker ?? ({} as SpaceResourceLinker),
    ),
    new CreateBookingPolicyUseCase(em, catalogRepo, access, logger),
    new CreateTemplateUseCase(em, catalogRepo, access, overlapGuard, logger),
    new UpdateTemplateUseCase(em, catalogRepo, access, logger),
    new ReactivateTemplateUseCase(em, catalogRepo, access, logger),
    new RetireTemplateUseCase(em, catalogRepo, access, blockedBookings, logger),
    new GenerateSlotsUseCase(em, catalogRepo, professionalTime, access, logger),
    new CloseSlotsUseCase(em, catalogRepo, access, blockedBookings, logger),
    new ShiftSlotsUseCase(em, catalogRepo, access, moveNotifier, logger),
    new CreateExceptionUseCase(
      em,
      catalogRepo,
      professionalTime,
      access,
      blockedBookings,
      logger,
    ),
    new UpdateExceptionUseCase(em, catalogRepo, access, logger),
    new RemoveExceptionUseCase(em, catalogRepo, access, logger),
    new ListTemplatesUseCase(em, catalogRepo, access),
    new ListExceptionsUseCase(em, catalogRepo, access),
    new GetResourceAgendaUseCase(em, catalogRepo),
    new ListCatalogLookupsUseCase(),
    new ListTemplateLiveBookingsUseCase(
      em,
      catalogRepo,
      access,
      blockedBookings,
    ),
  );
}
