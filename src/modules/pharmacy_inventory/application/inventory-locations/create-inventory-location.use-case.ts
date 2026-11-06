import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../../../common';
import { LocationsRepository } from '../../infrastructure/repositories';
import type { CreateLocationDto, IdResponseDto } from '../../presentation/dto';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import { PharmacyInventoryScopePolicy } from '../scope/pharmacy-inventory-scope.policy';
import {
  DOMAIN_EVENT_PUBLISHER_PORT,
  type DomainEventPublisherPort,
} from '../ports/domain-event-publisher.port';
import { StockPointGuard, wardStockTaken } from './stock-point-guard';

/**
 * Crea una ubicación activa para la sede dentro de una transacción. Con
 * `careSpaceId`/`clinicalUnitId` (F5c) la ubica en un espacio físico o la
 * hace botiquín de una unidad, validado por `StockPointGuard`.
 */
@Injectable()
export class CreateInventoryLocationUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly locations: LocationsRepository,
    private readonly scope: PharmacyInventoryScopePolicy,
    private readonly logger: PinoLogger,
    private readonly guard?: StockPointGuard,
    @Inject(DOMAIN_EVENT_PUBLISHER_PORT)
    private readonly events?: DomainEventPublisherPort,
  ) {}

  execute(
    pharmacySiteId: string,
    dto: CreateLocationDto,
    actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    this.logger.info(
      {
        operation: 'pharmacy_inventory.location.create',
        pharmacySiteId,
        code: dto.code,
      },
      'Creating inventory location',
    );
    const locationType = dto.locationTypeCode ?? 'SHELF';
    const placed = !!dto.careSpaceId || !!dto.clinicalUnitId;
    return this.em.transactional(async (tx) => {
      // La sede de la ruta debe ser de una farmacia que el actor administra, y
      // la ubicación padre, de esa misma sede.
      const site = await this.scope.requireManagedSite(
        tx,
        pharmacySiteId,
        actor,
      );
      if (dto.parentLocationId) {
        await this.scope.requireLocation(tx, site, dto.parentLocationId);
      }
      if (placed || locationType !== 'SHELF') {
        await this.guard!.assert(tx, site, {
          careSpaceId: dto.careSpaceId,
          clinicalUnitId: dto.clinicalUnitId,
          locationType,
        });
        if (
          locationType === 'WARD_STOCK' &&
          (await this.locations.findActiveWardStock(tx, dto.clinicalUnitId!))
        )
          throw wardStockTaken();
      }
      const location = this.locations.create(tx, {
        pharmacySiteId,
        parentLocationId: dto.parentLocationId,
        code: dto.code,
        name: dto.name,
        locationTypeConceptId:
          locationType === 'WARD_STOCK'
            ? PINV.LOCATION_TYPE_WARD_STOCK
            : PINV.LOCATION_TYPE_SHELF,
        temperatureZoneConceptId: PINV.TEMPERATURE_ZONE_AMBIENT,
        controlledAccess: dto.controlledAccess,
        statusConceptId: PINV.LOCATION_ACTIVE,
        actorUserId: actor.id,
        ...(placed
          ? {
              careSpaceId: dto.careSpaceId,
              clinicalUnitId: dto.clinicalUnitId,
            }
          : {}),
      });
      try {
        await tx.flush();
      } catch (error) {
        throw this.guard ? this.guard.translate(error) : error;
      }
      if (placed && this.events)
        await this.events.publish(tx, {
          tenantId: site.tenantId,
          eventType: 'pharmacy_inventory.location.located',
          aggregateType: 'pharmacy_inventory.inventory_locations',
          aggregateId: location.id,
          payloadJson: {
            inventoryLocationId: location.id,
            pharmacySiteId,
            careSpaceId: dto.careSpaceId ?? null,
            clinicalUnitId: dto.clinicalUnitId ?? null,
            locationTypeCode: locationType,
          },
          actorUserId: actor.id,
        });
      return { id: location.id };
    });
  }
}
