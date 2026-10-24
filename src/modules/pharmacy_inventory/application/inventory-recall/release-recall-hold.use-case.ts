import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
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
  ReleaseRecallHoldDto,
  StatusResultDto,
} from '../../presentation/dto';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import {
  numericQuantity,
  recomputeAvailableQuantity,
} from '../../domain/counting/stock-quantity';

/** Libera un recall activo y reintegra o da de baja el stock en cuarentena. */
@Injectable()
export class ReleaseRecallHoldUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly holds: RecallHoldsRepository,
    private readonly lots: LotsRepository,
    private readonly stock: StockPositionsRepository,
    private readonly ledger: LedgerRepository,
    private readonly logger: PinoLogger,
  ) {}

  execute(
    id: string,
    dto: ReleaseRecallHoldDto,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    this.logger.info(
      { operation: 'pharmacy_inventory.recall.release', holdId: id },
      'Releasing recall hold',
    );
    return this.em.transactional(async (tx) => {
      const hold = await this.holds.findById(tx, id);
      if (!hold) {
        throw new ResourceNotFoundException('Hold de recall no encontrado', {
          holdId: id,
        });
      }
      if (hold.holdStatusConceptId !== PINV.HOLD_ACTIVE) {
        throw new PreconditionFailedException('El hold no está activo', {
          holdId: id,
        });
      }

      hold.holdStatusConceptId = PINV.HOLD_RELEASED;
      hold.releasedAt = new Date();
      touch(hold, actor.id);

      const writeOff = dto.writeOff === true;
      if (hold.inventoryLotId) {
        const lot = await this.lots.findById(tx, hold.inventoryLotId);
        if (lot) {
          lot.recallStatusConceptId = PINV.LOT_RECALL_CLEARED;
          lot.quarantineStatusConceptId = PINV.LOT_QUARANTINE_RELEASED;
          touch(lot, actor.id);

          // La cuarentena puede alcanzar posiciones del mismo lote en varias sedes.
          const positions = await this.stock.findByLot(tx, hold.inventoryLotId);
          for (const position of positions) {
            const quarantined = numericQuantity(position.quarantineQuantity);
            if (quarantined === 0) continue;
            const sequence = await this.ledger.nextSequence(
              tx,
              position.inventoryLocationId,
            );
            this.ledger.append(tx, {
              pharmacyId: position.inventoryLocationId,
              pharmacySiteId: position.inventoryLocationId,
              inventoryLocationId: position.inventoryLocationId,
              pharmacyProductId: position.pharmacyProductId,
              inventoryLotId: position.inventoryLotId,
              ledgerSequence: sequence,
              movementTypeConceptId: writeOff
                ? PINV.MV_WRITE_OFF
                : PINV.MV_QUARANTINE_RELEASE,
              quantityDelta: writeOff ? String(-quarantined) : '0',
              quarantineDelta: String(-quarantined),
              sourceId: hold.id,
              recordedByUserId: actor.id,
            });
            position.quarantineQuantity = '0';
            if (writeOff) {
              position.onHandQuantity = String(
                numericQuantity(position.onHandQuantity) - quarantined,
              );
            }
            position.availableQuantity = recomputeAvailableQuantity(
              position.onHandQuantity,
              position.reservedQuantity,
              position.quarantineQuantity,
            );
            position.lastLedgerSequence = sequence;
            position.updatedAt = new Date();
          }
        }
      }
      await tx.flush();
      return { id: hold.id, status: writeOff ? 'WRITTEN_OFF' : 'RELEASED' };
    });
  }
}
