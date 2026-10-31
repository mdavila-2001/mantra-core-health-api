import type { FilterQuery } from '@mikro-orm/core';
import type { PharmacyProducts } from '../entities';
import { PHARM } from '../pharmacy.concepts';

/*
 * Reglas del catálogo que administra la propia farmacia (P47 §3-5). Puras:
 * sin base ni Nest, para que el alta, la edición, el inventario en lote, la
 * lectura y el resumen digan exactamente lo mismo.
 */

/** Código de la lista pública de mostrador donde vive el precio del catálogo. */
export const CATALOG_PRICE_LIST_CODE = 'CATALOGO';

/**
 * Umbral de alerta que se asume mientras la farmacia no fija el suyo. Es el del
 * mockup del cliente (28/09/2026), el mismo que usa el portal.
 */
export const DEFAULT_MIN_STOCK = 5;

/** Tope de existencias: atrapa un dedo de más. */
export const STOCK_MAX = 1_000_000;

/** Cuántas imágenes admite un producto (mockup del cliente). */
export const MAX_PRODUCT_IMAGES = 3;

/** Largo máximo del nombre de una categoría. */
export const CATEGORY_NAME_MAX = 60;

/** Largo máximo de la descripción para el paciente. */
export const DESCRIPTION_MAX = 2000;

/**
 * Las seis categorías con que parte cada farmacia. Procedencia: mockup del
 * cliente `farmacia_ecommerce_mantra.html` (28/09/2026). Catálogo interno de la
 * farmacia: las renombra o elimina.
 */
export const DEFAULT_CATEGORY_NAMES = [
  'Medicamentos',
  'Dermocosmética',
  'Cuidado personal',
  'Bebé y maternidad',
  'Dispositivos',
  'Bienestar',
] as const;

/** Estado del producto tal como lo ve el portal. */
export type CatalogStatus = 'PUBLISHED' | 'DRAFT' | 'WITHDRAWN';

/** El concepto de estado que guarda cada valor del portal. */
export const STATUS_CONCEPT: Readonly<Record<CatalogStatus, string>> = {
  PUBLISHED: PHARM.PRODUCT_ACTIVE,
  DRAFT: PHARM.PRODUCT_DRAFT,
  WITHDRAWN: PHARM.PRODUCT_RETIRED,
};

/** El estado del portal de un concepto guardado. */
export function catalogStatusOf(statusConceptId: string): CatalogStatus {
  if (statusConceptId === PHARM.PRODUCT_DRAFT) return 'DRAFT';
  if (statusConceptId === PHARM.PRODUCT_RETIRED) return 'WITHDRAWN';
  return 'PUBLISHED';
}

/** El nombre de una categoría sin espacios de más, o `null` si no sirve. */
export function cleanCategoryName(value: string): string | null {
  const clean = value.trim().replace(/\s+/g, ' ');
  return clean.length >= 1 && clean.length <= CATEGORY_NAME_MAX ? clean : null;
}

/**
 * La clave con que se comparan los nombres: sin mayúsculas ni tildes. Es la
 * columna `name_key` y su índice único por farmacia.
 */
