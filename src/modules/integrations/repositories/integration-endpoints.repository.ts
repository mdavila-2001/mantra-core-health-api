import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { IntegrationEndpoints, IntegrationFieldMappings } from '../entities';
import { createdBy } from '../../../common';

/** Datos para publicar un endpoint versionado (UC-12-04). */
export interface CreateEndpointData {
  /**
   * Identificador asociado a provider.
   */
  providerId: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de operation mantenido por la instancia.
   */
  operation: string;
  /**
   * Valor de version mantenido por la instancia.
   */
  version: string;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId: string;
  /**
   * Identificador asociado a http method concept.
   */
  httpMethodConceptId?: string;
  /**
   * Valor de path mantenido por la instancia.
   */
  path?: string;
  /**
   * Valor de request schema json mantenido por la instancia.
   */
  requestSchemaJson?: unknown;
  /**
   * Valor de response schema json mantenido por la instancia.
   */
  responseSchemaJson?: unknown;
  /**
   * Valor de timeout ms mantenido por la instancia.
   */
  timeoutMs?: number;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Datos para una fila de mapeo de campos de un endpoint (UC-12-04). */
export interface CreateFieldMappingData {
  /**
   * Identificador asociado a endpoint.
   */
  endpointId: string;
  /**
   * Valor de source path mantenido por la instancia.
   */
  sourcePath: string;
  /**
   * Valor de target field mantenido por la instancia.
   */
  targetField: string;
  /**
   * Identificador asociado a concept map.
   */
  conceptMapId?: string;
  /**
   * Valor de transform json mantenido por la instancia.
   */
  transformJson?: unknown;
  /**
   * Identificador asociado a direction concept.
   */
  directionConceptId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de endpoints de integración y sus mapeos de campos. */
@Injectable()
export class IntegrationEndpointsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<IntegrationEndpoints | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<IntegrationEndpoints | null> {
    return em.findOne(IntegrationEndpoints, { id });
  }

  /** Valida la unicidad (provider_id, version) antes de publicar. */
  findByProviderAndVersion(
    em: EntityManager,
    providerId: string,
    version: string,
  ): Promise<IntegrationEndpoints | null> {
    return em.findOne(IntegrationEndpoints, { providerId, version });
  }

  /**
   * Crea create endpoint.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create endpoint conforme al contrato `IntegrationEndpoints`.
   */
  createEndpoint(
    em: EntityManager,
    data: CreateEndpointData,
  ): IntegrationEndpoints {
    return em.create(
      IntegrationEndpoints,
      {
        providerId: data.providerId,
        code: data.code,
        operation: data.operation,
        version: data.version,
        stateConceptId: data.stateConceptId,
        httpMethodConceptId: data.httpMethodConceptId,
        path: data.path,
        requestSchemaJson: data.requestSchemaJson,
        responseSchemaJson: data.responseSchemaJson,
        timeoutMs: data.timeoutMs,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create field mapping.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create field mapping conforme al contrato `IntegrationFieldMappings`.
   */
  createFieldMapping(
    em: EntityManager,
    data: CreateFieldMappingData,
  ): IntegrationFieldMappings {
    return em.create(
      IntegrationFieldMappings,
      {
        endpointId: data.endpointId,
        sourcePath: data.sourcePath,
        targetField: data.targetField,
        conceptMapId: data.conceptMapId,
        transformJson: data.transformJson,
        directionConceptId: data.directionConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
