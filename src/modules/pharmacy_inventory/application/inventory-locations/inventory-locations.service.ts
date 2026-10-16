import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../../../common';
import type { CreateLocationDto, IdResponseDto } from '../../presentation/dto';
import { CreateInventoryLocationUseCase } from './create-inventory-location.use-case';

/** Fachada pública de ubicaciones de inventario. */
@Injectable()
export class InventoryLocationsService {
  constructor(
    private readonly createLocation: CreateInventoryLocationUseCase,
    logger: PinoLogger,
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
}