export function categoryNameKey(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** Importe con hasta 10 enteros y 2 decimales, sin signo ni exponente. */
const MONEY_RE = /^(\d{1,10})(?:\.(\d{1,2}))?$/;

/**
 * Un importe recibido como número JSON o como texto, a texto exacto con dos
 * decimales, o `null` si no es un importe válido y positivo.
 *
 * Nunca se hace aritmética de coma flotante: el número se lee por su
 * representación decimal más corta (`String(12.5)` es `'12.5'`), se valida con
 * la expresión y se completa con ceros. `1e21`, `0.125` o `-3` no pasan.
 */
export function normalizeMoney(value: unknown): string | null {
  const text =
    typeof value === 'number'
      ? Number.isFinite(value)
        ? String(value)
        : ''
      : typeof value === 'string'
        ? value.trim()
        : '';
  const match = MONEY_RE.exec(text);
  if (!match) return null;
  const whole = match[1].replace(/^0+(?=\d)/, '');
  const cents = (match[2] ?? '').padEnd(2, '0');
  if (whole === '0' && cents === '00') return null;
  return `${whole}.${cents}`;
}

/** Centavos de un importe `numeric` en texto (`'12.50'` → `1250n`). */
export function toCents(amount: string): bigint {
  const [whole, fraction = ''] = amount.split('.');
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0').slice(0, 2));
}

/** Texto con dos decimales de una cantidad de centavos. */
export function fromCents(cents: bigint): string {
  const whole = cents / 100n;
  const fraction = (cents % 100n).toString().padStart(2, '0');
  return `${whole}.${fraction}`;
}

/** Lo que el catálogo declara de existencias de un producto. */
export interface DeclaredStock {
  readonly stockQuantity?: number | null;
  readonly outOfStockDeclared: boolean;
}

/**
 * Si la farmacia lo puede vender hoy: no lo marcó «no tengo» y, si lleva
 * conteo, le queda. Sin conteo (`stock_quantity` NULL) cuenta como que hay.
 */
export function isInStock(product: DeclaredStock): boolean {
  if (product.outOfStockDeclared) return false;
  return product.stockQuantity == null || product.stockQuantity > 0;
}

/**
 * Filtro de MikroORM de lo que la farmacia **no** apagó para todas sus sedes:
 * sin el «no tengo» del catálogo. Lo piden disponibilidad, precios de sede y
 * un pedido nuevo.
 *
 * El conteo del catálogo (`stock_quantity`) no filtra acá: cuántas hay en
 * cada sede lo decide la regla por sede (`siteProductAvailabilitySql`), que
 * da el libro cuando el producto tiene posición en la sede y el conteo del
 * catálogo cuando no. Filtrar por el conteo antes escondía un producto con
 * catálogo en 0 que una sede marcó «Lo tengo»: el paciente lo veía en una
 * pantalla y en otra no, y al pedirlo recibía 404.
 */
export const SELLABLE_STOCK_FILTER = {
  outOfStockDeclared: false,
} satisfies FilterQuery<PharmacyProducts>;

/** Los cambios de existencias que pide una línea o un producto. */
export interface StockChange {
  readonly stock?: number;
  readonly minStock?: number;
  readonly inStock?: boolean;
}

/**
 * Aplica un cambio de existencias a un producto (sin guardarlo).
 *
 * - `stock`: cuántas hay. Dar el número es decir cuántas hay: el «no tengo» de
 *   antes queda atrás.
 * - `inStock: false`: «no tengo», sin tocar el conteo.
 * - `inStock: true`: «tengo». Si el conteo estaba en 0, pasa a «sin conteo»
 *   (NULL) para que de verdad quede disponible — en vez de inventar un número.
 *
 * Que una misma petición traiga `stock` e `inStock` lo rechaza quien llama.
 */
export function applyStockChange(
  product: {
    stockQuantity?: number | null;
    minStockQuantity?: number | null;
    outOfStockDeclared: boolean;
  },
  change: StockChange,
): void {
  if (change.stock !== undefined) {
    product.stockQuantity = change.stock;
    product.outOfStockDeclared = false;
  }
  if (change.minStock !== undefined) {
    product.minStockQuantity = change.minStock;
  }
  if (change.inStock === false) {
    product.outOfStockDeclared = true;
  }
  if (change.inStock === true) {
    product.outOfStockDeclared = false;
    if (product.stockQuantity === 0) product.stockQuantity = null;
  }
}

/** Si un producto con existencias está en el umbral de alerta o por debajo. */
export function isLowStock(product: {
  stockQuantity?: number | null;
  minStockQuantity?: number | null;
  outOfStockDeclared: boolean;
}): boolean {
  if (!isInStock(product) || product.stockQuantity == null) return false;
  return (
    product.stockQuantity <= (product.minStockQuantity ?? DEFAULT_MIN_STOCK)
  );
}
