import { CONCEPT_DEFS, deterministicId } from './concepts';
import { DYNAMIC_ENUM_CATALOG } from '../seed/dynamic-enum-catalog';
import {
  CANONICAL_LEGAL_CATEGORIES,
  LEGAL_ENTITY_TYPES,
  LEGAL_ENTITY_TYPE_CODES,
  LEGAL_ENTITY_COUNTRY_CONCEPT_BY_ISO,
  resolveLegalEntityType,
  countryConceptForLegalEntityType,
} from './legal-entity-types';

/** El conjunto de ids de concepto que declara `CONCEPT_DEFS`, para chequear pertenencia. */
const CONCEPT_IDS_SEEDED = new Set(
  Object.values(CONCEPT_DEFS).map((def) => deterministicId(def.key)),
);

/** Los conceptos de la enumeración `legal-entity-type` del catálogo dinámico. */
const ENUM_LEGAL_ENTITY_TYPE = DYNAMIC_ENUM_CATALOG.find(
  (entry) => entry.code === 'legal-entity-type',
)!;

describe('LEGAL_ENTITY_TYPES', () => {
  it('no repite ningún código', () => {
    expect(new Set(LEGAL_ENTITY_TYPE_CODES).size).toBe(
      LEGAL_ENTITY_TYPE_CODES.length,
    );
  });

  it('cada conceptId existe en el catálogo interno de conceptos', () => {
    for (const entry of LEGAL_ENTITY_TYPES) {
      expect(CONCEPT_IDS_SEEDED.has(entry.conceptId)).toBe(true);
    }
  });

  it('cada concepto de la enumeración legal-entity-type tiene entrada en el diccionario, y viceversa', () => {
    const inDictionary = new Set(LEGAL_ENTITY_TYPES.map((e) => e.conceptId));
    const inEnumeration = new Set(ENUM_LEGAL_ENTITY_TYPE.concepts);

    expect([...inEnumeration].every((id) => inDictionary.has(id))).toBe(true);
    expect([...inDictionary].every((id) => inEnumeration.has(id))).toBe(true);
  });

  it('el país de cada entrada es un ISO-2 con concepto de país declarado', () => {
    for (const entry of LEGAL_ENTITY_TYPES) {
      expect(entry.countryIso).toMatch(/^[A-Z]{2}$/);
      expect(
        LEGAL_ENTITY_COUNTRY_CONCEPT_BY_ISO[entry.countryIso],
      ).toBeDefined();
    }
  });

  it('la categoría canónica de cada entrada pertenece al set cerrado', () => {
    for (const entry of LEGAL_ENTITY_TYPES) {
      expect(CANONICAL_LEGAL_CATEGORIES).toContain(entry.canonicalCategory);
    }
  });

  it('el acrónimo no está vacío', () => {
    for (const entry of LEGAL_ENTITY_TYPES) {
      expect(entry.acronym.trim()).not.toBe('');
    }
  });

  it('las 8 formas bolivianas conservan sus códigos históricos, sin prefijo de país, y en su lugar', () => {
    const bolivianos = LEGAL_ENTITY_TYPES.filter(
      (e) => e.countryIso === 'BO',
    ).map((e) => e.code);
    expect(bolivianos.slice(0, 8)).toEqual([
      'UNIPERSONAL',
      'SRL',
      'LTDA',
      'SA',
      'SOCIEDAD_COLECTIVA',
      'COMANDITA_SIMPLE',
      'COMANDITA_ACCIONES',
      'SUCURSAL_EXTRANJERA',
    ]);
    // Ningún código boliviano lleva prefijo de país.
    for (const code of bolivianos) {
      expect(code).not.toMatch(/^[A-Z]{2}_/);
    }
  });

  it('cubre las formas no societarias y del sector público con las que se presta salud en Bolivia', () => {
    const bolivianos = LEGAL_ENTITY_TYPES.filter(
      (e) => e.countryIso === 'BO',
    ).map((e) => e.code);
    expect(bolivianos).toEqual(
      expect.arrayContaining([
        'SAM',
        'COOPERATIVA',
        'ASOCIACION_CIVIL',
        'FUNDACION',
        'ONG',
        'ENTIDAD_PUBLICA',
        'EMPRESA_ESTATAL',
        'EMPRESA_ESTATAL_MIXTA',
        'ENTIDAD_RELIGIOSA',
        'MUTUAL',
        'IFD',
        'PROFESIONAL_INDEPENDIENTE',
      ]),
    );
    expect(bolivianos).toHaveLength(27);
  });

  it('agrega las formas nuevas al final: las 21 originales conservan su posición', () => {
    expect(LEGAL_ENTITY_TYPES.slice(0, 21).map((e) => e.code)).toEqual([
      'UNIPERSONAL',
      'SRL',
      'LTDA',
      'SA',
      'SOCIEDAD_COLECTIVA',
      'COMANDITA_SIMPLE',
      'COMANDITA_ACCIONES',
      'SUCURSAL_EXTRANJERA',
      'BR_LTDA',
      'BR_SA',
      'BR_MEI',
      'BR_EI',
      'BR_SLU',
      'BR_FILIAL_EST',
      'US_LLC',
      'US_CORP',
      'US_SOLE_PROP',
      'US_LLP',
      'US_BRANCH',
      'AR_SAS',
      'MX_S_RL',
    ]);
    // El orden de la enumeración es el del diccionario: el seed asigna el
    // ordinal por posición y no reordena lo ya sembrado.
    expect(ENUM_LEGAL_ENTITY_TYPE.concepts).toEqual(
      LEGAL_ENTITY_TYPES.map((e) => e.conceptId),
    );
  });
});

describe('resolveLegalEntityType', () => {
  const fallback = 'concept-company';

  it('el código gana sobre el conceptId crudo', () => {
    const srl = LEGAL_ENTITY_TYPES.find((e) => e.code === 'SRL')!;
    expect(resolveLegalEntityType('SRL', 'otro-concepto', fallback)).toBe(
      srl.conceptId,
    );
  });

  it('sin código, usa el conceptId crudo declarado', () => {
    expect(resolveLegalEntityType(undefined, 'concepto-libre', fallback)).toBe(
      'concepto-libre',
    );
  });

  it('sin ninguno de los dos, cae al fallback', () => {
    expect(resolveLegalEntityType(undefined, undefined, fallback)).toBe(
      fallback,
    );
  });

  it('un código desconocido también cae al fallback', () => {
    expect(resolveLegalEntityType('NO_EXISTE', undefined, fallback)).toBe(
      fallback,
    );
  });
});

describe('countryConceptForLegalEntityType', () => {
  it('deriva el país de constitución de un tipo boliviano', () => {
    expect(countryConceptForLegalEntityType('SRL')).toBe(
      LEGAL_ENTITY_COUNTRY_CONCEPT_BY_ISO.BO,
    );
  });

  it('deriva el país de constitución de un tipo extranjero', () => {
    expect(countryConceptForLegalEntityType('US_LLC')).toBe(
      LEGAL_ENTITY_COUNTRY_CONCEPT_BY_ISO.US,
    );
  });

  it('sin código, o con uno desconocido, no deriva nada', () => {
    expect(countryConceptForLegalEntityType(undefined)).toBeUndefined();
    expect(countryConceptForLegalEntityType('NO_EXISTE')).toBeUndefined();
  });
});
