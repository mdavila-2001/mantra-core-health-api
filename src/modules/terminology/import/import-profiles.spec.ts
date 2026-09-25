import {
  PERFILES_DE_IMPORTACION,
  normalizarEncabezado,
  resolverColumna,
} from './import-profiles';

const CONCEPTOS = PERFILES_DE_IMPORTACION.conceptos;

describe('perfil de conceptos', () => {
  it('declara las tres columnas del contrato, con su obligatoriedad y su largo', () => {
    expect(CONCEPTOS.columnas).toEqual([
      expect.objectContaining({
        nombre: 'code',
        obligatoria: true,
        maxLargo: 255,
      }),
      expect.objectContaining({
        nombre: 'display',
        obligatoria: true,
        maxLargo: 255,
      }),
      expect.objectContaining({ nombre: 'definition', obligatoria: false }),
    ]);
  });

  it('la definición no tiene tope de largo', () => {
    const definition = CONCEPTOS.columnas.find(
      (columna) => columna.nombre === 'definition',
    );

    expect(definition?.maxLargo).toBeUndefined();
  });

  it('su fila de ejemplo es sintética y se reconoce como tal', () => {
    expect(CONCEPTOS.ejemplo.code).toMatch(/^ZZ-/);
    expect(Object.keys(CONCEPTOS.ejemplo)).toEqual([
      'code',
      'display',
      'definition',
    ]);
  });
});

describe('resolverColumna', () => {
  it('reconoce el nombre canónico', () => {
    expect(resolverColumna(CONCEPTOS, 'code')).toBe('code');
    expect(resolverColumna(CONCEPTOS, 'definition')).toBe('definition');
  });

  it('no distingue mayúsculas', () => {
    expect(resolverColumna(CONCEPTOS, 'CÓDIGO')).toBe('code');
    expect(resolverColumna(CONCEPTOS, 'Nombre')).toBe('display');
  });

  it('conserva las tildes: con y sin tilde son alias distintos, los dos válidos', () => {
    expect(resolverColumna(CONCEPTOS, 'definición')).toBe('definition');
    expect(resolverColumna(CONCEPTOS, 'definicion')).toBe('definition');
  });

  it('recorta los espacios laterales que deja una planilla', () => {
    expect(resolverColumna(CONCEPTOS, '  display  ')).toBe('display');
  });

  it('devuelve indefinido para una columna que el perfil no declara', () => {
    expect(resolverColumna(CONCEPTOS, 'extra')).toBeUndefined();
  });
});

describe('normalizarEncabezado', () => {
  it('baja a minúsculas y recorta, sin tocar las tildes', () => {
    expect(normalizarEncabezado('  Término ')).toBe('término');
  });
});
