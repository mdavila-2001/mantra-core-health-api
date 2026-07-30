import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { InventoryCountSessions, InventoryCountLines } from '../entities';
import { createdBy } from '../../../common';

/** Datos de cabecera de una sesión de conteo cíclico. */
export interface CreateCountSessionData {
  /**
   * Identificador asociado a pharmacy site.
   */
  pharmacySiteId: string;
  /**
   * Identificador asociado a inventory location.
   */
  inventoryLocationId: string;
  /**
   * Identificador asociado a count type concept.
   */
  countTypeConceptId: string;
  /**
   * Identificador asociado a freeze mode concept.
   */
  freezeModeConceptId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de started at mantenido por la instancia.
   */
  startedAt?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Datos de una línea de conteo (snapshot). */
export interface CreateCountLineData {
  /**
   * Identificador asociado a inventory count session.
   */
  inventoryCountSessionId: string;
  /**
   * Identificador asociado a pharmacy product.
   */
  pharmacyProductId: string;
  /**
   * Identificador asociado a inventory lot.
   */
  inventoryLotId?: string;
  /**
   * Valor de expected quantity mantenido por la instancia.
   */
  expectedQuantity: string;
  /**
   * Valor de counted quantity mantenido por la instancia.
   */
  countedQuantity: string;
  /**
   * Valor de variance quantity mantenido por la instancia.
   */
  varianceQuantity: string;
  /**
   * Identificador asociado a variance reason concept.
   */
  varianceReasonConceptId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de las sesiones de conteo y sus líneas. */
@Injectable()
export class CountSessionsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<InventoryCountSessions | null>`.
   */
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

  /**
   * Obtiene find lines.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param sessionId - Identificador de session.
   * @returns Resultado de find lines conforme al contrato `Promise<InventoryCountLines[]>`.
   */
  findLines(
    em: EntityManager,
    sessionId: string,
  ): Promise<InventoryCountLines[]> {
    return em.find(InventoryCountLines, { inventoryCountSessionId: sessionId });
  }

  /**
   * Obtiene find line by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find line by id conforme al contrato `Promise<InventoryCountLines | null>`.
   */
  findLineById(
    em: EntityManager,
    id: string,
  ): Promise<InventoryCountLines | null> {
    return em.findOne(InventoryCountLines, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `InventoryCountSessions`.
   */
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

  /**
   * Crea create line.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create line conforme al contrato `InventoryCountLines`.
   */
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
