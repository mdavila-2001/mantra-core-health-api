import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { createdBy } from '../../../common';
import { PharmacyOrderSubstitutions } from '../entities';

/** Datos de una propuesta de sustitución (cierre de farmacia, v4.2.1). */
export interface CreateSubstitutionData {
  /**
   * Pedido al que pertenece la propuesta.
   */
  inventoryReservationId: string;
  /**
   * La línea física ancla del renglón (su primera porción): la identidad de
   * negocio es `(pedido, producto original)` — el contrato agrupa porciones.
   */
  inventoryReservationLineId: string;
  /**
   * Producto recetado/pedido.
   */
  originalPharmacyProductId: string;
  /**
   * Producto que la farmacia propone en su lugar (mismo concepto).
   */
  proposedPharmacyProductId: string;
  /**
   * Precio congelado del original al proponer, si había uno publicado.
   */
  originalUnitPriceAmount?: string;
  /**
   * Precio congelado del propuesto: la oferta que el paciente decide.
   */
  proposedUnitPriceAmount?: string;
  /**
   * Moneda de la oferta, copiada de la lista de precios — jamás acuñada.
   */
  currencyConceptId?: string;
  /**
   * Estado inicial (`PINV_SUBSTITUTION_PROPUESTA`).
   */
  statusConceptId: string;
  /**
   * Quién propone (el mostrador).
   */
  actorUserId?: string;
}

/**
 * La bitácora de propuestas de sustitución del pedido (v4.2.1).
 *
 * Es historia, no un campo mutable: aceptar y preferir-el-original DEJAN la
 * fila viva con su `decided_at`; por eso no hay único por línea — una línea
 * cuya propuesta se rechazó puede recibir otra en el futuro.
 */
@Injectable()
export class PharmacyOrderSubstitutionsRepository {
  /** Las propuestas de los pedidos dados, más nuevas primero. */
  findByReservationIds(
    em: EntityManager,
    reservationIds: readonly string[],
  ): Promise<PharmacyOrderSubstitutions[]> {
    if (reservationIds.length === 0) return Promise.resolve([]);
    return em.find(
      PharmacyOrderSubstitutions,
      { inventoryReservationId: { $in: [...reservationIds] } },
      { orderBy: { createdAt: 'DESC' } },
    );
  }

  /** Crea la propuesta; la transacción del caso de uso la persiste. */
  create(
    em: EntityManager,
    data: CreateSubstitutionData,
  ): PharmacyOrderSubstitutions {
    return em.create(
      PharmacyOrderSubstitutions,
      {
        inventoryReservationId: data.inventoryReservationId,
        inventoryReservationLineId: data.inventoryReservationLineId,
        originalPharmacyProductId: data.originalPharmacyProductId,
        proposedPharmacyProductId: data.proposedPharmacyProductId,
        originalUnitPriceAmount: data.originalUnitPriceAmount,
        proposedUnitPriceAmount: data.proposedUnitPriceAmount,
        currencyConceptId: data.currencyConceptId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
