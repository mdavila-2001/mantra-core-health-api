import { CONCEPT_DEFS, deterministicId } from '../../common/constants/concepts';
import { DYNAMIC_ENUM_CATALOG } from '../../common/seed/dynamic-enum-catalog';
import {
  CANONICAL_LEGAL_CATEGORIES,
  LEGAL_ENTITY_TYPES,
  LEGAL_ENTITY_TYPE_CODES,
  LEGAL_ENTITY_COUNTRY_CONCEPT_BY_ISO,
  resolveLegalEntityType,
  countryConceptForLegalEntityType,
} from './legal-entity-types';

/** El conjunto de ids de concepto que declara `CONCEPT_DEFS`, para chequear pertenencia. */
const CONCEPT_IDS_SEMBRADOS = new Set(
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
      expect(CONCEPT_IDS_SEMBRADOS.has(entry.conceptId)).toBe(true);
    }
  });

  it('cada concepto de la enumeración legal-entity-type tiene entrada en el diccionario, y viceversa', () => {
    const enDiccionario = new Set(LEGAL_ENTITY_TYPES.map((e) => e.conceptId));
    const enEnumeracion = new Set(ENUM_LEGAL_ENTITY_TYPE.concepts);

    expect([...enEnumeracion].every((id) => enDiccionario.has(id))).toBe(true);
    expect([...enDiccionario].every((id) => enEnumeracion.has(id))).toBe(true);
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

  it('las 8 formas bolivianas conservan sus códigos históricos, sin prefijo de país', () => {
    const bolivianos = LEGAL_ENTITY_TYPES.filter(
      (e) => e.countryIso === 'BO',
    ).map((e) => e.code);
    expect(bolivianos.sort()).toEqual(
      [
        'UNIPERSONAL',
        'SRL',
        'LTDA',
        'SA',
        'SOCIEDAD_COLECTIVA',
        'COMANDITA_SIMPLE',
        'COMANDITA_ACCIONES',
        'SUCURSAL_EXTRANJERA',
      ].sort(),
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
