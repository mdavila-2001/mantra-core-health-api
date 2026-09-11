import {
  AFFILIATION_DOCUMENT_ROLES,
  BOLIVIAN_ISSUING_AUTHORITY_BY_ROLE,
  DOCUMENT_TYPE_CODE_BY_ROLE,
  ISSUING_AUTHORITY_OTHER,
  REGISTRATION_DOCUMENT_ROLES,
  countryIsoForLegalEntityType,
  issuingAuthorityCodeFor,
} from './affiliation-documents';
import { LEGAL_ENTITY_TYPE_CODES } from './legal-entity-types';

describe('AFFILIATION_DOCUMENT_ROLES', () => {
  it('no repite ningún rol', () => {
    expect(new Set(AFFILIATION_DOCUMENT_ROLES).size).toBe(
      AFFILIATION_DOCUMENT_ROLES.length,
    );
  });

  it('cada rol tiene un código de tipo de documento y de autoridad boliviana', () => {
    for (const role of AFFILIATION_DOCUMENT_ROLES) {
      expect(DOCUMENT_TYPE_CODE_BY_ROLE[role]).toEqual(expect.any(String));
      expect(BOLIVIAN_ISSUING_AUTHORITY_BY_ROLE[role]).toEqual(
        expect.any(String),
      );
    }
  });

  it('los cinco del autorregistro son un subconjunto de los seis roles', () => {
    for (const role of REGISTRATION_DOCUMENT_ROLES) {
      expect(AFFILIATION_DOCUMENT_ROLES).toContain(role);
    }
    expect(REGISTRATION_DOCUMENT_ROLES).not.toContain('POWER_OF_ATTORNEY_DOC');
    expect(REGISTRATION_DOCUMENT_ROLES).toHaveLength(5);
  });
});

describe('issuingAuthorityCodeFor', () => {
  it('en Bolivia devuelve la autoridad nombrada del rol', () => {
    expect(issuingAuthorityCodeFor('CONSTITUTION_DOC', 'BO')).toBe('NOTARIA');
    expect(issuingAuthorityCodeFor('TAX_IDENTIFIER_DOC', 'BO')).toBe('SIAT');
    expect(issuingAuthorityCodeFor('COMMERCE_REGISTRY_DOC', 'BO')).toBe(
      'SEPREC',
    );
    expect(issuingAuthorityCodeFor('OPERATING_LICENSE_DOC', 'BO')).toBe(
      'GOBIERNO_MUNICIPAL',
    );
    expect(issuingAuthorityCodeFor('HEALTH_AUTHORITY_CERT_DOC', 'BO')).toBe(
      'SEDES',
    );
  });

  it('sin país declarado asume Bolivia (el país por defecto del producto)', () => {
    expect(issuingAuthorityCodeFor('CONSTITUTION_DOC', undefined)).toBe(
      'NOTARIA',
    );
  });

  it('fuera de Bolivia devuelve OTRO: el value set no nombra otras autoridades', () => {
    expect(issuingAuthorityCodeFor('HEALTH_AUTHORITY_CERT_DOC', 'BR')).toBe(
      ISSUING_AUTHORITY_OTHER,
    );
    expect(issuingAuthorityCodeFor('COMMERCE_REGISTRY_DOC', 'US')).toBe(
      ISSUING_AUTHORITY_OTHER,
    );
  });
});

describe('countryIsoForLegalEntityType', () => {
  it('deriva el país de un tipo societario del diccionario', () => {
    expect(countryIsoForLegalEntityType('SRL')).toBe('BO');
    expect(countryIsoForLegalEntityType('US_LLC')).toBe('US');
  });

  it('devuelve undefined sin tipo declarado o con un código que no existe', () => {
    expect(countryIsoForLegalEntityType(undefined)).toBeUndefined();
    expect(countryIsoForLegalEntityType('NO_EXISTE')).toBeUndefined();
  });

  it('resuelve todos los códigos del diccionario internacional sin lanzar', () => {
    for (const code of LEGAL_ENTITY_TYPE_CODES) {
      expect(() => countryIsoForLegalEntityType(code)).not.toThrow();
    }
  });
});
