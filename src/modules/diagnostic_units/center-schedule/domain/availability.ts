import {
  BOOKING_MARGIN_MINUTES,
  type CenterEquipment,
  type CenterSchedule,
  type ModalityCode,
  type ScheduleBlock,
  type StudyStart,
} from './center-schedule.model';
import {
  capacityOf,
  isSlotStart,
  resolveBlock,
  slotsBetween,
} from './schedule-rules';

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
  readonly capacity: number;
  readonly modalityCode: ModalityCode;
  readonly occupying: readonly OccupyingBooking[];
  readonly from: Date;
  readonly to: Date;
  readonly now: Date;
}

/** Free starts of a study: slots of its block with capacity left. */
export function availableStarts(input: AvailabilityInput): StudyStart[] {
  if (input.capacity <= 0) return [];
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
    const remaining = input.capacity - taken;
    if (remaining <= 0) continue;
    items.push({
      startAt: slot.startAt.toISOString(),
      endAt: slot.endAt.toISOString(),
      remaining,
      capacity: input.capacity,
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

/** Future bookings left without an operational device to attend them. */
export function bookingsWithoutEquipment(
  future: readonly OccupyingBooking[],
  equipment: readonly CenterEquipment[],
  declaredCapacity: number,
): number {
  return future.filter((b) => {
    if (b.modalityCode === null) return false;
    const capacity = capacityOf(equipment, b.modalityCode, declaredCapacity);
    const others = overlapping(
      future,
      b.modalityCode,
      b.startAt,
      b.endAt,
      b.id,
    );
    return others >= capacity;
  }).length;
}
