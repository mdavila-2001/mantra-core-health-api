import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../../../common';
import type {
  CreateLocationDto,
  IdResponseDto,
  RelocateLocationDto,
} from '../../presentation/dto';
import { CreateInventoryLocationUseCase } from './create-inventory-location.use-case';
import { RelocateInventoryLocationUseCase } from './relocate-inventory-location.use-case';

/** Fachada pública de ubicaciones de inventario. */
@Injectable()
export class InventoryLocationsService {
  constructor(
    private readonly createLocation: CreateInventoryLocationUseCase,
    logger: PinoLogger,
    private readonly relocateLocation?: RelocateInventoryLocationUseCase,
  ) {
    logger.setContext(InventoryLocationsService.name);
  }

  create(
    pharmacySiteId: string,
    dto: CreateLocationDto,
    actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    return this.createLocation.execute(pharmacySiteId, dto, actor);
  }

  /** F5c: reubicar en otro espacio. */
  relocate(
    locationId: string,
    dto: RelocateLocationDto,
    actor: AuthenticatedUser,
  ) {
    return this.relocateLocation!.execute(locationId, dto, actor);
  }
}
