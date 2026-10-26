import {
  applyStockChange,
  categoryNameKey,
  cleanCategoryName,
  fromCents,
  isInStock,
  isLowStock,
  normalizeMoney,
  toCents,
} from './pharmacy-catalog-rules';

describe('reglas del catálogo de la farmacia (P47)', () => {
  describe('normalizeMoney — importe exacto, nunca coma flotante', () => {
    it.each([
      [12.5, '12.50'],
      ['12.5', '12.50'],
      [7, '7.00'],
      ['0.10', '0.10'],
      ['007.1', '7.10'],
      [9999999999.99, '9999999999.99'],
    ])('%p → %p', (input, expected) => {
      expect(normalizeMoney(input)).toBe(expected);
    });

    it.each([
      0,
      '0.00',
      -1,
      0.125,
      '1e3',
      1e21,
      '12,50',
      '',
      NaN,
      Infinity,
      null,
      true,
    ])('rechaza %p', (input) => {
      expect(normalizeMoney(input)).toBeNull();
    });
  });

  it('centavos ida y vuelta sin pérdida', () => {
    expect(toCents('0.10') * 3n).toBe(30n);
    expect(fromCents(toCents('10.20') * 2n + toCents('0.10') * 3n)).toBe(
      '20.70',
    );
    expect(fromCents(5n)).toBe('0.05');
  });

  it('el nombre de la categoría se compara sin mayúsculas, tildes ni espacios de más', () => {
    expect(categoryNameKey('  Bebé   y Maternidad ')).toBe('bebe y maternidad');
    expect(cleanCategoryName('  Bebé   y Maternidad ')).toBe(
      'Bebé y Maternidad',
    );
    expect(cleanCategoryName('   ')).toBeNull();
    expect(cleanCategoryName('a'.repeat(61))).toBeNull();
  });

  describe('existencias declaradas', () => {
    it('sin conteo hay; con 0 no hay; «no tengo» manda', () => {
      expect(
        isInStock({ stockQuantity: null, outOfStockDeclared: false }),
      ).toBe(true);
      expect(isInStock({ stockQuantity: 0, outOfStockDeclared: false })).toBe(
        false,
      );
      expect(isInStock({ stockQuantity: 9, outOfStockDeclared: true })).toBe(
        false,
      );
    });

    it('bajo umbral: sólo con conteo y en stock; umbral por defecto 5', () => {
      expect(isLowStock({ stockQuantity: 5, outOfStockDeclared: false })).toBe(
        true,
      );
      expect(isLowStock({ stockQuantity: 6, outOfStockDeclared: false })).toBe(
        false,
      );
      expect(
        isLowStock({
          stockQuantity: 6,
          minStockQuantity: 6,
          outOfStockDeclared: false,
        }),
      ).toBe(true);
      expect(
        isLowStock({ stockQuantity: null, outOfStockDeclared: false }),
      ).toBe(false);
      expect(isLowStock({ stockQuantity: 0, outOfStockDeclared: false })).toBe(
        false,
      );
    });

    it('dar el número borra el «no tengo»; «tengo» sobre 0 deja sin conteo', () => {
      const p = { stockQuantity: 0 as number | null, outOfStockDeclared: true };
      applyStockChange(p, { stock: 4 });
      expect(p).toEqual({ stockQuantity: 4, outOfStockDeclared: false });
      applyStockChange(p, { inStock: false });
      expect(p).toEqual({ stockQuantity: 4, outOfStockDeclared: true });
      const q = { stockQuantity: 0 as number | null, outOfStockDeclared: true };
      applyStockChange(q, { inStock: true });
      expect(q).toEqual({ stockQuantity: null, outOfStockDeclared: false });
    });
  });
});
