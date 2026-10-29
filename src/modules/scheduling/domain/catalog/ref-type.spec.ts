import {
  CARE_SPACES_REF_TYPE,
  RESOURCE_REF_TYPE_SCHEMAS,
  canonicalRefType,
  normalizeRefType,
  refersToCareSpace,
} from './catalog-concepts';

describe('normalizeRefType · un solo analizador para validar y para guardar', () => {
  it.each([
    ['care_spaces', 'care_spaces'],
    ['Care_Spaces', 'care_spaces'],
    ['  CARE_SPACES  ', 'care_spaces'],
    ['\tcare_spaces\n', 'care_spaces'],
    ['practice.care_spaces', 'care_spaces'],
    [' Practice.Care_Spaces ', 'care_spaces'],
    // Ancho completo: NFKC lo lleva a ASCII antes de comparar.
    ['ＣＡＲＥ＿ＳＰＡＣＥＳ', 'care_spaces'],
    ['practitioner_profiles', 'health_practitioner_profiles'],
    ['Practitioner_Profiles ', 'health_practitioner_profiles'],
    ['profiles.health_practitioner_profiles', 'health_practitioner_profiles'],
    ['profiles.practitioner_profiles', 'health_practitioner_profiles'],
    ['PRACTICE_SITES', 'practice_sites'],
    ['diagnostic_units.diagnostic_equipment', 'diagnostic_equipment'],
  ])('%j se normaliza a %j', (raw, canonical) => {
    expect(normalizeRefType(raw)).toBe(canonical);
    expect(canonicalRefType(raw)).toBe(canonical);
  });

  it.each([
    'rooms',
    'users',
    '',
    '   ',
    'care_spaces;',
    'care_spaces​',
    'care spaces',
    '"care_spaces"',
    'care_spaces.',
    '.care_spaces',
    'a.b.care_spaces',
    // Esquema que no es el de la tabla: no es el mismo recurso.
    'public.care_spaces',
    'evil.care_spaces',
    'practice.health_practitioner_profiles',
    "care_spaces' or '1'='1",
  ])('%j no es un tipo admitido', (raw) => {
    expect(normalizeRefType(raw)).toBeNull();
    expect(refersToCareSpace(raw)).toBe(false);
  });

  it('un valor que no es texto no es un tipo admitido', () => {
    expect(normalizeRefType(undefined)).toBeNull();
    expect(normalizeRefType(null)).toBeNull();
    expect(normalizeRefType(42)).toBeNull();
    expect(normalizeRefType({ toString: () => 'care_spaces' })).toBeNull();
  });

  it('decidir el camino y guardar usan el mismo texto: refersToCareSpace ⇔ el valor guardado es care_spaces', () => {
    const variantes = [
      'care_spaces',
      'CARE_SPACES ',
      'practice.care_spaces',
      'Practice.Care_Spaces',
      'practice_sites',
      'rooms',
      'practitioner_profiles',
    ];
    for (const raw of variantes) {
      expect(refersToCareSpace(raw)).toBe(
        normalizeRefType(raw) === CARE_SPACES_REF_TYPE,
      );
    }
  });

  it('la lista cerrada es la que consumen las reservas: ningún canónico lleva mayúsculas ni esquema', () => {
    for (const canonical of Object.keys(RESOURCE_REF_TYPE_SCHEMAS)) {
      expect(canonical).toMatch(/^[a-z][a-z0-9_]*$/);
      expect(normalizeRefType(canonical)).toBe(canonical);
    }
  });
});
