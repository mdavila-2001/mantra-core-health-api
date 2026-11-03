import { expect, jest } from '@jest/globals';
import { GLOSSARY_SLUG_PROPERTY_CODE } from '../../modules/terminology/glossary.constants';
import type { GlossarySeedService } from './glossary-seed.service';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/** Filas por entidad y por id: el estado de la base de prueba. */
export type GlossarySeedStore = Map<string, Map<string, any>>;

/**
 * Construye el seed del glosario con un contexto de persistencia controlado —
 * el mismo patrón que `dynamic-enum-seed.service.spec.ts`: un `em` en memoria
 * que responde `find`/`create`/`remove`/`flush` sin tocar una base real, y
 * guarda las filas enteras porque la reconciliación compara contenido.
 *
 * La única consulta directa del servicio (los conceptos de cada
 * `glossary-slug`, ver `GlossarySeedService.conceptIdsBySlug`) se resuelve
 * contra las mismas filas de `ConceptProperties`.
 *
 * Recibe la clase del servicio para que una prueba pueda importarla después
 * de sustituir un módulo (`jest.unstable_mockModule`).
 *
 * @param Service - La clase `GlossarySeedService` a instanciar.
 * @param initial - Filas que la base ya tiene, por entidad.
 * @returns Servicio, filas creadas y quitadas, y el estado final.
 */
export function buildGlossarySeed(
  Service: typeof GlossarySeedService,
  initial: GlossarySeedStore = new Map(),
) {
  const store: GlossarySeedStore = new Map(
    [...initial].map(([entity, rows]) => [
      entity,
      new Map([...rows].map(([id, row]) => [id, { ...row }])),
    ]),
  );
  const table = (entity: string): Map<string, any> => {
    if (!store.has(entity)) store.set(entity, new Map());
    return store.get(entity)!;
  };
  const matches = (row: any, where: Record<string, any>): boolean =>
    Object.entries(where).every(([key, value]) =>
      value !== null && typeof value === 'object' && '$in' in value
        ? (value.$in as unknown[]).includes(row[key])
        : row[key] === value,
    );

  const created: { entity: string; data: any }[] = [];
  const removed: { entity: string; data: any }[] = [];
  const executed: { sql: string; params: unknown[] }[] = [];
  let flushes = 0;

  const em = {
    find: mockFn((entity: any, where: any) =>
      Promise.resolve(
        [...table(entity.name).values()].filter((row) => matches(row, where)),
      ),
    ),
    create: mockFn((entity: any, data: any) => {
      created.push({ entity: entity.name, data });
      table(entity.name).set(data.id, data);
      return data;
    }),
    remove: mockFn((row: any) => {
      for (const [entity, rows] of store) {
        if (rows.get(row.id) === row) {
          rows.delete(row.id);
          removed.push({ entity, data: row });
        }
      }
    }),
    flush: mockFn(() => {
      flushes += 1;
      return Promise.resolve();
    }),
    // `backfillTermCodeSystem` (FND-25-03) es un `UPDATE ... WHERE` de una
    // sola sentencia: todo lo que siembra este doble ya cuelga del code
    // system propio, así que no hay nada que backfillear — 0.
    nativeUpdate: mockFn(() => Promise.resolve(0)),
    // `SELECT concept_id, value_json #>> '{}' AS slug ... WHERE property_code
    // = ? AND ... IN (?, ...)`: el primer parámetro es el código, el resto los
    // slugs buscados.
    getConnection: mockFn(() => ({
      execute: mockFn((sql: string, params: unknown[]) => {
        executed.push({ sql, params });
        const [code, ...slugs] = params;
        expect(code).toBe(GLOSSARY_SLUG_PROPERTY_CODE);
        return Promise.resolve(
          [...table('ConceptProperties').values()]
            .filter(
              (row) =>
                row.propertyCode === code &&
                typeof row.valueJson === 'string' &&
                slugs.includes(row.valueJson),
            )
            .map((row) => ({ concept_id: row.conceptId, slug: row.valueJson })),
        );
      }),
    })),
  };
  const orm = { em: { fork: mockFn(() => em) } };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new Service(orm as any, logger as any);

  return {
    service,
    created,
    removed,
    store,
    /** Las consultas directas que hizo el servicio. */
    executed,
    /** Filas creadas para una entidad concreta. */
    rowsOf: (entity: string) =>
      created.filter((row) => row.entity === entity).map((row) => row.data),
    /** Filas que la base tiene ahora para una entidad. */
    rowsIn: (entity: string) => [...table(entity).values()],
    /** Cuántas veces se flusheó. */
    flushes: () => flushes,
    logger,
  };
}
