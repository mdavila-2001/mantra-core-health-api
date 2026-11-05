import { isFlexibleBand, startsInFlexibleBand } from './flexible-band';

// Lunes de turnos fijos y martes flexible: «el lunes doy turnos de 30, el
// martes atiendo a la hora que me pidan».
const lunesFijo = {
  dayOfWeek: 1,
  startTime: '09:00:00',
  endTime: '11:00:00',
  flexibleHours: false,
};
const martesFlexible = {
  dayOfWeek: 2,
  startTime: '09:00:00',
  endTime: '11:00:00',
  flexibleHours: true,
};

describe('isFlexibleBand', () => {
  it('la plantilla flexible implica la franja, diga lo que diga la franja', () => {
    expect(isFlexibleBand(true, { flexibleHours: false })).toBe(true);
    expect(isFlexibleBand(true, {})).toBe(true);
  });

  it('con la plantilla de turnos fijos, cada franja dice el suyo; ausente ≡ false', () => {
    expect(isFlexibleBand(false, { flexibleHours: true })).toBe(true);
    expect(isFlexibleBand(false, { flexibleHours: false })).toBe(false);
    expect(isFlexibleBand(false, {})).toBe(false);
  });
});

describe('startsInFlexibleBand', () => {
  // 1 y 2 de junio de 2026 son lunes y martes.
  it('un cupo del martes cae en la franja flexible', () => {
    expect(
      startsInFlexibleBand(
        new Date('2026-06-02T09:30:00Z'),
        false,
        [lunesFijo, martesFlexible],
        'UTC',
      ),
    ).toBe(true);
  });

  it('un cupo del lunes no: su franja es de turnos fijos', () => {
    expect(
      startsInFlexibleBand(
        new Date('2026-06-01T09:40:00Z'),
        false,
        [lunesFijo, martesFlexible],
        'UTC',
      ),
    ).toBe(false);
  });

  it('el fin de la franja es abierto: a las 11:00 del martes ya no es flexible', () => {
    expect(
      startsInFlexibleBand(
        new Date('2026-06-02T11:00:00Z'),
        false,
        [lunesFijo, martesFlexible],
        'UTC',
      ),
    ).toBe(false);
  });

  it('ubica la franja en la hora de pared de la sede, no en UTC', () => {
    // Martes 09:30 en La Paz (UTC-4) son las 13:30 UTC.
    expect(
      startsInFlexibleBand(
        new Date('2026-06-02T13:30:00Z'),
        false,
        [martesFlexible],
        'America/La_Paz',
      ),
    ).toBe(true);
  });
});
