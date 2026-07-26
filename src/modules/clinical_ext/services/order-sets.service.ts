import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { OrderSetsRepository } from '../repositories';
import {
  CreateOrderSetDto,
  ApplyOrderSetDto,
  OrderSetResponseDto,
  ApplyOrderSetResponseDto,
} from '../dto';
import { CEXT } from '../clinical_ext.concepts';

/**
 * Plantillas de órdenes (order sets): creación de la plantilla con sus ítems y
 * aplicación con fan-out (UC-18-06). La aplicación deriva una orden por ítem
 * seleccionado; el alta de las `clinical.service_requests` resultantes pertenece
 * al módulo clínico, por lo que aquí se devuelve el plan derivado de forma atómica.
 */
@Injectable()
export class OrderSetsService {
  constructor(
    private readonly em: EntityManager,
    private readonly orderSetsRepo: OrderSetsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OrderSetsService.name);
  }

  /** Crea una plantilla de órdenes con sus ítems (precondición de UC-18-06). */
  async create(dto: CreateOrderSetDto, actor: AuthenticatedUser): Promise<OrderSetResponseDto> {
    this.logger.info({ operation: 'clinical_ext.order_set.create', code: dto.code }, 'Creating order set');
    return this.em.transactional(async (tx) => {
      const clash = await this.orderSetsRepo.findByCode(tx, dto.code);
      if (clash) throw new ConflictException('El código de order set ya existe', { code: dto.code });

      const orderSet = this.orderSetsRepo.create(tx, {
        tenantId: dto.tenantId,
        specialtyConceptId: dto.specialtyConceptId,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        version: 1,
        statusConceptId: CEXT.ORDER_SET_ACTIVE,
        actorUserId: actor.id,
      });
      // FK son columnas uuid: persistir el padre antes de los ítems.
      await tx.flush();

      const items = dto.items.map((item, idx) =>
        this.orderSetsRepo.createItem(tx, {
          orderSetId: orderSet.id,
          itemTypeConceptId: item.itemTypeConceptId ?? CEXT.ORDER_ITEM_TYPE_SERVICE,
          codeConceptId: item.codeConceptId,
          defaultDoseText: item.defaultDoseText,
          defaultFrequencyText: item.defaultFrequencyText,
          isSelectedDefault: item.isSelectedDefault ?? true,
          ordinal: item.ordinal ?? idx,
          actorUserId: actor.id,
        }),
      );
      await tx.flush();

      return {
        id: orderSet.id,
        code: orderSet.code,
        version: orderSet.version,
        itemCount: items.length,
        statusConceptId: orderSet.statusConceptId,
      };
    });
  }

  /** UC-18-06: aplica el order set (fan-out de órdenes por ítem seleccionado). */
  async apply(
    orderSetId: string,
    dto: ApplyOrderSetDto,
    actor: AuthenticatedUser,
  ): Promise<ApplyOrderSetResponseDto> {
    this.logger.info(
      { operation: 'clinical_ext.order_set.apply', orderSetId, actorId: actor.id },
      'Applying order set',
    );
    return this.em.transactional(async (tx) => {
      const orderSet = await this.orderSetsRepo.findById(tx, orderSetId);
      if (!orderSet) throw new ResourceNotFoundException('Order set no encontrado', { orderSetId });
      if (orderSet.statusConceptId !== CEXT.ORDER_SET_ACTIVE) {
        throw new PreconditionFailedException('El order set no está activo', { orderSetId });
      }

      const items = await this.orderSetsRepo.itemsBySet(tx, orderSetId);
      const selected = dto.selectedItemIds?.length
        ? items.filter((i) => dto.selectedItemIds!.includes(i.id))
        : items.filter((i) => i.isSelectedDefault);

      if (selected.length === 0) {
        throw new PreconditionFailedException('No hay ítems seleccionados para aplicar', {
          orderSetId,
        });
      }

      return {
        orderSetId,
        appliedOrders: selected.map((i) => ({
          orderSetItemId: i.id,
          codeConceptId: i.codeConceptId,
          doseText: i.defaultDoseText,
          frequencyText: i.defaultFrequencyText,
        })),
        count: selected.length,
      };
    });
  }
}
