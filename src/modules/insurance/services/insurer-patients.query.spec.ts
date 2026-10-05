import { BadRequestException } from '@nestjs/common';
import { CONCEPTS, encodeKeysetCursor } from '../../../common';
import { INS } from '../insurance.concepts';
import {
  buildInsurerPatientPageQuery,
  nextCursorAfter,
  type InsurerPatientCriteria,
} from './insurer-patients.query';

const CARRIER = 'carrier-1';
const HOY = '2026-10-04';

function criteria(
  overrides: Partial<InsurerPatientCriteria> = {},
): InsurerPatientCriteria {
  return {
    carrierId: CARRIER,
    referenceDate: HOY,
    limit: 10,
    insuranceStatus: 'ALL',
    sortBy: 'fullName',
    sortDirection: 'asc',
    ...overrides,
  };
}

describe('buildInsurerPatientPageQuery', () => {
  it('acota a la aseguradora por cobertura o reclamo, con su id como parámetro', () => {
    const { sql, params } = buildInsurerPatientPageQuery(criteria());

    expect(sql).toContain('where pr.insurance_carrier_id = ?');
    expect(sql).toContain('where cl.insurance_carrier_id = ?');
    expect(params.slice(0, 2)).toEqual([CARRIER, CARRIER]);
    expect(sql).not.toContain(CARRIER);
    expect(params.at(-1)).toBe(11);
  });

  it('busca nombre, teléfono y correo por «contiene» sin tildes y el documento entero', () => {
    const { sql, params } = buildInsurerPatientPageQuery(
      criteria({ search: '  Pérez 50%  ' }),
    );

    expect(params).toContain('%perez 50\\%%');
    expect(params).toContain(CONCEPTS.CONTACT_MOBILE);
    expect(params).toContain(CONCEPTS.CONTACT_EMAIL);
    expect(params).toContain(CONCEPTS.ID_TYPE_NATIONAL);
    expect(params).toContain('Pérez 50%');
    expect(sql).toContain('i.value = ?');
    expect(sql).not.toContain('Pérez');
  });

  it('suma sexo, ocupación y rango de nacimiento como igualdades parametrizadas', () => {
    const { sql, params } = buildInsurerPatientPageQuery(
      criteria({
        genderConceptId: 'g-1',
        occupationConceptId: 'o-1',
        birthDateFrom: '1980-01-01',
        birthDateTo: '1999-12-31',
      }),
    );

    expect(sql).toContain('p.administrative_gender_concept_id = ?');
    expect(sql).toContain('p.occupation_concept_id = ?');
    expect(sql).toContain('p.birth_date >= ?::date');
    expect(sql).toContain('p.birth_date <= ?::date');
    expect(params).toEqual(
      expect.arrayContaining(['g-1', 'o-1', '1980-01-01', '1999-12-31']),
    );
  });

  it('«Con seguro» exige cobertura vigente con ESTA aseguradora a la fecha de La Paz', () => {
    const { sql, params } = buildInsurerPatientPageQuery(
      criteria({ insuranceStatus: 'WITH_INSURANCE' }),
    );

    expect(sql).toMatch(
      /where exists \(\s*select 1\s+from insurance\.patient_coverages ac/,
    );
    expect(params.slice(2, 9)).toEqual([
      CARRIER,
      INS.COVERAGE_ACTIVE,
      INS.PLAN_ACTIVE,
      HOY,
      HOY,
      HOY,
      HOY,
    ]);
  });

  it('«Sin seguro» es la negación del mismo predicado', () => {
    const { sql } = buildInsurerPatientPageQuery(
      criteria({ insuranceStatus: 'NO_INSURANCE' }),
    );

    expect(sql).toMatch(
      /where not exists \(\s*select 1\s+from insurance\.patient_coverages ac/,
    );
  });

  it('«Todos» no agrega predicado de cobertura', () => {
    const { sql } = buildInsurerPatientPageQuery(criteria());

    expect(sql).not.toContain('patient_coverages ac');
  });

  it('continúa después del cursor que emitió, hacia adelante o hacia atrás según el orden', () => {
    const asc = criteria();
    const cursor = nextCursorAfter(
      { patient_profile_id: 'pp-9', sort_value: 'perez ana' },
      asc,
    );

    const adelante = buildInsurerPatientPageQuery({ ...asc, cursor });
    expect(adelante.sql).toContain(') > (?, ?)');
    expect(adelante.params).toEqual(
      expect.arrayContaining(['perez ana', 'pp-9']),
    );

    const desc = criteria({ sortDirection: 'desc' });
    const atras = buildInsurerPatientPageQuery({
      ...desc,
      cursor: nextCursorAfter(
        { patient_profile_id: 'pp-9', sort_value: 'perez ana' },
        desc,
      ),
    });
    expect(atras.sql).toContain(') < (?, ?)');
    expect(atras.sql).toContain('order by sort_value desc');
  });

  it('rechaza un cursor emitido para otro orden', () => {
    const cursor = nextCursorAfter(
      { patient_profile_id: 'pp-9', sort_value: 'perez ana' },
      criteria(),
    );

    expect(() =>
      buildInsurerPatientPageQuery(criteria({ sortBy: 'birthDate', cursor })),
    ).toThrow(BadRequestException);
  });

  it('rechaza un cursor fabricado sin las claves que emite', () => {
    expect(() =>
      buildInsurerPatientPageQuery(
        criteria({ cursor: encodeKeysetCursor({ patientCode: 'X' }) }),
      ),
    ).toThrow(BadRequestException);
    expect(() =>
      buildInsurerPatientPageQuery(criteria({ cursor: 'no-es-un-cursor' })),
    ).toThrow(BadRequestException);
  });

  it('manda al final a quien no declaró nacimiento, en los dos sentidos', () => {
    expect(
      buildInsurerPatientPageQuery(criteria({ sortBy: 'birthDate' })).sql,
    ).toContain("'9999-12-31'");
    expect(
      buildInsurerPatientPageQuery(
        criteria({ sortBy: 'birthDate', sortDirection: 'desc' }),
      ).sql,
    ).toContain("'0001-01-01'");
  });
});
