import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ReadModelDependencies } from '../entities';

/** Datos para crear una dependencia upstream de un read model. */
export interface CreateDependencyData {
  readModelDefinitionId: string;
  sourceSchemaName: string;
  sourceObjectName: string;
  dependencyTypeConceptId: string;
  selectedColumnsJson?: unknown;
  filteringRuleSummary?: string;
}

/**
 * Acceso a datos de `read_models.read_model_dependencies`. La tabla solo tiene
 * `created_at` (sin auditoría completa ni row_version), por lo que se fija a mano.
 */
@Injectable()
export class ReadModelDependenciesRepository {
  findByDefinition(
    em: EntityManager,
    readModelDefinitionId: string,
  ): Promise<ReadModelDependencies[]> {
    return em.find(ReadModelDependencies, { readModelDefinitionId });
  }

  create(em: EntityManager, data: CreateDependencyData): ReadModelDependencies {
    return em.create(
      ReadModelDependencies,
      { ...data, createdAt: new Date() },
      { partial: true },
    );
  }
}
