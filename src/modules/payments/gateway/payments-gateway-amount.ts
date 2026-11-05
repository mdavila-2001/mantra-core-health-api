/**
 * Conversión de importes de la API (cadena decimal) a unidades menores enteras
 * de la pasarela (`amount_minor`).
 *
 * Aritmética de cadenas y `BigInt`: ningún importe pasa por `Number` antes de
 * ser entero. **No redondea**: un importe con más decimales de los que admite la
 * moneda se rechaza, porque redondear un cobro es decidir a favor de quién.
 */

/** Decimales de la unidad menor del boliviano (D-06: v1 sólo BOB). */
export const GATEWAY_MINOR_SCALE = 2;

/** Mayor entero seguro de JSON, el tope de `AmountMinor` en el contrato. */
const MAX_AMOUNT_MINOR = BigInt(Number.MAX_SAFE_INTEGER);

/** El importe no se puede expresar como unidades menores enteras y positivas. */
export class GatewayAmountError extends Error {
  constructor(
    readonly reason:
      'not_decimal' | 'too_many_decimals' | 'not_positive' | 'too_large',
  ) {
    super(`Importe no representable en la pasarela: ${reason}`);
    this.name = 'GatewayAmountError';
  }
}

/**
 * Convierte `"150.00"` en `15000`.
 *
 * @param amount - Importe decimal como cadena (`numeric` de PostgreSQL o DTO).
 * @returns Unidades menores, entero ≥ 1.
 * @throws GatewayAmountError si no es decimal, tiene más decimales que la moneda,
 *   no es positivo o supera el entero seguro de JSON.
 */
export function decimalToMinorUnits(amount: string): number {
  const clean = amount.trim();
  if (!/^\d+(\.\d+)?$/u.test(clean)) {
    throw new GatewayAmountError('not_decimal');
  }
  const [whole, rawFraction = ''] = clean.split('.');
  // Los ceros a la derecha de la parte decimal no cambian el valor ("150.500000").
  const fraction = rawFraction.replace(/0+$/u, '');
  if (fraction.length > GATEWAY_MINOR_SCALE) {
    throw new GatewayAmountError('too_many_decimals');
  }
  const minor = BigInt(`${whole}${fraction.padEnd(GATEWAY_MINOR_SCALE, '0')}`);
  if (minor <= 0n) throw new GatewayAmountError('not_positive');
  if (minor > MAX_AMOUNT_MINOR) throw new GatewayAmountError('too_large');
  return Number(minor);
}

/**
 * Convierte unidades menores a la cadena decimal de la API (`15000` → `"150.00"`).
 *
 * @param minor - Entero no negativo.
 */
export function minorUnitsToDecimal(minor: number): string {
  if (!Number.isSafeInteger(minor) || minor < 0) {
    throw new GatewayAmountError('not_decimal');
  }
  const digits = String(minor).padStart(GATEWAY_MINOR_SCALE + 1, '0');
  const cut = digits.length - GATEWAY_MINOR_SCALE;
  return `${digits.slice(0, cut)}.${digits.slice(cut)}`;
}
