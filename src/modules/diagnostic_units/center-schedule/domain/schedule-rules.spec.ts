import { describe, expect, it } from '@jest/globals';
import type {
  CenterEquipment,
  CenterSchedule,
  ScheduleBlock,
} from './center-schedule.model';
import {
  capacityOf,
  defaultSchedule,
  isSlotStart,
  resolveBlock,
  scopeOfTemplate,
  slotsBetween,
  templateName,
  validateSchedule,
} from './schedule-rules';

const week = (
  start: string,
  end: string,
  slot: number,
  days = [1, 2, 3, 4, 5],
): ScheduleBlock => ({
  windows: days.map((dayOfWeek) => ({
    dayOfWeek,
    startTime: start,
    endTime: end,
  })),
  slotMinutes: slot,
});

const GENERAL = week('08:00', '12:00', 30);
const ECO = week('14:00', '18:00', 20, [2, 4]);
const OBSTETRIC = week('09:00', '11:00', 45, [6]);
const schedule: CenterSchedule = {
  general: GENERAL,
  modalities: [{ modalityCode: 'ECO', schedule: ECO }],
  studies: [{ studyCode: 'STUDY-ECO-OBSTETRICA', schedule: OBSTETRIC }],
};

const device = (
  modalityCode: CenterEquipment['modalityCode'],
  status: CenterEquipment['status'],
): CenterEquipment => ({
  id: `${modalityCode}-${status}`,
  name: 'x',
  manufacturer: null,
  model: null,
  modalityCode,
  status,
  glossaryConceptId: null,
});

const ZONE = 'America/La_Paz'; // UTC-4, no DST

describe('resolveBlock', () => {
  it('a study exception wins over its modality, the modality over the general', () => {
    expect(resolveBlock(schedule, 'STUDY-ECO-OBSTETRICA', 'ECO')).toEqual({
      block: OBSTETRIC,
      origin: 'STUDY',
    });
    expect(resolveBlock(schedule, 'STUDY-ECO-ABD', 'ECO').origin).toBe(
      'MODALITY',
    );
    expect(resolveBlock(schedule, 'STUDY-RX-TORAX', 'RX')).toEqual({
      block: GENERAL,
      origin: 'GENERAL',
    });
  });
});

describe('validateSchedule', () => {
  it('accepts a complete schedule', () => {
    expect(validateSchedule(schedule)).toEqual([]);
  });

  it('rejects an own schedule without days, an inverted window and one too short for a slot', () => {
    const bad: CenterSchedule = {
      general: {
        windows: [{ dayOfWeek: 1, startTime: '12:00', endTime: '08:00' }],
        slotMinutes: 30,
      },
      modalities: [
        { modalityCode: 'ECO', schedule: { windows: [], slotMinutes: 20 } },
      ],
      studies: [
        {
          studyCode: 'S1',
          schedule: week('08:00', '08:10', 30, [1]),
        },
      ],
    };
    expect(validateSchedule(bad).map((p) => p.field)).toEqual([
      'general',
      'ECO',
      'S1',
    ]);
  });
});

describe('slotsBetween', () => {
  it('reads windows as wall-clock time of the center, not UTC', () => {
    // Tuesday 2026-11-10 08:00–09:10 in La Paz is 12:00–13:10 UTC.
    const slots = slotsBetween(
      week('08:00', '09:10', 30, [2]),
      new Date('2026-11-10T00:00:00Z'),
      new Date('2026-11-11T00:00:00Z'),
      ZONE,
    );
    expect(slots.map((s) => s.startAt.toISOString())).toEqual([
      '2026-11-10T12:00:00.000Z',
      '2026-11-10T12:30:00.000Z',
    ]);
    expect(slots[1].endAt.toISOString()).toBe('2026-11-10T13:00:00.000Z');
  });

  it('ISO Sunday (7) is honoured and a day without a window gives nothing', () => {
    const sunday = week('08:00', '09:00', 60, [7]);
    const from = new Date('2026-11-08T00:00:00Z');
    const to = new Date('2026-11-09T03:59:00Z');
    expect(slotsBetween(sunday, from, to, ZONE)).toHaveLength(1);
    expect(slotsBetween(GENERAL, from, to, ZONE)).toEqual([]);
  });

  it('isSlotStart only accepts exact starts of the block', () => {
    expect(isSlotStart(GENERAL, new Date('2026-11-10T12:30:00Z'), ZONE)).toBe(
      true,
    );
    expect(isSlotStart(GENERAL, new Date('2026-11-10T12:40:00Z'), ZONE)).toBe(
      false,
    );
  });
});

describe('capacityOf', () => {
  const park = [
    device('ECO', 'OPERATIONAL'),
    device('ECO', 'OUT_OF_SERVICE'),
    device('RM', 'MAINTENANCE'),
  ];

  it('counts only operational devices of the modality', () => {
    expect(capacityOf(park, 'ECO', 2)).toBe(1);
  });

  it('a modality whose only device is in maintenance has no quota', () => {
    expect(capacityOf(park, 'RM', 2)).toBe(0);
  });

  it('without registered devices the declared capacity applies', () => {
    expect(capacityOf(park, 'LAB', 2)).toBe(2);
  });
});

describe('templates and defaults', () => {
  it('round-trips the level of a block through the template name', () => {
    expect(
      scopeOfTemplate(templateName({ level: 'MODALITY', key: 'ECO' })),
    ).toEqual({ level: 'MODALITY', key: 'ECO' });
    expect(
      scopeOfTemplate(templateName({ level: 'STUDY', key: 'STUDY-X' })),
    ).toEqual({ level: 'STUDY', key: 'STUDY-X' });
    // The seeded «Horario de …» template is a general one.
    expect(scopeOfTemplate('Horario de Centro')).toEqual({ level: 'GENERAL' });
  });

  it('a laboratory opens early on six days, an imaging center on weekdays', () => {
    expect(defaultSchedule('LABORATORY').general.windows).toHaveLength(6);
    expect(defaultSchedule('IMAGING').general.slotMinutes).toBe(30);
  });
});
