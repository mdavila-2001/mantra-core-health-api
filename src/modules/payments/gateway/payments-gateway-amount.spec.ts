import {
  GatewayAmountError,
  decimalToMinorUnits,
  minorUnitsToDecimal,
} from './payments-gateway-amount';

describe('decimalToMinorUnits', () => {
  describe('correcto', () => {
    it.each([
      ['150.00', 15000],
      ['150', 15000],
      ['0.01', 1],
      ['0.1', 10],
      ['1234567.89', 123456789],
    ])('%s -> %i centavos', (amount, minor) => {
      expect(decimalToMinorUnits(amount)).toBe(minor);
    });
  });

  describe('límite', () => {
    it('los ceros de más a la derecha no cuentan como decimales', () => {
      expect(decimalToMinorUnits('150.500000')).toBe(15050);
      expect(decimalToMinorUnits('150.000000')).toBe(15000);
    });

    it('0.01 es el mínimo admitido', () => {
      expect(decimalToMinorUnits('0.01')).toBe(1);
    });

    it('el mayor entero seguro de JSON entra y el siguiente no', () => {
      expect(decimalToMinorUnits('90071992547409.91')).toBe(
        Number.MAX_SAFE_INTEGER,
      );
      expect(() => decimalToMinorUnits('90071992547409.92')).toThrow(
        new GatewayAmountError('too_large'),
      );
    });

    it('no pasa por coma flotante: 0.07 * 100 daría 7.000000000000001', () => {
      expect(decimalToMinorUnits('0.07')).toBe(7);
      expect(decimalToMinorUnits('19.99')).toBe(1999);
    });
  });

  describe('inválido', () => {
    it.each([['150.005'], ['0.001'], ['10.123456']])(
      '%s tiene más decimales que la moneda: se rechaza, NO se redondea',
      (amount) => {
        expect(() => decimalToMinorUnits(amount)).toThrow(
          new GatewayAmountError('too_many_decimals'),
        );
      },
    );

    it.each([['0'], ['0.00'], ['0.000000']])('%s no es positivo', (amount) => {
      expect(() => decimalToMinorUnits(amount)).toThrow(
        new GatewayAmountError('not_positive'),
      );
    });

    it.each([[''], ['abc'], ['-5.00'], ['1e3'], ['1,50'], ['12.'], ['.5']])(
      '%j no es un decimal',
      (amount) => {
        expect(() => decimalToMinorUnits(amount)).toThrow(
          new GatewayAmountError('not_decimal'),
        );
      },
    );
  });
});

describe('minorUnitsToDecimal', () => {
  it.each([
    [15000, '150.00'],
    [1, '0.01'],
    [0, '0.00'],
    [123456789, '1234567.89'],
  ])('%i -> %s', (minor, decimal) => {
    expect(minorUnitsToDecimal(minor)).toBe(decimal);
  });

  it('ida y vuelta', () => {
    for (const amount of ['0.01', '19.99', '150.00', '99999.99']) {
      expect(minorUnitsToDecimal(decimalToMinorUnits(amount))).toBe(amount);
    }
  });

  it.each([[-1], [1.5], [Number.NaN]])('rechaza %s', (minor) => {
    expect(() => minorUnitsToDecimal(minor)).toThrow(GatewayAmountError);
  });
});
