import {
  computeLocationPath,
  fhirPhysicalTypeOf,
  relocateSubtree,
} from './care-space-location';
import { PRAC } from './practice.concepts';

const SITE = 'site';

/** Árbol: A > B > C, A > D, y E suelto en la raíz de la sede. */
function tree() {
  return [
    { id: 'A', parentSpaceId: null, locationPath: `/${SITE}/A/` },
    { id: 'B', parentSpaceId: 'A', locationPath: `/${SITE}/A/B/` },
    { id: 'C', parentSpaceId: 'B', locationPath: `/${SITE}/A/B/C/` },
    { id: 'D', parentSpaceId: 'A', locationPath: `/${SITE}/A/D/` },
    { id: 'E', parentSpaceId: null, locationPath: `/${SITE}/E/` },
  ];
}

describe('computeLocationPath', () => {
  it('un espacio en la raíz cuelga de la sede', () => {
    expect(computeLocationPath(SITE, 'X')).toBe('/site/X/');
  });

  it('hereda la ruta del padre', () => {
    expect(
      computeLocationPath(SITE, 'X', { id: 'P', locationPath: '/site/P/' }),
    ).toBe('/site/P/X/');
  });

  it('reconstruye la ruta del padre si no la tiene guardada', () => {
    expect(computeLocationPath(SITE, 'X', { id: 'P' })).toBe('/site/P/X/');
  });
});

describe('fhirPhysicalTypeOf', () => {
  it('mapea edificio, piso, ala y cama; el resto es sala', () => {
    expect(fhirPhysicalTypeOf(PRAC.SPACE_TYPE_BUILDING)).toBe('bu');
    expect(fhirPhysicalTypeOf(PRAC.SPACE_TYPE_LEVEL)).toBe('lvl');
    expect(fhirPhysicalTypeOf(PRAC.SPACE_TYPE_WING)).toBe('wi');
    expect(fhirPhysicalTypeOf(PRAC.SPACE_TYPE_BED)).toBe('bd');
    expect(fhirPhysicalTypeOf(PRAC.SPACE_TYPE_ROOM)).toBe('ro');
  });
});

describe('relocateSubtree', () => {
  it('mover un espacio recalcula su ruta y la de todos sus descendientes', () => {
    const paths = relocateSubtree(SITE, tree(), 'B', 'E');
    expect(Object.fromEntries(paths)).toEqual({
      B: '/site/E/B/',
      C: '/site/E/B/C/',
    });
  });

  it('no toca a los espacios fuera del subárbol', () => {
    const paths = relocateSubtree(SITE, tree(), 'B', 'E');
    expect(paths.has('A')).toBe(false);
    expect(paths.has('D')).toBe(false);
    expect(paths.has('E')).toBe(false);
  });

  it('con padre null cuelga el subárbol de la sede', () => {
    const paths = relocateSubtree(SITE, tree(), 'B', null);
    expect(Object.fromEntries(paths)).toEqual({
      B: '/site/B/',
      C: '/site/B/C/',
    });
  });

  it('mover a un padre profundo usa la cadena de ancestros', () => {
    const paths = relocateSubtree(SITE, tree(), 'E', 'C');
    expect(paths.get('E')).toBe('/site/A/B/C/E/');
  });

  it('el padre sin ruta guardada se reconstruye por sus ancestros', () => {
    const spaces = tree().map((s) => ({ ...s, locationPath: null }));
    expect(relocateSubtree(SITE, spaces, 'E', 'D').get('E')).toBe(
      '/site/A/D/E/',
    );
  });

  it('rechaza colgar un espacio de sí mismo', () => {
    expect(() => relocateSubtree(SITE, tree(), 'B', 'B')).toThrow(/sí mismo/);
  });

  it('rechaza colgar un espacio de un descendiente (ciclo)', () => {
    expect(() => relocateSubtree(SITE, tree(), 'A', 'C')).toThrow(
      /descendiente/,
    );
  });

  it('rechaza un padre que no está en la sede', () => {
    expect(() => relocateSubtree(SITE, tree(), 'B', 'ZZ')).toThrow(
      /no pertenece/,
    );
  });

  it('rechaza mover un espacio que no está en la sede', () => {
    expect(() => relocateSubtree(SITE, tree(), 'ZZ', null)).toThrow(
      /no pertenece/,
    );
  });
});
