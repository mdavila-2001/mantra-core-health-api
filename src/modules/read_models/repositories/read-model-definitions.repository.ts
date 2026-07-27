import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ReadModelDefinitions } from '../entities';
import { createdBy } from '../../../common';

/** Datos para crear una fila de `read_models.read_model_definitions`. */
export interface CreateDefinitionData {
  schemaName: string;
  objectName: string;
  objectTypeConceptId: string;
  owningModule?: string;
  purposeText?: string;
  refreshModeConceptId?: string;
  maximumStalenessSeconds?: number;
  defaultPageSize?: number;
  maximumPageSize?: number;
  stableCursorColumnsJson?: unknown;
  containsPii?: boolean;
  containsPhi?: boolean;
  securityBarrierRequired?: boolean;
  rowLevelSecurityRequired?: boolean;
  definitionHash?: string;
  versionNumber: number;
  statusConceptId: string;
  actorUserId?: string;
}

/**
 * Acceso a datos de `read_models.read_model_definitions` (contrato versionado de
 * un read model). Stateless: cada método recibe el `EntityManager` activo.
 */
@Injectable()
export class ReadModelDefinitionsRepository {
  findById(
    em: EntityManager,
    id: string,
  ): Promise<ReadModelDefinitions | null> {
    return em.findOne(ReadModelDefinitions, { id });
  }

  findBySchemaObjectVersion(
    em: EntityManager,
    schemaName: string,
    objectName: string,
    versionNumber: number,
  ): Promise<ReadModelDefinitions | null> {
    return em.findOne(ReadModelDefinitions, {
      schemaName,
      objectName,
      versionNumber,
    });
  }

  /** Todas las versiones de un objeto lógico, de mayor a menor versión. */
  findAllBySchemaObject(
    em: EntityManager,
    schemaName: string,
    objectName: string,
  ): Promise<ReadModelDefinitions[]> {
    return em.find(
      ReadModelDefinitions,
      { schemaName, objectName },
      { orderBy: { versionNumber: 'desc' } },
    );
  }

  findActiveBySchemaObject(
    em: EntityManager,
    schemaName: string,
    objectName: string,
    activeStatusConceptId: string,
  ): Promise<ReadModelDefinitions | null> {
    return em.findOne(ReadModelDefinitions, {
      schemaName,
      objectName,
      statusConceptId: activeStatusConceptId,
    });
  }

  /** Definiciones no retiradas, para el barrido de staleness (UC-30-12). */
  findAllNotRetired(
    em: EntityManager,
    retiredStatusConceptId: string,
  ): Promise<ReadModelDefinitions[]> {
    return em.find(
      ReadModelDefinitions,
      { statusConceptId: { $ne: retiredStatusConceptId } },
      { orderBy: { createdAt: 'desc' }, limit: 200 },
    );
  }

  create(em: EntityManager, data: CreateDefinitionData): ReadModelDefinitions {
    const { actorUserId, ...rest } = data;
    return em.create(
      ReadModelDefinitions,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }
}
