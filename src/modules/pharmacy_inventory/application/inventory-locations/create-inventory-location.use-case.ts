import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../../../common';
import { LocationsRepository } from '../../infrastructure/repositories';
import type { CreateLocationDto, IdResponseDto } from '../../presentation/dto';
import { PINV } from '../../domain/pharmacy_inventory.concepts';

/** Crea una ubicación activa para la sede dentro de una transacción. */
@Injectable()
export class CreateInventoryLocationUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly locations: LocationsRepository,
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
