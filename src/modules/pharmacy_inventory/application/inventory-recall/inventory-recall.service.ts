import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../../../common';
import type {
  CreateRecallHoldDto,
  IdResponseDto,
  ReleaseRecallHoldDto,
  StatusResultDto,
} from '../../presentation/dto';
import { CreateRecallHoldUseCase } from './create-recall-hold.use-case';
import { ReleaseRecallHoldUseCase } from './release-recall-hold.use-case';

/** Fachada pública del retiro y liberación de lotes por recall. */
@Injectable()
export class InventoryRecallService {
  constructor(
    private readonly createHoldUseCase: CreateRecallHoldUseCase,
    private readonly releaseHoldUseCase: ReleaseRecallHoldUseCase,
    logger: PinoLogger,
  ) {
    logger.setContext(InventoryRecallService.name);
  }

  createHold(
    dto: CreateRecallHoldDto,
    actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    return this.createHoldUseCase.execute(dto, actor);
  }

  release(
    id: string,
    dto: ReleaseRecallHoldDto,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.releaseHoldUseCase.execute(id, dto, actor);
  }
}
