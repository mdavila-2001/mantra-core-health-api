import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  InventoryReservationLines,
  InventoryReservations,
  MedicationDispensationLines,
  MedicationDispensations,
} from '../../entities';
import { PharmacyProducts } from '../../../pharmacy/entities';
import { MedicationRequests } from '../../../clinical/entities';
import { CLIN } from '../../../clinical/clinical.concepts';
import { prescriptionItemState } from '../../../clinical/services/prescription-validity';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import type {
  PrescriptionItemStatus,
  PrescriptionOrderItem,
} from '../../domain/prescription-order-policy';

/**
 * Estados de pedido que todavía retienen lo pedido contra la receta: el pedido
 * vive y no se entregó del todo. `RETIRADO` ya cuenta como entregado (por su
 * dispensación) y `RECHAZADO`, `VENCIDO` y `CANCELADO` devuelven lo pedido al
 * saldo.
 */
export const RESERVING_ORDER_STATUS_IDS: readonly string[] = [
  PINV.ORDER_ENVIADO,
  PINV.ORDER_EN_REVISION,
  PINV.ORDER_CONFIRMADO,
  PINV.ORDER_ACEPTACION_PENDIENTE,
  PINV.ORDER_ACEPTADO,
  PINV.ORDER_LISTO_PARA_RETIRO,
];

/** Lo que el repositorio necesita de la receta referida para hallar sus hermanos. */
export type PrescriptionAnchor = Pick<
  PrescriptionOrderItem,
  'id' | 'encounterId' | 'patientProfileId'
>;

/**
 * Traduce un `medication_request` al ítem del módulo, con su estado resuelto
 * por la regla única de receta vigente (`prescriptionItemState`).
 *
 * @param row - La fila de `clinical.medication_requests`.
 * @param now - Instante contra el que se mide el vencimiento.
 * @returns El ítem plano que usan el guard y la política del pedido.
 */
export function toPrescriptionOrderItem(
  row: MedicationRequests,
  now: Date,
): PrescriptionOrderItem {
  const state: PrescriptionItemStatus = prescriptionItemState(row, now);
  const quantity =
    row.quantityDecimal == null ? null : Number(row.quantityDecimal);
  return {
    id: row.id,
    patientProfileId: row.patientProfileId,
    encounterId: row.encounterId ?? null,
    medicationConceptId: row.medicationConceptId,
    state,
    quantity: quantity !== null && Number.isFinite(quantity) ? quantity : null,
    unitConceptId: row.unitConceptId ?? null,
  };
}

/**
 * Lecturas del saldo de una receta para el pedido de farmacia (FAR-03).
 *
 * Una receta son los `clinical.medication_requests` emitidos del mismo
 * `encounter_id` y del mismo paciente; un ítem sin encuentro es una receta de
 * un solo ítem. Lo entregado y lo reservado se cuentan por fármaco
 * (`medication_concept_id` del producto), en unidades de producto.
 *
 * El módulo clínico no se modifica: se lee, igual que en la validación del
 * alta del pedido.
 */
@Injectable()
export class PrescriptionBalanceRepository {
  /**
   * La receta referida por el pedido, del paciente dado, con lock de escritura
   * sobre **toda** la receta: todos los ítems del mismo `encounter_id` y del
   * mismo paciente (la referida incluida), en cualquier estado. Sin encuentro,
   * la receta es solo la referida y solo ella se bloquea.
   *
   * El `FOR UPDATE` serializa dos pedidos simultáneos sobre la misma receta
   * aunque refieran a ítems distintos (otro fármaco del encuentro, o la
   * renovación del mismo): el segundo espera a que el primero confirme y lee su
   * reserva al calcular el saldo. Los ítems se bloquean en una sola consulta y
   * en orden fijo (`id` ascendente), así dos pedidos nunca se esperan en orden
   * inverso. Una primera lectura sin lock solo ubica el encuentro; la lectura
   * con lock refresca la fila (`refresh`) para no quedarse con el estado previo
   * a la espera.
   *
   * Receta inexistente y receta ajena devuelven lo mismo (`null`), y nunca se
   * bloquean filas de otro paciente: el paciente va en las dos consultas.
   *
   * @param em - EntityManager de la transacción del alta.
   * @param id - `medication_request_id` del pedido.
   * @param patientProfileId - Paciente del token.
   * @param now - Instante contra el que se mide el vencimiento.
   * @returns La receta bloqueada con su estado, o `null`.
   */
  async lockRequest(
    em: EntityManager,
    id: string,
    patientProfileId: string,
    now: Date,
  ): Promise<PrescriptionOrderItem | null> {
    const referred = await em.findOne(MedicationRequests, {
      id,
      patientProfileId,
    });
    if (!referred) return null;
    const locked = await em.find(
      MedicationRequests,
      referred.encounterId
        ? { encounterId: referred.encounterId, patientProfileId }
        : { id, patientProfileId },
      {
        lockMode: LockMode.PESSIMISTIC_WRITE,
        orderBy: { id: 'asc' },
        refresh: true,
      },
    );
    const row = locked.find((item) => item.id === id);
    return row ? toPrescriptionOrderItem(row, now) : null;
  }

