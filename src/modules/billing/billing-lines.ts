import { PreconditionFailedException } from '../../common';
import { BillingErrorReason } from './billing.error-reasons';
import { exactCents, lineBaseCents } from './money.util';

/** Importes de una línea ya validados, en centavos. */
export interface ValidatedLine {
  /** Cantidad por precio unitario, con decimal exacto. */
  readonly baseCents: number;
  /** Descuento de la línea (cero si no lo declara). */
  readonly discountCents: number;
  /** Impuesto de la línea (cero si no lo declara). */
  readonly taxCents: number;
  /** Base menos descuento; nunca negativo. */
  readonly netCents: number;
  /** Neto más impuesto. */
  readonly lineTotalCents: number;
}

/** Razones del catálogo con las que se rechaza una línea de un documento. */
export interface LineFailureReasons {
  /** Cantidad, precio, descuento o impuesto inválidos. */
  readonly amount: BillingErrorReason;
  /** Descuento mayor que la base; ausente si el documento no admite descuento. */
  readonly discountExceedsBase?: BillingErrorReason;
}

/**
 * Valida los importes de una línea de factura, bill o nota de crédito con
 * decimal exacto y devuelve sus centavos.
 *
 * Reglas: la cantidad es positiva; precio, descuento e impuesto no son
 * negativos; y el descuento no supera la base, de modo que el neto de la línea
 * nunca es negativo. Una línea negativa o con descuento extremo producía un
 * total y un saldo negativos o exagerados.
 *
 * @param line - Importes tal como llegaron del cliente.
 * @param reasons - Razones del catálogo del documento.
 * @returns Los centavos de la línea.
 * @throws PreconditionFailedException si algún importe es inválido. El mensaje no
 *   refleja los valores recibidos.
 */
export function validateLineAmounts(
  line: {
    quantity: string;
    unitPrice: string;
    discount?: string;
    taxAmount?: string;
  },
  reasons: LineFailureReasons,
): ValidatedLine {
  const baseCents = lineBaseCents(line.quantity, line.unitPrice);
  const discountCents =
    line.discount === undefined ? 0 : exactCents(line.discount);
  const taxCents =
    line.taxAmount === undefined ? 0 : exactCents(line.taxAmount);
  if (
    baseCents === null ||
    !(Number(line.quantity) > 0) ||
    discountCents === null ||
    taxCents === null
  ) {
    throw new PreconditionFailedException(
      'Cantidad, precio, descuento e impuesto de la línea deben ser importes decimales válidos y la cantidad positiva',
      undefined,
      reasons.amount,
    );
  }
  if (discountCents > baseCents) {
    throw new PreconditionFailedException(
      'El descuento de la línea no puede superar su base',
      undefined,
      reasons.discountExceedsBase ?? reasons.amount,
    );
  }
  const netCents = baseCents - discountCents;
  return {
    baseCents,
    discountCents,
    taxCents,
    netCents,
    lineTotalCents: netCents + taxCents,
  };
}
