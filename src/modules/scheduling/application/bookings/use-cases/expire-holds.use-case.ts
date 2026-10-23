import { CONCEPTS, touch } from '../../../../../common';
import { DEFAULT_WORKER_BATCH } from '../../../domain/booking/booking-defaults';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { SchedulingBookingsRepository } from '../../../infrastructure/repositories';
import { ServiceSlotLifecycle } from '../support/service-slot-lifecycle';
import { WorkerBatchResultDto } from '../../../presentation/dto';

/** UC-41-07 (worker): recicla los holds vencidos y devuelve el cupo. */
@Injectable()
export class ExpireHoldsUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly bookingsRepo: SchedulingBookingsRepository,
    private readonly serviceSlots: ServiceSlotLifecycle,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ExpireHoldsUseCase.name);
  }

  /**
   * UC-41-07 (worker): recicla los holds vencidos y devuelve el cupo.
   *
   * Idempotente y seguro entre workers: el lote se toma con `SKIP LOCKED`, así que
   * dos instancias se reparten el trabajo en vez de bloquearse mutuamente.
   */
  async execute(limit = DEFAULT_WORKER_BATCH): Promise<WorkerBatchResultDto> {
    return this.em.transactional(async (tx) => {
      const expired = await this.bookingsRepo.findExpiredHolds(
        tx,
        CONCEPTS.HOLD_ACTIVE,
        new Date(),
        limit,
      );

      for (const hold of expired) {
        hold.statusConceptId = CONCEPTS.HOLD_EXPIRED;
        hold.releasedAt = new Date();
        touch(hold, undefined);

        const slot = await this.bookingsRepo.findSlotForUpdate(
          tx,
          hold.bookableSlotId,
        );
        if (!slot) continue;
        slot.remainingCapacity += 1;
        if (slot.practitionerServiceOfferingId) {
          // El cupo de un servicio nació para esta retención: no se reofrece, muere
          // con ella y devuelve las consultas que había retraído.
          await this.serviceSlots.discardOneOffSlot(tx, slot, undefined);
          continue;
        }
        if (slot.statusConceptId === CONCEPTS.SLOT_HELD) {
          slot.statusConceptId = CONCEPTS.SLOT_OPEN;
        }
        touch(slot, undefined);
      }

      if (expired.length > 0) {
        this.logger.info(
          { operation: 'scheduling.hold.expire', released: expired.length },
          'Released expired holds',
        );
      }

      return {
        processed: expired.length,
        detail: 'Holds vencidos liberados y cupo devuelto',
      };
    });
  }
}
