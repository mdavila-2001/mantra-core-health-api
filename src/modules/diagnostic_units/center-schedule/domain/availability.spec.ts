import { describe, expect, it } from '@jest/globals';
import {
  availableStarts,
  bookingsOutsideSchedule,
  bookingsWithoutEquipment,
  type OccupyingBooking,
} from './availability';
import type {
  CenterEquipment,
  CenterSchedule,
  ScheduleBlock,
} from './center-schedule.model';

const ZONE = 'America/La_Paz';
const TUESDAY: ScheduleBlock = {
  windows: [{ dayOfWeek: 2, startTime: '08:00', endTime: '09:00' }],
  slotMinutes: 30,
};
const FROM = new Date('2026-11-10T00:00:00Z');
const TO = new Date('2026-11-11T00:00:00Z');
const NOW = new Date('2026-11-01T00:00:00Z');

const booking = (
  id: string,
  start: string,
  modalityCode: OccupyingBooking['modalityCode'] = 'ECO',
  studyCode: string | null = 'STUDY-ECO-ABD',
): OccupyingBooking => ({
  id,
  startAt: new Date(start),
  endAt: new Date(new Date(start).getTime() + 30 * 60_000),
  modalityCode,
  studyCode,
});

const base = {
  block: TUESDAY,
  zone: ZONE,
  modalityCode: 'ECO' as const,
  from: FROM,
  to: TO,
  now: NOW,
};

describe('availableStarts', () => {
  it('subtracts overlapping bookings of the same modality from the capacity', () => {
    const items = availableStarts({
      ...base,
      capacityAt: () => 2,
      occupying: [
        booking('b1', '2026-11-10T12:00:00Z'),
        booking('b2', '2026-11-10T12:00:00Z', 'RX'),
      ],
    });
    expect(items).toEqual([
      {
        startAt: '2026-11-10T12:00:00.000Z',
        endAt: '2026-11-10T12:30:00.000Z',
        remaining: 1,
        capacity: 2,
      },
      {
        startAt: '2026-11-10T12:30:00.000Z',
        endAt: '2026-11-10T13:00:00.000Z',
        remaining: 2,
        capacity: 2,
      },
    ]);
  });

  it('a full slot disappears, and a booking without modality takes from every modality', () => {
    const items = availableStarts({
      ...base,
      capacityAt: () => 1,
      occupying: [booking('b1', '2026-11-10T12:00:00Z', null, null)],
    });
    expect(items.map((i) => i.startAt)).toEqual(['2026-11-10T12:30:00.000Z']);
  });

  it('no operational equipment, no starts', () => {
    expect(
      availableStarts({ ...base, capacityAt: () => 0, occupying: [] }),
    ).toEqual([]);
  });

  it('never offers a start inside the booking margin', () => {
    const items = availableStarts({
      ...base,
      capacityAt: () => 1,
      occupying: [],
      now: new Date('2026-11-10T11:45:00Z'),
    });
    expect(items.map((i) => i.startAt)).toEqual(['2026-11-10T12:30:00.000Z']);
  });
});

describe('bookingsOutsideSchedule', () => {
  const schedule: CenterSchedule = {
    general: TUESDAY,
    modalities: [],
    studies: [],
    equipment: [],
  };

  it('counts the bookings that would not start on a slot of the new schedule', () => {
    expect(
      bookingsOutsideSchedule(
        schedule,
        [
          booking('in', '2026-11-10T12:30:00Z'),
          booking('out', '2026-11-11T12:30:00Z'),
        ],
        ZONE,
      ),
    ).toBe(1);
  });
});

describe('bookingsWithoutEquipment', () => {
  const eco = (
    status: CenterEquipment['status'],
    id: string = status,
  ): CenterEquipment => ({
    id,
    name: 'Ecógrafo',
    manufacturer: null,
    model: null,
    serialNumber: null,
    modalityCode: 'ECO',
    status,
    glossaryConceptId: null,
  });

  const schedule: CenterSchedule = {
    general: TUESDAY,
    modalities: [],
    studies: [],
    equipment: [],
  };

  it('flags only the bookings that no open line can take', () => {
    const future = [
      booking('a', '2026-11-10T12:00:00Z'),
      booking('b', '2026-11-10T12:00:00Z'),
    ];
    expect(
      bookingsWithoutEquipment(
        schedule,
        future,
        [eco('OPERATIONAL', 'e1'), eco('OPERATIONAL', 'e2')],
        ZONE,
      ),
    ).toBe(0);
    expect(
      bookingsWithoutEquipment(
        schedule,
        future,
        [eco('OPERATIONAL', 'e1'), eco('MAINTENANCE', 'e2')],
        ZONE,
      ),
    ).toBe(1);
  });

  it('a modality without registered devices rides on the declared capacity', () => {
    expect(
      bookingsWithoutEquipment(
        schedule,
        [booking('a', '2026-11-10T12:00:00Z', 'RX')],
        [eco('OPERATIONAL', 'e1')],
        ZONE,
      ),
    ).toBe(0);
  });
});
