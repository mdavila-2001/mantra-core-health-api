import { BadRequestException } from '@nestjs/common';
import {
  decodeKeysetCursor,
  encodeKeysetCursor,
} from '../../../common/pagination/keyset-cursor';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../data_catalog.constants';

/** Página de un listado del portal. */
export interface Pagina<T> {
  items: T[];
  /** Cursor opaco de la página siguiente; `null` en la última. */
  nextCursor: string | null;
  limit: number;
  /** Cantidad total de filas que cumplen los filtros (no sólo las de esta página). */
  total: number;
}

/** Minúsculas y sin tildes: «Catálogo» y «catalogo» se buscan igual. */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * Orden de las claves de paginación. **Es el mismo para ordenar y para continuar desde un cursor**:
 * si una parte usara `localeCompare` y la otra `>`, las dos discreparían en mayúsculas y signos y
 * la paginación saltaría o repetiría filas.
 */
export function compararClaves(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** ¿Algún campo contiene la búsqueda normalizada? Una búsqueda vacía no filtra. */
export function coincide(
  busqueda: string | undefined,
  ...campos: (string | null | undefined)[]
): boolean {
  if (!busqueda?.trim()) return true;
  const q = normalizar(busqueda);
  return campos.some((c) => c && normalizar(c).includes(q));
}

/**
 * Pagina por clave. `items` debe llegar **ordenado por `clave` ascendente**: el cursor es la
 * última clave devuelta y la página siguiente son las filas con clave mayor. Por eso es estable
 * aunque el inventario se regenere entre dos páginas: no depende de la posición.
 */
export function paginar<T>(
  items: readonly T[],
  clave: (item: T) => string,
  opciones: { cursor?: string; limit?: number },
): Pagina<T> {
  const limit = Math.min(
    Math.max(Math.trunc(opciones.limit ?? DEFAULT_PAGE_SIZE), 1),
    MAX_PAGE_SIZE,
  );
  let desde = 0;
  if (opciones.cursor) {
    const decodificado = decodeKeysetCursor(opciones.cursor);
    const ultima = decodificado['k'];
    if (typeof ultima !== 'string')
      throw new BadRequestException('El cursor de paginación no es válido');
    // primera fila con clave estrictamente mayor que la del cursor
    desde = items.findIndex((item) => compararClaves(clave(item), ultima) > 0);
    if (desde < 0) desde = items.length;
  }
  const pagina = items.slice(desde, desde + limit);
  const hayMas = desde + limit < items.length;
  return {
    items: pagina,
    nextCursor:
      hayMas && pagina.length
        ? encodeKeysetCursor({ k: clave(pagina[pagina.length - 1]) })
        : null,
    limit,
    total: items.length,
  };
}
