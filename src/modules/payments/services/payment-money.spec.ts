import {
  compareAmounts,
  isPositiveAmount,
  subtractAmounts,
  addAmounts,
} from './payment-money';

describe('payment-money (MCH-017)', () => {
  it('0.10 + 0.20 es exactamente 0.30', () => {
    expect(compareAmounts(addAmounts(['0.10', '0.20']), '0.30')).toBe(0);
  });

  it('la lista vacía suma cero', () => {
    expect(addAmounts([])).toBe('0');
  });

  it('compara por valor entre escalas distintas', () => {
    expect(compareAmounts('0.3', '0.30')).toBe(0);
    expect(compareAmounts('100', '99.999')).toBe(1);
    expect(compareAmounts('1.005', '1.01')).toBe(-1);
  });

  it('distingue una unidad menor en montos que no caben en un doble', () => {
    expect(compareAmounts('90071992547409.92', '90071992547409.91')).toBe(1);
  });

  it('resta exacta, incluso con resultado negativo', () => {
    expect(subtractAmounts('100.00', '40.00')).toBe('60.00');
    expect(subtractAmounts('0.30', '0.31')).toBe('-0.01');
    expect(subtractAmounts('0.30', '-0.10')).toBe('0.40');
  });

  it('sólo son positivos los decimales mayores que cero', () => {
    expect(isPositiveAmount('0.01')).toBe(true);
    expect(isPositiveAmount('0')).toBe(false);
    expect(isPositiveAmount('0.00')).toBe(false);
    expect(isPositiveAmount('-1')).toBe(false);
    expect(isPositiveAmount('1e3')).toBe(false);
    expect(isPositiveAmount('abc')).toBe(false);
  });
});
