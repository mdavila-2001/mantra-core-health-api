/**
 * Suma exacta de importes `numeric` que llegan como cadena.
 *
 * **Por qué otra utilidad de dinero.** Ya hay dos —
 * `modules/accounting/services/money.ts` y `modules/billing/money.util.ts` — y
 * las dos convierten a `number` para operar (`Math.round(n * 100)`). Eso
 * alcanza para dos decimales y montos chicos, y falla en dos casos que a una
 * lectura de seguros le tocan de lleno:
 *
 * - **Un importe con más de dos decimales se redondea antes de sumar.** Un
 *   coaseguro de `0.005` desaparece y el total no cierra contra el declarado.
 * - **`n * 100` es coma flotante.** `19.99 * 100` es `1998.9999999999998`; con
 *   `Math.round` sale bien, pero la suma de miles de líneas acumula el ruido y
 *   nadie puede decir después si el céntimo de diferencia era un error real.
 *
 * Acá se opera con `BigInt` sobre la representación decimal literal: no hay
 * coma flotante en ningún paso, así que el total de N líneas es el mismo que
 * escribiría la base con `SUM()`. Es lo que exige AC-16-6 de la TAREA-16, que
 * compara el total **como cadena** justamente para que un descuadre real no se
 * pueda confundir con ruido de redondeo.
 *
 * No reemplaza a las otras dos: no las toca. Se usa donde el contrato exige
 * igualdad de cadena.
 */

/** Un importe partido en signo, entero escalado y cantidad de decimales. */
interface DecimalScale {
  /** Valor escalado a `decimales` posiciones, con su signo. */
  readonly valor: bigint;
  /** Cuántas posiciones decimales tenía la cadena original. */
  readonly decimales: number;
}

/**
 * Parte una cadena decimal en entero escalado + cantidad de decimales.
 *
 * @param text - Importe tal cual lo devolvió la base.
 * @returns La representación escalada.
 * @throws RangeError si el texto no es un decimal.
 */
function escalate(text: string): DecimalScale {
  const clean = text.trim();
  if (!/^[+-]?\d+(\.\d+)?$/.test(clean)) {
    throw new RangeError(`Importe no decimal: ${text}`);
  }
  const negative = clean.startsWith('-');
  const withoutSign = clean.replace(/^[+-]/, '');
  const [entera, fraccion = ''] = withoutSign.split('.');
  const valor = BigInt(`${entera}${fraccion}`);
  return { valor: negative ? -valor : valor, decimales: fraccion.length };
}

/**
 * Suma importes decimales sin pasar por coma flotante.
 *
 * El resultado se emite con **la mayor cantidad de decimales de las entradas**,
 * no con dos fijos: recortar acá sería volver a perder lo que este módulo
 * existe para conservar. Con la lista vacía o sólo nulos devuelve `null` — que
 * es distinto de `'0.00'`: «todavía no hay dictamen» y «el dictamen aprobó
 * cero» no son lo mismo.
 *
 * @param amounts - Importes como cadena; los nulos se ignoran.
 * @returns La suma como cadena decimal, o `null` si no había ninguno.
 */
export function addDecimals(
  amounts: ReadonlyArray<string | null | undefined>,
): string | null {
  const present = amounts.filter(
    (amount): amount is string => amount != null && amount.trim() !== '',
  );
  if (present.length === 0) return null;

  const escalados = present.map(escalate);
  const decimals = escalados.reduce(
    (max, item) => Math.max(max, item.decimales),
    0,
  );
  const total = escalados.reduce((accumulated, item) => {
    const factor = 10n ** BigInt(decimals - item.decimales);
    return accumulated + item.valor * factor;
  }, 0n);

  return formatEscalado(total, decimals);
}

/**
 * Compara dos importes decimales por valor, no por texto.
 *
 * `'1250.0'` y `'1250.00'` son el mismo dinero y distinta cadena: comparar con
 * `===` daría un falso descuadre. Esto normaliza la escala antes de comparar.
 *
 * @param a - Primer importe.
 * @param b - Segundo importe.
 * @returns `true` si representan el mismo valor.
 */
export function sameDecimals(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (a == null || b == null) return a == null && b == null;
  const ea = escalate(a);
  const eb = escalate(b);
  const decimals = Math.max(ea.decimales, eb.decimales);
  const va = ea.valor * 10n ** BigInt(decimals - ea.decimales);
  const vb = eb.valor * 10n ** BigInt(decimals - eb.decimales);
  return va === vb;
}

/**
 * Vuelve a poner el punto decimal en un entero escalado.
 *
 * @param valor - Entero escalado, con signo.
 * @param decimals - Posiciones decimales a restituir.
 * @returns La cadena decimal.
 */
function formatEscalado(valor: bigint, decimals: number): string {
  if (decimals === 0) return valor.toString();
  const negative = valor < 0n;
  const digits = (negative ? -valor : valor)
    .toString()
    .padStart(decimals + 1, '0');
  const cut = digits.length - decimals;
  const text = `${digits.slice(0, cut)}.${digits.slice(cut)}`;
  return negative ? `-${text}` : text;
}
