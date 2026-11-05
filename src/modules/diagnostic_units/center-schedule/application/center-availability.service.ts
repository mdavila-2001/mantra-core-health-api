import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { availableStarts } from '../domain/availability';
import type {
  ModalityCode,
  ScheduleOrigin,
  StudyStart,
} from '../domain/center-schedule.model';
import { capacityOf, resolveBlock } from '../domain/schedule-rules';
import { CenterBookingsRepository } from '../infrastructure/center-bookings.repository';
import { toOccupying, type CenterContext } from './center-context.service';

export interface StudyAvailability {
  readonly origin: ScheduleOrigin;
  readonly capacity: number;
  /** The template-free slot length, for the booking's end instant. */
  readonly slotMinutes: number;
  readonly items: StudyStart[];
}

/**
 * Free starts of a study in a center: the block that applies to it (study →
 * modality → general), capacity from its operational equipment, minus the
 * bookings already taken on the center's resource.
 */
@Injectable()
export class CenterAvailabilityService {
  constructor(private readonly bookingsRepo: CenterBookingsRepository) {}

  async startsFor(
    em: EntityManager,
    ctx: CenterContext,
    studyCode: string,
    modalityCode: ModalityCode,
    from: Date,
    to: Date,
  ): Promise<StudyAvailability> {
    const { block, origin } = resolveBlock(
      ctx.schedule,
      studyCode,
      modalityCode,
    );
    const capacity = capacityOf(
      ctx.equipment,
      modalityCode,
      ctx.declaredCapacity,
    );
    const occupying = ctx.resourceId
      ? (
          await this.bookingsRepo.findOccupying(
            em,
            ctx.resourceId,
            from,
            new Date(to.getTime() + block.slotMinutes * 60_000),
          )
        ).map(toOccupying)
      : [];
    const items = availableStarts({
      block,
      zone: ctx.zone,
      capacity,
      modalityCode,
      occupying,
      from,
      to,
      now: new Date(),
    });
    return { origin, capacity, slotMinutes: block.slotMinutes, items };
  }
}
