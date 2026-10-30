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
  if (input.prescribed === null || !Number.isFinite(input.prescribed)) {
    return null;
  }
  return Math.max(0, input.prescribed - input.dispensed - input.reserved);
}
