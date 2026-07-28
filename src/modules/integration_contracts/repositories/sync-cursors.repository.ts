import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { IntegrationSyncCursors } from '../entities';

/** Datos para crear un cursor de sincronización (UC-31-08). */
export interface CreateSyncCursorData {
  /**
   * Identificador asociado a integration contract.
   */
  integrationContractId: string;
  /**
   * Valor de cursor scope mantenido por la instancia.
   */
  cursorScope: string;
  /**
   * Valor de cursor value mantenido por la instancia.
   */
  cursorValue: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de watermark at mantenido por la instancia.
   */
  watermarkAt?: Date;
  /**
   * Identificador asociado a last successful exchange.
   */
  lastSuccessfulExchangeId?: string;
}

/** Acceso a datos de `integration_contracts.integration_sync_cursors`. */
@Injectable()
export class SyncCursorsRepository {
  /** Busca el cursor por (contrato, scope) o `null`. */
  findByScope(
    em: EntityManager,
    contractId: string,
    cursorScope: string,
  ): Promise<IntegrationSyncCursors | null> {
    return em.findOne(IntegrationSyncCursors, {
      integrationContractId: contractId,
      cursorScope,
    });
  }

  /** Crea la entidad de cursor en la unidad de trabajo (sin flush). */
  create(
    em: EntityManager,
    data: CreateSyncCursorData,
  ): IntegrationSyncCursors {
    const now = new Date();
    return em.create(
      IntegrationSyncCursors,
      {
        integrationContractId: data.integrationContractId,
        cursorScope: data.cursorScope,
        cursorValue: data.cursorValue,
        watermarkAt: data.watermarkAt,
        lastSuccessfulExchangeId: data.lastSuccessfulExchangeId,
        statusConceptId: data.statusConceptId,
        createdAt: now,
        updatedAt: now,
      },
      { partial: true },
    );
  }
}
