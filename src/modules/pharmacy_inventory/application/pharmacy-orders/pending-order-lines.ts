import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  PreconditionFailedException,
  touch,
  type AuthenticatedUser,
} from '../../../../common';
import type {
  InventoryReservations,
  InventoryReservationLines,
  InventoryStockPositions,
} from '../../entities';
import {
  InventoryReadRepository,
  type CreateReservationLineData,
  type ReservationsRepository,
} from '../../infrastructure/repositories';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import { PharmacyInventoryErrorReason } from '../../pharmacy_inventory.error-reasons';
import type { ConfirmOrderAdjustmentDto } from '../../presentation/dto';
import { SiteStockWriter } from '../site-availability/site-stock-writer';

/**
 * Las líneas «por confirmar» del pedido de farmacia.
 *
 * ## Qué es una línea «por confirmar»
 *
 * La regla de disponibilidad por sede (`domain/site-product-availability.ts`)
 * ofrece un producto sin posición en la sede por lo que declara el catálogo:
 * sin conteo, o con conteo mayor que cero. Ese producto no tiene unidades en
 * el libro, así que el pedido no tiene contra qué reservarlo, y copiar el
 * conteo del catálogo a la sede no vale: es de toda la farmacia, no de esa
 * sede.
 *
 * Por eso la línea entra `PINV_RES_LINE_PENDING_CONFIRMATION`, con
 * `reserved_quantity = 0` y sin asiento: no reserva ni crea stock. Al
 * confirmar, la farmacia dice si lo tiene y con cuánto, y recién ahí se
 * escribe la posición por {@link SiteStockWriter} y se reserva con la misma
 * contabilidad de una línea con stock. Si dice que no, la línea queda sin
 * stock.
 *
 * Un producto que ya tiene posición en la sede lo gobierna el libro, como
 * siempre: su línea se reserva o queda sin stock al crear el pedido.
 */

/** Lo que la línea necesita saber del producto para decidir cómo entra. */
export interface DeclaredProductStock {
  /** Conteo del catálogo (`stock_quantity`); `null`/ausente es «hay, sin conteo». */
  readonly stockQuantity?: number | null;
}

/**
 * ¿La línea entra «por confirmar»? Sí cuando el producto no tiene posición en
 * ninguna ubicación activa de la sede y el catálogo lo declara disponible: la
 * misma condición con que la regla por sede lo ofrece por lo declarado.
 *
 * @param product - El producto, con su conteo del catálogo.
 * @param sitePositions - Sus posiciones en las ubicaciones activas de la sede.
 */
export function entersPendingConfirmation(
  product: DeclaredProductStock | undefined,
  sitePositions: readonly InventoryStockPositions[],
): boolean {
  if (sitePositions.length > 0) return false;
  const declared = product?.stockQuantity;
  return declared === null || declared === undefined || declared > 0;
}

/**
 * El 422 de un pedido en el que ninguna línea tiene stock real: todas son «No
 * lo tengo» o sin unidades. Corre dentro de la transacción del alta, así que
 * no queda ni el pedido, ni sus líneas, ni sus asientos, ni el evento.
 */
export function noStockForAnyLine(
  siteId: string,
  productIds: readonly string[],
): PreconditionFailedException {
  const reason = PharmacyInventoryErrorReason.PRODUCT_OUT_OF_STOCK;
  return new PreconditionFailedException(
    'La farmacia no tiene en esta sucursal ninguno de los productos del pedido',
    { reason, siteId, productIds: [...productIds] },
    reason,
  );
}

/** Los datos de una línea «por confirmar» del alta del pedido. */
export function pendingLineData(
  reservation: InventoryReservations,
  productId: string,
  quantity: number,
  frozen: { unitPriceAmount?: string; currencyConceptId?: string } = {},
  actorUserId?: string,
): CreateReservationLineData {
  return {
    inventoryReservationId: reservation.id,
    pharmacyProductId: productId,
    requestedQuantity: String(quantity),
    reservedQuantity: '0',
    statusConceptId: PINV.RES_LINE_PENDING_CONFIRMATION,
    unitPriceAmount: frozen.unitPriceAmount,
    currencyConceptId: frozen.currencyConceptId,
    actorUserId,
  };
}

