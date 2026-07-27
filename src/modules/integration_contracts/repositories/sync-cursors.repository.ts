import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { IntegrationSyncCursors } from '../entities';

/** Datos para crear un cursor de sincronización (UC-31-08). */
export interface CreateSyncCursorData {
  integrationContractId: string;
  cursorScope: string;
  cursorValue: string;
  statusConceptId: string;
  watermarkAt?: Date;
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
