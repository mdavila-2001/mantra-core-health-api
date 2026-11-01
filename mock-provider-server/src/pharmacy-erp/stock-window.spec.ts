import {
  STOCK_WINDOW_MS,
  stockWindow,
  unitPriceCents,
  windowedQuantity,
} from './stock-window';
import { ERP_PRODUCTS } from './pharmacy-erp.data';

const CODES = ERP_PRODUCTS.map((p) => p.code);
const T0 = Date.UTC(2026, 9, 31, 12, 0, 0);

function snapshot(pharmacy: string, site: string, window: number): number[] {
  return CODES.map((code) => windowedQuantity(pharmacy, site, code, window));
}

describe('stock por ventanas de cinco minutos', () => {
  it('dos instantes de la misma ventana caen en la misma ventana', () => {
    const a = stockWindow(new Date(T0 + 1_000));
    const b = stockWindow(new Date(T0 + STOCK_WINDOW_MS - 1_000));

    expect(a.index).toBe(b.index);
    expect(b.end.getTime() - b.start.getTime()).toBe(STOCK_WINDOW_MS);
  });

  it('dentro de una ventana, dos consultas dan lo mismo', () => {
    const w = stockWindow(new Date(T0)).index;

    expect(snapshot('FARM-A', 'SUC-1', w)).toEqual(
      snapshot('FARM-A', 'SUC-1', w),
    );
  });

  it('entre ventanas el stock cambia: baja y se repone', () => {
    const w = stockWindow(new Date(T0)).index;
    const series = CODES.map((code) =>
      Array.from({ length: 12 }, (_, i) =>
        windowedQuantity('FARM-A', 'SUC-1', code, w + i),
      ),
    );

    const someDrop = series.some((s) =>
      s.some((q, i) => i > 0 && q < s[i - 1]),
    );
    const someRestock = series.some((s) =>
      s.some((q, i) => i > 0 && q > s[i - 1]),
    );
    expect(someDrop).toBe(true);
    expect(someRestock).toBe(true);
  });

  it('a veces un producto llega a 0, y vuelve a tener', () => {
    const w = stockWindow(new Date(T0)).index;
    const series = CODES.map((code) =>
      Array.from({ length: 12 }, (_, i) =>
        windowedQuantity('FARM-A', 'SUC-1', code, w + i),
      ),
    );

    expect(series.some((s) => s.includes(0) && s.some((q) => q > 0))).toBe(
      true,
    );
    expect(
      series.flat().every((q) => Number.isInteger(q) && q >= 0 && q <= 40),
    ).toBe(true);
  });

  it('dos farmacias con el mismo código de sede no comparten stock', () => {
    const w = stockWindow(new Date(T0)).index;

    expect(snapshot('FARM-A', 'SUC-CENTRO', w)).not.toEqual(
      snapshot('FARM-B', 'SUC-CENTRO', w),
    );
  });

  it('otra sucursal de la misma farmacia tiene su propio stock', () => {
    const w = stockWindow(new Date(T0)).index;

    expect(snapshot('FARM-A', 'SUC-1', w)).not.toEqual(
      snapshot('FARM-A', 'SUC-2', w),
    );
  });

  it('el precio es estable por farmacia y producto, entre 5 y 150 bolivianos', () => {
    const prices = CODES.map((code) => unitPriceCents('FARM-A', code));

    expect(CODES.map((code) => unitPriceCents('FARM-A', code))).toEqual(prices);
    expect(
      prices.every((c) => Number.isInteger(c) && c >= 500 && c <= 15_000),
    ).toBe(true);
    expect(CODES.map((code) => unitPriceCents('FARM-B', code))).not.toEqual(
      prices,
    );
  });
});
