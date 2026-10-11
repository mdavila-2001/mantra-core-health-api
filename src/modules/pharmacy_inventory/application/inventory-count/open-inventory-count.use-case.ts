import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../../common';
import {
  CountSessionsRepository,
  LocationsRepository,
  StockPositionsRepository,
} from '../../infrastructure/repositories';
import type {
  CountSessionResponseDto,
  CreateCountSessionDto,
} from '../../presentation/dto';
import { PINV } from '../../domain/pharmacy_inventory.concepts';

/** Abre una sesión y captura el stock esperado dentro de una transacción. */
@Injectable()
export class OpenInventoryCountUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly countRepo: CountSessionsRepository,
    private readonly locationsRepo: LocationsRepository,
    private readonly stockRepo: StockPositionsRepository,
    private readonly logger: PinoLogger,
  ) {}

  execute(
    pharmacySiteId: string,
    dto: CreateCountSessionDto,
    actor: AuthenticatedUser,
  ): Promise<CountSessionResponseDto> {
    this.logger.info(
      {
        operation: 'pharmacy_inventory.count.open',
        pharmacySiteId,
        location: dto.inventoryLocationId,
      },
      'Opening count session',
    );
    return this.em.transactional(async (tx) => {
      const location = await this.locationsRepo.findById(
        tx,
        dto.inventoryLocationId,
      );
      if (!location) {
        throw new ResourceNotFoundException('Ubicación no encontrada', {
          locationId: dto.inventoryLocationId,
        });
      }
      const openCount = await this.countRepo.countOpenAtLocation(
        tx,
        dto.inventoryLocationId,
        [PINV.COUNT_OPEN, PINV.COUNT_FROZEN, PINV.COUNT_COUNTED],
      );
      if (openCount > 0) {
        throw new ConflictException(
          'Ya existe una sesión de conteo abierta en la ubicación',
          { locationId: dto.inventoryLocationId },
        );
      }

      const session = this.countRepo.create(tx, {
        pharmacySiteId,
        inventoryLocationId: dto.inventoryLocationId,
        countTypeConceptId: PINV.COUNT_TYPE_CYCLE,
        freezeModeConceptId: dto.freeze ? PINV.COUNT_FREEZE_FULL : undefined,
        statusConceptId: dto.freeze ? PINV.COUNT_FROZEN : PINV.COUNT_OPEN,
        startedAt: new Date(),
        actorUserId: actor.id,
      });
      await tx.flush();

      const lineIds: string[] = [];
      for (const item of dto.items) {
        const position = await this.stockRepo.findByKey(tx, {
          inventoryLocationId: dto.inventoryLocationId,
          pharmacyProductId: item.pharmacyProductId,
          inventoryLotId: item.inventoryLotId,
        });
        const expected = position ? position.onHandQuantity : '0';
        const created = this.countRepo.createLine(tx, {
          inventoryCountSessionId: session.id,
          pharmacyProductId: item.pharmacyProductId,
          inventoryLotId: item.inventoryLotId,
          expectedQuantity: expected,
          countedQuantity: '0',
          varianceQuantity: '0',
          actorUserId: actor.id,
        });
        lineIds.push(created.id);
      }
      await tx.flush();
      return { id: session.id, lineIds, adjustments: 0 };
    });
  }
}
