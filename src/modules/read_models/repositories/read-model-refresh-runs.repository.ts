import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ReadModelRefreshRuns } from '../entities';

/** Datos para registrar una corrida de refresh. */
export interface CreateRefreshRunData {
  /**
   * Identificador asociado a read model definition.
   */
  readModelDefinitionId: string;
  /**
   * Identificador asociado a refresh type concept.
   */
  refreshTypeConceptId: string;
  /**
   * Valor de started at mantenido por la instancia.
   */
  startedAt?: Date;
  /**
   * Valor de completed at mantenido por la instancia.
   */
  completedAt?: Date;
  /**
   * Valor de rows affected mantenido por la instancia.
   */
  rowsAffected?: string;
  /**
   * Valor de source watermark mantenido por la instancia.
   */
  sourceWatermark?: string;
  /**
   * Identificador asociado a result concept.
   */
  resultConceptId?: string;
  /**
   * Valor de error code mantenido por la instancia.
   */
  errorCode?: string;
  /**
   * Identificador asociado a correlation.
   */
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

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `ReadModelRefreshRuns`.
   */
  create(em: EntityManager, data: CreateRefreshRunData): ReadModelRefreshRuns {
    return em.create(
      ReadModelRefreshRuns,
      { ...data, createdAt: new Date() },
      { partial: true },
    );
  }
}
