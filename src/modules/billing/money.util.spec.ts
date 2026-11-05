import { exactCents, lineBaseCents } from './money.util';

describe('exactCents', () => {
  it.each([
    ['0', 0],
    ['0.5', 50],
    ['10.05', 1005],
    ['1234567890123.99', 123456789012399],
  ])('lee %s sin coma flotante', (value, cents) => {
    expect(exactCents(value)).toBe(cents);
  });

  it.each([
    '-1',
    '-0.01',
    '+1',
    '1.005',
    '1e3',
    'abc',
    '',
    ' 1',
    '12345678901234',
    '.5',
  ])('rechaza %j', (value) => {
    expect(exactCents(value)).toBeNull();
  });

  it('rechaza lo que no es texto', () => {
    expect(exactCents(undefined)).toBeNull();
    expect(exactCents(null)).toBeNull();
  });
});

describe('lineBaseCents', () => {
  it('multiplica cantidad por precio con decimal exacto y redondeo half-up', () => {
    expect(lineBaseCents('3', '0.10')).toBe(30);
    expect(lineBaseCents('1.5', '0.10')).toBe(15);
    expect(lineBaseCents('0.0001', '0.50')).toBe(0);
    expect(lineBaseCents('0.5', '0.01')).toBe(1);
    expect(lineBaseCents('1.005', '10.00')).toBe(1005);
  });

  it('rechaza cantidades y precios inválidos', () => {
    expect(lineBaseCents('-1', '1.00')).toBeNull();
    expect(lineBaseCents('1', '-1.00')).toBeNull();
    expect(lineBaseCents('1.00001', '1.00')).toBeNull();
    expect(lineBaseCents('1', '1.001')).toBeNull();
    expect(lineBaseCents(undefined, '1.00')).toBeNull();
  });

  it('rechaza un resultado que no cabe en un entero exacto', () => {
    expect(lineBaseCents('9999999999', '9999999999999.99')).toBeNull();
  });
});
