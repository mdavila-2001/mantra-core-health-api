import {
  BOOKING_MARGIN_MINUTES,
  type CenterEquipment,
  type CenterSchedule,
  type ModalityCode,
  type ScheduleBlock,
  type StudyStart,
} from './center-schedule.model';
import { assignToLines } from './equipment-lines';
import { isSlotStart, resolveBlock, slotsBetween } from './schedule-rules';

/**
 * A booking that takes capacity on the center's resource. `modalityCode` is
 * `null` for bookings made outside the order flow (the generic scheduling
 * engine does not record a modality): those take capacity from every modality,
 * which is the conservative reading.
 */
export interface OccupyingBooking {
  readonly id: string;
  readonly startAt: Date;
  readonly endAt: Date;
  readonly modalityCode: ModalityCode | null;
  readonly studyCode: string | null;
}

function overlapping(
  bookings: readonly OccupyingBooking[],
  modalityCode: ModalityCode,
  start: Date,
  end: Date,
  exceptId?: string,
): number {
  return bookings.filter(
    (b) =>
      b.id !== exceptId &&
      (b.modalityCode === null || b.modalityCode === modalityCode) &&
      b.startAt.getTime() < end.getTime() &&
      b.endAt.getTime() > start.getTime(),
  ).length;
}

export interface AvailabilityInput {
  readonly block: ScheduleBlock;
  readonly zone: string;
  /** Patients that fit in one slot: the lines open for it. */
  readonly capacityAt: (start: Date, end: Date) => number;
  readonly modalityCode: ModalityCode;
  readonly occupying: readonly OccupyingBooking[];
  readonly from: Date;
  readonly to: Date;
  readonly now: Date;
}

/** Free starts of a study: slots of its block with capacity left. */
export function availableStarts(input: AvailabilityInput): StudyStart[] {
  const earliest = input.now.getTime() + BOOKING_MARGIN_MINUTES * 60_000;
  const from = new Date(Math.max(input.from.getTime(), earliest));
  if (from.getTime() > input.to.getTime()) return [];
  const items: StudyStart[] = [];
  for (const slot of slotsBetween(input.block, from, input.to, input.zone)) {
    const taken = overlapping(
      input.occupying,
      input.modalityCode,
      slot.startAt,
      slot.endAt,
    );
    const capacity = input.capacityAt(slot.startAt, slot.endAt);
    const remaining = capacity - taken;
    if (remaining <= 0) continue;
    items.push({
      startAt: slot.startAt.toISOString(),
      endAt: slot.endAt.toISOString(),
      remaining,
      capacity,
    });
  }
  return items;
}

/**
 * Future bookings that would not start on a slot of the new schedule. Only the
 * schedule is checked: capacity is the equipment's business, and checking it
 * here would block publishing any modality while one device is broken.
 */
export function bookingsOutsideSchedule(
  schedule: CenterSchedule,
  future: readonly OccupyingBooking[],
  zone: string,
): number {
  return future.filter((b) => {
    const { block } = resolveBlock(schedule, b.studyCode, b.modalityCode);
    return !isSlotStart(block, b.startAt, zone);
  }).length;
}

/**
 * Future bookings no open line can attend (a device broke, went to
 * maintenance or its shift changed after they were booked). Bookings of a
 * modality without any registered device ride on the declared capacity.
 */
export function bookingsWithoutEquipment(
  schedule: CenterSchedule,
  future: readonly OccupyingBooking[],
  equipment: readonly CenterEquipment[],
  zone: string,
): number {
  const lined = future.filter(
    (b) =>
      b.modalityCode !== null &&
      equipment.some((e) => e.modalityCode === b.modalityCode),
  );
  return assignToLines(schedule, equipment, lined, zone).unassigned.length;
}
