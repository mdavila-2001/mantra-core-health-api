/**
 * Motivos por los que un pedido no respeta la receta (FAR-03). Cada uno es el
 * `reason` de un 422 `PRECONDITION_FAILED`.
 */
export type PrescriptionOrderReason =
  | 'PRESCRIPTION_NOT_ACTIVE'
  | 'PRESCRIPTION_EXPIRED'
  | 'PRODUCT_NOT_PRESCRIBED'
  | 'QUANTITY_EXCEEDS_PRESCRIPTION'
  | 'PRESCRIPTION_REQUIRED';

/**
 * Estado de un ítem de receta visto desde la farmacia. Lo calcula
 * infraestructura con la regla única de `clinical/services/prescription-validity.ts`
 * (`prescriptionItemState`); acá solo se lee, nunca se recalcula.
 */
export type PrescriptionItemStatus = 'ACTIVE' | 'EXPIRED' | 'NOT_ACTIVE';

/**
 * Un ítem de receta (`clinical.medication_requests`) traducido al módulo: lo
 * que el pedido necesita saber de él, con el estado ya resuelto.
 */
export interface PrescriptionOrderItem {
  id: string;
  patientProfileId: string;
  /** Encuentro que agrupa la receta; sin él, la receta es solo este ítem. */
  encounterId: string | null;
  medicationConceptId: string;
  state: PrescriptionItemStatus;
  /** Cantidad recetada; `null` si la receta no fija cantidad. */
  quantity: number | null;
  unitConceptId: string | null;
}

/** Un fármaco de la receta con lo que queda de él. */
export interface PrescribedDrug {
  medicationConceptId: string;
  /** Lo que queda (recetado − entregado − reservado); `null` = sin control de cantidad. */
  remaining: number | null;
}

/** La receta referida por el pedido, ya resuelta. */
export interface PrescriptionOrderPrescription {
  /** Estado de la receta referida. */
  state: PrescriptionItemStatus;
  /** Los fármacos de los ítems `ACTIVE` de la receta (la referida y sus hermanos). */
  drugs: readonly PrescribedDrug[];
}

/** Una línea del pedido con lo que el catálogo dice de su producto. */
export interface PrescriptionOrderLine {
  productId: string;
  medicationConceptId?: string | null;
  /** `null` o ausente cuenta como venta libre. */
  requiresPrescription?: boolean | null;
  quantity: number;
}

export interface PrescriptionOrderPolicyInput {
  /** `null` si el pedido no trae `medicationRequestId`. */
  prescription: PrescriptionOrderPrescription | null;
  lines: readonly PrescriptionOrderLine[];
}

/** El primer motivo encontrado y, si aplica, las líneas que lo causan. */
export interface PrescriptionOrderViolation {
  reason: PrescriptionOrderReason;
  productIds?: string[];
}

/**
 * ¿El pedido respeta la receta? Devuelve el primer motivo que lo impide, en
 * este orden: `PRESCRIPTION_NOT_ACTIVE`, `PRESCRIPTION_EXPIRED`,
 * `PRODUCT_NOT_PRESCRIBED`, `QUANTITY_EXCEEDS_PRESCRIPTION`. Sin receta, solo
 * `PRESCRIPTION_REQUIRED`.
 *
 * Solo se validan las líneas con producto de receta obligatoria: las de venta
 * libre pasan sin mirar la receta (D-4). Un producto de receta obligatoria sin
 * fármaco declarado no puede ser el de ninguna receta. Las líneas del mismo
 * fármaco suman contra su saldo; un saldo `null` no se controla (D-5).
 *
 * @param input - La receta resuelta (o `null`) y las líneas del pedido.
 * @returns `null` si el pedido pasa, o el primer motivo que lo impide.
 */
export function evaluatePrescriptionOrder(
  input: PrescriptionOrderPolicyInput,
): PrescriptionOrderViolation | null {
  const controlled = input.lines.filter(
    (line) => line.requiresPrescription === true,
  );
  const { prescription } = input;

  if (!prescription) {
    return controlled.length > 0
      ? {
          reason: 'PRESCRIPTION_REQUIRED',
          productIds: controlled.map((line) => line.productId),
        }
      : null;
  }
  if (prescription.state === 'NOT_ACTIVE') {
    return { reason: 'PRESCRIPTION_NOT_ACTIVE' };
  }
  if (prescription.state === 'EXPIRED') {
    return { reason: 'PRESCRIPTION_EXPIRED' };
  }

  const remainingByDrug = new Map(
    prescription.drugs.map((drug) => [
      drug.medicationConceptId,
      drug.remaining,
    ]),
  );
  const notPrescribed = controlled.filter(
    (line) =>
      !line.medicationConceptId ||
      !remainingByDrug.has(line.medicationConceptId),
  );
  if (notPrescribed.length > 0) {
    return {
      reason: 'PRODUCT_NOT_PRESCRIBED',
      productIds: notPrescribed.map((line) => line.productId),
    };
  }

  const linesByDrug = new Map<string, PrescriptionOrderLine[]>();
  for (const line of controlled) {
    const conceptId = line.medicationConceptId as string;
    linesByDrug.set(conceptId, [...(linesByDrug.get(conceptId) ?? []), line]);
  }
  for (const [conceptId, lines] of linesByDrug) {
    const remaining = remainingByDrug.get(conceptId);
    if (remaining === null || remaining === undefined) continue;
    const requested = lines.reduce((sum, line) => sum + line.quantity, 0);
    if (requested > remaining) {
      return {
        reason: 'QUANTITY_EXCEEDS_PRESCRIPTION',
        productIds: lines.map((line) => line.productId),
      };
    }
  }
  return null;
}
