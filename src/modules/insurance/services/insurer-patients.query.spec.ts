import { BadRequestException } from '@nestjs/common';
import { CONCEPTS, encodeKeysetCursor } from '../../../common';
import { INS } from '../insurance.concepts';
import {
  buildInsurerPatientPageQuery,
  buildInsurerPatientCountQuery,
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
  it('acota a la aseguradora por cobertura vigente, nunca reclamos, con su id como parámetro', () => {
    const { sql, params } = buildInsurerPatientPageQuery(criteria());

    expect(sql).toContain('and apr.insurance_carrier_id = ?');
    expect(sql).not.toContain('insurance_claims');
    expect(params.slice(0, 2)).toEqual([CARRIER, INS.CARRIER_ACTIVE]);
    expect(sql).not.toContain(CARRIER);
    expect(params.at(-1)).toBe(11);
  });

  it('busca nombre, teléfono y correo por «contiene» sin tildes sin consultar documentos', () => {
    const { sql, params } = buildInsurerPatientPageQuery(
      criteria({ search: '  Pérez 50%  ' }),
    );

    expect(params).toContain('%perez 50\\%%');
    expect(params).toContain(CONCEPTS.CONTACT_MOBILE);
    expect(params).toContain(CONCEPTS.CONTACT_EMAIL);
    expect(params).not.toContain(CONCEPTS.ID_TYPE_NATIONAL);
    expect(params).not.toContain('Pérez 50%');
    expect(sql).not.toContain('common.identifiers');
    expect(sql).not.toContain('Pérez');
  });

  it('suma sexo, ocupación y rango de nacimiento con parametros', () => {
    const { sql, params } = buildInsurerPatientPageQuery(
      criteria({
        genderConceptId: 'g-1',
        occupation: 'o-1',
        birthDateFrom: '1980-01-01',
        birthDateTo: '1999-12-31',
      }),
    );

    expect(sql).toContain('p.administrative_gender_concept_id = ?');
    expect(sql).toContain('p.occupation_free_text');
    expect(sql).toContain('p.birth_date >= ?::date');
    expect(sql).toContain('p.birth_date <= ?::date');
    expect(params).toEqual(
      expect.arrayContaining(['g-1', '%o-1%', '1980-01-01', '1999-12-31']),
    );
  });

  it('«Con seguro» exige cobertura vigente con ESTA aseguradora a la fecha de La Paz', () => {
    const { sql, params } = buildInsurerPatientPageQuery(
      criteria({ insuranceStatus: 'WITH_INSURANCE' }),
    );

    expect(sql).toMatch(
      /where exists \(\s*select 1\s+from insurance\.patient_coverages ac/,
    );
    expect(params.slice(0, 8)).toEqual([
      CARRIER,
      INS.CARRIER_ACTIVE,
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
      /and not exists \(\s*select 1\s+from insurance\.patient_coverages ac/,
    );
  });

  it('«Todos» conserva el predicado de cobertura vigente', () => {
    const { sql } = buildInsurerPatientPageQuery(criteria());

    expect(sql).toContain('patient_coverages ac');
    expect(sql).toContain('ac.status_concept_id = ?');
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

  it('ordena por la fecha de creación en UTC y conserva el desempate estable', () => {
    const { sql } = buildInsurerPatientPageQuery(
      criteria({ sortBy: 'createdAt', sortDirection: 'desc' }),
    );

    expect(sql).toContain(
      `to_char(pa.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US') as sort_value`,
    );
    expect(sql).toContain('order by sort_value desc, pa.profile_id::text desc');
  });
});

describe('directory scope and counts', () => {
  it('does not expand insurer scope for no insurance or another carrier', () => {
    expect(
      buildInsurerPatientPageQuery(criteria({ insuranceCarrierId: 'other' }))
        .sql,
    ).toContain('and false');
    const none = buildInsurerPatientPageQuery(
      criteria({ insuranceStatus: 'NO_INSURANCE' }),
    );
    expect(none.sql).toContain('where exists');
    expect(none.sql).toContain('and not exists');
  });
  it('accepts the same carrier as a tenant filter without denying the scope', () => {
    const filtered = buildInsurerPatientPageQuery(
      criteria({ insuranceCarrierId: CARRIER }),
    );

    expect(filtered.sql).not.toContain('and false');
    expect(filtered.params.filter((param) => param === CARRIER)).toHaveLength(
      2,
    );
  });
  it('lets platform administrators filter the roster by an active carrier', () => {
    const filtered = buildInsurerPatientPageQuery(
      criteria({ carrierId: undefined, insuranceCarrierId: CARRIER }),
    );

    expect(filtered.sql).toContain('and apr.insurance_carrier_id = ?');
    expect(filtered.sql).not.toContain('and false');
    expect(filtered.params[0]).toBe(CARRIER);
  });
  it('allows the platform roster including uninsured patients', () => {
    const roster = buildInsurerPatientPageQuery(
      criteria({ carrierId: undefined }),
    );
    expect(roster.sql).not.toContain('patient_coverages');
    expect(roster.params).toEqual([11]);
  });
  it('uses the same filters for total without cursor or limit', () => {
    const base = criteria({
      search: 'Ana',
      occupation: 'Arquitecta',
      birthDateFrom: '1980-01-01',
    });
    const cursor = nextCursorAfter(
      { patient_profile_id: 'p1', sort_value: 'a' },
      base,
    );
    const count = buildInsurerPatientCountQuery({ ...base, cursor });
    expect(count.sql).toContain('count(*)::int as total');
    expect(count.params).toEqual(
      buildInsurerPatientPageQuery(base).params.slice(0, -1),
    );
    expect(count.sql).not.toContain('limit');
  });
  it('rejects an inverted birth date range', () => {
    expect(() =>
      buildInsurerPatientPageQuery(
        criteria({ birthDateFrom: '2000-01-01', birthDateTo: '1990-01-01' }),
      ),
    ).toThrow(BadRequestException);
  });
  it('normalizes phone formatting without turning arbitrary text into a phone search', () => {
    const phone = buildInsurerPatientPageQuery(
      criteria({ search: '+591 700-00-001' }),
    );
    expect(phone.params).toContain('%59170000001%');
    expect(phone.sql).toContain('regexp_replace');
    expect(
      buildInsurerPatientPageQuery(criteria({ search: 'Persona 1' })).sql,
    ).not.toContain('regexp_replace');
  });
});