/**
 * Escribe las líneas de una reserva: la primera reusa la línea «por
 * confirmar» que se está resolviendo (si hay), las demás se crean. Así la
 * línea confirmada queda con la misma forma que una que nació con stock, sin
 * borrar filas ni dejar una línea vieja que sume dos veces lo pedido.
 */
export function reservationLineWriter(
  repo: Pick<ReservationsRepository, 'createLine'>,
  placeholder?: InventoryReservationLines,
): (tx: EntityManager, data: CreateReservationLineData) => void {
  let reusable = placeholder;
  return (tx, data) => {
    if (!reusable) {
      repo.createLine(tx, data);
      return;
    }
    const line = reusable;
    reusable = undefined;
    line.inventoryLotId = data.inventoryLotId;
    line.inventoryLocationId = data.inventoryLocationId;
    line.requestedQuantity = data.requestedQuantity;
    line.reservedQuantity = data.reservedQuantity;
    line.statusConceptId = data.statusConceptId;
    line.unitPriceAmount = data.unitPriceAmount;
    line.currencyConceptId = data.currencyConceptId;
    touch(line, data.actorUserId);
  };
}

/** Una línea «por confirmar» que la farmacia confirmó y ya se puede reservar. */
export interface PendingLineToReserve {
  /** La línea «por confirmar»; la reserva la reusa como primera porción. */
  readonly line: InventoryReservationLines;
  /** Las posiciones del producto en la sede, ya escritas. */
  readonly positions: readonly InventoryStockPositions[];
}

/** Lo que dejó la confirmación sobre las líneas «por confirmar». */
export interface PendingLinesResolution {
  /** Las que se reservan ahora, contra las posiciones dadas. */
  readonly toReserve: readonly PendingLineToReserve[];
  /** Cuántas quedaron sin stock por decisión de la farmacia. */
  readonly unavailable: number;
}

/** 422 tipificado para un ajuste que no cuadra con una línea por confirmar. */
function notPending(
  message: string,
  details: Record<string, unknown>,
): PreconditionFailedException {
  const reason =
    PharmacyInventoryErrorReason.ORDER_LINE_NOT_PENDING_CONFIRMATION;
  return new PreconditionFailedException(
    message,
    { reason, ...details },
    reason,
  );
}

/**
 * La confirmación de las líneas «por confirmar» de un pedido (D-5).
 *
 * Corre dentro de la transacción de la confirmación, con el pedido ya
 * bloqueado, y **antes** que cualquier liberación del pedido: el escritor
 * toma el candado de la sede y después el del libro, el mismo orden que el
 * «Lo tengo» de una sede. Así la confirmación no agrega un cruce nuevo de
 * candados con la sincronización.
 */
@Injectable()
export class PendingOrderLines {
  constructor(
    private readonly inventoryRead: InventoryReadRepository,
    private readonly writer: SiteStockWriter,
  ) {}

