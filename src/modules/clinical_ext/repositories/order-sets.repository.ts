import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { OrderSets, OrderSetItems } from '../entities';
import { createdBy } from '../../../common';

/** Datos para crear un order set (plantilla de órdenes). */
export interface CreateOrderSetData {
  tenantId?: string;
  specialtyConceptId?: string;
  code: string;
  name: string;
  description?: string;
  conditionConceptId?: string;
  version: number;
  statusConceptId: string;
  actorUserId?: string;
}

/** Datos para un ítem de order set. */
export interface CreateOrderSetItemData {
  orderSetId: string;
  itemTypeConceptId: string;
  codeConceptId: string;
  defaultDoseText?: string;
  defaultRouteConceptId?: string;
  defaultFrequencyText?: string;
  isSelectedDefault?: boolean;
  ordinal?: number;
  actorUserId?: string;
}

/** Acceso a datos de `clinical_ext.order_sets` y `order_set_items`. */
@Injectable()
export class OrderSetsRepository {
  findById(em: EntityManager, id: string): Promise<OrderSets | null> {
    return em.findOne(OrderSets, { id });
  }

  findByCode(em: EntityManager, code: string): Promise<OrderSets | null> {
    return em.findOne(OrderSets, { code });
  }

  itemsBySet(em: EntityManager, orderSetId: string): Promise<OrderSetItems[]> {
    return em.find(OrderSetItems, { orderSetId }, { orderBy: { ordinal: 'asc' } });
  }

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
