import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { InventoryCountSessions, InventoryCountLines } from '../entities';
import { createdBy } from '../../../common';

/** Datos de cabecera de una sesión de conteo cíclico. */
export interface CreateCountSessionData {
  pharmacySiteId: string;
  inventoryLocationId: string;
  countTypeConceptId: string;
  freezeModeConceptId?: string;
  statusConceptId: string;
  startedAt?: Date;
  actorUserId?: string;
}

/** Datos de una línea de conteo (snapshot). */
export interface CreateCountLineData {
  inventoryCountSessionId: string;
  pharmacyProductId: string;
  inventoryLotId?: string;
  expectedQuantity: string;
  countedQuantity: string;
  varianceQuantity: string;
  varianceReasonConceptId?: string;
  actorUserId?: string;
}

/** Acceso a datos de las sesiones de conteo y sus líneas. */
@Injectable()
export class CountSessionsRepository {
  findById(
    em: EntityManager,
    id: string,
  ): Promise<InventoryCountSessions | null> {
    return em.findOne(InventoryCountSessions, { id });
  }

  /** Cuenta sesiones abiertas en una ubicación (para evitar solapamiento). */
  countOpenAtLocation(
    em: EntityManager,
    inventoryLocationId: string,
    openStatusIds: string[],
  ): Promise<number> {
    return em.count(InventoryCountSessions, {
      inventoryLocationId,
      statusConceptId: { $in: openStatusIds },
    });
  }

  findLines(
    em: EntityManager,
    sessionId: string,
  ): Promise<InventoryCountLines[]> {
    return em.find(InventoryCountLines, { inventoryCountSessionId: sessionId });
  }

  findLineById(
    em: EntityManager,
    id: string,
  ): Promise<InventoryCountLines | null> {
    return em.findOne(InventoryCountLines, { id });
  }

  create(
    em: EntityManager,
    data: CreateCountSessionData,
  ): InventoryCountSessions {
    return em.create(
      InventoryCountSessions,
      {
        pharmacySiteId: data.pharmacySiteId,
        inventoryLocationId: data.inventoryLocationId,
        countTypeConceptId: data.countTypeConceptId,
        freezeModeConceptId: data.freezeModeConceptId,
        statusConceptId: data.statusConceptId,
        startedAt: data.startedAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  createLine(
    em: EntityManager,
    data: CreateCountLineData,
  ): InventoryCountLines {
    return em.create(
      InventoryCountLines,
      {
        inventoryCountSessionId: data.inventoryCountSessionId,
        pharmacyProductId: data.pharmacyProductId,
        inventoryLotId: data.inventoryLotId,
        expectedQuantity: data.expectedQuantity,
        countedQuantity: data.countedQuantity,
        varianceQuantity: data.varianceQuantity,
        varianceReasonConceptId: data.varianceReasonConceptId,
        createdAt: new Date(),
        createdByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }
}
