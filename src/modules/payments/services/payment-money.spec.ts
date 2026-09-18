import {
  compararImportes,
  esImportePositivo,
  restarImportes,
  sumarImportes,
} from './payment-money';

describe('payment-money (MCH-017)', () => {
  it('0.10 + 0.20 es exactamente 0.30', () => {
    expect(compararImportes(sumarImportes(['0.10', '0.20']), '0.30')).toBe(0);
  });

  it('la lista vacía suma cero', () => {
    expect(sumarImportes([])).toBe('0');
  });

  it('compara por valor entre escalas distintas', () => {
    expect(compararImportes('0.3', '0.30')).toBe(0);
    expect(compararImportes('100', '99.999')).toBe(1);
    expect(compararImportes('1.005', '1.01')).toBe(-1);
  });

  it('distingue una unidad menor en montos que no caben en un doble', () => {
    expect(compararImportes('90071992547409.92', '90071992547409.91')).toBe(1);
  });

  it('resta exacta, incluso con resultado negativo', () => {
    expect(restarImportes('100.00', '40.00')).toBe('60.00');
    expect(restarImportes('0.30', '0.31')).toBe('-0.01');
    expect(restarImportes('0.30', '-0.10')).toBe('0.40');
  });

  it('sólo son positivos los decimales mayores que cero', () => {
    expect(esImportePositivo('0.01')).toBe(true);
    expect(esImportePositivo('0')).toBe(false);
    expect(esImportePositivo('0.00')).toBe(false);
    expect(esImportePositivo('-1')).toBe(false);
    expect(esImportePositivo('1e3')).toBe(false);
    expect(esImportePositivo('abc')).toBe(false);
  });
});
