import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ReadModelDependencies } from '../entities';

/** Datos para crear una dependencia upstream de un read model. */
export interface CreateDependencyData {
  /**
   * Identificador asociado a read model definition.
   */
  readModelDefinitionId: string;
  /**
   * Valor de source schema name mantenido por la instancia.
   */
  sourceSchemaName: string;
  /**
   * Valor de source object name mantenido por la instancia.
   */
  sourceObjectName: string;
  /**
   * Identificador asociado a dependency type concept.
   */
  dependencyTypeConceptId: string;
  /**
   * Valor de selected columns json mantenido por la instancia.
   */
  selectedColumnsJson?: unknown;
  /**
   * Valor de filtering rule summary mantenido por la instancia.
   */
  filteringRuleSummary?: string;
}

/**
 * Acceso a datos de `read_models.read_model_dependencies`. La tabla solo tiene
 * `created_at` (sin auditoría completa ni row_version), por lo que se fija a mano.
 */
@Injectable()
export class ReadModelDependenciesRepository {
  /**
   * Obtiene find by definition.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param readModelDefinitionId - Identificador de read model definition.
   * @returns Resultado de find by definition conforme al contrato `Promise<ReadModelDependencies[]>`.
   */
  findByDefinition(
    em: EntityManager,
    readModelDefinitionId: string,
  ): Promise<ReadModelDependencies[]> {
    return em.find(ReadModelDependencies, { readModelDefinitionId });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `ReadModelDependencies`.
   */
  create(em: EntityManager, data: CreateDependencyData): ReadModelDependencies {
    return em.create(
      ReadModelDependencies,
      { ...data, createdAt: new Date() },
      { partial: true },
    );
  }
}
