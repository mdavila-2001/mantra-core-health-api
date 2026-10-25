import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  touch,
  type AuthenticatedUser,
} from '../../../../common';
import {
  DispensationsRepository,
  ReservationsRepository,
  StockPositionsRepository,
  LedgerRepository,
} from '../../infrastructure/repositories';
import {
  ReverseDispensationDto,
  StatusResultDto,
} from '../../presentation/dto';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import { PharmacyInventoryScopePolicy } from '../scope/pharmacy-inventory-scope.policy';

const num = (v: string | null | undefined): number =>
  v == null ? 0 : Number(v);

const recompute = (
  onHand: string,
  reserved: string,
  quarantine: string,
): string => String(num(onHand) - num(reserved) - num(quarantine));

/** Reversión compensatoria de una dispensación. */
@Injectable()
export class ReverseMedicationDispensationUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly dispensationsRepo: DispensationsRepository,
    private readonly reservationsRepo: ReservationsRepository,
    private readonly stockRepo: StockPositionsRepository,
    private readonly ledgerRepo: LedgerRepository,
    private readonly scope: PharmacyInventoryScopePolicy,
    private readonly logger: PinoLogger,
  ) {}

  /** UC-25-11: reversa una dispensación con un asiento compensatorio. */
  async execute(
    id: string,
    dto: ReverseDispensationDto,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    this.logger.info(
      {
        operation: 'pharmacy_inventory.dispensation.reverse',
        dispensationId: id,
      },
      'Reversing dispensation',
    );
    return this.em.transactional(async (tx) => {
      const dispensation = await this.dispensationsRepo.findById(tx, id);
      if (!dispensation) throw this.scope.notAvailable();
      // La dispensación guarda la farmacia y la sede: deben ser del actor, y la
      // ubicación que recibe la devolución, de esa sede.
      const pharmacy = await this.scope.requireManagedPharmacy(
        tx,
        dispensation.pharmacyId,
        actor,
      );
      if (dto.inventoryLocationId) {
        const site = await this.scope.requireSite(
          tx,
          pharmacy,
          dispensation.pharmacySiteId,
        );
        await this.scope.requireLocation(tx, site, dto.inventoryLocationId);
      }
      if (
        dispensation.dispensationStatusConceptId !== PINV.DISPENSE_DISPENSED
      ) {
        throw new PreconditionFailedException(
          'La dispensación no está en estado reversible',
          {
            dispensationId: id,
          },
        );
      }

      dispensation.dispensationStatusConceptId = PINV.DISPENSE_REVERSED;
      touch(dispensation, actor.id);

      const lines = await this.dispensationsRepo.findLines(tx, id);
      for (const dl of lines) {
        const locationId = dto.inventoryLocationId;
        const sequence = await this.ledgerRepo.nextSequence(
          tx,
          dispensation.pharmacyId,
        );
        if (locationId) {
          this.ledgerRepo.append(tx, {
            pharmacyId: dispensation.pharmacyId,
            pharmacySiteId: dispensation.pharmacySiteId,
            inventoryLocationId: locationId,
            pharmacyProductId: dl.pharmacyProductId,
            inventoryLotId: dl.inventoryLotId,
            ledgerSequence: sequence,
            movementTypeConceptId: PINV.MV_DISPENSE_REVERSAL,
            quantityDelta: String(num(dl.dispensedQuantity)),
            sourceId: dispensation.id,
            recordedByUserId: actor.id,
          });
          const position = await this.stockRepo.findByKeyForUpdate(tx, {
            inventoryLocationId: locationId,
            pharmacyProductId: dl.pharmacyProductId,
            inventoryLotId: dl.inventoryLotId,
          });
          if (position) {
            position.onHandQuantity = String(
              num(position.onHandQuantity) + num(dl.dispensedQuantity),
            );
            position.availableQuantity = recompute(
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

      return { id: dispensation.id, status: 'REVERSED' };
    });
  }
}
