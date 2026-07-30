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
      const arg = (client.indices.create as any).mock.calls[0][0];
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
      const arg = (client.index as any).mock.calls[0][0];
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
      const body = (client.search as any).mock.calls[0][0].body;
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
      const body = (client.search as any).mock.calls[0][0].body;
      expect(body.query.bool.must[0]).toEqual({ match_all: {} });
    });

    it('traduce filtros declarados a terms y agrega facetas permitidas', async () => {
      const { service, client } = build();
      const result = await service.search(INDEX, {
        tenantId: TENANT_A,
        filters: [{ field: 'city', values: ['lima'] }],
        facets: ['city'],
      });
      const body = (client.search as any).mock.calls[0][0].body;
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
      const body = (client.deleteByQuery as any).mock.calls[0][0].body;
      expect(body.query.bool.filter[0]).toEqual({
        term: { tenantId: TENANT_A },
      });
      expect(res.deleted).toBe(5);
    });
  });
});
