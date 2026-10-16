import {
  IMPORT_PROFILES,
  normalizeHeader,
  resolverColumn,
} from './import-profiles';

const CONCEPTS = IMPORT_PROFILES.conceptos;

describe('perfil de conceptos', () => {
  it('declara las tres columnas del contrato, con su obligatoriedad y su largo', () => {
    expect(CONCEPTS.columnas).toEqual([
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
    const definition = CONCEPTS.columnas.find(
      (column) => column.nombre === 'definition',
    );

    expect(definition?.maxLargo).toBeUndefined();
  });

  it('su fila de ejemplo es sintética y se reconoce como tal', () => {
    expect(CONCEPTS.ejemplo.code).toMatch(/^ZZ-/);
    expect(Object.keys(CONCEPTS.ejemplo)).toEqual([
      'code',
      'display',
      'definition',
    ]);
  });
});

describe('resolverColumna', () => {
  it('reconoce el nombre canónico', () => {
    expect(resolverColumn(CONCEPTS, 'code')).toBe('code');
    expect(resolverColumn(CONCEPTS, 'definition')).toBe('definition');
  });

  it('no distingue mayúsculas', () => {
    expect(resolverColumn(CONCEPTS, 'CÓDIGO')).toBe('code');
    expect(resolverColumn(CONCEPTS, 'Nombre')).toBe('display');
  });

  it('conserva las tildes: con y sin tilde son alias distintos, los dos válidos', () => {
    expect(resolverColumn(CONCEPTS, 'definición')).toBe('definition');
    expect(resolverColumn(CONCEPTS, 'definicion')).toBe('definition');
  });

  it('recorta los espacios laterales que deja una planilla', () => {
    expect(resolverColumn(CONCEPTS, '  display  ')).toBe('display');
  });

  it('devuelve indefinido para una columna que el perfil no declara', () => {
    expect(resolverColumn(CONCEPTS, 'extra')).toBeUndefined();
  });
});

describe('normalizarEncabezado', () => {
  it('baja a minúsculas y recorta, sin tocar las tildes', () => {
    expect(normalizeHeader('  Término ')).toBe('término');
  });
});
