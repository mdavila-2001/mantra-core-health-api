import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { SearchIndexService } from './search-index.service';

const TENANT_A = '11111111-1111-1111-1111-111111111111';
const TENANT_B = '22222222-2222-2222-2222-222222222222';
const INDEX = 'directory_profiles';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de build.
 */
function build(overrides: Record<string, any> = {}) {
  const client = {
    indices: {
      exists: mockFn(async () => ({ body: true })),
      create: mockFn(async () => ({ body: { acknowledged: true } })),
      delete: mockFn(async () => ({ body: { acknowledged: true } })),
    },
    index: mockFn(async () => ({ body: { result: 'created' } })),
    bulk: mockFn(async () => ({ body: { errors: false, items: [] } })),
    search: mockFn(async () => ({
      body: {
        hits: {
          total: { value: 1 },
          hits: [{ _id: 'd1', _score: 1.2, _source: { displayName: 'Dr. X' } }],
        },
        aggregations: { city: { buckets: [{ key: 'lima', doc_count: 3 }] } },
      },
    })),
    delete: mockFn(async () => ({ body: { result: 'deleted' } })),
    deleteByQuery: mockFn(async () => ({ body: { deleted: 5 } })),
    ...overrides,
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new SearchIndexService(client as any, logger as any);
  return { service, client, logger };
}

describe('SearchIndexService', () => {
  describe('ensureIndex', () => {
    it('es idempotente: no recrea un índice existente', async () => {
      const { service, client } = build();
      const res = await service.ensureIndex(INDEX);
      expect(res.created).toBe(false);
      expect(client.indices.create).not.toHaveBeenCalled();
    });

    it('crea el índice con sus mappings si no existe', async () => {
      const { service, client } = build({
        indices: {
          exists: mockFn(async () => ({ body: false })),
          create: mockFn(async () => ({ body: { acknowledged: true } })),
        },
      });
      const res = await service.ensureIndex(INDEX);
      expect(res.created).toBe(true);
      const arg = client.indices.create.mock.calls[0][0];
      expect(arg.index).toBe(INDEX);
      expect(arg.body.mappings.properties.tenantId).toEqual({
        type: 'keyword',
      });
    });

    it('rechaza un índice fuera de la whitelist', async () => {
      const { service } = build();
      await expect(service.ensureIndex('__evil')).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });
  });

  describe('indexDocument', () => {
    it('sella el documento con el tenant del contexto y descarta el del cuerpo', async () => {
      const { service, client } = build();
      await service.indexDocument(INDEX, TENANT_A, 'd1', {
        displayName: 'Dr. X',
        tenantId: TENANT_B, // intento de suplantar tenant
      });
      const arg = client.index.mock.calls[0][0];
      expect(arg.index).toBe(INDEX);
      expect(arg.id).toBe('d1');
      expect(arg.body.tenantId).toBe(TENANT_A);
    });

    it('falla cerrado si no hay tenant', async () => {
      const { service, client } = build();
      await expect(
        service.indexDocument(INDEX, '', 'd1', {}),
      ).rejects.toMatchObject({ code: 'PRECONDITION_FAILED' });
      expect(client.index).not.toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('inyecta SIEMPRE el filtro term { tenantId } en el bool query', async () => {
      const { service, client } = build();
      await service.search(INDEX, { tenantId: TENANT_A, query: 'cardio' });
      const body = client.search.mock.calls[0][0].body;
      expect(body.query.bool.filter).toContainEqual({
        term: { tenantId: TENANT_A },
      });
      expect(body.query.bool.must[0].multi_match.fields).toEqual([
        'displayName',
        'bio',
      ]);
    });

    it('usa match_all cuando no hay texto', async () => {
      const { service, client } = build();
      await service.search(INDEX, { tenantId: TENANT_A });
      const body = client.search.mock.calls[0][0].body;
      expect(body.query.bool.must[0]).toEqual({ match_all: {} });
    });

    it('traduce filtros declarados a terms y agrega facetas permitidas', async () => {
      const { service, client } = build();
      const result = await service.search(INDEX, {
        tenantId: TENANT_A,
        filters: [{ field: 'city', values: ['lima'] }],
        facets: ['city'],
      });
      const body = client.search.mock.calls[0][0].body;
      expect(body.query.bool.filter).toContainEqual({
        terms: { city: ['lima'] },
      });
      expect(body.aggs.city.terms.field).toBe('city');
      expect(result.facets.city).toEqual([{ key: 'lima', count: 3 }]);
      expect(result.total).toBe(1);
      expect(result.hits[0]).toEqual({
        id: 'd1',
        score: 1.2,
        source: { displayName: 'Dr. X' },
      });
    });

    it('rechaza un campo de filtro fuera de la allowlist', async () => {
      const { service, client } = build();
      await expect(
        service.search(INDEX, {
          tenantId: TENANT_A,
          filters: [{ field: 'password', values: ['x'] }],
        }),
      ).rejects.toMatchObject({ code: 'PRECONDITION_FAILED' });
      expect(client.search).not.toHaveBeenCalled();
    });

    it('rechaza una faceta fuera de la allowlist', async () => {
      const { service } = build();
      await expect(
        service.search(INDEX, { tenantId: TENANT_A, facets: ['bio'] }),
      ).rejects.toMatchObject({ code: 'PRECONDITION_FAILED' });
    });

    it('falla cerrado sin tenant', async () => {
      const { service, client } = build();
      await expect(
        service.search(INDEX, { tenantId: '' } as any),
      ).rejects.toMatchObject({ code: 'PRECONDITION_FAILED' });
      expect(client.search).not.toHaveBeenCalled();
    });
  });

  describe('deleteDocument', () => {
    it('devuelve deleted=false ante un 404 en vez de propagar', async () => {
      const { service } = build({
        delete: mockFn(async () => {
          throw { statusCode: 404 };
        }),
      });
      const res = await service.deleteDocument(INDEX, TENANT_A, 'nope');
      expect(res.deleted).toBe(false);
    });
  });

  describe('deleteByQuery', () => {
    it('acota siempre al tenant', async () => {
      const { service, client } = build();
      const res = await service.deleteByQuery(INDEX, TENANT_A, [
        { field: 'status', values: ['inactive'] },
      ]);
      const body = client.deleteByQuery.mock.calls[0][0].body;
      expect(body.query.bool.filter[0]).toEqual({
        term: { tenantId: TENANT_A },
      });
      expect(res.deleted).toBe(5);
    });
  });
});

/**
 * P10 · lo que hace que el índice sirva y no filtre.
 *
 * El índice del directorio público se consulta **sin sesión**: no lo protege
 * ningún guard, sobrevive al request y se puede volcar entero. Por eso las tres
 * pruebas de abajo cubren las tres cosas que, si se rompen, no se notan hasta
 * que ya es tarde: que el analizador español llegue al índice, que la búsqueda
 * geográfica ordene por distancia real, y que un campo de más no se escriba.
 */
describe('SearchIndexService · P10', () => {
  const PUBLICO = 'community_public_profiles';
  const TENANT_PUBLICO = 'public-directory';

  /** Cliente que reporta el índice como inexistente, para ver el `create`. */
  function buildSinIndice() {
    return build({
      indices: {
        exists: mockFn(async () => ({ body: false })),
        create: mockFn(async () => ({ body: { acknowledged: true } })),
        delete: mockFn(async () => ({ body: { acknowledged: true } })),
      },
    });
  }

  describe('analizador español', () => {
    it('crea el índice público con sus settings de análisis', async () => {
      const { service, client } = buildSinIndice();

      await service.ensureIndex(PUBLICO);

      const [[llamada]] = client.indices.create.mock.calls;
      const analisis = llamada.body.settings.analysis;
      expect(analisis.analyzer.es_text.filter).toContain('asciifolding');
      expect(analisis.analyzer.es_text.filter).toContain('spanish_stemmer');
      // Sin esto, «cardiologo» no encuentra «Cardiología» y el buscador
      // devuelve cero sobre datos que sí existen.
      expect(analisis.normalizer.es_keyword.filter).toContain('asciifolding');
    });

    it('el índice público declara el punto geográfico', async () => {
      const { service, client } = buildSinIndice();

      await service.ensureIndex(PUBLICO);

      const [[llamada]] = client.indices.create.mock.calls;
      expect(llamada.body.mappings.properties.location).toEqual({
        type: 'geo_point',
      });
    });
  });

  describe('búsqueda geográfica', () => {
    it('acota por radio y ordena por distancia real, no por relevancia', async () => {
      const { service, client } = build({
        search: mockFn(async () => ({
          body: {
            hits: {
              total: { value: 1 },
              hits: [
                {
                  _id: 'p1',
                  _score: null,
                  _source: { displayName: 'Dra. Cercana' },
                  sort: [1.23456, 'p1'],
                },
              ],
            },
          },
        })),
      });

      const res = await service.search(PUBLICO, {
        tenantId: TENANT_PUBLICO,
        geo: {
          field: 'location',
          lat: -16.5,
          lng: -68.15,
          radiusKm: 5,
          sortByDistance: true,
        },
      });

      const [[llamada]] = client.search.mock.calls;
      const filtros = llamada.body.query.bool.filter;
      expect(filtros).toContainEqual({
        geo_distance: {
          distance: '5km',
          location: { lat: -16.5, lon: -68.15 },
        },
      });
      expect(llamada.body.sort[0]._geo_distance.unit).toBe('km');
      // La distancia sale de OpenSearch, no de un recálculo en memoria sobre
      // una página ya recortada — que era justo el defecto que P10 cierra.
      expect(res.hits[0].distanceKm).toBe(1.2);
    });

    it('rechaza un campo geográfico que el índice no declara', async () => {
      const { service } = build();

      await expect(
        service.search(PUBLICO, {
          tenantId: TENANT_PUBLICO,
          geo: {
            field: 'homeAddress',
            lat: 0,
            lng: 0,
            radiusKm: 1,
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe('sólo campos declarados', () => {
    it('no indexa un documento con un campo de más', async () => {
      const { service, client } = build();

      await expect(
        service.indexDocument(PUBLICO, TENANT_PUBLICO, 'p1', {
          slug: 'dra-demo',
          displayName: 'Dra. Demo',
          // El identificador interno del sujeto: exactamente la fuga que la
          // tarea 40 de P10 vino a hacer imposible.
          targetId: '99999999-9999-9999-9999-999999999999',
        }),
      ).rejects.toThrow();
      expect(client.index).not.toHaveBeenCalled();
    });

    it('tampoco por lote: un solo documento sucio aborta el lote entero', async () => {
      const { service, client } = build();

      await expect(
        service.bulkIndex(PUBLICO, TENANT_PUBLICO, [
          { id: 'p1', document: { slug: 'a', displayName: 'A' } },
          { id: 'p2', document: { slug: 'b', tenantIdReal: 'x' } },
        ]),
      ).rejects.toThrow();
      expect(client.bulk).not.toHaveBeenCalled();
    });

    it('acepta el documento que sólo trae claves declaradas', async () => {
      const { service, client } = build();

      await service.indexDocument(PUBLICO, TENANT_PUBLICO, 'p1', {
        kind: 'PRACTITIONER',
        slug: 'dra-demo',
        displayName: 'Dra. Demo',
        location: { lat: -16.5, lon: -68.15 },
      });

      expect(client.index).toHaveBeenCalled();
    });

    it('los índices sin `documentKeys` siguen aceptando cualquier campo', async () => {
      const { service, client } = build();

      await service.indexDocument(INDEX, TENANT_A, 'd1', { loQueSea: 1 });

      expect(client.index).toHaveBeenCalled();
    });
  });

  describe('recreateIndex', () => {
    it('borra el índice antes de volver a crearlo', async () => {
      const { service, client } = build({
        indices: {
          exists: mockFn(async () => ({ body: true })),
          create: mockFn(async () => ({ body: { acknowledged: true } })),
          delete: mockFn(async () => ({ body: { acknowledged: true } })),
        },
      });

      const res = await service.recreateIndex(PUBLICO);

      expect(res.dropped).toBe(true);
      expect(client.indices.delete).toHaveBeenCalled();
    });
  });
});
