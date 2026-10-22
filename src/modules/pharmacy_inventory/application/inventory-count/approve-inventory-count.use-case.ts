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

/** Aprueba un conteo, registra varianzas y ajusta el ledger y stock. */
@Injectable()
export class ApproveInventoryCountUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly countRepo: CountSessionsRepository,
    private readonly stockRepo: StockPositionsRepository,
    private readonly ledgerRepo: LedgerRepository,
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
      if (!session) {
        throw new ResourceNotFoundException('Sesión de conteo no encontrada', {
          sessionId: id,
        });
      }
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
        lineIds.push(line.id);
        const variance = counted - numericQuantity(line.expectedQuantity);
        line.countedQuantity = String(counted);
        line.varianceQuantity = String(variance);

        if (variance !== 0) {
          line.varianceReasonConceptId = PINV.VARIANCE_REASON_ADJUSTMENT;
          const sequence = await this.ledgerRepo.nextSequence(
            tx,
            session.pharmacySiteId,
          );
          this.ledgerRepo.append(tx, {
            pharmacyId: session.pharmacySiteId,
            pharmacySiteId: session.pharmacySiteId,
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
