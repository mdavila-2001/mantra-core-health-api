import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ReadModelDefinitions } from '../entities';
import { createdBy } from '../../../common';

/** Datos para crear una fila de `read_models.read_model_definitions`. */
export interface CreateDefinitionData {
  /**
   * Valor de schema name mantenido por la instancia.
   */
  schemaName: string;
  /**
   * Valor de object name mantenido por la instancia.
   */
  objectName: string;
  /**
   * Identificador asociado a object type concept.
   */
  objectTypeConceptId: string;
  /**
   * Valor de owning module mantenido por la instancia.
   */
  owningModule?: string;
  /**
   * Valor de purpose text mantenido por la instancia.
   */
  purposeText?: string;
  /**
   * Identificador asociado a refresh mode concept.
   */
  refreshModeConceptId?: string;
  /**
   * Valor de maximum staleness seconds mantenido por la instancia.
   */
  maximumStalenessSeconds?: number;
  /**
   * Valor de default page size mantenido por la instancia.
   */
  defaultPageSize?: number;
  /**
   * Valor de maximum page size mantenido por la instancia.
   */
  maximumPageSize?: number;
  /**
   * Valor de stable cursor columns json mantenido por la instancia.
   */
  stableCursorColumnsJson?: unknown;
  /**
   * Valor de contains pii mantenido por la instancia.
   */
  containsPii?: boolean;
  /**
   * Valor de contains phi mantenido por la instancia.
   */
  containsPhi?: boolean;
  /**
   * Valor de security barrier required mantenido por la instancia.
   */
  securityBarrierRequired?: boolean;
  /**
   * Valor de row level security required mantenido por la instancia.
   */
  rowLevelSecurityRequired?: boolean;
  /**
   * Valor de definition hash mantenido por la instancia.
   */
  definitionHash?: string;
  /**
   * Valor de version number mantenido por la instancia.
   */
  versionNumber: number;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos de `read_models.read_model_definitions` (contrato versionado de
 * un read model). Stateless: cada método recibe el `EntityManager` activo.
 */
@Injectable()
export class ReadModelDefinitionsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<ReadModelDefinitions | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<ReadModelDefinitions | null> {
    return em.findOne(ReadModelDefinitions, { id });
  }

  /**
   * Obtiene find by schema object version.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param schemaName - Valor de schema name requerido por la operación.
   * @param objectName - Valor de object name requerido por la operación.
   * @param versionNumber - Valor de version number requerido por la operación.
   * @returns Resultado de find by schema object version conforme al contrato `Promise<ReadModelDefinitions | null>`.
   */
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

  /**
   * Obtiene find active by schema object.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param schemaName - Valor de schema name requerido por la operación.
   * @param objectName - Valor de object name requerido por la operación.
   * @param activeStatusConceptId - Identificador de active status concept.
   * @returns Resultado de find active by schema object conforme al contrato `Promise<ReadModelDefinitions | null>`.
   */
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

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `ReadModelDefinitions`.
   */
  create(em: EntityManager, data: CreateDefinitionData): ReadModelDefinitions {
    const { actorUserId, ...rest } = data;
    return em.create(
      ReadModelDefinitions,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }
}
