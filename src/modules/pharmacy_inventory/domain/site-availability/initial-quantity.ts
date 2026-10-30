/**
 * Cantidades por defecto del stock por sede (FAR-06).
 *
 * El libro de inventario exige un número en cada posición
 * (`inventory_stock_positions.on_hand_quantity`), pero el catálogo admite un
 * producto «hay» sin conteo (`stock_quantity` NULL). Estas dos reglas deciden
 * qué número toma una sede cuando no hay otro dato.
 */

/** Lo que el catálogo de la farmacia declara de un producto, para toda la farmacia. */
export interface DeclaredStock {
  /** Conteo declarado; `null` es «hay» sin número. */
  readonly stockQuantity: number | null | undefined;
  /** «No tengo» de toda la farmacia (`out_of_stock_declared`). */
  readonly outOfStockDeclared: boolean | null | undefined;
}

/**
 * Cantidad con la que nace la posición de un producto cuando la sede pasa a
 * llevar su propio stock: lo declarado si es un número; sin conteo, 1 unidad
 * (D-06-1), salvo que la farmacia lo haya marcado «no tengo», que es 0.
 */
export function initialSiteQuantity(declared: DeclaredStock): number {
  if (typeof declared.stockQuantity === 'number') {
    return Math.max(0, declared.stockQuantity);
  }
  return declared.outOfStockDeclared ? 0 : 1;
}

/**
 * Cantidad que toma «Lo tengo» cuando el pedido no trae una: lo declarado si es
 * mayor que cero; sin conteo o en cero, 1 unidad (D-06-1).
 */
export function defaultAvailableQuantity(
  stockQuantity: number | null | undefined,
): number {
  return typeof stockQuantity === 'number' && stockQuantity > 0
    ? stockQuantity
    : 1;
}
