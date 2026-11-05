import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  availableStarts,
  unionOfDevices,
  type DeviceStart,
} from '../domain/availability';
import type {
  CenterDevice,
  ModalityCode,
  ScheduleOrigin,
  StudyStart,
} from '../domain/center-schedule.model';
import {
  capacityOf,
  devicesOf,
  resolveBlock,
  resolveBlockFor,
  slotsBetween,
} from '../domain/schedule-rules';
import { CenterBookingsRepository } from '../infrastructure/center-bookings.repository';
import { toOccupying, type CenterContext } from './center-context.service';

export interface StudyAvailability {
  readonly origin: ScheduleOrigin;
  readonly capacity: number;
  readonly items: StudyStart[];
  /** The free devices at each start, first one to book. Empty for a center without devices. */
  readonly devicesAt: ReadonlyMap<string, readonly DeviceStart[]>;
}

/**
 * Free starts of a study in a center. With devices registered for the
 * modality, each operational one is a production line: its own block minus
 * its own bookings, and the patient sees the union. Without any, the center's
 * resource and its declared capacity apply, so a center that has not
 * inventoried its equipment yet stays bookable.
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
    const devices = devicesOf(ctx.equipment, modalityCode);
    if (devices.length === 0) {
      return this.legacyStarts(em, ctx, studyCode, modalityCode, from, to);
    }
    const operational = devices.filter((d) => d.status === 'OPERATIONAL');
    const now = new Date();
    const occupying = (
      await this.bookingsRepo.findOccupying(
        em,
        operational.flatMap((d) => (d.resourceId ? [d.resourceId] : [])),
        from,
        new Date(to.getTime() + 240 * 60_000),
      )
    ).map(toOccupying);
    const starts: DeviceStart[] = [];
    const openAt = new Map<string, number>();
    let origin: ScheduleOrigin = 'GENERAL';
    for (const device of operational) {
      const resolved = resolveBlockFor(
        ctx.schedule,
        device,
        studyCode,
        modalityCode,
      );
      origin = resolved.origin;
      for (const slot of slotsBetween(resolved.block, from, to, ctx.zone)) {
        const key = slot.startAt.toISOString();
        openAt.set(key, (openAt.get(key) ?? 0) + 1);
      }
      const free = availableStarts({
        block: resolved.block,
        zone: ctx.zone,
        capacity: 1,
        modalityCode,
        occupying: occupying.filter((b) => b.resourceId === device.resourceId),
        from,
        to,
        now,
      });
      for (const s of free) {
        starts.push({
          deviceId: device.id,
          startAt: s.startAt,
          endAt: s.endAt,
        });
      }
    }
    const { items, devicesAt } = unionOfDevices(starts, openAt);
    return { origin, capacity: operational.length, items, devicesAt };
  }

  /** The device that takes a start: the first free one there. */
  deviceFor(
    ctx: CenterContext,
    availability: StudyAvailability,
    startAt: string,
  ): CenterDevice | null {
    const first = availability.devicesAt.get(startAt)?.[0];
    return first
      ? (ctx.equipment.find((e) => e.id === first.deviceId) ?? null)
      : null;
  }

  private async legacyStarts(
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
            [ctx.resourceId],
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
    return { origin, capacity, items, devicesAt: new Map() };
  }
}
