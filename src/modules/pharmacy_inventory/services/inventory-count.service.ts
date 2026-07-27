import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ResourceNotFoundException,
  ConflictException,
  PreconditionFailedException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  CountSessionsRepository,
  LocationsRepository,
  StockPositionsRepository,
  LedgerRepository,
} from '../repositories';
import {
  CreateCountSessionDto,
  ApproveCountSessionDto,
  CountSessionResponseDto,
} from '../dto';
import { PINV } from '../pharmacy_inventory.concepts';

const num = (v: string | null | undefined): number =>
  v == null ? 0 : Number(v);
const recompute = (
  onHand: string,
  reserved: string,
  quarantine: string,
): string => String(num(onHand) - num(reserved) - num(quarantine));

/** Conteo cíclico: abrir/congelar sesión (UC-25-06) y aprobar/ajustar (UC-25-07). */
@Injectable()
export class InventoryCountService {
  constructor(
    private readonly em: EntityManager,
    private readonly countRepo: CountSessionsRepository,
    private readonly locationsRepo: LocationsRepository,
    private readonly stockRepo: StockPositionsRepository,
    private readonly ledgerRepo: LedgerRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(InventoryCountService.name);
  }

  /** UC-25-06: abre una sesión de conteo tomando snapshot del on-hand. */
  async openSession(
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
          {
            locationId: dto.inventoryLocationId,
          },
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

  /** UC-25-07: aprueba el conteo, calcula varianzas y ajusta el ledger/stock. */
  async approve(
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
        dto.counts.map((c) => [c.lineId, c.countedQuantity]),
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
        const variance = counted - num(line.expectedQuantity);
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

          const position = await this.stockRepo.findByKey(tx, {
            inventoryLocationId: session.inventoryLocationId,
            pharmacyProductId: line.pharmacyProductId,
            inventoryLotId: line.inventoryLotId,
          });
          if (position) {
            position.onHandQuantity = String(counted);
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
