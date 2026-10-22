import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { touch, type AuthenticatedUser } from '../../../../common';
import { ReservationsRepository } from '../../infrastructure/repositories';
import type { ExpireReservationsResponseDto } from '../../presentation/dto';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import { ReleaseConfirmedReservationLinesUseCase } from './release-confirmed-reservation-lines.use-case';

/** Expira reservas vencidas y devuelve sus líneas al stock bajo la misma UOW. */
@Injectable()
export class ExpireInventoryReservationsUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly reservations: ReservationsRepository,
    private readonly releaseLines: ReleaseConfirmedReservationLinesUseCase,
    private readonly logger: PinoLogger,
  ) {}

  execute(actor: AuthenticatedUser): Promise<ExpireReservationsResponseDto> {
    this.logger.info(
      { operation: 'pharmacy_inventory.reservation.expire' },
      'Expiring reservations',
    );
    return this.em.transactional(async (tx) => {
      const expired = await this.reservations.findExpired(
        tx,
        PINV.RESERVATION_CONFIRMED,
        new Date(),
      );
      let count = 0;
      for (const reservation of expired) {
        reservation.reservationStatusConceptId = PINV.RESERVATION_EXPIRED;
        reservation.releasedAt = new Date();
        touch(reservation, actor.id);

        await this.releaseLines.execute(tx, reservation, actor);
        count += 1;
      }
      await tx.flush();
      return { expiredCount: count };
    });
  }
}
