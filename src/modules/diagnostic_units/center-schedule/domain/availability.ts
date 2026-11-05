import {
  BOOKING_MARGIN_MINUTES,
  type CenterDevice,
  type CenterSchedule,
  type ModalityCode,
  type ScheduleBlock,
  type StudyStart,
} from './center-schedule.model';
import {
  capacityOf,
  devicesOf,
  isSlotStart,
  resolveBlock,
  resolveBlockFor,
  slotsBetween,
} from './schedule-rules';

/**
 * A booking that takes capacity. `resourceId` says where it lives: the
 * center's resource (legacy, before devices had their own) or a device's.
 * `modalityCode` is `null` for bookings made outside the order flow (the
 * generic scheduling engine does not record a modality): those take capacity
 * from every modality, which is the conservative reading.
 */
export interface OccupyingBooking {
  readonly id: string;
  readonly slotId: string;
  readonly resourceId: string;
  readonly startAt: Date;
  readonly endAt: Date;
  readonly modalityCode: ModalityCode | null;
  readonly studyCode: string | null;
  readonly equipmentId: string | null;
}

export function overlapping(
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

/** A free start of one device. */
export interface DeviceStart {
  readonly deviceId: string;
  readonly startAt: string;
  readonly endAt: string;
}

/**
 * The production-line reading of a modality: every operational device offers
 * the starts of its own block, minus its own bookings, and the patient sees
 * the union. `remaining` is how many devices are free at that start and
 * `capacity` how many open at all then. The devices that are free keep their
 * order, so the booking takes the first one.
 */
export function unionOfDevices(
  starts: readonly DeviceStart[],
  openAt: ReadonlyMap<string, number>,
): { items: StudyStart[]; devicesAt: Map<string, DeviceStart[]> } {
  const devicesAt = new Map<string, DeviceStart[]>();
  for (const s of starts) {
    devicesAt.set(s.startAt, [...(devicesAt.get(s.startAt) ?? []), s]);
  }
  const items = [...devicesAt.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([startAt, free]) => ({
      startAt,
      endAt: free[0].endAt,
      remaining: free.length,
      capacity: Math.max(openAt.get(startAt) ?? 0, free.length),
    }));
  return { items, devicesAt };
}

/**
 * Future bookings that would not start on a slot of the new schedule. A
 * booking on a device is checked against what that device would attend under
 * the new general schedule (its own schedule, when it has one, does not move
 * here). Only the schedule is checked: capacity is the equipment's business,
 * and checking it here would block publishing any modality while one device
 * is broken.
 */
export function bookingsOutsideSchedule(
  schedule: CenterSchedule,
  future: readonly OccupyingBooking[],
  devices: readonly CenterDevice[],
  zone: string,
): number {
  return future.filter((b) => {
    const device = devices.find((d) => d.id === b.equipmentId);
    const { block } = device
      ? resolveBlockFor(schedule, device, b.studyCode, b.modalityCode)
      : resolveBlock(schedule, b.studyCode, b.modalityCode);
    return !isSlotStart(block, b.startAt, zone);
  }).length;
}

/**
 * Future bookings left without an operational device to attend them: those on
 * a device that is down, the legacy ones on the center's resource that no
 * operational device could adopt, and (without devices) the legacy ones that
 * exceed the modality's declared capacity.
 */
export function bookingsWithoutEquipment(
  schedule: CenterSchedule,
  future: readonly OccupyingBooking[],
  devices: readonly CenterDevice[],
  declaredCapacity: number,
  zone: string,
): number {
  const legacy = future.filter((b) => b.equipmentId === null);
  const taken = future.filter((b) => b.equipmentId !== null);
  const adopted = new Set(
    planAdoption(schedule, legacy, devices, taken, zone).map(
      (p) => p.booking.id,
    ),
  );
  return future.filter((b) => {
    if (b.modalityCode === null) return false;
    if (b.equipmentId !== null) {
      const device = devices.find((e) => e.id === b.equipmentId);
      return device?.status !== 'OPERATIONAL';
    }
    if (devicesOf(devices, b.modalityCode).length > 0)
      return !adopted.has(b.id);
    const capacity = capacityOf(devices, b.modalityCode, declaredCapacity);
    return (
      overlapping(legacy, b.modalityCode, b.startAt, b.endAt, b.id) >= capacity
    );
  }).length;
}

/**
 * Which operational device can adopt each legacy booking of the center's
 * resource: the first one that opens at that instant and is free then. A
 * booking no device can take is left where it is and counts as «without
 * equipment». Pure: the caller moves the rows.
 */
export function planAdoption(
  schedule: CenterSchedule,
  legacy: readonly OccupyingBooking[],
  devices: readonly CenterDevice[],
  taken: readonly OccupyingBooking[],
  zone: string,
): { booking: OccupyingBooking; device: CenterDevice }[] {
  const busy = [...taken];
  const plan: { booking: OccupyingBooking; device: CenterDevice }[] = [];
  const byStart = [...legacy].sort(
    (a, b) => a.startAt.getTime() - b.startAt.getTime(),
  );
  for (const booking of byStart) {
    if (booking.modalityCode === null) continue;
    const candidates = devicesOf(devices, booking.modalityCode).filter(
      (d) => d.status === 'OPERATIONAL',
    );
    const device = candidates.find((d) => {
      const { block } = resolveBlockFor(
        schedule,
        d,
        booking.studyCode,
        booking.modalityCode,
      );
      if (!isSlotStart(block, booking.startAt, zone)) return false;
      return !busy.some(
        (x) =>
          x.equipmentId === d.id &&
          x.startAt.getTime() < booking.endAt.getTime() &&
          x.endAt.getTime() > booking.startAt.getTime(),
      );
    });
    if (!device) continue;
    busy.push({ ...booking, equipmentId: device.id });
    plan.push({ booking, device });
  }
  return plan;
}
