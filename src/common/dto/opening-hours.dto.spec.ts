import { describe, it, expect } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  OpeningHoursField,
  OpeningHoursShiftDto,
  openingHoursProblem,
} from './opening-hours.dto';

class Holder {
  @OpeningHoursField()
  openingHours?: OpeningHoursShiftDto[];
}

async function problems(openingHours: unknown): Promise<string[]> {
  const errors = await validate(plainToInstance(Holder, { openingHours }));
  const flat = (list: typeof errors): string[] =>
    list.flatMap((e) => [
      ...Object.values(e.constraints ?? {}),
      ...flat(e.children ?? []),
    ]);
  return flat(errors);
}

const shift = (dayOfWeek: number, opensAt: string, closesAt: string) => ({
  dayOfWeek,
  opensAt,
  closesAt,
});

describe('OpeningHoursField', () => {
  it('acepta que falte: el horario es opcional en la API', async () => {
    expect(await problems(undefined)).toEqual([]);
  });

  it('acepta dos turnos por día con cierre al mediodía', async () => {
    expect(
      await problems([
        shift(1, '08:00', '12:00'),
        shift(1, '14:30', '19:00'),
        shift(6, '08:00', '12:00'),
      ]),
    ).toEqual([]);
  });

  it('acepta 00:00–24:00 como día completo', async () => {
    expect(await problems([shift(7, '00:00', '24:00')])).toEqual([]);
  });

  it('rechaza un día fuera de 1..7 y horas mal escritas', async () => {
    expect(await problems([shift(0, '08:00', '12:00')])).not.toEqual([]);
    expect(await problems([shift(1, '8:00', '12:00')])).not.toEqual([]);
    expect(await problems([shift(1, '24:00', '24:00')])).not.toEqual([]);
    expect(await problems([shift(1, '08:00', '25:00')])).not.toEqual([]);
  });

  it('rechaza un turno que cierra antes de abrir', async () => {
    expect(await problems([shift(2, '18:00', '09:00')])).toHaveLength(1);
  });

  it('rechaza tres turnos en un día y turnos superpuestos', async () => {
    expect(
      await problems([
        shift(3, '07:00', '09:00'),
        shift(3, '10:00', '12:00'),
        shift(3, '14:00', '18:00'),
      ]),
    ).toHaveLength(1);
    expect(
      await problems([shift(4, '08:00', '13:00'), shift(4, '12:00', '18:00')]),
    ).toHaveLength(1);
  });

  it('rechaza más de catorce turnos', async () => {
    const many = Array.from({ length: 15 }, (_, i) =>
      shift((i % 7) + 1, i < 7 ? '06:00' : '13:00', i < 7 ? '12:00' : '20:00'),
    );
    expect(await problems(many)).not.toEqual([]);
  });
});

describe('openingHoursProblem', () => {
  it('nombra la regla que falla', () => {
    expect(openingHoursProblem([shift(1, '09:00', '09:00')])).toBe(
      'Cada turno cierra después de abrir',
    );
    expect(
      openingHoursProblem([
        shift(1, '08:00', '12:00'),
        shift(1, '11:00', '15:00'),
      ]),
    ).toBe('Los turnos de un mismo día no se superponen');
    expect(openingHoursProblem([shift(1, '08:00', '12:00')])).toBeNull();
  });
});
