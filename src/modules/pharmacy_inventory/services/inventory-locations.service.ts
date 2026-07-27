import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { type AuthenticatedUser } from '../../../common';
import { LocationsRepository } from '../repositories';
import { CreateLocationDto, IdResponseDto } from '../dto';
import { PINV } from '../pharmacy_inventory.concepts';

/** Bootstrap de ubicaciones de inventario (parent de stock/ledger/conteo). */
@Injectable()
export class InventoryLocationsService {
  constructor(
    private readonly em: EntityManager,
    private readonly locationsRepo: LocationsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(InventoryLocationsService.name);
  }

  /** Crea una ubicación de inventario activa para una sede. */
  async create(
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
      const location = this.locationsRepo.create(tx, {
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
