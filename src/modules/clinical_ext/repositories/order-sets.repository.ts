import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { OrderSets, OrderSetItems } from '../entities';
import { createdBy } from '../../../common';

/** Datos para crear un order set (plantilla de órdenes). */
export interface CreateOrderSetData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Identificador asociado a specialty concept.
   */
  specialtyConceptId?: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Valor de description mantenido por la instancia.
   */
  description?: string;
  /**
   * Identificador asociado a condition concept.
   */
  conditionConceptId?: string;
  /**
   * Valor de version mantenido por la instancia.
   */
  version: number;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Datos para un ítem de order set. */
export interface CreateOrderSetItemData {
  /**
   * Identificador asociado a order set.
   */
  orderSetId: string;
  /**
   * Identificador asociado a item type concept.
   */
  itemTypeConceptId: string;
  /**
   * Identificador asociado a code concept.
   */
  codeConceptId: string;
  /**
   * Valor de default dose text mantenido por la instancia.
   */
  defaultDoseText?: string;
  /**
   * Identificador asociado a default route concept.
   */
  defaultRouteConceptId?: string;
  /**
   * Valor de default frequency text mantenido por la instancia.
   */
  defaultFrequencyText?: string;
  /**
   * Valor de is selected default mantenido por la instancia.
   */
  isSelectedDefault?: boolean;
  /**
   * Valor de ordinal mantenido por la instancia.
   */
  ordinal?: number;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `clinical_ext.order_sets` y `order_set_items`. */
@Injectable()
export class OrderSetsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<OrderSets | null>`.
   */
  findById(em: EntityManager, id: string): Promise<OrderSets | null> {
    return em.findOne(OrderSets, { id });
  }

  /**
   * Obtiene find by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find by code conforme al contrato `Promise<OrderSets | null>`.
   */
  findByCode(em: EntityManager, code: string): Promise<OrderSets | null> {
    return em.findOne(OrderSets, { code });
  }

  /**
   * Ejecuta la operación items by set.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param orderSetId - Identificador de order set.
   * @returns Resultado de items by set conforme al contrato `Promise<OrderSetItems[]>`.
   */
  itemsBySet(em: EntityManager, orderSetId: string): Promise<OrderSetItems[]> {
    return em.find(
      OrderSetItems,
      { orderSetId },
      { orderBy: { ordinal: 'asc' } },
    );
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `OrderSets`.
   */
  create(em: EntityManager, data: CreateOrderSetData): OrderSets {
    return em.create(
      OrderSets,
      {
        tenantId: data.tenantId,
        specialtyConceptId: data.specialtyConceptId,
        code: data.code,
        name: data.name,
        description: data.description,
        conditionConceptId: data.conditionConceptId,
        version: data.version,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create item.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create item conforme al contrato `OrderSetItems`.
   */
  createItem(em: EntityManager, data: CreateOrderSetItemData): OrderSetItems {
    return em.create(
      OrderSetItems,
      {
        orderSetId: data.orderSetId,
        itemTypeConceptId: data.itemTypeConceptId,
        codeConceptId: data.codeConceptId,
        defaultDoseText: data.defaultDoseText,
        defaultRouteConceptId: data.defaultRouteConceptId,
        defaultFrequencyText: data.defaultFrequencyText,
        isSelectedDefault: data.isSelectedDefault ?? false,
        ordinal: data.ordinal,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
