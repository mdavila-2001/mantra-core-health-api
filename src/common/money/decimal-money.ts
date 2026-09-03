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
interface EscalaDecimal {
  /** Valor escalado a `decimales` posiciones, con su signo. */
  readonly valor: bigint;
  /** Cuántas posiciones decimales tenía la cadena original. */
  readonly decimales: number;
}

/**
 * Parte una cadena decimal en entero escalado + cantidad de decimales.
 *
 * @param texto - Importe tal cual lo devolvió la base.
 * @returns La representación escalada.
 * @throws RangeError si el texto no es un decimal.
 */
function escalar(texto: string): EscalaDecimal {
  const limpio = texto.trim();
  if (!/^[+-]?\d+(\.\d+)?$/.test(limpio)) {
    throw new RangeError(`Importe no decimal: ${texto}`);
  }
  const negativo = limpio.startsWith('-');
  const sinSigno = limpio.replace(/^[+-]/, '');
  const [entera, fraccion = ''] = sinSigno.split('.');
  const valor = BigInt(`${entera}${fraccion}`);
  return { valor: negativo ? -valor : valor, decimales: fraccion.length };
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
 * @param importes - Importes como cadena; los nulos se ignoran.
 * @returns La suma como cadena decimal, o `null` si no había ninguno.
 */
export function sumarDecimales(
  importes: ReadonlyArray<string | null | undefined>,
): string | null {
  const presentes = importes.filter(
    (importe): importe is string => importe != null && importe.trim() !== '',
  );
  if (presentes.length === 0) return null;

  const escalados = presentes.map(escalar);
  const decimales = escalados.reduce(
    (max, item) => Math.max(max, item.decimales),
    0,
  );
  const total = escalados.reduce((acumulado, item) => {
    const factor = 10n ** BigInt(decimales - item.decimales);
    return acumulado + item.valor * factor;
  }, 0n);

  return formatearEscalado(total, decimales);
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
export function mismosDecimales(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (a == null || b == null) return a == null && b == null;
  const ea = escalar(a);
  const eb = escalar(b);
  const decimales = Math.max(ea.decimales, eb.decimales);
  const va = ea.valor * 10n ** BigInt(decimales - ea.decimales);
  const vb = eb.valor * 10n ** BigInt(decimales - eb.decimales);
  return va === vb;
}

/**
 * Vuelve a poner el punto decimal en un entero escalado.
 *
 * @param valor - Entero escalado, con signo.
 * @param decimales - Posiciones decimales a restituir.
 * @returns La cadena decimal.
 */
function formatearEscalado(valor: bigint, decimales: number): string {
  if (decimales === 0) return valor.toString();
  const negativo = valor < 0n;
  const digitos = (negativo ? -valor : valor)
    .toString()
    .padStart(decimales + 1, '0');
  const corte = digitos.length - decimales;
  const texto = `${digitos.slice(0, corte)}.${digitos.slice(corte)}`;
  return negativo ? `-${texto}` : texto;
}
