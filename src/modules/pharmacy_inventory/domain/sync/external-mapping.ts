import type { ExternalProduct, ExternalStockLine } from './external-catalog';

/** Un vínculo de la conexión: código externo ↔ producto de la plataforma. */
export interface ExternalMapping {
  readonly externalProductCode: string;
  readonly pharmacyProductId: string;
  /**
   * La unidad del sistema externo que equivale a una unidad del producto
   * (`external_unit_code`); ausente si el vínculo no la declaró.
   */
  readonly externalUnitCode?: string | null;
}

/** Un ítem del lote de sincronización, ya traducido. */
export interface TranslatedSyncItem {
  readonly externalProductCode: string;
  readonly externalLocationCode: string;
  readonly externalQuantity: number;
  /** Producto de la plataforma, o ausente si el código no tiene un vínculo único. */
  readonly pharmacyProductId?: string;
}

/**
 * Por qué un código externo no se tradujo:
 *
 * - `NO_MAPPING`: ningún vínculo de la conexión lo nombra.
 * - `AMBIGUOUS_MAPPING`: lo nombran vínculos a más de un producto; se arregla
 *   deshaciendo los que sobran, no vinculando otra vez.
 */
export type UnmappedReason = 'NO_MAPPING' | 'AMBIGUOUS_MAPPING';

/** Un código externo que no se pudo traducir, con su nombre para mostrarlo. */
export interface UnmappedExternalProduct {
  readonly externalCode: string;
  readonly name: string;
  readonly reason: UnmappedReason;
  /** Los productos que se disputan el código (vacío si no tiene vínculo). */
  readonly productIds: readonly string[];
}

/** Lo que dicen los vínculos de un código externo. */
export type ExternalCodeResolution =
  | {
      readonly status: 'MAPPED';
      readonly productId: string;
      readonly externalUnitCode: string | null;
    }
  | { readonly status: 'AMBIGUOUS'; readonly productIds: readonly string[] };

/**
 * Qué dicen los vínculos de cada código externo: un producto, o varios (un
 * código ambiguo). Un código que no figura no tiene vínculo.
 */
export function resolveExternalCodes(
  mappings: readonly ExternalMapping[],
): Map<string, ExternalCodeResolution> {
  const grouped = new Map<string, Map<string, string | null>>();
  for (const mapping of mappings) {
    const products =
      grouped.get(mapping.externalProductCode) ??
      new Map<string, string | null>();
    products.set(mapping.pharmacyProductId, mapping.externalUnitCode ?? null);
    grouped.set(mapping.externalProductCode, products);
  }
  const resolved = new Map<string, ExternalCodeResolution>();
  for (const [code, products] of grouped) {
    const [[productId, externalUnitCode], ...others] = [...products];
    resolved.set(
      code,
      others.length === 0
        ? { status: 'MAPPED', productId, externalUnitCode }
        : { status: 'AMBIGUOUS', productIds: [...products.keys()].sort() },
    );
  }
  return resolved;
}

/**
 * El producto de cada código externo: solo si tiene **un** vínculo. Un código
 * vinculado a dos productos es ambiguo y se trata como sin vínculo: lo que no
 * se sabe traducir se informa, no se adivina.
 */
export function productByExternalCode(
  mappings: readonly ExternalMapping[],
): Map<string, string> {
  const unique = new Map<string, string>();
  for (const [code, resolution] of resolveExternalCodes(mappings)) {
    if (resolution.status === 'MAPPED') unique.set(code, resolution.productId);
  }
  return unique;
}

/**
 * Traduce el stock de una sucursal externa a ítems del lote. Cada línea va al
 * lote (con o sin producto); las que no tienen un vínculo único salen además
 * en `unmapped`, con el nombre que les da el catálogo externo y el motivo.
 */
export function translateExternalStock(
  mappings: readonly ExternalMapping[],
  catalog: readonly ExternalProduct[],
  siteCode: string,
  lines: readonly ExternalStockLine[],
): { items: TranslatedSyncItem[]; unmapped: UnmappedExternalProduct[] } {
  const resolved = resolveExternalCodes(mappings);
  const names = new Map(catalog.map((product) => [product.code, product.name]));
  const items: TranslatedSyncItem[] = [];
  const unmapped: UnmappedExternalProduct[] = [];
  for (const line of lines) {
    const resolution = resolved.get(line.code);
    const pharmacyProductId =
      resolution?.status === 'MAPPED' ? resolution.productId : undefined;
    items.push({
      externalProductCode: line.code,
      externalLocationCode: siteCode,
      externalQuantity: line.quantity,
      ...(pharmacyProductId ? { pharmacyProductId } : {}),
    });
    if (!pharmacyProductId) {
      unmapped.push({
        externalCode: line.code,
        name: names.get(line.code) ?? line.code,
        reason:
          resolution?.status === 'AMBIGUOUS'
            ? 'AMBIGUOUS_MAPPING'
            : 'NO_MAPPING',
        productIds:
          resolution?.status === 'AMBIGUOUS' ? resolution.productIds : [],
      });
    }
  }
  return { items, unmapped };
}

/**
 * Los códigos vinculados que el sistema externo **no mandó** para una
 * sucursal: su producto conserva lo último que se asentó, y eso se avisa en
 * lugar de borrarlo.
 */
export function mappedCodesNotSent(
  mappings: readonly ExternalMapping[],
  lines: readonly ExternalStockLine[],
): { externalCode: string; productId: string }[] {
  const sent = new Set(lines.map((line) => line.code));
  const missing: { externalCode: string; productId: string }[] = [];
  for (const [code, resolution] of resolveExternalCodes(mappings)) {
    if (resolution.status === 'MAPPED' && !sent.has(code)) {
      missing.push({ externalCode: code, productId: resolution.productId });
    }
  }
  return missing.sort((a, b) => a.externalCode.localeCompare(b.externalCode));
}

/**
 * Si la línea de un código se puede leer en la unidad del producto: el
 * vínculo dice qué unidad externa equivale a una del producto, y el catálogo
 * externo, en qué unidad cuenta ese código. No se convierte nada:
 *
 * - `null`: se puede leer (coinciden, o el vínculo no declaró unidad).
 * - `UNIT_MISMATCH`: el sistema externo cuenta en otra unidad.
 * - `UNIT_NOT_REPORTED`: el vínculo declara una unidad y el sistema externo no
 *   dice en cuál cuenta.
 */
export function unitIssue(
  mappingUnitCode: string | null | undefined,
  externalUnitCode: string | null | undefined,
): 'UNIT_MISMATCH' | 'UNIT_NOT_REPORTED' | null {
  const expected = normalizeUnit(mappingUnitCode);
  if (expected === '') return null;
  const reported = normalizeUnit(externalUnitCode);
  if (reported === '') return 'UNIT_NOT_REPORTED';
  return reported === expected ? null : 'UNIT_MISMATCH';
}

function normalizeUnit(code: string | null | undefined): string {
  return (code ?? '').trim().toUpperCase();
}
