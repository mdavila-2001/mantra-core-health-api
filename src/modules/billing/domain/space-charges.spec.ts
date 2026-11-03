import { describe, expect, it } from '@jest/globals';
import { bedDays, orTimeUnits } from './space-charges';

const LA_PAZ = -240;

describe('día-cama por medianoche (§F5e, D7)', () => {
  it('ingreso 27/10 15:00, traslado a UCI 28/10 10:00, egreso 30/10 09:00 → 27 (compartida), 28 y 29 (UCI)', () => {
    const days = bedDays(
      [
        {
          careSpaceId: 'shared',
          start: new Date('2026-10-27T19:00:00Z'),
          end: new Date('2026-10-28T14:00:00Z'),
        },
        {
          careSpaceId: 'icu',
          start: new Date('2026-10-28T14:00:00Z'),
          end: new Date('2026-10-30T13:00:00Z'),
        },
      ],
      LA_PAZ,
      new Date('2026-10-30T13:00:00Z'),
      true,
      true,
    );
    expect(days.map((d) => [d.serviceDate, d.careSpaceId])).toEqual([
      ['2026-10-27', 'shared'],
      ['2026-10-28', 'icu'],
      ['2026-10-29', 'icu'],
    ]);
  });

  it('estancia del mismo día: 1 día si bed_day_min_one y terminó; 0 si sigue o no se exige', () => {
    const seg = [
      {
        careSpaceId: 'b',
        start: new Date('2026-10-27T12:00:00Z'),
        end: new Date('2026-10-27T20:00:00Z'),
      },
    ];
    expect(
      bedDays(seg, LA_PAZ, new Date('2026-10-27T20:00:00Z'), true, true).map(
        (d) => d.serviceDate,
      ),
    ).toEqual(['2026-10-27']);
    expect(
      bedDays(seg, LA_PAZ, new Date('2026-10-27T20:00:00Z'), false, true),
    ).toEqual([]);
  });

  it('una medianoche sin cama (hueco) no devenga', () => {
    const days = bedDays(
      [
        {
          careSpaceId: 'a',
          start: new Date('2026-10-27T12:00:00Z'),
          end: new Date('2026-10-28T02:00:00Z'),
        },
        {
          careSpaceId: 'b',
          start: new Date('2026-10-28T06:00:00Z'),
          end: null,
        },
      ],
      LA_PAZ,
      new Date('2026-10-29T12:00:00Z'),
      true,
      false,
    );
    expect(days.map((d) => d.serviceDate)).toEqual(['2026-10-28']);
  });

  it('quirófano por tiempo: 95 min con unidad 30 → 4; mínimo respetado', () => {
    expect(orTimeUnits(95, 30)).toBe(4);
    expect(orTimeUnits(10, 30, 2)).toBe(2);
  });
});
