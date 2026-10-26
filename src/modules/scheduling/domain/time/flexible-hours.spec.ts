import {
  flexibleBands,
  flexibleDuration,
  isWholeMinute,
} from './flexible-hours';

const W = {
  from: new Date('2026-11-02T00:00:00.000Z'), // lunes
  to: new Date('2026-11-09T00:00:00.000Z'),
};

describe('flexible-hours', () => {
  it('ubica la franja del día en la zona de la sede', () => {
    const bands = flexibleBands(
      [{ dayOfWeek: 2, startTime: '08:00', endTime: '12:00' }],
      'America/La_Paz', // UTC−4
      W.from,
      W.to,
    );
    expect(bands).toEqual([
      {
        startAt: new Date('2026-11-03T12:00:00.000Z'),
        endAt: new Date('2026-11-03T16:00:00.000Z'),
      },
    ]);
  });

  it('un día con almuerzo son dos franjas, ordenadas', () => {
    const bands = flexibleBands(
      [
        { dayOfWeek: 1, startTime: '14:00', endTime: '18:00' },
        { dayOfWeek: 1, startTime: '08:00', endTime: '12:00' },
      ],
      'UTC',
      W.from,
      W.to,
    );
    expect(bands.map((b) => b.startAt.toISOString())).toEqual([
      '2026-11-02T08:00:00.000Z',
      '2026-11-02T14:00:00.000Z',
    ]);
  });

  it('recorta la franja a la ventana pedida', () => {
    const bands = flexibleBands(
      [{ dayOfWeek: 1, startTime: '08:00', endTime: '12:00' }],
      'UTC',
      new Date('2026-11-02T10:00:00.000Z'),
      W.to,
    );
    expect(bands[0].startAt.toISOString()).toBe('2026-11-02T10:00:00.000Z');
  });

  it('al recortar a una ventana que empieza a mitad de un paso, conserva la grilla de inicios', () => {
    const bands = flexibleBands(
      [{ dayOfWeek: 1, startTime: '09:00', endTime: '13:00' }],
      'UTC',
      new Date('2026-11-02T09:53:14.989Z'),
      W.to,
    );
    expect(bands[0].startAt.toISOString()).toBe('2026-11-02T10:00:00.000Z');
    expect(isWholeMinute(bands[0].startAt)).toBe(true);
  });

  it('dos ventanas que empiezan en instantes distintos del mismo paso dan el mismo primer inicio', () => {
    const rule = [{ dayOfWeek: 1, startTime: '09:00', endTime: '13:00' }];
    const a = flexibleBands(
      rule,
      'UTC',
      new Date('2026-11-02T09:46:00.000Z'),
      W.to,
    );
    const b = flexibleBands(
      rule,
      'UTC',
      new Date('2026-11-02T09:59:59.999Z'),
      W.to,
    );
    expect(a[0].startAt).toEqual(b[0].startAt);
  });

  it('respeta la vigencia de la plantilla cuando la franja no declara la suya', () => {
    const bands = flexibleBands(
      [{ dayOfWeek: 1, startTime: '08:00', endTime: '12:00' }],
      'UTC',
      W.from,
      new Date('2026-11-17T00:00:00.000Z'),
      { validFrom: '2026-11-03' },
    );
    expect(bands.map((b) => b.startAt.toISOString().slice(0, 10))).toEqual([
      '2026-11-09',
      '2026-11-16',
    ]);
  });

  it('un turno flexible es un servicio de duración fija y sin colchones', () => {
    expect(flexibleDuration(20)).toEqual({
      minDurationMinutes: 20,
      maxDurationMinutes: 20,
      prepMinutes: 0,
      cleanupMinutes: 0,
    });
    expect(() => flexibleDuration(0)).toThrow(RangeError);
    expect(() => flexibleDuration(12.5)).toThrow(RangeError);
  });

  it('la hora pedida no lleva segundos', () => {
    expect(isWholeMinute(new Date('2026-11-02T08:07:00.000Z'))).toBe(true);
    expect(isWholeMinute(new Date('2026-11-02T08:07:30.000Z'))).toBe(false);
  });
});
