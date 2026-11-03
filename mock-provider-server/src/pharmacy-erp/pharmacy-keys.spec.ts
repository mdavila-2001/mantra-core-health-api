import { parsePharmacyKeys } from './pharmacy-keys';

describe('parsePharmacyKeys', () => {
  it('sin variables no hay ninguna farmacia', () => {
    expect(parsePharmacyKeys(undefined, undefined)).toEqual({});
    expect(parsePharmacyKeys('', '')).toEqual({});
  });

  it('lee CODIGO=clave separados por punto y coma', () => {
    expect(
      parsePharmacyKeys('FARM-A=clave-a; FARM-B=clave=b', undefined),
    ).toEqual({
      'FARM-A': 'clave-a',
      'FARM-B': 'clave=b',
    });
  });

  it('lee el archivo de semilla y la variable pisa al archivo por código', () => {
    const keys = parsePharmacyKeys('FARM-A=nueva', '/semilla.json', () =>
      JSON.stringify({ 'FARM-A': 'vieja', 'FARM-C': 'clave-c' }),
    );

    expect(keys).toEqual({ 'FARM-A': 'nueva', 'FARM-C': 'clave-c' });
  });

  it('rechaza una clave vacía o un archivo que no es un objeto', () => {
    expect(() => parsePharmacyKeys('FARM-A=', undefined)).toThrow();
    expect(() => parsePharmacyKeys('sin-igual', undefined)).toThrow();
    expect(() =>
      parsePharmacyKeys(undefined, '/x.json', () => '["a"]'),
    ).toThrow();
  });
});
