import { coordinateOf, straightLineKm } from './straight-line-distance';

describe('straightLineKm', () => {
  it('el mismo punto está a cero', () => {
    const plaza = { lat: -17.7834, lng: -63.1821 };
    expect(straightLineKm(plaza, plaza)).toBe(0);
  });

  it('La Paz–Santa Cruz da la distancia en línea recta conocida, con un decimal', () => {
    // Plaza Murillo y Plaza 24 de Septiembre: unos 552 km en línea recta, no
    // los ~850 de la carretera.
    const km = straightLineKm(
      { lat: -16.4955, lng: -68.1336 },
      { lat: -17.7834, lng: -63.1821 },
    );
    expect(km).toBeGreaterThan(540);
    expect(km).toBeLessThan(560);
    expect(Number.isInteger(km * 10)).toBe(true);
  });

  it('no depende del sentido', () => {
    const a = { lat: -17.39, lng: -66.16 };
    const b = { lat: -17.78, lng: -63.18 };
    expect(straightLineKm(a, b)).toBe(straightLineKm(b, a));
  });
});

describe('coordinateOf', () => {
  it('convierte el texto de la columna numeric', () => {
    expect(coordinateOf('-17.7834')).toBe(-17.7834);
  });

  it('sin valor o con texto que no es número, no inventa un cero', () => {
    expect(coordinateOf(undefined)).toBeNull();
    expect(coordinateOf('abc')).toBeNull();
  });
});
