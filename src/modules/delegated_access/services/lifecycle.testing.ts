/**
 * Dobles de las pruebas del ciclo de vida, el traspaso y la administración
 * delegada. `memoryEm()` es un `EntityManager` en memoria con la intersección
 * mínima de lo que usan esos servicios: `create`, `find`, `findOne`,
 * `nativeUpdate`, `flush`, `transactional` y `fork`. Recibe la fábrica de
 * `jest.fn` de la prueba para no atar este archivo a una forma de importar `jest`.
 */

type Where = Record<string, unknown>;

function matches(row: Record<string, any>, where: Where): boolean {
  return Object.entries(where).every(([key, expected]) => {
    if (key === '$or') {
      return (expected as Where[]).some((w) => matches(row, w));
    }
    const actual = row[key];
    if (
      expected &&
      typeof expected === 'object' &&
      !(expected instanceof Date)
    ) {
      const op = expected as Record<string, any>;
      if ('$in' in op) return (op.$in as unknown[]).includes(actual);
      if ('$ne' in op) return actual !== op.$ne;
      if ('$gt' in op) return actual !== undefined && actual > op.$gt;
      if ('$lte' in op) return actual !== undefined && actual <= op.$lte;
      return false;
    }
    if (expected === null) return actual === null || actual === undefined;
    return actual === expected;
  });
}

/** Marca de orden global: permite comprobar «primero esto, después aquello» entre servicios. */
export function orderLog(): { push(label: string): number; entries: string[] } {
  const entries: string[] = [];
  return {
    entries,
    push(label: string) {
      entries.push(label);
      return entries.length;
    },
  };
}

/**
 * `EntityManager` en memoria, por nombre de entidad.
 *
 * @param mockFn - Fábrica de funciones simuladas de la prueba.
 * @param seed - Filas iniciales por nombre de entidad.
 * @returns El gestor y el almacén (`tables`) para aserciones.
 */
export function memoryEm(
  mockFn: (impl?: any) => any,
  seed: Record<string, any[]> = {},
): { em: any; tables: Record<string, any[]> } {
  const tables: Record<string, any[]> = {};
  for (const [name, rows] of Object.entries(seed)) tables[name] = [...rows];
  const table = (entity: { name: string }): any[] =>
    (tables[entity.name] ??= []);
  let serial = 0;
  const em: any = {
    tables,
    create: mockFn((entity: { name: string }, data: Record<string, any>) => {
      const row = { id: `${entity.name}-${++serial}`, ...data };
      table(entity).push(row);
      return row;
    }),
    find: mockFn(async (entity: { name: string }, where: Where = {}) =>
      table(entity).filter((r) => matches(r, where)),
    ),
    findOne: mockFn(
      async (entity: { name: string }, where: Where = {}) =>
        table(entity).find((r) => matches(r, where)) ?? null,
    ),
    count: mockFn(
      async (entity: { name: string }, where: Where = {}) =>
        table(entity).filter((r) => matches(r, where)).length,
    ),
    nativeUpdate: mockFn(
      async (
        entity: { name: string },
        where: Where,
        data: Record<string, any>,
      ) => {
        const hit = table(entity).filter((r) => matches(r, where));
        hit.forEach((r) => Object.assign(r, data));
        return hit.length;
      },
    ),
    flush: mockFn().mockResolvedValue(undefined),
    execute: mockFn().mockResolvedValue([]),
  };
  em.transactional = mockFn((cb: any) => cb(em));
  em.fork = mockFn(() => em);
  return { em, tables };
}
