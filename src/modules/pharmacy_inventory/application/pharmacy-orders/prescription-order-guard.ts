import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PreconditionFailedException } from '../../../../common';
import {
  isComparableUnit,
  remainingQuantity,
  sumQuantities,
} from '../../domain/prescription-balance';
import {
  evaluatePrescriptionOrder,
  type PrescribedDrug,
  type LockedPrescription,
  type PrescriptionOrderItem,
  type PrescriptionOrderLine,
  type PrescriptionOrderPrescription,
  type PrescriptionOrderReason,
} from '../../domain/prescription-order-policy';
import { PrescriptionBalanceRepository } from '../../infrastructure/repositories/prescription-balance.repository';
import { PharmacyInventoryErrorReason } from '../../pharmacy_inventory.error-reasons';
import type { PharmacyProductSnapshot } from '../ports/pharmacy-directory.port';

/** Lo que la persona lee cuando el pedido no respeta su receta. */
export const PRESCRIPTION_ORDER_MESSAGES: Readonly<
  Record<PrescriptionOrderReason, string>
> = {
  PRESCRIPTION_NOT_ACTIVE:
    'Esta receta ya no se puede usar: fue anulada, reemplazada o ya se entregó.',
  PRESCRIPTION_EXPIRED: 'Esta receta venció. Pida a su médico una nueva.',
  PRODUCT_NOT_PRESCRIBED:
    'Uno de los productos no es el medicamento de su receta. Quítelo del pedido para continuar.',
  QUANTITY_EXCEEDS_PRESCRIPTION:
    'Está pidiendo más de lo que le queda en su receta.',
  PRESCRIPTION_REQUIRED:
    'Uno de los productos se vende solo con receta. Elíjalo desde «Mis recetas».',
};

/** El motivo de la política, como sub-código del catálogo del módulo. */
const REASON_CODES: Readonly<
  Record<PrescriptionOrderReason, PharmacyInventoryErrorReason>
> = {
  PRESCRIPTION_NOT_ACTIVE: PharmacyInventoryErrorReason.PRESCRIPTION_NOT_ACTIVE,
  PRESCRIPTION_EXPIRED: PharmacyInventoryErrorReason.PRESCRIPTION_EXPIRED,
  PRODUCT_NOT_PRESCRIBED: PharmacyInventoryErrorReason.PRODUCT_NOT_PRESCRIBED,
  QUANTITY_EXCEEDS_PRESCRIPTION:
    PharmacyInventoryErrorReason.QUANTITY_EXCEEDS_PRESCRIPTION,
  PRESCRIPTION_REQUIRED: PharmacyInventoryErrorReason.PRESCRIPTION_REQUIRED,
};

/** Una línea del pedido tal como llega en el alta. */
export interface PrescriptionOrderLineInput {
  productId: string;
  quantity: number;
}

/**
 * El pedido respeta la receta (FAR-03).
 *
 * Arma la entrada de {@link evaluatePrescriptionOrder} con la receta ya leída
 * (con bloqueo), sus hermanos del mismo encuentro y el saldo de cada fármaco,
 * y traduce el primer motivo a un 422 `PRECONDITION_FAILED` con el motivo en
 * `reason` y en `details.reason`. Corre dentro de la transacción del alta y
 * antes de reservar: un rechazo no deja reserva, líneas, asientos ni eventos.
 */
@Injectable()
export class PrescriptionOrderGuard {
  constructor(private readonly balances: PrescriptionBalanceRepository) {}

  /**
   * La receta del pedido, del paciente, con lock de escritura sobre todos los
   * ítems de su encuentro: dos pedidos simultáneos sobre la misma receta no
   * superan juntos su saldo, aunque refieran a ítems distintos. Los hermanos
   * salen de las mismas filas bloqueadas, y el estado de todos se mide con el
   * mismo instante.
   *
   * @param em - EntityManager de la transacción del alta.
   * @param id - `medicationRequestId` del pedido.
   * @param patientProfileId - Paciente del token.
   * @param now - Instante del pedido contra el que se mide el vencimiento.
   * @returns La referida y sus hermanos `ACTIVE`, o `null` si no existe o es de otro paciente.
   */
  lockOwnRequest(
    em: EntityManager,
    id: string,
    patientProfileId: string,
    now: Date,
  ): Promise<LockedPrescription | null> {
    return this.balances.lockRequest(em, id, patientProfileId, now);
  }

