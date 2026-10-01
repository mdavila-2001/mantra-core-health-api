/**
 * Aritmética de centavos del dictamen de la aseguradora (Hito 4 §A).
 *
 * Todo el dinero viaja como **cadena decimal** y se opera en centavos enteros
 * (`bigint`): `numeric` de Postgres no entra en un doble sin perder centavos, y
 * repartir un monto entre líneas con `number` deja descuadres de un centavo que
 * la conciliación de la liquidación (`approved + patient + denied = billed`)
 * rechaza después.
 */

/** Un importe como lo escribe la base o el cliente: dígitos, y a lo sumo decimales. */
const AMOUNT_PATTERN = /^\d+(?:\.\d+)?$/;

/**
 * Pasa una cadena decimal a centavos.
 *
 * Admite ceros de más a la derecha (`'400.2500'`, que es como `numeric` sin
 * escala devuelve un importe) pero **no** un tercer decimal con valor: ese
 * dinero no existe y redondearlo sería inventar un centavo.
 *
 * @param amount - Importe decimal no negativo.
 * @returns El importe en centavos.
 * @throws RangeError si no es un decimal no negativo, o tiene fracciones de centavo.
 */
export function toCents(amount: string): bigint {
  if (!AMOUNT_PATTERN.test(amount)) {
    throw new RangeError(`Importe decimal inválido: ${amount}`);
  }
  const [whole, fraction = ''] = amount.split('.');
  const cents = fraction.slice(0, 2).padEnd(2, '0');
  if (/[^0]/.test(fraction.slice(2))) {
    throw new RangeError(`Importe con fracciones de centavo: ${amount}`);
  }
  return BigInt(whole) * 100n + BigInt(cents);
}

/**
 * Pasa centavos a cadena decimal con dos decimales.
 *
 * @param cents - Importe en centavos, no negativo.
 * @returns `'123.45'`.
 */
export function fromCents(cents: bigint): string {
  const whole = cents / 100n;
  const fraction = (cents % 100n).toString().padStart(2, '0');
  return `${whole}.${fraction}`;
}

/** Una línea de la solicitud, con lo que facturó. */
export interface SettlementInputLine {
  /** Identificador de la línea. */
  readonly id: string;
  /** Importe facturado; `null` cuenta como cero. */
  readonly billedAmount: string | null;
}

/** Lo que la aseguradora decide para una línea. */
export interface LineSettlement {
  /** Identificador de la línea. */
  readonly id: string;
  /** Importe facturado, ya normalizado a dos decimales. */
  readonly billedAmount: string;
  /** Importe que la aseguradora aprueba de esa línea. */
  readonly approvedAmount: string;
  /** Lo que no aprueba: `billed - approved`. */
  readonly deniedAmount: string;
}

/**
 * Reparte el monto aprobado entre las líneas, en proporción a lo facturado.
 *
 * - Aprobar todo (`approved == facturado`) deja cada línea aprobada entera, y
 *   aprobar cero las deja denegadas enteras: sin proporciones ni redondeos.
 * - En el caso parcial cada línea recibe `floor(approved * billed / total)` y
 *   los centavos que sobran van de a uno, empezando por las líneas de mayor
 *   importe (a igualdad, las primeras): así la suma es **exactamente** el monto
 *   aprobado y ninguna línea aprueba más de lo que facturó.
 * - Una línea sin importe aprueba cero.
 *
 * @param lines - Las líneas de la solicitud, en el orden en que se persisten.
 * @param approvedCents - Lo que la aseguradora aprueba en total, en centavos.
 * @returns Una entrada por línea, en el mismo orden.
 * @throws RangeError si el monto aprobado es negativo, supera lo facturado, o
 *   es positivo y las líneas no suman nada que repartir.
 */
export function splitApproval(
  lines: readonly SettlementInputLine[],
  approvedCents: bigint,
): LineSettlement[] {
  const billed = lines.map((line) =>
    line.billedAmount === null ? 0n : toCents(line.billedAmount),
  );
  const total = billed.reduce((sum, cents) => sum + cents, 0n);
  if (approvedCents < 0n || approvedCents > total) {
    throw new RangeError(
      'El monto aprobado debe estar entre cero y lo facturado',
    );
  }

  const approved = billed.map((cents) =>
    total === 0n ? 0n : (approvedCents * cents) / total,
  );
  let remainder =
    approvedCents - approved.reduce((sum, cents) => sum + cents, 0n);
  if (remainder > 0n && total === 0n) {
    throw new RangeError('Las líneas no suman nada que repartir');
  }

  const byAmountDesc = billed
    .map((cents, index) => ({ cents, index }))
    .sort((a, b) => {
      if (a.cents === b.cents) return a.index - b.index;
      return a.cents > b.cents ? -1 : 1;
    });
  for (const { index } of byAmountDesc) {
    if (remainder === 0n) break;
    if (approved[index] < billed[index]) {
      approved[index] += 1n;
      remainder -= 1n;
    }
  }
  // Inalcanzable: cada piso pierde menos de un centavo, así que sobran menos
  // centavos que líneas con importe. Si algún día pasara, fallar es mejor que
  // dejar un centavo sin repartir en una ruta de dinero.
  if (remainder !== 0n) {
    throw new RangeError(
      'No se pudo repartir el monto aprobado entre las líneas',
    );
  }

  return lines.map((line, index) => ({
    id: line.id,
    billedAmount: fromCents(billed[index]),
    approvedAmount: fromCents(approved[index]),
    deniedAmount: fromCents(billed[index] - approved[index]),
  }));
}
