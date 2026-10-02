import { describe, it, expect, jest } from '@jest/globals';
import { CatalogConceptsRepository } from './catalog-concepts.repository';

/**
 * La forma de la consulta paginada del glosario.
 *
 * Estas pruebas no ejecutan SQL —no hay base en la suite unitaria—: fijan lo
 * que la consulta **pide** (orden, filtros, parámetros en su lugar) para que un
 * cambio que rompa el contrato se note acá y no recién en el int-spec. Que la
 * consulta corra contra Postgres queda para la prueba de integración.
 */
function build(rows: unknown[] = []) {
  const execute = jest.fn((_sql: string, _params: unknown[]) =>
    Promise.resolve(rows),
  );
  const em = { getConnection: () => ({ execute }) } as any;
  return { repo: new CatalogConceptsRepository(), em, execute };
}

const base = {
  valueSetVersionId: 'vsv-cat',
  stateConceptId: 'state-active',
  languageConceptId: 'lang-es',
};

describe('CatalogConceptsRepository.searchGlossaryPage', () => {
  it('ordena castellano primero y después por nombre sin tildes, con desempate estable', async () => {
    const { repo, em, execute } = build();
    await repo.searchGlossaryPage(em, base, 24, 48);

    const [sql, params] = execute.mock.calls[0];
    const orden = sql.slice(sql.indexOf('ORDER BY'));
    expect(orden.indexOf('(es.value IS NULL)')).toBeLessThan(
      orden.indexOf('translate(lower(coalesce(es.value, c.display))'),
    );
    expect(orden).toContain('c.id');
    // idioma (del LATERAL), versión, estado, y al final limit y offset.
    expect(params).toEqual(['lang-es', 'vsv-cat', 'state-active', 24, 48]);
  });

  it('busca sin tildes en código, display y todas las designaciones, con los comodines escapados', async () => {
    const { repo, em, execute } = build();
    await repo.searchGlossaryPage(
      em,
      { ...base, query: ' Hipertensión 50%' },
      12,
      0,
    );

    const [sql, params] = execute.mock.calls[0];
    expect(sql).toContain('terminology.concept_designations d2');
    expect(params).toEqual([
      'lang-es',
      'vsv-cat',
      'state-active',
      '%hipertension 50\\%%',
      '%hipertension 50\\%%',
      '%hipertension 50\\%%',
      12,
      0,
    ]);
  });

  it('una etiqueta se intersecta con un EXISTS sobre su versión vigente', async () => {
    const { repo, em, execute } = build();
    await repo.searchGlossaryPage(
      em,
      { ...base, tagValueSetVersionId: 'vsv-tag' },
      12,
      0,
    );

    const [sql, params] = execute.mock.calls[0];
    expect(sql).toMatch(
      /EXISTS \(SELECT 1 FROM terminology\.value_set_members t/,
    );
    expect(params).toContain('vsv-tag');
  });

  it('una lista de ids vacía es «ninguno», sin consultar', async () => {
    const { repo, em, execute } = build();
    await expect(
      repo.searchGlossaryPage(em, { ...base, ids: [] }, 12, 0),
    ).resolves.toEqual({ ids: [], total: 0 });
    expect(execute).not.toHaveBeenCalled();
  });

  it('lee el total de la ventana, que el driver entrega como texto', async () => {
    const { repo, em } = build([
      { id: 'a', total: '1200' },
      { id: 'b', total: '1200' },
    ]);
    await expect(repo.searchGlossaryPage(em, base, 2, 0)).resolves.toEqual({
      ids: ['a', 'b'],
      total: 1200,
    });
  });

  it('pasado el final, vuelve a contar para no decir «0 en total»', async () => {
    const execute = jest
      .fn<(sql: string, params: unknown[]) => Promise<unknown[]>>()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'a', total: '30' }]);
    const em = { getConnection: () => ({ execute }) } as any;

    await expect(
      new CatalogConceptsRepository().searchGlossaryPage(em, base, 12, 900),
    ).resolves.toEqual({ ids: [], total: 30 });
  });
});
