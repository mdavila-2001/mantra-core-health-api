import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ReadModelRefreshRuns } from '../entities';

/** Datos para registrar una corrida de refresh. */
export interface CreateRefreshRunData {
  readModelDefinitionId: string;
  refreshTypeConceptId: string;
  startedAt?: Date;
  completedAt?: Date;
  rowsAffected?: string;
  sourceWatermark?: string;
  resultConceptId?: string;
  errorCode?: string;
  correlationId?: string;
}

/**
 * Acceso a datos de `read_models.read_model_refresh_runs` (bitácora de refresh /
 * backfill / reconcile). Append-only: solo `created_at`, sin row_version.
 */
@Injectable()
export class ReadModelRefreshRunsRepository {
  /** Última corrida de una definición (para calcular staleness). */
  findLatestByDefinition(
    em: EntityManager,
    readModelDefinitionId: string,
  ): Promise<ReadModelRefreshRuns | null> {
    return em.findOne(
      ReadModelRefreshRuns,
      { readModelDefinitionId },
      { orderBy: { createdAt: 'desc' } },
    );
  }

  create(em: EntityManager, data: CreateRefreshRunData): ReadModelRefreshRuns {
    return em.create(
      ReadModelRefreshRuns,
      { ...data, createdAt: new Date() },
      { partial: true },
    );
  }
}
