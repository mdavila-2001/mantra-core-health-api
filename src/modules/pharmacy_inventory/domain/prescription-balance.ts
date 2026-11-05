import { CLIN } from '../../clinical/clinical.concepts';

/**
 * Unidades recetadas que se pueden comparar con lo que pide un pedido.
 *
 * El pedido cuenta envases (`requested_quantity` de la línea) y el producto no
 * declara su contenido: solo un `package_size_text` libre. Una receta en
 * comprimidos, mL o mg no se puede traducir a envases sin inventarlo. Solo una
 * receta que ya cuenta envases que se venden por pieza (un frasco, un tubo) se
 * compara de igual a igual.
 */
export const COUNTABLE_PACKAGE_UNITS: ReadonlySet<string> = new Set([
  CLIN.MEDICATION_UNIT_BOTTLE,
  CLIN.MEDICATION_UNIT_TUBE,
]);

/**
 * ¿La cantidad recetada en esta unidad se puede comparar con la de un pedido?
 *
 * @param unitConceptId - `unit_concept_id` del ítem de receta.
 * @returns Si la unidad es un envase que se vende por pieza.
 */
export function isComparableUnit(
  unitConceptId: string | null | undefined,
): boolean {
  return unitConceptId != null && COUNTABLE_PACKAGE_UNITS.has(unitConceptId);
}

/** Cantidades de un fármaco de la receta, todas en la misma unidad. */
export interface PrescriptionBalanceInput {
  /** Lo recetado; `null` si la receta no fija cantidad. */
  prescribed: number | null;
  /** Lo ya entregado en mostrador. */
  dispensed: number;
  /** Lo reservado en pedidos que siguen activos. */
  reserved: number;
}

/**
 * Lo que queda de la receta: recetado − entregado − reservado.
 *
 * Nunca es negativo: si lo entregado o reservado ya superó lo recetado (una
 * entrega anterior a esta regla, por ejemplo), lo que queda es cero.
 *
 * @param input - Lo recetado, lo entregado y lo reservado.
 * @param unitConceptId - Unidad de lo recetado.
 * @returns Lo que queda, o `null` si la unidad no es comparable o la receta no
 * fija cantidad: en ese caso no hay control de cantidad.
 */
export function remainingQuantity(
  input: PrescriptionBalanceInput,
  unitConceptId: string | null | undefined,
): number | null {
  if (!isComparableUnit(unitConceptId)) return null;
  const prescribed = toExact(input.prescribed);
  if (prescribed === null) return null;
  const left = sumExact([
    prescribed,
    negate(toExact(input.dispensed) ?? ZERO),
    negate(toExact(input.reserved) ?? ZERO),
  ]);
  return left.units > 0n ? fromExact(left) : 0;
}

/**
 * La suma exacta de cantidades: `0.1 + 0.2` da `0.3`, no
 * `0.30000000000000004`.
 *
 * @param values - Cantidades (las que no son finitas cuentan 0).
 * @returns La suma.
 */
export function sumQuantities(values: readonly number[]): number {
  return fromExact(sumExact(values.map((value) => toExact(value) ?? ZERO)));
}

/**
 * ¿Lo pedido supera el límite? Comparación exacta: pedir `0.2` cuando quedan
 * `0.3 − 0.1` no lo supera.
 *
 * @param requested - Las cantidades pedidas, que se suman.
 * @param limit - Lo que queda.
 * @returns Si la suma de lo pedido es mayor que el límite.
 */
export function exceedsQuantity(
  requested: readonly number[],
  limit: number,
): boolean {
  const total = sumExact(requested.map((value) => toExact(value) ?? ZERO));
  return compareExact(total, toExact(limit) ?? ZERO) > 0;
}

/*
 * Aritmética decimal exacta, sin librerías: un decimal es un entero (`bigint`)
 * y una escala (cantidad de decimales). Las columnas de cantidad son `numeric`
 * sin escala declarada (`clinical.medication_requests.quantity_decimal`,
 * `pharmacy_inventory.medication_dispensation_lines.dispensed_quantity`,
 * `inventory_reservation_lines.requested_quantity`/`fulfilled_quantity`) y el
 * DTO del pedido no acota los decimales: no hay una escala fija que usar. Cada
 * operación alinea a la mayor escala de sus operandos.
 *
 * Un `number` se lee por su representación decimal más corta (`String(0.1)`
 * es `"0.1"`), que es el decimal que vino de la base o del cuerpo HTTP.
 */
interface Exact {
  readonly units: bigint;
  readonly scale: number;
}

const ZERO: Exact = { units: 0n, scale: 0 };

const DECIMAL = /^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i;

function toExact(value: number | null | undefined): Exact | null {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }
  const match = DECIMAL.exec(String(value));
  if (!match) return null;
  const [, sign, whole = '', fraction = '', exponent = '0'] = match;
  const digits = BigInt(`${whole}${fraction}` || '0');
  const power = Number(exponent) - fraction.length;
  const units = power >= 0 ? digits * 10n ** BigInt(power) : digits;
  return { units: sign === '-' ? -units : units, scale: Math.max(0, -power) };
}

function rescale(value: Exact, scale: number): bigint {
  return value.units * 10n ** BigInt(scale - value.scale);
}

function negate(value: Exact): Exact {
  return { units: -value.units, scale: value.scale };
}

function sumExact(values: readonly Exact[]): Exact {
  const scale = Math.max(0, ...values.map((value) => value.scale));
  return {
    units: values.reduce((sum, value) => sum + rescale(value, scale), 0n),
    scale,
  };
}

function compareExact(a: Exact, b: Exact): number {
  const scale = Math.max(a.scale, b.scale);
  const diff = rescale(a, scale) - rescale(b, scale);
  return diff > 0n ? 1 : diff < 0n ? -1 : 0;
}

function fromExact(value: Exact): number {
  const negative = value.units < 0n;
  const digits = (negative ? -value.units : value.units)
    .toString()
    .padStart(value.scale + 1, '0');
  const cut = digits.length - value.scale;
  const text =
    value.scale === 0 ? digits : `${digits.slice(0, cut)}.${digits.slice(cut)}`;
  return Number(`${negative ? '-' : ''}${text}`);
}
