import { describe, expect, it } from '@jest/globals';
import { PROF } from '../../profiles.concepts';
import {
  ADMISSION_ITEM_CONCEPT,
  PRACTITIONER_ONBOARDING_REQUIREMENTS,
  admissionItemTypeOf,
  credentialSubtype,
  licenseSubtype,
  requirementId,
  resolveProfessionGroup,
} from './admission-requirements.catalog';

describe('catálogo ALTA_DE_DOCTOR (proceso 2.1)', () => {
  const porCodigo = new Map(
    PRACTITIONER_ONBOARDING_REQUIREMENTS.map((r) => [r.code, r]),
  );

  it('los códigos y los órdenes son únicos', () => {
    expect(porCodigo.size).toBe(PRACTITIONER_ONBOARDING_REQUIREMENTS.length);
    const orders = PRACTITIONER_ONBOARDING_REQUIREMENTS.map((r) => r.sortOrder);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it('contiene lo que dice el proceso 2.1', () => {
    for (const code of [
      'CI',
      'MATRICULA_MSALUD',
      'TITULO_UNIVERSITARIO',
      'DIPLOMADO',
      'MAESTRIA',
      'DOCTORADO',
      'TITULO_ESPECIALIDAD',
      'REGISTRO_COLEGIO_MEDICO',
      'REGISTRO_COLEGIO_ODONTOLOGOS',
      'ESPECIALIDADES_DECLARADAS',
      'UBICACION_CONSULTORIOS',
    ]) {
      expect(porCodigo.has(code)).toBe(true);
    }
  });

  it('obligatorios: CI, matrícula, título universitario y registro del colegio', () => {
    const obligatorios = PRACTITIONER_ONBOARDING_REQUIREMENTS.filter((r) => r.required).map(
      (r) => r.code,
    );
    expect(obligatorios).toEqual([
      'CI',
      'MATRICULA_MSALUD',
      'TITULO_UNIVERSITARIO',
      'REGISTRO_COLEGIO_MEDICO',
      'REGISTRO_COLEGIO_ODONTOLOGOS',
    ]);
  });

  it('título universitario: hasta 2; especialidades declaradas: hasta 3', () => {
    expect(porCodigo.get('TITULO_UNIVERSITARIO')?.maxItems).toBe(2);
    expect(porCodigo.get('ESPECIALIDADES_DECLARADAS')?.maxItems).toBe(3);
  });

  it('posgrados, especialidades y consultorios son opcionales', () => {
    for (const code of [
      'DIPLOMADO',
      'MAESTRIA',
      'DOCTORADO',
      'TITULO_ESPECIALIDAD',
      'ESPECIALIDADES_DECLARADAS',
      'UBICACION_CONSULTORIOS',
    ]) {
      expect(porCodigo.get(code)?.required).toBe(false);
    }
  });

  it('documentos exigen fuente; los datos no', () => {
    for (const r of PRACTITIONER_ONBOARDING_REQUIREMENTS) {
      if (r.evidence === 'DATA') expect(r.requiresSourceUri).toBe(false);
      if (r.itemType === 'LICENSE' || r.itemType === 'CREDENTIAL') {
        expect(r.requiresSourceUri).toBe(true);
      }
    }
  });

  it('el colegio se acota por profesión: uno por grupo', () => {
    expect(porCodigo.get('REGISTRO_COLEGIO_MEDICO')?.professionGroup).toBe('MEDICO');
    expect(porCodigo.get('REGISTRO_COLEGIO_ODONTOLOGOS')?.professionGroup).toBe(
      'ODONTOLOGO',
    );
  });

  it('los ids de requisito son deterministas y distintos por código y por tipo', () => {
    expect(requirementId('practitioner-onboarding', 'CI')).toBe(
      requirementId('practitioner-onboarding', 'CI'),
    );
    expect(requirementId('practitioner-onboarding', 'CI')).not.toBe(
      requirementId('practitioner-onboarding', 'MATRICULA_MSALUD'),
    );
    expect(requirementId('practitioner-onboarding', 'CI')).not.toBe(
      requirementId('pharmacy-onboarding', 'CI'),
    );
  });
});

describe('correspondencia ítem ↔ requisito', () => {
  it('la jurisdicción decide el subtipo de matrícula', () => {
    expect(licenseSubtype(PROF.JURISDICTION_NATIONAL)).toBe('NATIONAL');
    expect(licenseSubtype(PROF.JURISDICTION_PROFESSIONAL_COLLEGE)).toBe(
      'PROFESSIONAL_COLLEGE',
    );
    expect(licenseSubtype(PROF.JURISDICTION_SEDES_SANTA_CRUZ)).toBe('SEDES');
    expect(licenseSubtype(PROF.JURISDICTION_SEDES_PANDO)).toBe('SEDES');
    // Una jurisdicción desconocida se revisa como la matrícula nacional: no hay
    // habilitación sin revisar.
    expect(licenseSubtype('otra-jurisdiccion')).toBe('NATIONAL');
  });

  it('el tipo de credencial decide el subtipo de título', () => {
    expect(credentialSubtype(PROF.CREDENTIAL_TYPE_DEGREE)).toBe('DEGREE');
    expect(credentialSubtype(PROF.CREDENTIAL_TYPE_DIPLOMA)).toBe('DIPLOMA');
    expect(credentialSubtype(PROF.CREDENTIAL_TYPE_MASTER)).toBe('MASTER');
    expect(credentialSubtype(PROF.CREDENTIAL_TYPE_DOCTORATE)).toBe('DOCTORATE');
    expect(credentialSubtype(PROF.CREDENTIAL_TYPE_SPECIALTY)).toBe('SPECIALTY');
  });

  it('ida y vuelta de la clase de ítem', () => {
    for (const type of ['LICENSE', 'CREDENTIAL', 'SPECIALTY', 'PROFILE'] as const) {
      expect(admissionItemTypeOf(ADMISSION_ITEM_CONCEPT[type])).toBe(type);
    }
    expect(admissionItemTypeOf('x')).toBeUndefined();
    expect(admissionItemTypeOf(undefined)).toBeUndefined();
  });
});

describe('resolveProfessionGroup', () => {
  it('odontología se reconoce con o sin tildes y mayúsculas', () => {
    expect(resolveProfessionGroup(['Odontólogos'])).toBe('ODONTOLOGO');
    expect(resolveProfessionGroup(['CIRUJANO DENTISTA'])).toBe('ODONTOLOGO');
    expect(resolveProfessionGroup(['odontologia general'])).toBe('ODONTOLOGO');
  });

  it('los auxiliares de odontología no son odontólogos', () => {
    expect(
      resolveProfessionGroup(['Dentistas auxiliares y ayudantes de odontología']),
    ).toBe('MEDICO');
  });

  it('médicos, otras profesiones y sin dato caen en MEDICO (el grupo por omisión)', () => {
    expect(resolveProfessionGroup(['Médicos generales'])).toBe('MEDICO');
    expect(resolveProfessionGroup(['Enfermeros'])).toBe('MEDICO');
    expect(resolveProfessionGroup([])).toBe('MEDICO');
    expect(resolveProfessionGroup([undefined, null, ''])).toBe('MEDICO');
  });

  it('si alguno de los títulos es de odontología, gana ODONTOLOGO', () => {
    expect(resolveProfessionGroup(['Médicos generales', 'Odontólogos'])).toBe(
      'ODONTOLOGO',
    );
  });
});
