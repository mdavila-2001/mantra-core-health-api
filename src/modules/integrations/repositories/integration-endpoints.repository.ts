import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { IntegrationEndpoints, IntegrationFieldMappings } from '../entities';
import { createdBy } from '../../../common';

/** Datos para publicar un endpoint versionado (UC-12-04). */
export interface CreateEndpointData {
  providerId: string;
  code: string;
  operation: string;
  version: string;
  stateConceptId: string;
  httpMethodConceptId?: string;
  path?: string;
  requestSchemaJson?: unknown;
  responseSchemaJson?: unknown;
  timeoutMs?: number;
  actorUserId?: string;
}

/** Datos para una fila de mapeo de campos de un endpoint (UC-12-04). */
export interface CreateFieldMappingData {
  endpointId: string;
  sourcePath: string;
  targetField: string;
  conceptMapId?: string;
  transformJson?: unknown;
  directionConceptId?: string;
  actorUserId?: string;
}

/** Acceso a datos de endpoints de integración y sus mapeos de campos. */
@Injectable()
export class IntegrationEndpointsRepository {
  findById(em: EntityManager, id: string): Promise<IntegrationEndpoints | null> {
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

  createEndpoint(em: EntityManager, data: CreateEndpointData): IntegrationEndpoints {
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

  createFieldMapping(em: EntityManager, data: CreateFieldMappingData): IntegrationFieldMappings {
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
