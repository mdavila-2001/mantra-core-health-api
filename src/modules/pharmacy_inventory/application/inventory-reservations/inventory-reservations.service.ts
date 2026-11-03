import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../../../common';
import type {
  CreateReservationDto,
  ExpireReservationsResponseDto,
  MovementResponseDto,
} from '../../presentation/dto';
import { ReserveInventoryUseCase } from './reserve-inventory.use-case';
import { ExpireInventoryReservationsUseCase } from './expire-inventory-reservations.use-case';
import { ReleaseConfirmedReservationLinesUseCase } from './release-confirmed-reservation-lines.use-case';
import type {
  ReleaseConfirmedLinesOptions,
  ReservationReference,
} from './reservation-reference';

/** Fachada pública de reservas, expiración y devolución de stock. */
@Injectable()
export class InventoryReservationsService {
  constructor(
    private readonly reserveInventory: ReserveInventoryUseCase,
    private readonly expireReservations: ExpireInventoryReservationsUseCase,
    private readonly releaseLines: ReleaseConfirmedReservationLinesUseCase,
    logger: PinoLogger,
  ) {
    logger.setContext(InventoryReservationsService.name);
  }

  reserve(
    pharmacyId: string,
    dto: CreateReservationDto,
    actor: AuthenticatedUser,
  ): Promise<MovementResponseDto> {
    return this.reserveInventory.execute(pharmacyId, dto, actor);
  }

  expire(actor: AuthenticatedUser): Promise<ExpireReservationsResponseDto> {
    return this.expireReservations.execute(actor);
  }

  releaseConfirmedLines(
    tx: Parameters<ReleaseConfirmedReservationLinesUseCase['execute']>[0],
    reservation: ReservationReference,
    actor: AuthenticatedUser,
    options?: ReleaseConfirmedLinesOptions,
  ): Promise<number> {
    return this.releaseLines.execute(tx, reservation, actor, options);
  }
}
