import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { randomUUID } from 'node:crypto';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../../common';
import {
  StockPositionsRepository,
  LedgerRepository,
} from '../../infrastructure/repositories';
import type {
  CreateTransferDto,
  TransferResponseDto,
} from '../../presentation/dto';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import { PharmacyInventoryErrorReason } from '../../pharmacy_inventory.error-reasons';
import { PharmacyInventoryScopePolicy } from '../scope/pharmacy-inventory-scope.policy';

const num = (value: string | null | undefined): number =>
  value == null ? 0 : Number(value);

const recompute = (
  onHand: string,
  reserved: string,
  quarantine: string,
): string => String(num(onHand) - num(reserved) - num(quarantine));

/** Mueve stock entre ubicaciones con dos asientos correlacionados. */
@Injectable()
export class TransferInventoryUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly stockRepo: StockPositionsRepository,
    private readonly ledgerRepo: LedgerRepository,
    private readonly scope: PharmacyInventoryScopePolicy,
    private readonly logger: PinoLogger,
  ) {}

  execute(
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
      // Origen y destino deben ser ubicaciones de la misma farmacia, del producto
      // y lote de esa farmacia; no hay transferencias entre farmacias.
      const pharmacy = await this.scope.requireManagedPharmacy(
        tx,
        pharmacyId,
        actor,
      );
      await this.scope.requireSite(tx, pharmacy, dto.pharmacySiteId);
      const from = await this.scope.requireLocationInPharmacy(
        tx,
        pharmacy,
        dto.fromLocationId,
      );
      const to = await this.scope.requireLocationInPharmacy(
        tx,
        pharmacy,
        dto.toLocationId,
      );
      await this.scope.requireProduct(tx, pharmacy, dto.pharmacyProductId);
      await this.scope.requireLot(
        tx,
        dto.inventoryLotId,
        dto.pharmacyProductId,
      );

      const fromPosition = await this.stockRepo.findByKeyForUpdate(tx, {
        inventoryLocationId: dto.fromLocationId,
        pharmacyProductId: dto.pharmacyProductId,
        inventoryLotId: dto.inventoryLotId,
      });
      if (
        from?.locationTypeConceptId === PINV.LOCATION_TYPE_WARD_STOCK &&
        (!fromPosition || num(fromPosition.availableQuantity) < dto.quantity)
      ) {
        throw new ConflictException(
          'Stock disponible insuficiente en el botiquín',
          {
            available: fromPosition ? num(fromPosition.availableQuantity) : 0,
            requested: dto.quantity,
          },
          PharmacyInventoryErrorReason.INSUFFICIENT_AVAILABLE_STOCK,
        );
      }
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
        pharmacySiteId: from.pharmacySiteId,
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
        pharmacySiteId: to.pharmacySiteId,
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
