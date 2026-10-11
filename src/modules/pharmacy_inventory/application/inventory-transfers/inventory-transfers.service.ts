import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../../../common';
import type {
  CreateTransferDto,
  TransferResponseDto,
} from '../../presentation/dto';
import { TransferInventoryUseCase } from './transfer-inventory.use-case';

/** Fachada pública de transferencias de stock entre ubicaciones. */
@Injectable()
export class InventoryTransfersService {
  constructor(
    private readonly transferInventory: TransferInventoryUseCase,
    logger: PinoLogger,
  ) {
    logger.setContext(InventoryTransfersService.name);
  }

  transfer(
    pharmacyId: string,
    dto: CreateTransferDto,
    actor: AuthenticatedUser,
  ): Promise<TransferResponseDto> {
    return this.transferInventory.execute(pharmacyId, dto, actor);
  }
}
