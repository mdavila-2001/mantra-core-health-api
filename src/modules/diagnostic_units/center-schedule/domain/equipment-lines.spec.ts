import { describe, expect, it } from '@jest/globals';
import type {
  CenterEquipment,
  CenterSchedule,
  ScheduleBlock,
} from './center-schedule.model';
import { assignToLines, shiftCovers, slotCapacity } from './equipment-lines';

const ZONE = 'America/La_Paz';
// Tuesday 10/11/2026, 08:00–12:00 in La Paz is 12:00–16:00 UTC.
const MORNING: ScheduleBlock = {
  windows: [{ dayOfWeek: 2, startTime: '08:00', endTime: '10:00' }],
  slotMinutes: 30,
};
const at = (iso: string): Date => new Date(iso);
const device = (
  id: string,
  status: CenterEquipment['status'] = 'OPERATIONAL',
): CenterEquipment => ({
  id,
  name: id,
  manufacturer: null,
  model: null,
  serialNumber: null,
  modalityCode: 'ECO',
  status,
  glossaryConceptId: null,
});
const schedule = (equipment: CenterSchedule['equipment']): CenterSchedule => ({
  general: MORNING,
  modalities: [],
  studies: [],
  equipment,
});
const booking = (id: string, start: string) => ({
  id,
  startAt: at(start),
  endAt: new Date(at(start).getTime() + 30 * 60_000),
  modalityCode: 'ECO' as const,
});

describe('shiftCovers', () => {
  it('covers a slot inside the window and not one that runs past its close', () => {
    expect(
      shiftCovers(
        MORNING,
        at('2026-11-10T12:00:00Z'),
        at('2026-11-10T12:30:00Z'),
        ZONE,
      ),
    ).toBe(true);
    expect(
      shiftCovers(
        MORNING,
        at('2026-11-10T13:45:00Z'),
        at('2026-11-10T14:15:00Z'),
        ZONE,
      ),
    ).toBe(false);
    expect(
      shiftCovers(
        MORNING,
        at('2026-11-11T12:00:00Z'),
        at('2026-11-11T12:30:00Z'),
        ZONE,
      ),
    ).toBe(false);
  });
});

describe('slotCapacity', () => {
  const equipment = [device('a'), device('b'), device('c', 'MAINTENANCE')];

  it('counts the operational lines open for the slot', () => {
    const s = schedule([
      {
        equipmentId: 'b',
        schedule: {
          windows: [{ dayOfWeek: 2, startTime: '09:00', endTime: '10:00' }],
          slotMinutes: 30,
        },
      },
    ]);
    const cap = (start: string, end: string) =>
      slotCapacity(s, equipment, 'ECO', 9, at(start), at(end), ZONE);
    // 08:00 local: only «a» (b starts at 09:00, c is in maintenance).
    expect(cap('2026-11-10T12:00:00Z', '2026-11-10T12:30:00Z')).toBe(1);
    // 09:00 local: «a» and «b».
    expect(cap('2026-11-10T13:00:00Z', '2026-11-10T13:30:00Z')).toBe(2);
  });

  it('falls back to the declared capacity when the modality has no device', () => {
    expect(
      slotCapacity(
        schedule([]),
        equipment,
        'RX',
        3,
        at('2026-11-10T12:00:00Z'),
        at('2026-11-10T12:30:00Z'),
        ZONE,
      ),
    ).toBe(3);
  });
});

describe('assignToLines', () => {
  it('fills each line first come first served and leaves the overflow unassigned', () => {
    const queues = assignToLines(
      schedule([]),
      [device('a'), device('b')],
      [
        booking('3', '2026-11-10T12:00:00Z'),
        booking('1', '2026-11-10T12:00:00Z'),
        booking('2', '2026-11-10T12:00:00Z'),
        booking('4', '2026-11-10T12:30:00Z'),
      ],
      ZONE,
    );
    expect(queues.byEquipment.get('a')).toEqual(['1', '4']);
    expect(queues.byEquipment.get('b')).toEqual(['2']);
    expect(queues.unassigned).toEqual(['3']);
  });
});
