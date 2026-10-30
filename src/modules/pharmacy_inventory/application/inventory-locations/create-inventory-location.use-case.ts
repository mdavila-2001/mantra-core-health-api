import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../../../common';
import { LocationsRepository } from '../../infrastructure/repositories';
import type { CreateLocationDto, IdResponseDto } from '../../presentation/dto';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import { PharmacyInventoryScopePolicy } from '../scope/pharmacy-inventory-scope.policy';

/** Crea una ubicación activa para la sede dentro de una transacción. */
@Injectable()
export class CreateInventoryLocationUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly locations: LocationsRepository,
    private readonly scope: PharmacyInventoryScopePolicy,
    private readonly logger: PinoLogger,
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
      const location = this.locations.create(tx, {
        pharmacySiteId,
        parentLocationId: dto.parentLocationId,
        code: dto.code,
        name: dto.name,
        locationTypeConceptId: PINV.LOCATION_TYPE_SHELF,
        temperatureZoneConceptId: PINV.TEMPERATURE_ZONE_AMBIENT,
        controlledAccess: dto.controlledAccess,
        statusConceptId: PINV.LOCATION_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();
      return { id: location.id };
    });
  }
}
