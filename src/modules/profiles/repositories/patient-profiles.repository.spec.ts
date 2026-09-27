import { jest } from '@jest/globals';
import { PatientProfilesRepository } from './patient-profiles.repository';

// Loose-typed mock factory, como el resto de las specs del módulo.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const ABO = '0f000000-0000-4000-8000-00000000000a';
const RH = '0f000000-0000-4000-8000-00000000000b';
const IDIOMA = '0f000000-0000-4000-8000-00000000000c';

/** Un `EntityManager` cuyo `execute` guarda el SQL y los parámetros. */
function build(filas: unknown[] = []) {
  const execute = mockFn().mockResolvedValue(filas);
  const em = { getConnection: () => ({ execute }) } as never;
  return { repo: new PatientProfilesRepository(), em, execute };
}

function sqlDe(execute: { mock: { calls: unknown[][] } }): string {
  return String(execute.mock.calls[0]?.[0]).replace(/\s+/g, ' ');
}

function paramsDe(execute: { mock: { calls: unknown[][] } }): unknown[] {
  return execute.mock.calls[0]?.[1] as unknown[];
}

describe('PatientProfilesRepository.searchPage — filtros de catálogo', () => {
  const scope = { kind: 'unrestricted' } as const;

  it('correcto — cada filtro es una igualdad sobre su columna, con su valor como parámetro', async () => {
    const d = build();

    await d.repo.searchPage(
      d.em,
      {
        query: 'ana',
        aboGroupConceptId: ABO,
        rhFactorConceptId: RH,
        clinicalLanguageConceptId: IDIOMA,
        scope,
      },
      26,
    );

    const sql = sqlDe(d.execute);
    expect(sql).toContain('pp.abo_group_concept_id = ?');
    expect(sql).toContain('pp.rh_factor_concept_id = ?');
    expect(sql).toContain('pp.clinical_language_concept_id = ?');
    // Los valores nunca se interpolan: van en el mismo orden que sus `?`.
    expect(sql).not.toContain(ABO);
    expect(paramsDe(d.execute)).toEqual([
      '%ana%',
      '%ana%',
      ABO,
      RH,
      IDIOMA,
      26,
    ]);
  });

  it('correcto — la fila trae los tres conceptos, y `null` se vuelve ausencia', async () => {
    const d = build([
      {
        profile_id: 'pp-1',
        patient_code: 'PAC-1',
        abo_group_concept_id: ABO,
        rh_factor_concept_id: null,
        clinical_language_concept_id: IDIOMA,
      },
    ]);

    const filas = await d.repo.searchPage(d.em, { scope }, 26);

    expect(filas).toEqual([
      {
        profileId: 'pp-1',
        patientCode: 'PAC-1',
        aboGroupConceptId: ABO,
        rhFactorConceptId: undefined,
        clinicalLanguageConceptId: IDIOMA,
      },
    ]);
    expect(sqlDe(d.execute)).toContain(
      'pp.abo_group_concept_id, pp.rh_factor_concept_id, pp.clinical_language_concept_id',
    );
  });

  it('límite — con un solo filtro sólo aparece esa condición', async () => {
    const d = build();

    await d.repo.searchPage(d.em, { rhFactorConceptId: RH, scope }, 26);

    const sql = sqlDe(d.execute);
    expect(sql).toContain('where pp.rh_factor_concept_id = ?');
    expect(sql).not.toContain('abo_group_concept_id = ?');
    expect(paramsDe(d.execute)).toEqual([RH, 26]);
  });

  it("inválido — un filtro vacío no agrega condición (no filtra por `= ''`)", async () => {
    const d = build();

    await d.repo.searchPage(
      d.em,
      { aboGroupConceptId: '', clinicalLanguageConceptId: undefined, scope },
      26,
    );

    expect(sqlDe(d.execute)).not.toContain('where');
    expect(paramsDe(d.execute)).toEqual([26]);
  });
});
