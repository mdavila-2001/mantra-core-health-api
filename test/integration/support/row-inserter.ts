import { randomUUID } from 'node:crypto';
import type { Client } from 'pg';

/**
 * Inserts rows into a real PostgreSQL, filling every NOT NULL column that has
 * no default, and removes exactly the rows it created. It never truncates:
 * it is safe next to data it did not write.
 */
export function rowInserter(db: Client, mark: string) {
  const created: Array<[string, string, string]> = [];

  async function insert(
    table: string,
    values: Record<string, unknown>,
    key = 'id',
  ): Promise<string> {
    const [schema, name] = table.split('.');
    const cols = await db.query(
      `select column_name, data_type from information_schema.columns
        where table_schema = $1 and table_name = $2 and is_nullable = 'NO' and column_default is null`,
      [schema, name],
    );
    const row: Record<string, unknown> = { ...values };
    for (const c of cols.rows) {
      if (c.column_name in row) continue;
      row[c.column_name] =
        c.data_type === 'uuid'
          ? randomUUID()
          : c.data_type.startsWith('timestamp')
            ? new Date()
            : c.data_type === 'boolean'
              ? false
              : c.data_type === 'integer'
                ? 0
                : `x-${mark}`;
    }
    const names = Object.keys(row);
    const res = await db.query(
      `insert into ${table} (${names.map((n) => `"${n}"`).join(',')})
       values (${names.map((_, i) => `$${i + 1}`).join(',')}) returning "${key}"`,
      names.map((n) => row[n]),
    );
    created.push([table, key, res.rows[0][key]]);
    return res.rows[0][key];
  }

  /** Removes the rows this inserter created, newest first. */
  async function cleanup(): Promise<void> {
    for (const [table, key, id] of [...created].reverse())
      await db.query(`delete from ${table} where "${key}" = $1`, [id]);
  }

  return { insert, cleanup };
}
