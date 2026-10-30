import type { ExternalProduct, ExternalStockLine } from './external-catalog';

/** Un vínculo de la conexión: código externo ↔ producto de la plataforma. */
export interface ExternalMapping {
  readonly externalProductCode: string;
  readonly pharmacyProductId: string;
}

/** Un ítem del lote de sincronización, ya traducido. */
export interface TranslatedSyncItem {
  readonly externalProductCode: string;
  readonly externalLocationCode: string;
  readonly externalQuantity: number;
  /** Producto de la plataforma, o ausente si el código no tiene un vínculo único. */
  readonly pharmacyProductId?: string;
}

/** Un código externo que no se pudo traducir, con su nombre para mostrarlo. */
export interface UnmappedExternalProduct {
  readonly externalCode: string;
  readonly name: string;
}

/**
 * El producto de cada código externo: solo si tiene **un** vínculo. Un código
 * vinculado a dos productos es ambiguo y se trata como sin vínculo: lo que no
 * se sabe traducir se informa, no se adivina.
 */
export function productByExternalCode(
  mappings: readonly ExternalMapping[],
): Map<string, string> {
  const products = new Map<string, Set<string>>();
  for (const mapping of mappings) {
    const set = products.get(mapping.externalProductCode) ?? new Set<string>();
    set.add(mapping.pharmacyProductId);
    products.set(mapping.externalProductCode, set);
  }
  const unique = new Map<string, string>();
  for (const [code, set] of products) {
    if (set.size === 1) unique.set(code, [...set][0]);
  }
  return unique;
}

/**
 * Traduce el stock de una sucursal externa a ítems del lote. Cada línea va al
 * lote (con o sin producto); las que no tienen un vínculo único salen además
 * en `unmapped`, con el nombre que les da el catálogo externo.
 */
export function translateExternalStock(
  mappings: readonly ExternalMapping[],
  catalog: readonly ExternalProduct[],
  siteCode: string,
  lines: readonly ExternalStockLine[],
): { items: TranslatedSyncItem[]; unmapped: UnmappedExternalProduct[] } {
  const byCode = productByExternalCode(mappings);
  const names = new Map(catalog.map((product) => [product.code, product.name]));
  const items: TranslatedSyncItem[] = [];
  const unmapped: UnmappedExternalProduct[] = [];
  for (const line of lines) {
    const pharmacyProductId = byCode.get(line.code);
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
      });
    }
  }
  return { items, unmapped };
}
