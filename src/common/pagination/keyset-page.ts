import { decodeKeysetCursor, encodeKeysetCursor } from './keyset-cursor';

/** Tope de filas por página cuando el cliente no pide uno. */
export const DEFAULT_KEYSET_PAGE_SIZE = 50;

/** Una página de un listado keyset por `id`. */
export interface KeysetPage<T> {
  items: T[];
  count: number;
  limit: number;
  /** Cursor opaco de continuación, o `null` si ésta es la última página. */
  nextCursor: string | null;
}

/** El `id` desde el que continúa una página, o `undefined` en la primera. */
export function afterIdOf(cursor: string | undefined): string | undefined {
  if (!cursor) return undefined;
  const key = decodeKeysetCursor(cursor);
  return typeof key.id === 'string' ? key.id : undefined;
}

/**
 * Recorta a `limit` las filas pedidas con `limit + 1` y arma la página: si
 * sobró una fila, hay continuación.
 */
export function toKeysetPage<T extends { id: string }>(
  rows: readonly T[],
  limit: number,
): KeysetPage<T> {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : [...rows];
  const last = items.at(-1);
  return {
    items,
    count: items.length,
    limit,
    nextCursor: hasMore && last ? encodeKeysetCursor({ id: last.id }) : null,
  };
}