  /**
   * Los otros ítems vigentes de la misma receta: mismo `encounter_id`, mismo
   * paciente, distinto id, emitidos y sin vencer. Sin encuentro, la receta es
   * solo la referida y no hay hermanos.
   *
   * @param em - EntityManager de la transacción del alta.
   * @param request - La receta referida.
   * @param now - Instante contra el que se mide el vencimiento.
   * @returns Los ítems `ACTIVE` del mismo encuentro, sin la referida.
   */
  async findActiveSiblings(
    em: EntityManager,
    request: PrescriptionAnchor,
    now: Date,
  ): Promise<PrescriptionOrderItem[]> {
    if (!request.encounterId) return [];
    const rows = await em.find(MedicationRequests, {
      encounterId: request.encounterId,
      patientProfileId: request.patientProfileId,
      statusConceptId: CLIN.MEDICATION_REQUEST_ISSUED,
      id: { $ne: request.id },
    });
    return rows
      .map((row) => toPrescriptionOrderItem(row, now))
      .filter((item) => item.state === 'ACTIVE');
  }

  /**
   * Lo entregado en mostrador por fármaco: suma de `dispensed_quantity` de las
   * dispensaciones `DISPENSED` de esas recetas (una revertida no cuenta), solo
   * de productos de los fármacos pedidos.
   *
   * @param em - EntityManager de la transacción del alta.
   * @param requestIds - Ítems de la receta.
   * @param conceptIds - Fármacos (`medication_concept_id`) a contar.
   * @returns Cantidad entregada por fármaco; un fármaco sin entregas no aparece.
   */
  async dispensedByConcept(
    em: EntityManager,
    requestIds: readonly string[],
    conceptIds: readonly string[],
  ): Promise<Map<string, number>> {
    if (requestIds.length === 0 || conceptIds.length === 0) return new Map();
    const dispensations = await em.find(MedicationDispensations, {
      medicationRequestId: { $in: [...requestIds] },
      dispensationStatusConceptId: PINV.DISPENSE_DISPENSED,
    });
    if (dispensations.length === 0) return new Map();
    const lines = await em.find(MedicationDispensationLines, {
      medicationDispensationId: { $in: dispensations.map((row) => row.id) },
    });
    return this.sumByConcept(
      em,
      conceptIds,
      lines.map((line) => ({
        productId: line.pharmacyProductId,
        quantity: toNumber(line.dispensedQuantity),
      })),
    );
  }

  /**
   * Lo reservado en pedidos vivos por fármaco: `requested_quantity −
   * fulfilled_quantity` de las líneas de pedidos de esas recetas en un estado
   * de {@link RESERVING_ORDER_STATUS_IDS}, solo de productos de los fármacos
   * pedidos. Lo ya entregado de un pedido vivo lo cuenta su dispensación.
   *
   * @param em - EntityManager de la transacción del alta.
   * @param requestIds - Ítems de la receta.
   * @param conceptIds - Fármacos (`medication_concept_id`) a contar.
   * @param activeStatusIds - Estados de pedido que retienen lo pedido.
   * @returns Cantidad reservada por fármaco; un fármaco sin reservas no aparece.
   */
  async reservedByConcept(
    em: EntityManager,
    requestIds: readonly string[],
    conceptIds: readonly string[],
    activeStatusIds: readonly string[] = RESERVING_ORDER_STATUS_IDS,
  ): Promise<Map<string, number>> {
    if (requestIds.length === 0 || conceptIds.length === 0) return new Map();
    const orders = await em.find(InventoryReservations, {
      medicationRequestId: { $in: [...requestIds] },
      reservationStatusConceptId: { $in: [...activeStatusIds] },
    });
    if (orders.length === 0) return new Map();
    const lines = await em.find(InventoryReservationLines, {
      inventoryReservationId: { $in: orders.map((row) => row.id) },
    });
    return this.sumByConcept(
      em,
      conceptIds,
      lines.map((line) => ({
        productId: line.pharmacyProductId,
        quantity: Math.max(
          0,
          toNumber(line.requestedQuantity) - toNumber(line.fulfilledQuantity),
        ),
      })),
    );
  }

  /**
   * Suma cantidades por fármaco, resolviendo el fármaco de cada producto en
   * una sola consulta acotada a los fármacos pedidos: un producto de otro
   * fármaco no aparece y su cantidad no se suma.
   */
  private async sumByConcept(
    em: EntityManager,
    conceptIds: readonly string[],
    rows: readonly { productId: string; quantity: number }[],
  ): Promise<Map<string, number>> {
    const totals = new Map<string, number>();
    if (rows.length === 0) return totals;
    const products = await em.find(PharmacyProducts, {
      id: { $in: [...new Set(rows.map((row) => row.productId))] },
      medicationConceptId: { $in: [...conceptIds] },
    });
    const conceptByProduct = new Map(
      products.map((product) => [product.id, product.medicationConceptId]),
    );
    for (const row of rows) {
      const conceptId = conceptByProduct.get(row.productId);
      if (!conceptId) continue;
      totals.set(conceptId, (totals.get(conceptId) ?? 0) + row.quantity);
    }
    return totals;
  }
}

/** `numeric` de Postgres (texto) a número; nulo o no numérico cuenta 0. */
function toNumber(value: string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}
