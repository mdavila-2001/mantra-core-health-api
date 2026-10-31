import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
// Lectura mínima de los documentos que un vínculo referencia, para contrastar su
// tenant antes de crear el vínculo: las FK sólo demuestran existencia.
import { Encounters } from '../../clinical/entities';
import { Contracts, PurchaseOrders } from '../../erp/entities';

/**
 * Lectura de los documentos de otros dominios que `billing` vincula a una
 * factura (encuentro, orden de compra, contrato). Nunca escribe en ellos.
 */
@Injectable()
export class BillingLinkTargetsRepository {
  /**
   * Carga el encuentro que una factura declara como origen.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Encuentro recibido del cliente.
   * @returns El encuentro, o `null` si no existe.
   */
  findEncounter(em: EntityManager, id: string): Promise<Encounters | null> {
    return em.findOne(Encounters, { id });
  }

  /**
   * Carga la orden de compra que una factura de proveedor declara.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Orden de compra recibida del cliente.
   * @returns La orden, o `null` si no existe.
   */
  findPurchaseOrder(
    em: EntityManager,
    id: string,
  ): Promise<PurchaseOrders | null> {
    return em.findOne(PurchaseOrders, { id });
  }

  /**
   * Carga el contrato que una factura de proveedor declara.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Contrato recibido del cliente.
   * @returns El contrato, o `null` si no existe.
   */
  findContract(em: EntityManager, id: string): Promise<Contracts | null> {
    return em.findOne(Contracts, { id });
  }
}