  /**
   * Resuelve las líneas «por confirmar» según los ajustes de la farmacia:
   *
   * - **Sin ajuste**: la farmacia lo tiene, con lo pedido como cantidad.
   * - **`CONFIRMAR_STOCK` con `quantity`**: lo tiene, con esa cantidad para
   *   vender en la sede.
   * - **`NO_DISPONIBLE`**: la línea queda sin stock. No se escribe la sede:
   *   la farmacia habló de este pedido, no de su existencia.
   * - **`PROPONER_GENERICO`**: la farmacia no confirmó el original, que queda
   *   sin stock —sin reservar nada— y la propuesta sigue su camino como la de
   *   cualquier línea sin stock.
   *
   * Lo confirmado se escribe por {@link SiteStockWriter} en una sola
   * escritura (un solo candado de sede) y sólo para los productos que siguen
   * sin posición en la sede: si mientras tanto alguien le escribió una, el
   * libro manda y la línea se reserva contra lo que haya.
   *
   * @returns Las líneas a reservar, con las posiciones del producto en la
   *   sede, y cuántas quedaron sin stock.
   */
  async resolveOnConfirm(
    tx: EntityManager,
    order: InventoryReservations,
    lines: readonly InventoryReservationLines[],
    adjustments: readonly ConfirmOrderAdjustmentDto[],
    site: { readonly tenantId: string },
    actor: AuthenticatedUser,
  ): Promise<PendingLinesResolution> {
    const pending = lines.filter(
      (line) => line.statusConceptId === PINV.RES_LINE_PENDING_CONFIRMATION,
    );
    const pendingProducts = new Set(
      pending.map((line) => line.pharmacyProductId),
    );
    const adjustmentOf = new Map(
      adjustments.map((adjustment) => [adjustment.productId, adjustment]),
    );
    for (const adjustment of adjustments) {
      if (adjustment.decision !== 'CONFIRMAR_STOCK') continue;
      if (!pendingProducts.has(adjustment.productId)) {
        throw notPending(
          'Solo se confirma la existencia de una línea por confirmar',
          { orderId: order.id, productId: adjustment.productId },
        );
      }
      if (adjustment.quantity === undefined) {
        throw notPending(
          'CONFIRMAR_STOCK exige la cantidad que la sucursal tiene (quantity)',
          { orderId: order.id, productId: adjustment.productId },
        );
      }
    }

    let unavailable = 0;
    const confirmed: { line: InventoryReservationLines; quantity: number }[] =
      [];
    for (const line of pending) {
      const adjustment = adjustmentOf.get(line.pharmacyProductId);
      if (
        adjustment?.decision === 'NO_DISPONIBLE' ||
        adjustment?.decision === 'PROPONER_GENERICO'
      ) {
        line.statusConceptId = PINV.RES_LINE_OUT_OF_STOCK;
        line.reservedQuantity = '0';
        touch(line, actor.id);
        unavailable += 1;
        continue;
      }
      confirmed.push({
        line,
        quantity: adjustment?.quantity ?? Number(line.requestedQuantity),
      });
    }
    if (confirmed.length === 0) return { toReserve: [], unavailable };

    const productIds = confirmed.map(({ line }) => line.pharmacyProductId);
    const before = await this.sitePositions(tx, order, productIds);
    const targets = confirmed
      .filter(({ line }) => !before.has(line.pharmacyProductId))
      .map(({ line, quantity }) => ({
        productId: line.pharmacyProductId,
        availableQuantity: quantity,
      }));
    if (targets.length > 0) {
      await this.writer.write(
        tx,
        {
          tenantId: site.tenantId,
          pharmacyId: order.pharmacyId,
          siteId: order.pharmacySiteId,
        },
        targets,
        {
          movementTypeConceptId: PINV.MV_COUNT_ADJUSTMENT,
          sourceId: order.id,
          actorUserId: actor.id,
        },
      );
    }
    const after =
      targets.length > 0
        ? await this.sitePositions(tx, order, productIds)
        : before;
    return {
      toReserve: confirmed.map(({ line }) => ({
        line,
        positions: after.get(line.pharmacyProductId) ?? [],
      })),
      unavailable,
    };
  }

  /** Las posiciones de unos productos en las ubicaciones activas de la sede. */
  private async sitePositions(
    tx: EntityManager,
    order: InventoryReservations,
    productIds: readonly string[],
  ): Promise<Map<string, InventoryStockPositions[]>> {
    const locations = await this.inventoryRead.findActiveLocationsBySites(tx, [
      order.pharmacySiteId,
    ]);
    const positions = await this.inventoryRead.findStockPositions(
      tx,
      locations.map((location) => location.id),
      productIds,
    );
    const byProduct = new Map<string, InventoryStockPositions[]>();
    for (const position of positions) {
      const list = byProduct.get(position.pharmacyProductId) ?? [];
      list.push(position);
      byProduct.set(position.pharmacyProductId, list);
    }
    return byProduct;
  }
}
