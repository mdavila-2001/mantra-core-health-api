import type { EntityManager } from '@mikro-orm/postgresql';
import { EMPTY_CONTENT } from '../catalog/annotation.rules';
import { CatalogRepository } from './catalog.repository';

/** Un EntityManager que solo registra el SQL y los parámetros de cada `execute`. */
function emQueRegistra() {
  const llamadas: { sql: string; params: unknown[] }[] = [];
  const em = {
    getConnection: () => ({
      execute: (sql: string, params: unknown[]) => {
        llamadas.push({ sql, params });
        return Promise.resolve([]);
      },
    }),
    getTransactionContext: () => undefined,
  } as unknown as EntityManager;
  return { em, llamadas };
}

/** Los placeholders `?` del SQL, en orden, marcando cuáles llevan cast a jsonb. */
function placeholders(sql: string): boolean[] {
  return [...sql.matchAll(/\?(::jsonb)?/g)].map((m) => m[1] !== undefined);
}

describe('CatalogRepository.insertAnnotation', () => {
  it.each([
    ['de objeto', null],
    ['de columna', '00000000-0000-4000-8000-0000000000c1'],
  ])(
    'alinea cada parámetro con su placeholder en la ficha %s (los jsonb reciben JSON)',
    async (_tipo, columnId) => {
      const { em, llamadas } = emQueRegistra();
      await new CatalogRepository().insertAnnotation(em, {
        objectId: '00000000-0000-4000-8000-0000000000a1',
        columnId,
        content: { ...EMPTY_CONTENT, sensitivity: 'CREDENTIAL' },
        reviewStatus: 'AUTO_DETECTED',
        origin: 'AUTO_CLASSIFIER',
        userId: '00000000-0000-4000-8000-0000000000b1',
      });

      const { sql, params } = llamadas[0];
      const casts = placeholders(sql);
      expect(casts).toHaveLength(params.length);
      casts.forEach((esJsonb, i) => {
        if (esJsonb)
          expect(() => JSON.parse(params[i] as string)).not.toThrow();
      });
      // Cierre de la fila: review_status, origin, created_at, updated_at, created_by, updated_by.
      expect(params.slice(-6, -4)).toEqual([
        'AUTO_DETECTED',
        'AUTO_CLASSIFIER',
      ]);
      expect(params).toContain('CREDENTIAL');
      expect(casts[params.indexOf('CREDENTIAL')]).toBe(false);
    },
  );
});
