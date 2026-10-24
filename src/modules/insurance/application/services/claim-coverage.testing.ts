/**
 * Apoyo de pruebas de la regla de cobertura (carril 16): una base en memoria
 * que comparten el spec de la política y los de sus caminos de alta.
 */

export type Row = Record<string, unknown>;

/**
 * Base en memoria que entiende sólo los operadores que la regla usa: igualdad
 * (incluido `null`), `$lte`, `$gte` y `$or`. Así el filtro de vigencia y de
 * estado se prueba de verdad, no se da por bueno.
 */
export function memoryEm(tables: Map<unknown, Row[]>) {
  const matches = (row: Row, filter: Row): boolean =>
    Object.entries(filter).every(([key, expected]) => {
      if (key === '$or') {
        return (expected as Row[]).some((branch) => matches(row, branch));
      }
      const actual = row[key];
      if (expected === null) return actual == null;
      if (
        expected &&
        typeof expected === 'object' &&
        !(expected instanceof Date)
      ) {
        const op = expected as {
          $lte?: Date;
          $gte?: Date;
          $ne?: unknown;
          $in?: unknown[];
        };
        if ('$ne' in op) return actual !== op.$ne;
        if ('$in' in op) return (op.$in ?? []).includes(actual);
        if (actual == null) return false;
        if (op.$lte && (actual as Date).getTime() > op.$lte.getTime())
          return false;
        if (op.$gte && (actual as Date).getTime() < op.$gte.getTime())
          return false;
        return true;
      }
      return actual === expected;
    });
  const query = (entity: unknown, filter: Row) =>
    (tables.get(entity) ?? []).filter((row) => matches(row, filter));
  return {
    find: async (entity: unknown, filter: Row) => query(entity, filter),
    locks: [] as unknown[],
    findOne: async function (
      this: { locks: unknown[] },
      entity: unknown,
      filter: Row,
      options?: {
        orderBy?: Record<string, 'desc' | 'asc'>;
        lockMode?: unknown;
      },
    ) {
      if (options?.lockMode !== undefined) this.locks.push(entity);
      const rows = query(entity, filter);
      const order = options?.orderBy && Object.entries(options.orderBy)[0];
      if (order) {
        const [field, dir] = order;
        rows.sort((a, b) =>
          dir === 'desc'
            ? (b[field] as number) - (a[field] as number)
            : (a[field] as number) - (b[field] as number),
        );
      }
      return rows[0] ?? null;
    },
  };
}
