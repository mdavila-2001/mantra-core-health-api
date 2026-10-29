import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../../../common';
import type { CreateLocationDto } from '../../presentation/dto';
import type { RelocateLocationDto } from '../../presentation/dto/relocate-location.dto';
import type { LocationResponseDto } from '../../presentation/dto/responses.dto';
import type { SpaceStockView } from '../../presentation/dto/space-stock.types';
import { CreateInventoryLocationUseCase } from './create-inventory-location.use-case';
import { ReadSpaceStockUseCase } from './read-space-stock.use-case';
import { RelocateInventoryLocationUseCase } from './relocate-inventory-location.use-case';

/** Fachada pública de ubicaciones de inventario. */
@Injectable()
export class InventoryLocationsService {
  constructor(
    private readonly createLocation: CreateInventoryLocationUseCase,
    logger: PinoLogger,
    private readonly relocateLocation: RelocateInventoryLocationUseCase,
    private readonly readSpaceStock: ReadSpaceStockUseCase,
  ) {
    logger.setContext(InventoryLocationsService.name);
  }

  create(
    pharmacySiteId: string,
    dto: CreateLocationDto,
    actor: AuthenticatedUser,
  ): Promise<LocationResponseDto> {
    return this.createLocation.execute(pharmacySiteId, dto, actor);
  }

  relocate(
    locationId: string,
    dto: RelocateLocationDto,
    expectedRowVersion: number,
    actor: AuthenticatedUser,
  ): Promise<LocationResponseDto> {
    return this.relocateLocation.execute(
      locationId,
      dto,
      expectedRowVersion,
      actor,
    );
  }

  spaceStock(
    careSpaceId: string,
    actor: AuthenticatedUser,
  ): Promise<SpaceStockView> {
    return this.readSpaceStock.execute(careSpaceId, actor);
  }
}
