import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../../../common';
import type {
  ApproveCountSessionDto,
  CountSessionResponseDto,
  CreateCountSessionDto,
} from '../../presentation/dto';
import { ApproveInventoryCountUseCase } from './approve-inventory-count.use-case';
import { OpenInventoryCountUseCase } from './open-inventory-count.use-case';

/** Fachada pública del conteo cíclico; conserva la API del módulo. */
@Injectable()
export class InventoryCountService {
  constructor(
    private readonly openCount: OpenInventoryCountUseCase,
    private readonly approveCount: ApproveInventoryCountUseCase,
    logger: PinoLogger,
  ) {
    logger.setContext(InventoryCountService.name);
  }

  /** UC-25-06: abre una sesión de conteo tomando snapshot del on-hand. */
  openSession(
    pharmacySiteId: string,
    dto: CreateCountSessionDto,
    actor: AuthenticatedUser,
  ): Promise<CountSessionResponseDto> {
    return this.openCount.execute(pharmacySiteId, dto, actor);
  }

  /** UC-25-07: aprueba el conteo, calcula varianzas y ajusta ledger/stock. */
  approve(
    id: string,
    dto: ApproveCountSessionDto,
    actor: AuthenticatedUser,
  ): Promise<CountSessionResponseDto> {
    return this.approveCount.execute(id, dto, actor);
  }
}
