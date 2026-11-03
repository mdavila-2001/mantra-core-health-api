/**
 * Cantidad por defecto del stock por sede (FAR-06).
 *
 * El libro de inventario exige un número en cada posición
 * (`inventory_stock_positions.on_hand_quantity`), pero el catálogo admite un
 * producto «hay» sin conteo (`stock_quantity` NULL). Esta regla decide qué
 * número toma una sede cuando no hay otro dato.
 */

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
