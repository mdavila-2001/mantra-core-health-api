import {
  localTimeToUtc,
  matchingLocalDays,
} from '../../../scheduling/domain/time/scheduling-time';
import type {
  CenterEquipment,
  CenterSchedule,
  ModalityCode,
  ScheduleBlock,
} from './center-schedule.model';

/**
 * Each device is a production line: it attends one patient per slot while its
 * own shift is open. A device without a shift of its own follows the block of
 * the study (study → modality → general). The capacity of a slot is the number
 * of operational lines of the modality open for the whole slot.
 */

/** Whether a shift has a window that covers `[start, end)` entirely. */
export function shiftCovers(
  block: ScheduleBlock,
  start: Date,
  end: Date,
  zone: string,
): boolean {
  return block.windows.some((w) =>
    matchingLocalDays(start, start, w.dayOfWeek % 7, zone).some((day) => {
      const open = localTimeToUtc(day, w.startTime, zone).getTime();
      const close = localTimeToUtc(day, w.endTime, zone).getTime();
      return open <= start.getTime() && end.getTime() <= close;
    }),
  );
}

/** The own shift of a device, or `null` when it follows its study's block. */
export function shiftOf(
  schedule: CenterSchedule,
  equipmentId: string,
): ScheduleBlock | null {
  return (
    schedule.equipment.find((e) => e.equipmentId === equipmentId)?.schedule ??
    null
  );
}

/** Operational lines of a modality open for the whole slot. */
export function openLines(
  schedule: CenterSchedule,
  equipment: readonly CenterEquipment[],
  modalityCode: ModalityCode,
  start: Date,
  end: Date,
  zone: string,
): CenterEquipment[] {
  return equipment.filter((e) => {
    if (e.modalityCode !== modalityCode || e.status !== 'OPERATIONAL')
      return false;
    const own = shiftOf(schedule, e.id);
    return own === null || shiftCovers(own, start, end, zone);
  });
}

/**
 * Patients that fit in one slot of a modality. Without any device registered
 * for the modality, the template's declared capacity applies, so a center
 * that has not inventoried its equipment yet stays bookable.
 */
export function slotCapacity(
  schedule: CenterSchedule,
  equipment: readonly CenterEquipment[],
  modalityCode: ModalityCode | null,
  declaredCapacity: number,
  start: Date,
  end: Date,
  zone: string,
): number {
  if (modalityCode === null) return declaredCapacity;
  if (!equipment.some((e) => e.modalityCode === modalityCode))
    return declaredCapacity;
  return openLines(schedule, equipment, modalityCode, start, end, zone).length;
}

/** A booking waiting on a line. */
export interface QueuedBooking {
  readonly id: string;
  readonly startAt: Date;
  readonly endAt: Date;
  readonly modalityCode: ModalityCode | null;
}

export interface EquipmentQueues {
  /** Booking ids per device, in the order the line attends them. */
  readonly byEquipment: ReadonlyMap<string, string[]>;
  /** Bookings no open line can take (broken device, shift changed). */
  readonly unassigned: string[];
}

/**
 * Lays the bookings on the lines, first come first served: each booking goes
 * to the first open line of its modality that is free for its slot. Nothing is
 * stored; it is the queue each device has today with the current shifts.
 */
export function assignToLines(
  schedule: CenterSchedule,
  equipment: readonly CenterEquipment[],
  bookings: readonly QueuedBooking[],
  zone: string,
): EquipmentQueues {
  const byEquipment = new Map<string, string[]>(
    equipment.map((e) => [e.id, []]),
  );
  const busy = new Map<string, QueuedBooking[]>();
  const unassigned: string[] = [];
  const ordered = [...bookings].sort(
    (a, b) =>
      a.startAt.getTime() - b.startAt.getTime() || a.id.localeCompare(b.id),
  );
  for (const booking of ordered) {
    const lines =
      booking.modalityCode === null
        ? []
        : openLines(
            schedule,
            equipment,
            booking.modalityCode,
            booking.startAt,
            booking.endAt,
            zone,
          );
    const free = lines.find(
      (line) =>
        !(busy.get(line.id) ?? []).some(
          (b) =>
            b.startAt.getTime() < booking.endAt.getTime() &&
            b.endAt.getTime() > booking.startAt.getTime(),
        ),
    );
    if (!free) {
      unassigned.push(booking.id);
      continue;
    }
    busy.set(free.id, [...(busy.get(free.id) ?? []), booking]);
    byEquipment.get(free.id)!.push(booking.id);
  }
  return { byEquipment, unassigned };
}
