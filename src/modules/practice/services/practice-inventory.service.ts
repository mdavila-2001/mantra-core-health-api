import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { PRAC } from '../practice.concepts';
import {
  InventoryItemsRepository,
  InventoryMovementsRepository,
} from '../repositories';
import {
  CreateInventoryItemDto,
  CreateMovementDto,
  InventoryItemResponseDto,
  MovementResponseDto,
  type MovementDirection,
} from '../dto';

/** Mapea el sentido del movimiento a su concepto de tipo. */
const MOVEMENT_TYPE_BY_DIRECTION: Record<MovementDirection, string> = {
  IN: PRAC.MOVEMENT_IN,
  OUT: PRAC.MOVEMENT_OUT,
  ADJUST: PRAC.MOVEMENT_ADJUST,
};

/**
 * Inventario de práctica: alta de insumos (UC-14-10) y registro de movimientos de
 * stock (UC-14-11). El movimiento actualiza `quantity_on_hand` del insumo en la
 * misma transacción; las salidas exigen stock suficiente (invariante >= 0).
 */
@Injectable()
export class PracticeInventoryService {
  constructor(
    private readonly em: EntityManager,
    private readonly itemsRepo: InventoryItemsRepository,
    private readonly movementsRepo: InventoryMovementsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PracticeInventoryService.name);
  }

  /** UC-14-10: da de alta un insumo con stock inicial en cero. */
  async createItem(
    practiceId: string,
    dto: CreateInventoryItemDto,
    actor: AuthenticatedUser,
  ): Promise<InventoryItemResponseDto> {
    this.logger.info(
      { operation: 'practice.inventory.item.create', practiceId },
      'Creating inventory item',
    );
    return this.em.transactional(async (tx) => {
      const item = this.itemsRepo.create(tx, {
        practiceId,
        productConceptId: dto.productConceptId ?? PRAC.PRODUCT_GENERIC,
        name: dto.name,
        lotNumber: dto.lotNumber,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        quantityOnHand: '0',
        unitConceptId: dto.unitConceptId ?? PRAC.UNIT_EACH,
        reorderLevel: dto.reorderLevel,
        statusConceptId: PRAC.INVENTORY_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();
      return {
        id: item.id,
        practiceId: item.practiceId,
        name: item.name,
        quantityOnHand: item.quantityOnHand,
        status: item.statusConceptId,
        createdAt: item.createdAt,
      };
    });
  }

  /** UC-14-11: registra un movimiento y ajusta el stock del insumo. */
  async recordMovement(
    itemId: string,
    dto: CreateMovementDto,
    actor: AuthenticatedUser,
  ): Promise<MovementResponseDto> {
    this.logger.info(
      {
        operation: 'practice.inventory.movement.record',
        itemId,
        direction: dto.direction,
      },
      'Recording inventory movement',
    );
    return this.em.transactional(async (tx) => {
      const item = await this.itemsRepo.findById(tx, itemId);
      if (!item)
        throw new ResourceNotFoundException(
          'Insumo de inventario no encontrado',
          { itemId },
        );
      if (item.statusConceptId !== PRAC.INVENTORY_ACTIVE) {
        throw new PreconditionFailedException('El insumo no está activo', {
          itemId,
        });
      }

      const current = Number(item.quantityOnHand);
      const delta = dto.direction === 'OUT' ? -dto.quantity : dto.quantity;
      const next = current + delta;
      if (next < 0) {
        throw new PreconditionFailedException(
          'Stock insuficiente para la salida',
          {
            itemId,
            quantityOnHand: item.quantityOnHand,
            requested: dto.quantity,
          },
        );
      }

      const now = new Date();
      const movement = this.movementsRepo.create(tx, {
        inventoryItemId: itemId,
        movementTypeConceptId: MOVEMENT_TYPE_BY_DIRECTION[dto.direction],
        quantity: String(dto.quantity),
        relatedResourceType: dto.relatedResourceType,
        relatedResourceId: dto.relatedResourceId,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : now,
        recordedAt: now,
        recordedByUserId: actor.id,
      });

      item.quantityOnHand = String(next);
      touch(item, actor.id);

      await tx.flush();

      if (
        item.reorderLevel !== undefined &&
        item.reorderLevel !== null &&
        next < Number(item.reorderLevel)
      ) {
        this.logger.warn(
          {
            operation: 'practice.inventory.lowstock',
            itemId,
            quantityOnHand: item.quantityOnHand,
          },
          'Inventory item crossed reorder level',
        );
      }

      return {
        id: movement.id,
        inventoryItemId: movement.inventoryItemId,
        quantityOnHand: item.quantityOnHand,
        recordedAt: movement.recordedAt,
      };
    });
  }
}
