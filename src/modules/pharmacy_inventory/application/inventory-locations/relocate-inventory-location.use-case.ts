import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../../common';
import { LocationsRepository } from '../../infrastructure/repositories';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import type { RelocateLocationDto } from '../../presentation/dto';
import { PharmacyInventoryScopePolicy } from '../scope/pharmacy-inventory-scope.policy';
import {
  DOMAIN_EVENT_PUBLISHER_PORT,
  type DomainEventPublisherPort,
} from '../ports/domain-event-publisher.port';
import { StockPointGuard } from './stock-point-guard';

/**
 * `POST /pharmacy/inventory-locations/:id/relocate {careSpaceId}` (§F5c): el
 * stock **sigue** a la ubicación (no se tocan posiciones ni ledger; cambia el
 * espacio). La ubicación tiene que ser de una farmacia que el actor administra
 * (404 si no) y el destino, un punto de stock de la misma sede.
 */
@Injectable()
export class RelocateInventoryLocationUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly locations: LocationsRepository,
    private readonly scope: PharmacyInventoryScopePolicy,
    private readonly guard: StockPointGuard,
    @Inject(DOMAIN_EVENT_PUBLISHER_PORT)
    private readonly events: DomainEventPublisherPort,
  ) {}

  execute(
    locationId: string,
    dto: RelocateLocationDto,
    actor: AuthenticatedUser,
  ): Promise<{
    id: string;
    careSpaceId: string;
    previousCareSpaceId: string | null;
  }> {
    return this.em.transactional(async (tx) => {
      const location = await this.locations.findById(tx, locationId);
      if (!location) throw this.scope.notAvailable();
      const site = await this.scope.requireManagedSite(
        tx,
        location.pharmacySiteId,
        actor,
      );
      await this.guard.assert(tx, site, {
        careSpaceId: dto.careSpaceId,
        clinicalUnitId: location.clinicalUnitId,
        locationType:
          location.locationTypeConceptId === PINV.LOCATION_TYPE_WARD_STOCK
            ? 'WARD_STOCK'
            : 'SHELF',
      });
      const previous = location.careSpaceId ?? null;
      location.careSpaceId = dto.careSpaceId;
      location.updatedAt = new Date();
      location.updatedByUserId = actor.id;
      await tx.flush();
      await this.events.publish(tx, {
        tenantId: site.tenantId,
        eventType: 'pharmacy_inventory.location.relocated',
        aggregateType: 'pharmacy_inventory.inventory_locations',
        aggregateId: location.id,
        payloadJson: {
          inventoryLocationId: location.id,
          fromCareSpaceId: previous,
          toCareSpaceId: dto.careSpaceId,
        },
        actorUserId: actor.id,
      });
      return {
        id: location.id,
        careSpaceId: dto.careSpaceId,
        previousCareSpaceId: previous,
      };
    });
  }
}
