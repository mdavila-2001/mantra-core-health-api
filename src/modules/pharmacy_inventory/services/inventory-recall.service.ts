import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ResourceNotFoundException,
  PreconditionFailedException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  RecallHoldsRepository,
  LotsRepository,
  StockPositionsRepository,
  LedgerRepository,
} from '../repositories';
import { CreateRecallHoldDto, ReleaseRecallHoldDto, IdResponseDto, StatusResultDto } from '../dto';
import { PINV } from '../pharmacy_inventory.concepts';

const num = (v: string | null | undefined): number => (v == null ? 0 : Number(v));
const recompute = (onHand: string, reserved: string, quarantine: string): string =>
  String(num(onHand) - num(reserved) - num(quarantine));

/** Retiro/recall de lote (UC-25-08) y su liberación/reactivación (UC-25-09). */
@Injectable()
export class InventoryRecallService {
  constructor(
    private readonly em: EntityManager,
    private readonly holdsRepo: RecallHoldsRepository,
    private readonly lotsRepo: LotsRepository,
    private readonly stockRepo: StockPositionsRepository,
    private readonly ledgerRepo: LedgerRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(InventoryRecallService.name);
  }

  /** UC-25-08: aplica un hold de recall, poniendo el lote en cuarentena. */
  async createHold(dto: CreateRecallHoldDto, actor: AuthenticatedUser): Promise<IdResponseDto> {
    this.logger.info(
      { operation: 'pharmacy_inventory.recall.create', lotId: dto.inventoryLotId, ref: dto.recallReference },
      'Applying recall hold',
    );
    return this.em.transactional(async (tx) => {
      const lot = await this.lotsRepo.findById(tx, dto.inventoryLotId);
      if (!lot) {
        throw new ResourceNotFoundException('Lote no encontrado', { lotId: dto.inventoryLotId });
      }

      const hold = this.holdsRepo.create(tx, {
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

      const position = await this.stockRepo.findByKey(tx, {
        inventoryLocationId: dto.inventoryLocationId,
        pharmacyProductId: dto.pharmacyProductId,
        inventoryLotId: dto.inventoryLotId,
      });
      const onHand = position ? num(position.onHandQuantity) : 0;
      const sequence = await this.ledgerRepo.nextSequence(tx, dto.pharmacyId);
      this.ledgerRepo.append(tx, {
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
        position.quarantineQuantity = String(num(position.quarantineQuantity) + onHand);
        position.availableQuantity = recompute(
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

  /** UC-25-09: libera el hold; reintegra o da de baja (write-off) el stock. */
  async release(id: string, dto: ReleaseRecallHoldDto, actor: AuthenticatedUser): Promise<StatusResultDto> {
    this.logger.info({ operation: 'pharmacy_inventory.recall.release', holdId: id }, 'Releasing recall hold');
    return this.em.transactional(async (tx) => {
      const hold = await this.holdsRepo.findById(tx, id);
      if (!hold) {
        throw new ResourceNotFoundException('Hold de recall no encontrado', { holdId: id });
      }
      if (hold.holdStatusConceptId !== PINV.HOLD_ACTIVE) {
        throw new PreconditionFailedException('El hold no está activo', { holdId: id });
      }

      hold.holdStatusConceptId = PINV.HOLD_RELEASED;
      hold.releasedAt = new Date();
      touch(hold, actor.id);

      const writeOff = dto.writeOff === true;
      if (hold.inventoryLotId) {
        const lot = await this.lotsRepo.findById(tx, hold.inventoryLotId);
        if (lot) {
          lot.recallStatusConceptId = PINV.LOT_RECALL_CLEARED;
          lot.quarantineStatusConceptId = PINV.LOT_QUARANTINE_RELEASED;
          touch(lot, actor.id);

          // La cuarentena puede afectar posiciones en varias ubicaciones del lote.
          const positions = await this.stockRepo.findByLot(tx, hold.inventoryLotId);
          for (const pos of positions) {
            const quarantined = num(pos.quarantineQuantity);
            if (quarantined === 0) continue;
            const sequence = await this.ledgerRepo.nextSequence(tx, pos.inventoryLocationId);
            this.ledgerRepo.append(tx, {
              pharmacyId: pos.inventoryLocationId,
              pharmacySiteId: pos.inventoryLocationId,
              inventoryLocationId: pos.inventoryLocationId,
              pharmacyProductId: pos.pharmacyProductId,
              inventoryLotId: pos.inventoryLotId,
              ledgerSequence: sequence,
              movementTypeConceptId: writeOff ? PINV.MV_WRITE_OFF : PINV.MV_QUARANTINE_RELEASE,
              quantityDelta: writeOff ? String(-quarantined) : '0',
              quarantineDelta: String(-quarantined),
              sourceId: hold.id,
              recordedByUserId: actor.id,
            });
            pos.quarantineQuantity = '0';
            if (writeOff) pos.onHandQuantity = String(num(pos.onHandQuantity) - quarantined);
            pos.availableQuantity = recompute(pos.onHandQuantity, pos.reservedQuantity, pos.quarantineQuantity);
            pos.lastLedgerSequence = sequence;
            pos.updatedAt = new Date();
          }
        }
      }
      await tx.flush();

      return { id: hold.id, status: writeOff ? 'WRITTEN_OFF' : 'RELEASED' };
    });
  }
}
