import { buildAmortizationSchedule } from './liability-amortization';

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

  it('la cuota N vence N meses después del alta', () => {
    // Un 15, no un fin de mes: así el resultado no depende de cómo cada motor
    // de JavaScript normaliza un "31 de febrero" — lo que se fija acá es la
    // relación (mes = alta + N), no la aritmética de calendario del runtime.
    const registration = new Date(2026, 0, 15); // 15 de enero de 2026, hora local.
    const rows = buildAmortizationSchedule({
      principalAmount: '300.00',
      installments: 3,
      startDate: registration,
    });

    rows.forEach((row, index) => {
      const expected = new Date(registration);
      expected.setMonth(expected.getMonth() + index + 1);
      expect(row.dueDate.getTime()).toBe(expected.getTime());
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
