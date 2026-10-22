import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../../common';
import {
  LedgerRepository,
  LotsRepository,
  RecallHoldsRepository,
  StockPositionsRepository,
} from '../../infrastructure/repositories';
import type {
  CreateRecallHoldDto,
  IdResponseDto,
} from '../../presentation/dto';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import {
  numericQuantity,
  recomputeAvailableQuantity,
} from '../../domain/counting/stock-quantity';

/** Pone en cuarentena el stock de un lote alcanzado por recall. */
@Injectable()
export class CreateRecallHoldUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly holds: RecallHoldsRepository,
    private readonly lots: LotsRepository,
    private readonly stock: StockPositionsRepository,
    private readonly ledger: LedgerRepository,
    private readonly logger: PinoLogger,
  ) {}

  execute(
    dto: CreateRecallHoldDto,
    actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    this.logger.info(
      {
        operation: 'pharmacy_inventory.recall.create',
        lotId: dto.inventoryLotId,
        ref: dto.recallReference,
      },
      'Applying recall hold',
    );
    return this.em.transactional(async (tx) => {
      const lot = await this.lots.findById(tx, dto.inventoryLotId);
      if (!lot) {
        throw new ResourceNotFoundException('Lote no encontrado', {
          lotId: dto.inventoryLotId,
        });
      }

      const hold = this.holds.create(tx, {
        pharmacyProductId: dto.pharmacyProductId,
        inventoryLotId: dto.inventoryLotId,
        recallReference: dto.recallReference,
        recallClassConceptId: PINV.RECALL_CLASS_I,
        holdStatusConceptId: PINV.HOLD_ACTIVE,
        initiatedAt: new Date(),
        sourceAuthorityTenantId: dto.sourceAuthorityTenantId,
        actorUserId: actor.id,
      });
      await tx.flush();

      lot.recallStatusConceptId = PINV.LOT_RECALLED;
      lot.quarantineStatusConceptId = PINV.LOT_QUARANTINED;
      touch(lot, actor.id);

      const position = await this.stock.findByKey(tx, {
        inventoryLocationId: dto.inventoryLocationId,
        pharmacyProductId: dto.pharmacyProductId,
        inventoryLotId: dto.inventoryLotId,
      });
      const onHand = position ? numericQuantity(position.onHandQuantity) : 0;
      const sequence = await this.ledger.nextSequence(tx, dto.pharmacyId);
      this.ledger.append(tx, {
        pharmacyId: dto.pharmacyId,
        pharmacySiteId: dto.pharmacySiteId,
        inventoryLocationId: dto.inventoryLocationId,
        pharmacyProductId: dto.pharmacyProductId,
        inventoryLotId: dto.inventoryLotId,
        ledgerSequence: sequence,
        movementTypeConceptId: PINV.MV_QUARANTINE_HOLD,
        quantityDelta: '0',
        quarantineDelta: String(onHand),
        sourceId: hold.id,
        recordedByUserId: actor.id,
      });
      if (position) {
        position.quarantineQuantity = String(
          numericQuantity(position.quarantineQuantity) + onHand,
        );
        position.availableQuantity = recomputeAvailableQuantity(
          position.onHandQuantity,
          position.reservedQuantity,
          position.quarantineQuantity,
        );
        position.lastLedgerSequence = sequence;
        position.updatedAt = new Date();
      }
      await tx.flush();
      return { id: hold.id };
    });
  }
}
