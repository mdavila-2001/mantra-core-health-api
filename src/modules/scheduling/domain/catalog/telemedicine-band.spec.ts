import { startsInTelemedicineBand } from './telemedicine-band';

describe('startsInTelemedicineBand (v4.2.61)', () => {
  const zone = 'America/La_Paz'; // UTC-4, sin horario de verano
  // Jueves 10/09/2026 de 08:00 a 12:00 en La Paz.
  const thursday = {
    dayOfWeek: 4,
    startTime: '08:00:00',
    endTime: '12:00:00',
    telemedicineEnabled: true,
  };

  it('acepta un inicio dentro de una franja con telemedicina', () => {
    // 10:00 de La Paz = 14:00 UTC.
    expect(
      startsInTelemedicineBand(
        new Date('2026-09-10T14:00:00Z'),
        [thursday],
        zone,
      ),
    ).toBe(true);
  });

  it('por defecto no: la misma franja sin telemedicina rechaza', () => {
    expect(
      startsInTelemedicineBand(
        new Date('2026-09-10T14:00:00Z'),
        [{ ...thursday, telemedicineEnabled: false }],
        zone,
      ),
    ).toBe(false);
  });

  it('sin franjas no hay telemedicina', () => {
    expect(
      startsInTelemedicineBand(new Date('2026-09-10T14:00:00Z'), [], zone),
    ).toBe(false);
  });

  it('el inicio es inclusivo y el fin exclusivo', () => {
    // 08:00 La Paz = 12:00 UTC; 12:00 La Paz = 16:00 UTC.
    expect(
      startsInTelemedicineBand(
        new Date('2026-09-10T12:00:00Z'),
        [thursday],
        zone,
      ),
    ).toBe(true);
    expect(
      startsInTelemedicineBand(
        new Date('2026-09-10T16:00:00Z'),
        [thursday],
        zone,
      ),
    ).toBe(false);
  });

  it('evalúa la hora de pared de la sede, no la de UTC', () => {
    // 13:00 UTC del jueves es 09:00 en La Paz (dentro) pero 13:00 en UTC (fuera).
    const at = new Date('2026-09-10T13:00:00Z');
    expect(startsInTelemedicineBand(at, [thursday], zone)).toBe(true);
    expect(
      startsInTelemedicineBand(
        at,
        [{ ...thursday, startTime: '14:00:00', endTime: '18:00:00' }],
        'UTC',
      ),
    ).toBe(false);
  });

  it('otro día de la semana no cuenta', () => {
    // Viernes 11/09 a las 10:00 de La Paz.
    expect(
      startsInTelemedicineBand(
        new Date('2026-09-11T14:00:00Z'),
        [thursday],
        zone,
      ),
    ).toBe(false);
  });

  it('respeta la vigencia de la plantilla', () => {
    const at = new Date('2026-09-10T14:00:00Z');
    expect(
      startsInTelemedicineBand(
        at,
        [{ ...thursday, validFrom: new Date('2026-09-11T00:00:00Z') }],
        zone,
      ),
    ).toBe(false);
    expect(
      startsInTelemedicineBand(
        at,
        [{ ...thursday, validTo: new Date('2026-09-09T00:00:00Z') }],
        zone,
      ),
    ).toBe(false);
    expect(
      startsInTelemedicineBand(
        at,
        [
          {
            ...thursday,
            validFrom: new Date('2026-09-10T00:00:00Z'),
            validTo: new Date('2026-09-10T00:00:00Z'),
          },
        ],
        zone,
      ),
    ).toBe(true);
  });
});
