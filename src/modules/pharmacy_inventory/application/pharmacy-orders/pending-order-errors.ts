import { PreconditionFailedException } from '../../../../common';
import { PharmacyInventoryErrorReason } from '../../pharmacy_inventory.error-reasons';
/**
 * El 422 de un pedido en el que ninguna línea tiene stock real: todas son «No
 * lo tengo» o sin unidades. Corre dentro de la transacción del alta, así que
 * no queda ni el pedido, ni sus líneas, ni sus asientos, ni el evento.
 */
export function noStockForAnyLine(
  siteId: string,
  productIds: readonly string[],
): PreconditionFailedException {
  const reason = PharmacyInventoryErrorReason.PRODUCT_OUT_OF_STOCK;
  return new PreconditionFailedException(
    'La farmacia no tiene en esta sucursal ninguno de los productos del pedido',
    { reason, siteId, productIds: [...productIds] },
    reason,
  );
}

/** 422 tipificado para un ajuste que no cuadra con una línea por confirmar. */
export function notPending(
  message: string,
  details: Record<string, unknown>,
): PreconditionFailedException {
  const reason =
    PharmacyInventoryErrorReason.ORDER_LINE_NOT_PENDING_CONFIRMATION;
  return new PreconditionFailedException(
    message,
    { reason, ...details },
    reason,
  );
}
