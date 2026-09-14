/**
 * Utilidades numéricas para importes contables.
 *
 * Los importes viajan como cadenas (`numeric` de PostgreSQL) para no perder
 * precisión al deserializar. Para comparar saldos se trabaja en "centésimas"
 * enteras redondeadas, evitando el ruido de coma flotante que haría fallar la
 * validación debe=haber por diferencias de 1e-9.
 */

/** Convierte un importe a un entero de centésimas (2 decimales) redondeado. */
export function toCents(amount: string | number): number {
  const n = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(n)) {
    throw new Error(`Importe no numérico: ${String(amount)}`);
  }
  return Math.round(n * 100);
}

/** Suma una lista de importes y devuelve el total en centésimas. */
export function sumCents(amounts: Array<string | number>): number {
  return amounts.reduce<number>((acc, a) => acc + toCents(a), 0);
}

/** Formatea centésimas a una cadena con 2 decimales. */
export function fromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * El importe de una línea **en moneda base**.
 *
 * `amount_base` sólo se llena cuando hubo conversión: la columna existe para
 * guardar el resultado de aplicar `fx_rate` a `amount`. Cuando el asiento ya
 * está en la moneda base —que es el caso corriente— queda **nula**, y el
 * importe vive en `amount`.
 *
 * Leer sólo `amount_base` daba un balance **entero en cero que además decía que
 * cuadraba**: 0 = 0. Eso es peor que fallar, porque un informe contable vacío
 * con el sello de «cuadra» se firma sin mirarlo. Lo destapó ejecutarlo contra
 * datos reales; ninguna prueba con dobles lo habría visto, porque los dobles
 * llenaban la columna que el código leía.
 */
export function importeEnBase(linea: {
  amountBase?: string | null;
  amount?: string | null;
}): string {
  return linea.amountBase ?? linea.amount ?? '0.00';
}

/**
 * El importe como entero de céntimos.
 *
 * El dinero **no se suma en coma flotante**: `0.1 + 0.2` no da `0.3`, y un
 * balance que no cuadra por un céntimo es indistinguible de uno que no cuadra
 * por un error real. Los importes llegan como texto decimal desde `numeric` de
 * PostgreSQL justamente para no perder precisión en el camino.
 */
export function aCentimos(valor: string | number | null | undefined): bigint {
  if (valor === null || valor === undefined) {
    return 0n;
  }
  const texto = String(valor).trim();
  const negativo = texto.startsWith('-');
  const [entera = '0', decimal = ''] = texto.replace('-', '').split('.');
  const centimos = BigInt(entera) * 100n + BigInt((decimal + '00').slice(0, 2));
  return negativo ? -centimos : centimos;
}

/** De céntimos a texto decimal, que es como viaja el dinero en el contrato. */
export function aTexto(centimos: bigint): string {
  const negativo = centimos < 0n;
  const abs = negativo ? -centimos : centimos;
  const entera = abs / 100n;
  const resto = abs % 100n;
  return `${negativo ? '-' : ''}${entera}.${resto.toString().padStart(2, '0')}`;
}
