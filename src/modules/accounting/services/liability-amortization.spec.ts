import {
  addMonthsUtc,
  buildAmortizationSchedule,
} from './liability-amortization';

describe('buildAmortizationSchedule', () => {
  it('reparte el principal en partes iguales, ajustando el resto en la última cuota', () => {
    const rows = buildAmortizationSchedule({
      principalAmount: '1000.00',
      installments: 3,
      startDate: new Date('2026-01-15'),
    });

    expect(rows).toHaveLength(3);
    // 100000 centavos / 3 = 33333,33 → 333.33 por cuota, piso.
    expect(rows[0]?.principalDue).toBe('333.33');
    expect(rows[1]?.principalDue).toBe('333.33');
    // 1000.00 - 333.33 - 333.33 = 333.34: la última se queda el resto exacto.
    expect(rows[2]?.principalDue).toBe('333.34');

    const sum = rows.reduce((acc, f) => acc + Number(f.principalDue), 0);
    expect(sum.toFixed(2)).toBe('1000.00');
  });

  it('calcula el interés sobre el saldo antes de esa cuota, no sobre el principal original', () => {
    const rows = buildAmortizationSchedule({
      principalAmount: '1200.00',
      annualInterestRate: '12.00', // 1 % mensual
      installments: 2,
      startDate: new Date('2026-01-01'),
    });

    // Cuota 1: interés sobre 1200.00 → 12.00.
    expect(rows[0]?.interestDue).toBe('12.00');
    // Cuota 2: interés sobre el saldo restante, 600.00 → 6.00.
    expect(rows[1]?.interestDue).toBe('6.00');
  });

  it('sin tasa declarada, el interés es cero', () => {
    const rows = buildAmortizationSchedule({
      principalAmount: '500.00',
      installments: 1,
      startDate: new Date('2026-01-01'),
    });

    expect(rows[0]?.interestDue).toBe('0.00');
    expect(rows[0]?.principalDue).toBe('500.00');
  });

  it('la cuota N vence N meses después del alta, el mismo día del mes', () => {
    const rows = buildAmortizationSchedule({
      principalAmount: '300.00',
      installments: 3,
      startDate: new Date('2026-10-01'), // como llega del DTO: medianoche UTC
    });
    // Antes se sumaba en hora local: con TZ=America/La_Paz salían
    // 2026-10-31, 2026-12-01 y 2026-12-31 (observado contra la API viva).
    expect(rows.map((row) => row.dueDate.toISOString().slice(0, 10))).toEqual([
      '2026-11-01',
      '2026-12-01',
      '2027-01-01',
    ]);
  });

  it('un alta de fin de mes vence el último día de cada mes, sin saltar al siguiente', () => {
    const rows = buildAmortizationSchedule({
      principalAmount: '400.00',
      installments: 4,
      startDate: new Date('2026-01-31'),
    });
    expect(rows.map((row) => row.dueDate.toISOString().slice(0, 10))).toEqual([
      '2026-02-28',
      '2026-03-31',
      '2026-04-30',
      '2026-05-31',
    ]);
  });

  describe('addMonthsUtc', () => {
    it('respeta el 29 de febrero de un año bisiesto', () => {
      expect(
        addMonthsUtc(new Date('2027-12-31'), 2).toISOString().slice(0, 10),
      ).toBe('2028-02-29');
    });
  });

  it('rechaza un número de cuotas menor a uno', () => {
    expect(() =>
      buildAmortizationSchedule({
        principalAmount: '100.00',
        installments: 0,
        startDate: new Date('2026-01-01'),
      }),
    ).toThrow();
  });
});
