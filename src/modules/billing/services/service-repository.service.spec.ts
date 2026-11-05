import {
  importedServiceCode,
  normalizeSearchText,
  searchTokens,
} from './service-repository.service';

describe('ServiceRepositoryService · búsqueda', () => {
  it('compara sin acentos ni mayúsculas', () => {
    expect(normalizeSearchText('ECOCARDIOGRAFÍA Transtorácica Ñandú')).toBe(
      'ecocardiografia transtoracica nandu',
    );
  });

  it('parte en palabras útiles y descarta los comodines de LIKE', () => {
    // «%» y «_» cambiarían qué casa el patrón: el texto viene del usuario.
    expect(searchTokens('  Holter 24 h %_ de ritmo  ')).toEqual([
      'holter',
      '24',
      'de',
      'ritmo',
    ]);
  });

  it('sin texto no hay palabras', () => {
    expect(searchTokens(undefined)).toEqual([]);
    expect(searchTokens('   ')).toEqual([]);
  });

  it('no repite palabras y corta en ocho', () => {
    expect(searchTokens('eco eco eco')).toEqual(['eco']);
    expect(searchTokens('aa bb cc dd ee ff gg hh ii jj')).toHaveLength(8);
  });
});

describe('importedServiceCode', () => {
  const base = {
    id: 'c',
    display: 'x',
    code_system_name: null,
    publisher: null,
  };

  it('antepone el sistema para que dos fuentes no choquen en una práctica', () => {
    expect(
      importedServiceCode({ ...base, code: '881234', code_system: 'cups' }),
    ).toBe('cups:881234');
  });

  it('respeta un código que ya trae prefijo', () => {
    expect(
      importedServiceCode({
        ...base,
        code: 'procedure:abc',
        code_system: 'bo',
      }),
    ).toBe('procedure:abc');
  });
});