  /**
   * Lanza el 422 del primer motivo por el que el pedido no respeta la receta.
   *
   * @param em - EntityManager de la transacción del alta.
   * @param request - La receta bloqueada ({@link lockOwnRequest}); `null` si el pedido no trae.
   * @param products - Los productos del pedido, ya validados como vendibles en la sede.
   * @param lines - Las líneas del pedido.
   * @throws PreconditionFailedException Si el pedido no respeta la receta.
   */
  async assertOrderRespectsPrescription(
    em: EntityManager,
    request: LockedPrescription | null,
    products: readonly PharmacyProductSnapshot[],
    lines: readonly PrescriptionOrderLineInput[],
  ): Promise<void> {
    const productById = new Map(
      products.map((product) => [product.id, product]),
    );
    const policyLines: PrescriptionOrderLine[] = lines.map((line) => ({
      productId: line.productId,
      medicationConceptId: productById.get(line.productId)?.medicationConceptId,
      requiresPrescription: productById.get(line.productId)
        ?.requiresPrescription,
      quantity: line.quantity,
    }));
    const prescription = request
      ? await this.resolvePrescription(em, request)
      : null;

    const violation = evaluatePrescriptionOrder({
      prescription,
      lines: policyLines,
    });
    if (!violation) return;

    const reason = REASON_CODES[violation.reason];
    throw new PreconditionFailedException(
      PRESCRIPTION_ORDER_MESSAGES[violation.reason],
      {
        reason,
        medicationRequestId: request?.item.id ?? null,
        ...(violation.productIds ? { productIds: violation.productIds } : {}),
      },
      reason,
    );
  }

  /**
   * La receta referida con sus fármacos vigentes y lo que queda de cada uno.
   * Una receta que no está activa no necesita saldo: la política la rechaza
   * antes de mirar las líneas.
   */
  private async resolvePrescription(
    em: EntityManager,
    request: LockedPrescription,
  ): Promise<PrescriptionOrderPrescription> {
    const { state } = request.item;
    if (state !== 'ACTIVE') return { state, drugs: [] };

    // Los hermanos son las filas que quedaron bloqueadas, sin otra lectura. El
    // estado ya viene resuelto por la regla única de receta vigente; acá solo
    // se descarta lo que no está `ACTIVE`.
    const items = [
      request.item,
      ...request.siblings.filter((item) => item.state === 'ACTIVE'),
    ];

    // Un fármaco recetado dos veces (una renovación del mismo encuentro) suma
    // las dos cantidades; solo se compara si ambas usan la misma unidad.
    const byDrug = new Map<string, PrescriptionOrderItem[]>();
    for (const item of items) {
      byDrug.set(item.medicationConceptId, [
        ...(byDrug.get(item.medicationConceptId) ?? []),
        item,
      ]);
    }
    const prescribed = [...byDrug].map(([conceptId, group]) => {
      const units = new Set(group.map((item) => item.unitConceptId));
      const unit = units.size === 1 ? [...units][0] : null;
      const quantity = group.some((item) => item.quantity === null)
        ? null
        : sumQuantities(group.map((item) => item.quantity ?? 0));
      return { conceptId, unit, quantity };
    });

    // Solo se consulta el saldo de lo que se puede controlar (D-5).
    const controlled = prescribed.filter(
      (drug) => drug.quantity !== null && isComparableUnit(drug.unit),
    );
    const requestIds = items.map((item) => item.id);
    const conceptIds = controlled.map((drug) => drug.conceptId);
    // Entregado y reservado en una sola sentencia: la misma foto de la base.
    const { dispensed, reserved } = await this.balances.balanceByConcept(
      em,
      requestIds,
      conceptIds,
    );

    const drugs: PrescribedDrug[] = prescribed.map((drug) => ({
      medicationConceptId: drug.conceptId,
      remaining: remainingQuantity(
        {
          prescribed: drug.quantity,
          dispensed: dispensed.get(drug.conceptId) ?? 0,
          reserved: reserved.get(drug.conceptId) ?? 0,
        },
        drug.unit,
      ),
    }));
    return { state, drugs };
  }
}
