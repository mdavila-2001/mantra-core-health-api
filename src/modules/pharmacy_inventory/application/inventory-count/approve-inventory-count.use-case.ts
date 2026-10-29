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
  CountSessionsRepository,
  LedgerRepository,
  StockPositionsRepository,
} from '../../infrastructure/repositories';
import type {
  ApproveCountSessionDto,
  CountSessionResponseDto,
} from '../../presentation/dto';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import {
  numericQuantity,
  recomputeAvailableQuantity,
} from '../../domain/counting/stock-quantity';
import { PharmacyInventoryScopePolicy } from '../scope/pharmacy-inventory-scope.policy';

/** Aprueba un conteo, registra varianzas y ajusta el ledger y stock. */
@Injectable()
export class ApproveInventoryCountUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly countRepo: CountSessionsRepository,
    private readonly stockRepo: StockPositionsRepository,
    private readonly ledgerRepo: LedgerRepository,
    private readonly scope: PharmacyInventoryScopePolicy,
    private readonly logger: PinoLogger,
  ) {}

  execute(
    id: string,
    dto: ApproveCountSessionDto,
    actor: AuthenticatedUser,
  ): Promise<CountSessionResponseDto> {
    this.logger.info(
      { operation: 'pharmacy_inventory.count.approve', sessionId: id },
      'Approving count session',
    );
    return this.em.transactional(async (tx) => {
      const session = await this.countRepo.findById(tx, id);
      if (!session) throw this.scope.notAvailable();
      // La sesión sólo guarda la sede: la farmacia verdadera sale de la sede, y
      // es la que va al ledger. La ubicación contada debe ser de esa sede.
      const site = await this.scope.requireManagedSite(
        tx,
        session.pharmacySiteId,
        actor,
      );
      await this.scope.assertStoredStockKey(tx, site, {
        inventoryLocationId: session.inventoryLocationId,
      });
      const approvable = [
        PINV.COUNT_OPEN,
        PINV.COUNT_FROZEN,
        PINV.COUNT_COUNTED,
      ];
      if (!approvable.includes(session.statusConceptId)) {
        throw new PreconditionFailedException(
          'La sesión no está en estado aprobable',
          { sessionId: id },
        );
      }

      const countByLine = new Map(
        dto.counts.map((count) => [count.lineId, count.countedQuantity]),
      );
      const lineIds: string[] = [];
      let adjustments = 0;

      for (const [lineId, counted] of countByLine) {
        const line = await this.countRepo.findLineById(tx, lineId);
        if (!line || line.inventoryCountSessionId !== session.id) {
          throw new ResourceNotFoundException('Línea de conteo no encontrada', {
            lineId,
          });
        }
        // El producto y el lote contados deben ser de la farmacia de la sede.
        await this.scope.assertStoredStockKey(tx, site, {
          inventoryLocationId: session.inventoryLocationId,
          pharmacyProductId: line.pharmacyProductId,
          inventoryLotId: line.inventoryLotId,
        });
        lineIds.push(line.id);
        const variance = counted - numericQuantity(line.expectedQuantity);
        line.countedQuantity = String(counted);
        line.varianceQuantity = String(variance);

        if (variance !== 0) {
          line.varianceReasonConceptId = PINV.VARIANCE_REASON_ADJUSTMENT;
          const sequence = await this.ledgerRepo.nextSequence(
            tx,
            site.pharmacyId,
          );
          this.ledgerRepo.append(tx, {
            pharmacyId: site.pharmacyId,
            pharmacySiteId: site.siteId,
            inventoryLocationId: session.inventoryLocationId,
            pharmacyProductId: line.pharmacyProductId,
            inventoryLotId: line.inventoryLotId,
            ledgerSequence: sequence,
            movementTypeConceptId: PINV.MV_COUNT_ADJUSTMENT,
            quantityDelta: String(variance),
            sourceId: session.id,
            recordedByUserId: actor.id,
          });
          adjustments += 1;

          const position = await this.stockRepo.findByKeyForUpdate(tx, {
            inventoryLocationId: session.inventoryLocationId,
            pharmacyProductId: line.pharmacyProductId,
            inventoryLotId: line.inventoryLotId,
          });
          if (position) {
            position.onHandQuantity = String(counted);
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

      session.statusConceptId = PINV.COUNT_APPROVED;
      session.approvedAt = new Date();
      session.approvedByUserId = actor.id;
      session.completedAt = new Date();
      touch(session, actor.id);
      await tx.flush();

      return { id: session.id, lineIds, adjustments };
    });
  }
}
