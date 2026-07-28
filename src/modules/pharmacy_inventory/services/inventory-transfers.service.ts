import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { randomUUID } from 'node:crypto';
import { PinoLogger } from 'nestjs-pino';
import {
  ResourceNotFoundException,
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../common';
import {
  LocationsRepository,
  StockPositionsRepository,
  LedgerRepository,
} from '../repositories';
import { CreateTransferDto, TransferResponseDto } from '../dto';
import { PINV } from '../pharmacy_inventory.concepts';

const num = (v: string | null | undefined): number =>
  v == null ? 0 : Number(v);
const recompute = (
  onHand: string,
  reserved: string,
  quarantine: string,
): string => String(num(onHand) - num(reserved) - num(quarantine));

/** Transferencia de stock entre ubicaciones (UC-25-10): TRANSFER_OUT + TRANSFER_IN. */
@Injectable()
export class InventoryTransfersService {
  constructor(
    private readonly em: EntityManager,
    private readonly locationsRepo: LocationsRepository,
    private readonly stockRepo: StockPositionsRepository,
    private readonly ledgerRepo: LedgerRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(InventoryTransfersService.name);
  }

  /** UC-25-10: mueve stock de origen a destino con dos asientos correlacionados. */
  async transfer(
    pharmacyId: string,
    dto: CreateTransferDto,
    actor: AuthenticatedUser,
  ): Promise<TransferResponseDto> {
    this.logger.info(
      {
        operation: 'pharmacy_inventory.transfer.create',
        pharmacyId,
        from: dto.fromLocationId,
        to: dto.toLocationId,
      },
      'Transferring stock',
    );
    return this.em.transactional(async (tx) => {
      const from = await this.locationsRepo.findById(tx, dto.fromLocationId);
      if (!from) {
        throw new ResourceNotFoundException('Ubicación origen no encontrada', {
          locationId: dto.fromLocationId,
        });
      }
      const to = await this.locationsRepo.findById(tx, dto.toLocationId);
      if (!to) {
        throw new ResourceNotFoundException('Ubicación destino no encontrada', {
          locationId: dto.toLocationId,
        });
      }

      const fromPosition = await this.stockRepo.findByKeyForUpdate(tx, {
        inventoryLocationId: dto.fromLocationId,
        pharmacyProductId: dto.pharmacyProductId,
        inventoryLotId: dto.inventoryLotId,
      });
      if (!fromPosition || num(fromPosition.availableQuantity) < dto.quantity) {
        throw new PreconditionFailedException(
          'Stock disponible insuficiente en origen',
          {
            available: fromPosition ? num(fromPosition.availableQuantity) : 0,
            requested: dto.quantity,
          },
        );
      }

      const correlationId = randomUUID();

      const outSeq = await this.ledgerRepo.nextSequence(tx, pharmacyId);
      const outEntry = this.ledgerRepo.append(tx, {
        pharmacyId,
        pharmacySiteId: dto.pharmacySiteId,
        inventoryLocationId: dto.fromLocationId,
        pharmacyProductId: dto.pharmacyProductId,
        inventoryLotId: dto.inventoryLotId,
        ledgerSequence: outSeq,
        movementTypeConceptId: PINV.MV_TRANSFER_OUT,
        quantityDelta: String(-dto.quantity),
        correlationId,
        recordedByUserId: actor.id,
      });
      await tx.flush();

      const inSeq = await this.ledgerRepo.nextSequence(tx, pharmacyId);
      const inEntry = this.ledgerRepo.append(tx, {
        pharmacyId,
        pharmacySiteId: dto.pharmacySiteId,
        inventoryLocationId: dto.toLocationId,
        pharmacyProductId: dto.pharmacyProductId,
        inventoryLotId: dto.inventoryLotId,
        ledgerSequence: inSeq,
        movementTypeConceptId: PINV.MV_TRANSFER_IN,
        quantityDelta: String(dto.quantity),
        correlationId,
        recordedByUserId: actor.id,
      });

      fromPosition.onHandQuantity = String(
        num(fromPosition.onHandQuantity) - dto.quantity,
      );
      fromPosition.availableQuantity = recompute(
        fromPosition.onHandQuantity,
        fromPosition.reservedQuantity,
        fromPosition.quarantineQuantity,
      );
      fromPosition.lastLedgerSequence = outSeq;
      fromPosition.updatedAt = new Date();

      let toPosition = await this.stockRepo.findByKeyForUpdate(tx, {
        inventoryLocationId: dto.toLocationId,
        pharmacyProductId: dto.pharmacyProductId,
        inventoryLotId: dto.inventoryLotId,
      });
      if (!toPosition) {
        toPosition = this.stockRepo.create(tx, {
          inventoryLocationId: dto.toLocationId,
          pharmacyProductId: dto.pharmacyProductId,
          inventoryLotId: dto.inventoryLotId,
          onHandQuantity: String(dto.quantity),
          availableQuantity: String(dto.quantity),
          lastLedgerSequence: inSeq,
        });
      } else {
        toPosition.onHandQuantity = String(
          num(toPosition.onHandQuantity) + dto.quantity,
        );
        toPosition.availableQuantity = recompute(
          toPosition.onHandQuantity,
          toPosition.reservedQuantity,
          toPosition.quarantineQuantity,
        );
        toPosition.lastLedgerSequence = inSeq;
        toPosition.updatedAt = new Date();
      }
      await tx.flush();

      return {
        correlationId,
        outLedgerEntryId: outEntry.id,
        inLedgerEntryId: inEntry.id,
      };
    });
  }
}
