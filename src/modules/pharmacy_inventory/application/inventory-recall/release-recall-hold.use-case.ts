import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
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
import type { InventoryStockPositions } from '../../entities';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import {
  numericQuantity,
  recomputeAvailableQuantity,
} from '../../domain/counting/stock-quantity';
import { PharmacyInventoryScopePolicy } from '../scope/pharmacy-inventory-scope.policy';

/** Libera un recall activo y reintegra o da de baja el stock en cuarentena. */
@Injectable()
export class ReleaseRecallHoldUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly holds: RecallHoldsRepository,
    private readonly lots: LotsRepository,
    private readonly stock: StockPositionsRepository,
    private readonly ledger: LedgerRepository,
    private readonly scope: PharmacyInventoryScopePolicy,
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
      if (!hold) throw this.scope.notAvailable();
      // El hold sólo guarda producto y lote: la farmacia es la del producto, y
      // debe ser una que el actor administra.
      const pharmacy = await this.scope.requireManagedProduct(
        tx,
        hold.pharmacyProductId,
        actor,
      );
      if (hold.holdStatusConceptId !== PINV.HOLD_ACTIVE) {
        throw new PreconditionFailedException('El hold no está activo', {
          holdId: id,
        });
      }

      // Se valida toda la cadena guardada antes de mutar nada: el lote es del
      // producto retenido y cada posición liberada es de ese producto y de una
      // ubicación de la farmacia. Si algo no cierra, no se escribe ningún asiento.
      const writeOff = dto.writeOff === true;
      const lot = hold.inventoryLotId
        ? await this.lots.findById(tx, hold.inventoryLotId)
        : null;
      if (lot && lot.pharmacyProductId !== hold.pharmacyProductId) {
        throw this.scope.inconsistent('hold-lot');
      }
      // La cuarentena puede alcanzar posiciones del mismo lote en varias sedes.
      const releases: {
        position: InventoryStockPositions;
        siteId: string;
        quarantined: number;
      }[] = [];
      if (lot && hold.inventoryLotId) {
        const positions = await this.stock.findByLot(tx, hold.inventoryLotId);
        for (const position of positions) {
          if (position.pharmacyProductId !== hold.pharmacyProductId) {
            throw this.scope.inconsistent('position-product');
          }
          const location = await this.scope.resolveStoredLocation(
            tx,
            pharmacy,
            position.inventoryLocationId,
          );
          const quarantined = numericQuantity(position.quarantineQuantity);
          if (quarantined === 0) continue;
          releases.push({ position, siteId: location.siteId, quarantined });
        }
      }

      hold.holdStatusConceptId = PINV.HOLD_RELEASED;
      hold.releasedAt = new Date();
      touch(hold, actor.id);

      if (lot) {
        lot.recallStatusConceptId = PINV.LOT_RECALL_CLEARED;
        lot.quarantineStatusConceptId = PINV.LOT_QUARANTINE_RELEASED;
        touch(lot, actor.id);
      }
      for (const { position, siteId, quarantined } of releases) {
        const sequence = await this.ledger.nextSequence(
          tx,
          pharmacy.pharmacyId,
        );
        this.ledger.append(tx, {
          pharmacyId: pharmacy.pharmacyId,
          pharmacySiteId: siteId,
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
      await tx.flush();
      return { id: hold.id, status: writeOff ? 'WRITTEN_OFF' : 'RELEASED' };
    });
  }
}
