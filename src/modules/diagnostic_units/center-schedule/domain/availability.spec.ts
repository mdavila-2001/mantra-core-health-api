import { describe, expect, it } from '@jest/globals';
import {
  availableStarts,
  bookingsOutsideSchedule,
  bookingsWithoutEquipment,
  planAdoption,
  unionOfDevices,
  type OccupyingBooking,
} from './availability';
import type {
  CenterDevice,
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
  slotId: `slot-${id}`,
  resourceId: 'center',
  startAt: new Date(start),
  endAt: new Date(new Date(start).getTime() + 30 * 60_000),
  modalityCode,
  studyCode,
  equipmentId: null,
});

const eco = (
  id: string,
  status: CenterDevice['status'] = 'OPERATIONAL',
  schedule: ScheduleBlock | null = null,
): CenterDevice => ({
  id,
  name: 'Ecógrafo',
  typeCode: 'US',
  manufacturer: null,
  model: null,
  serialNumber: null,
  modalityCode: 'ECO',
  status,
  schedule,
  resourceId: null,
  glossaryConceptId: null,
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
      capacity: 2,
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
      capacity: 1,
      occupying: [booking('b1', '2026-11-10T12:00:00Z', null, null)],
    });
    expect(items.map((i) => i.startAt)).toEqual(['2026-11-10T12:30:00.000Z']);
  });

  it('no operational equipment, no starts', () => {
    expect(availableStarts({ ...base, capacity: 0, occupying: [] })).toEqual(
      [],
    );
  });

  it('never offers a start inside the booking margin', () => {
    const items = availableStarts({
      ...base,
      capacity: 1,
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
  };

  it('counts the bookings that would not start on a slot of the new schedule', () => {
    expect(
      bookingsOutsideSchedule(
        schedule,
        [
          booking('in', '2026-11-10T12:30:00Z'),
          booking('out', '2026-11-11T12:30:00Z'),
        ],
        [],
        ZONE,
      ),
    ).toBe(1);
  });

  it('a booking on a device with its own hours is judged by those, not by the general block', () => {
    const wednesday: ScheduleBlock = {
      windows: [{ dayOfWeek: 3, startTime: '08:00', endTime: '09:00' }],
      slotMinutes: 30,
    };
    const onDevice = {
      ...booking('d', '2026-11-11T12:30:00Z'),
      equipmentId: 'e1',
    };
    expect(
      bookingsOutsideSchedule(
        schedule,
        [onDevice],
        [eco('e1', 'OPERATIONAL', wednesday)],
        ZONE,
      ),
    ).toBe(0);
    expect(
      bookingsOutsideSchedule(schedule, [onDevice], [eco('e1')], ZONE),
    ).toBe(1);
  });
});

describe('bookingsWithoutEquipment', () => {
  const schedule: CenterSchedule = {
    general: TUESDAY,
    modalities: [],
    studies: [],
  };

  it('flags the legacy bookings no operational device can adopt, and those on a device that is down', () => {
    const future = [
      booking('a', '2026-11-10T12:00:00Z'),
      booking('b', '2026-11-10T12:00:00Z'),
    ];
    expect(
      bookingsWithoutEquipment(schedule, future, [eco('x'), eco('y')], 1, ZONE),
    ).toBe(0);
    expect(
      bookingsWithoutEquipment(
        schedule,
        future,
        [eco('x'), eco('y', 'MAINTENANCE')],
        1,
        ZONE,
      ),
    ).toBe(1);
    const onDown = {
      ...booking('c', '2026-11-10T12:30:00Z'),
      equipmentId: 'y',
    };
    expect(
      bookingsWithoutEquipment(
        schedule,
        [onDown],
        [eco('y', 'OUT_OF_SERVICE')],
        1,
        ZONE,
      ),
    ).toBe(1);
  });

  it('without devices, the declared capacity of the center applies', () => {
    const future = [
      booking('a', '2026-11-10T12:00:00Z'),
      booking('b', '2026-11-10T12:00:00Z'),
    ];
    expect(bookingsWithoutEquipment(schedule, future, [], 2, ZONE)).toBe(0);
    expect(bookingsWithoutEquipment(schedule, future, [], 1, ZONE)).toBe(2);
  });
});

describe('planAdoption', () => {
  const schedule: CenterSchedule = {
    general: TUESDAY,
    modalities: [],
    studies: [],
  };

  it('gives each legacy booking to the first free device that opens then, in start order', () => {
    const legacy = [
      booking('late', '2026-11-10T12:30:00Z'),
      booking('early', '2026-11-10T12:00:00Z'),
      booking('again', '2026-11-10T12:00:00Z'),
      booking('nobody', '2026-11-11T12:00:00Z'),
    ];
    const plan = planAdoption(schedule, legacy, [eco('x'), eco('y')], [], ZONE);
    expect(plan.map((p) => [p.booking.id, p.device.id])).toEqual([
      ['early', 'x'],
      ['again', 'y'],
      ['late', 'x'],
    ]);
  });

  it('respects what a device already has booked', () => {
    const taken = { ...booking('t', '2026-11-10T12:00:00Z'), equipmentId: 'x' };
    const plan = planAdoption(
      schedule,
      [booking('l', '2026-11-10T12:00:00Z')],
      [eco('x')],
      [taken],
      ZONE,
    );
    expect(plan).toEqual([]);
  });
});

describe('unionOfDevices', () => {
  it('merges the starts of every device: remaining is the free ones, capacity the open ones', () => {
    const { items, devicesAt } = unionOfDevices(
      [
        { deviceId: 'y', startAt: 'T1', endAt: 'T1e' },
        { deviceId: 'x', startAt: 'T0', endAt: 'T0e' },
        { deviceId: 'y', startAt: 'T0', endAt: 'T0e' },
      ],
      new Map([
        ['T0', 2],
        ['T1', 2],
      ]),
    );
    expect(items).toEqual([
      { startAt: 'T0', endAt: 'T0e', remaining: 2, capacity: 2 },
      { startAt: 'T1', endAt: 'T1e', remaining: 1, capacity: 2 },
    ]);
    expect(devicesAt.get('T0')?.map((d) => d.deviceId)).toEqual(['x', 'y']);
  });
});
