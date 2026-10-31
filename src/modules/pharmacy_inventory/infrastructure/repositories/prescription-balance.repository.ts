import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { MedicationRequests } from '../../../clinical/entities';
import { prescriptionItemState } from '../../../clinical/services/prescription-validity';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import type {
  LockedPrescription,
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

/**
 * Estados de **línea** de pedido que no retienen nada contra la receta, aunque
 * el pedido siga vivo. El contrato FAR-03 §2 dice «reservado en pedidos
 * activos», y eso manda sobre el `requested − fulfilled` de REQ-003 para estas
 * líneas:
 *
 * - `SIN_STOCK`: se guarda con `reserved_quantity = 0` (al crear el pedido, o
 *   cuando la farmacia la marca `NO_DISPONIBLE` al confirmar). No hay nada
 *   reservado y no se puede entregar.
 * - `RELEASED`: en un pedido vivo, la deja la aceptación del genérico. El
 *   stock del original se devuelve, y su total se vuelve a reservar sobre la
 *   línea del genérico, que es del mismo fármaco. Contarla descontaría dos
 *   veces. La entrega solo toma líneas `CONFIRMED`, así que nunca se entrega.
 * - `POR_CONFIRMAR`: la sede la ofrece por su catálogo y la farmacia todavía
 *   no dijo si la tiene. Se guarda con `reserved_quantity = 0` y no tiene nada
 *   reservado hasta que la farmacia la confirme.
 */
export const NON_RESERVING_LINE_STATUS_IDS: readonly string[] = [
  PINV.RES_LINE_OUT_OF_STOCK,
  PINV.RES_LINE_RELEASED,
  PINV.RES_LINE_PENDING_CONFIRMATION,
];

/** Saltos máximos al seguir la cadena de reemplazos de un ítem. */
const MAX_REPLACED_HOPS = 20;

/** Lo entregado y lo reservado de una receta, por fármaco. */
export interface PrescriptionBalanceByConcept {
  dispensed: Map<string, number>;
  reserved: Map<string, number>;
}

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
   * Los hermanos salen de ese mismo conjunto de filas bloqueadas, sin otra
   * lectura: un ítem emitido en el encuentro después del bloqueo no está
   * bloqueado y no entra en este pedido.
   *
   * Receta inexistente y receta ajena devuelven lo mismo (`null`), y nunca se
   * bloquean filas de otro paciente: el paciente va en las dos consultas.
   *
   * @param em - EntityManager de la transacción del alta.
   * @param id - `medication_request_id` del pedido.
   * @param patientProfileId - Paciente del token.
   * @param now - Instante contra el que se mide el vencimiento.
   * @returns La referida con su estado, sus hermanos `ACTIVE` y los originales
   * que reemplazan, o `null`.
   */
  async lockRequest(
    em: EntityManager,
    id: string,
    patientProfileId: string,
    now: Date,
  ): Promise<LockedPrescription | null> {
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
    const items = locked.map((row) => toPrescriptionOrderItem(row, now));
    const item = items.find((row) => row.id === id);
    if (!item) return null;
    const siblings = items.filter(
      (row) => row.id !== id && row.state === 'ACTIVE',
    );
    const replacedIds = await this.replacedAncestorIds(
      em,
      locked,
      [item, ...siblings].map((row) => row.id),
      patientProfileId,
    );
    return { item, siblings, replacedIds };
  }

  /**
   * Los originales que los ítems dados reemplazan, siguiendo
   * `replaces_request_id` hacia atrás. Un reemplazo corrige la receta, no la
   * renueva: lo entregado o pedido sobre el original sigue contando contra el
   * reemplazo. El reemplazo conserva el encuentro, así que el original suele
   * estar entre las filas ya bloqueadas; si no (receta sin encuentro), se lee
   * sin lock: un original `REPLACED` ya no admite pedidos.
   */
  private async replacedAncestorIds(
    em: EntityManager,
    locked: readonly MedicationRequests[],
    itemIds: readonly string[],
    patientProfileId: string,
  ): Promise<string[]> {
    const byId = new Map(locked.map((row) => [row.id, row]));
    const seen = new Set<string>(itemIds);
    const ancestors: string[] = [];
    for (const itemId of itemIds) {
      let next = byId.get(itemId)?.replacesRequestId;
      // Tope de saltos: una cadena circular no puede colgar el alta.
      for (
        let hop = 0;
        next && !seen.has(next) && hop < MAX_REPLACED_HOPS;
        hop++
      ) {
        seen.add(next);
        const row =
          byId.get(next) ??
          (await em.findOne(MedicationRequests, {
            id: next,
            patientProfileId,
          }));
        if (!row) break;
        byId.set(row.id, row);
        ancestors.push(row.id);
        next = row.replacesRequestId;
      }
    }
    return ancestors;
  }

  /**
   * Lo entregado y lo reservado por fármaco, en **una sola sentencia SQL**.
   *
   * En READ COMMITTED cada sentencia toma su propia foto. Con dos lecturas
   * separadas, una entrega que confirma entre ambas (escribe la dispensación y
   * saca el pedido de los estados vivos en la misma transacción) no se ve en
   * la primera y ya no se ve en la segunda: esa cantidad desaparecería del
   * saldo. Una sola sentencia lee las dos cosas en la misma foto.
   *
   * - Entregado: suma de `dispensed_quantity` de las dispensaciones
   *   `DISPENSED` de esas recetas (una revertida no cuenta).
   * - Reservado: `requested_quantity − fulfilled_quantity` (nunca negativo) de
   *   las líneas de pedidos de esas recetas en un estado de `activeStatusIds`,
   *   salvo las líneas `SIN_STOCK` y `RELEASED`
   *   ({@link NON_RESERVING_LINE_STATUS_IDS}), que no retienen nada. Lo ya entregado de un pedido vivo lo cuenta su
   *   dispensación.
   * - En los dos, solo productos de los fármacos pedidos.
   *
   * @param em - EntityManager de la transacción del alta.
   * @param requestIds - Ítems de la receta.
   * @param conceptIds - Fármacos (`medication_concept_id`) a contar.
   * @param activeStatusIds - Estados de pedido que retienen lo pedido.
   * @returns Entregado y reservado por fármaco; un fármaco sin movimientos no aparece.
   */
  async balanceByConcept(
    em: EntityManager,
    requestIds: readonly string[],
    conceptIds: readonly string[],
    activeStatusIds: readonly string[] = RESERVING_ORDER_STATUS_IDS,
  ): Promise<PrescriptionBalanceByConcept> {
    const balance: PrescriptionBalanceByConcept = {
      dispensed: new Map(),
      reserved: new Map(),
    };
    if (
      requestIds.length === 0 ||
      conceptIds.length === 0 ||
      activeStatusIds.length === 0
    ) {
      return balance;
    }
    const list = (values: readonly string[]): string =>
      values.map(() => '?').join(', ');
    const rows: PrescriptionBalanceRow[] = await em.getConnection().execute(
      `SELECT movement.concept_id AS "conceptId",
              movement.kind AS "kind",
              SUM(movement.quantity)::text AS "quantity"
         FROM (
           SELECT product.medication_concept_id AS concept_id,
                  'DISPENSED'::text AS kind,
                  line.dispensed_quantity AS quantity
             FROM pharmacy_inventory.medication_dispensation_lines line
             JOIN pharmacy_inventory.medication_dispensations dispensation
               ON dispensation.id = line.medication_dispensation_id
             JOIN pharmacy.pharmacy_products product
               ON product.id = line.pharmacy_product_id
            WHERE dispensation.medication_request_id IN (${list(requestIds)})
              AND dispensation.dispensation_status_concept_id = ?
              AND product.medication_concept_id IN (${list(conceptIds)})
           UNION ALL
           SELECT product.medication_concept_id AS concept_id,
                  'RESERVED'::text AS kind,
                  GREATEST(
                    0,
                    line.requested_quantity - COALESCE(line.fulfilled_quantity, 0)
                  ) AS quantity
             FROM pharmacy_inventory.inventory_reservation_lines line
             JOIN pharmacy_inventory.inventory_reservations reservation
               ON reservation.id = line.inventory_reservation_id
             JOIN pharmacy.pharmacy_products product
               ON product.id = line.pharmacy_product_id
            WHERE reservation.medication_request_id IN (${list(requestIds)})
              AND reservation.reservation_status_concept_id IN (${list(activeStatusIds)})
              AND line.status_concept_id NOT IN (${list(NON_RESERVING_LINE_STATUS_IDS)})
              AND product.medication_concept_id IN (${list(conceptIds)})
         ) movement
        GROUP BY movement.concept_id, movement.kind`,
      [
        ...requestIds,
        PINV.DISPENSE_DISPENSED,
        ...conceptIds,
        ...requestIds,
        ...activeStatusIds,
        ...NON_RESERVING_LINE_STATUS_IDS,
        ...conceptIds,
      ],
      'all',
    );
    for (const row of rows) {
      const target =
        row.kind === 'DISPENSED' ? balance.dispensed : balance.reserved;
      target.set(row.conceptId, toNumber(row.quantity));
    }
    return balance;
  }

  /**
   * Cuántas veces se pidió cada fármaco de la receta, en **una sola sentencia
   * SQL**: los pedidos vivos y las entregas, contados una vez por pedido.
   *
   * - Un pedido en un estado de `activeStatusIds` cuenta por cada fármaco que
   *   tenga en sus líneas, en cualquier estado de línea: una línea «por
   *   confirmar» o sin stock sigue siendo parte de un pedido vivo.
   * - Una dispensación `DISPENSED` cuenta por cada fármaco del que entregó una
   *   cantidad mayor que cero: en un pedido retirado en parte, lo no entregado
   *   no consume nada. Una revertida no cuenta.
   * - La dispensación de un pedido y el pedido son la misma vez
   *   (`inventory_reservation_id`); una dispensación de mostrador sin pedido
   *   cuenta por sí sola.
   *
   * Un pedido cancelado, rechazado o vencido sin entrega no aparece: libera la
   * receta.
   *
   * @param em - EntityManager de la transacción del alta.
   * @param requestIds - Ítems de la receta (y los originales que reemplazan).
   * @param conceptIds - Fármacos (`medication_concept_id`) a contar.
   * @param activeStatusIds - Estados de pedido vivos.
   * @returns Cuántas veces se pidió cada fármaco; uno sin pedidos no aparece.
   */
  async orderedCountByConcept(
    em: EntityManager,
    requestIds: readonly string[],
    conceptIds: readonly string[],
    activeStatusIds: readonly string[] = RESERVING_ORDER_STATUS_IDS,
  ): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (
      requestIds.length === 0 ||
      conceptIds.length === 0 ||
      activeStatusIds.length === 0
    ) {
      return counts;
    }
    const list = (values: readonly string[]): string =>
      values.map(() => '?').join(', ');
    const rows: PrescriptionOrderedRow[] = await em.getConnection().execute(
      `SELECT movement.concept_id AS "conceptId",
              COUNT(DISTINCT movement.source_id)::text AS "times"
         FROM (
           SELECT product.medication_concept_id AS concept_id,
                  COALESCE(dispensation.inventory_reservation_id, dispensation.id) AS source_id
             FROM pharmacy_inventory.medication_dispensation_lines line
             JOIN pharmacy_inventory.medication_dispensations dispensation
               ON dispensation.id = line.medication_dispensation_id
             JOIN pharmacy.pharmacy_products product
               ON product.id = line.pharmacy_product_id
            WHERE dispensation.medication_request_id IN (${list(requestIds)})
              AND dispensation.dispensation_status_concept_id = ?
              AND line.dispensed_quantity > 0
              AND product.medication_concept_id IN (${list(conceptIds)})
           UNION ALL
           SELECT product.medication_concept_id AS concept_id,
                  reservation.id AS source_id
             FROM pharmacy_inventory.inventory_reservation_lines line
             JOIN pharmacy_inventory.inventory_reservations reservation
               ON reservation.id = line.inventory_reservation_id
             JOIN pharmacy.pharmacy_products product
               ON product.id = line.pharmacy_product_id
            WHERE reservation.medication_request_id IN (${list(requestIds)})
              AND reservation.reservation_status_concept_id IN (${list(activeStatusIds)})
              AND product.medication_concept_id IN (${list(conceptIds)})
         ) movement
        GROUP BY movement.concept_id`,
      [
        ...requestIds,
        PINV.DISPENSE_DISPENSED,
        ...conceptIds,
        ...requestIds,
        ...activeStatusIds,
        ...conceptIds,
      ],
      'all',
    );
    for (const row of rows) counts.set(row.conceptId, toNumber(row.times));
    return counts;
  }

  /**
   * Lo entregado por fármaco. Envoltorio de {@link balanceByConcept}: quien
   * necesite entregado **y** reservado juntos usa esa, para leerlos en la
   * misma foto.
   */
  async dispensedByConcept(
    em: EntityManager,
    requestIds: readonly string[],
    conceptIds: readonly string[],
  ): Promise<Map<string, number>> {
    return (await this.balanceByConcept(em, requestIds, conceptIds)).dispensed;
  }

  /**
   * Lo reservado en pedidos vivos por fármaco. Envoltorio de
   * {@link balanceByConcept}: quien necesite entregado **y** reservado juntos
   * usa esa, para leerlos en la misma foto.
   */
  async reservedByConcept(
    em: EntityManager,
    requestIds: readonly string[],
    conceptIds: readonly string[],
    activeStatusIds: readonly string[] = RESERVING_ORDER_STATUS_IDS,
  ): Promise<Map<string, number>> {
    return (
      await this.balanceByConcept(em, requestIds, conceptIds, activeStatusIds)
    ).reserved;
  }
}

/** Una fila de {@link PrescriptionBalanceRepository.balanceByConcept}. */
interface PrescriptionBalanceRow {
  readonly conceptId: string;
  readonly kind: 'DISPENSED' | 'RESERVED';
  readonly quantity: string | null;
}

/** Una fila de {@link PrescriptionBalanceRepository.orderedCountByConcept}. */
interface PrescriptionOrderedRow {
  readonly conceptId: string;
  readonly times: string | null;
}

/** `numeric` de Postgres (texto) a número; nulo o no numérico cuenta 0. */
function toNumber(value: string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}
